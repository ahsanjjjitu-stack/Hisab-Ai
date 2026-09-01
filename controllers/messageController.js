const Message = require("../model/model.message");
const Transaction = require("../model/model.transaction");
const Session = require("../model/model.session");
const { parseTransactionWithMessage, generateSummaryReply } = require("../services/geminiService");
const { getTodayRangeBD } = require("../utils/dateHelper");




// post api message send 
exports.sendMessage = async (req, res) => {

    try {



        const { userId, sessionId, message: userMessageText } = req.body;


        if (!userId || !sessionId || !userMessageText) {
             return res.status(400).json({
             success: false,
             message: 'userId, sessionId এবং message প্রদান করা আবশ্যক!'
         });
       }






       // ১. সেশনের শেষ ৪টি চ্যাট হিস্ট্রি তুলে নেওয়া (Context-এর জন্য)
       const recentMessages = await Message.find({ userId, sessionId })
       .sort({ createdAt: -1 })
       .limit(4);





       const chatHistory = recentMessages.reverse().map(msg => ({
           sender: msg.sender,
           text: msg.text
       }));




       



       // save shop massage 
       const userMessage = await Message.create({
            userId,
            sessionId,
            sender: "USER",
            text: userMessageText
        });
       







       // Gemini ai massage parse 
       const aiParsedResult = await parseTransactionWithMessage(userMessageText, chatHistory);
       const { intent, queryFilter, transactionData } = aiParsedResult;




       let finalAiText = aiParsedResult.aiReply || 'মামা, হিসাবটা সেভ করে রেখেছি!';
       let finalSummary = aiParsedResult.summary || null;
       let savedTransaction = null;




       // ai transaction save    ============================================================================
    if (intent === 'SAVE_TRANSACTION' && transactionData) {

            savedTransaction = await Transaction.create({
                userId,
                sessionId,
                transactionType: transactionData.transactionType || 'SALE',
                items: transactionData.items || [],
                totalAmount: transactionData.totalAmount || 0,
                paidAmount: transactionData.paidAmount || 0,
                dueAmount: transactionData.dueAmount || 0,
                paymentMethod: transactionData.paymentMethod || 'CASH',
                customer: {
                    name: transactionData.customer?.name || null,
                    phone: transactionData.customer?.phone || null,
                    address: transactionData.customer?.address || null
                }
            });

            // সেশন টোটাল আপডেট
            const session = await Session.findById(sessionId);
            if (session) {
                if (transactionData.transactionType === 'SALE') {
                    session.totalSales = (session.totalSales || 0) + (transactionData.totalAmount || 0);
                } else if (transactionData.transactionType === 'EXPENSE') {
                    session.totalExpenses = (session.totalExpenses || 0) + (transactionData.totalAmount || 0);
                }
                if (transactionData.dueAmount > 0) {
                    session.totalDue = (session.totalDue || 0) + transactionData.dueAmount;
                }
                await session.save();
            }

        }


        
       else if (intent === 'QUERY_SUMMARY') {
    // ১. বাংলাদেশ টাইম (BST: UTC+6) অনুযায়ী আজকের দিনের শুরু ও শেষ বের করা
    const { startOfToday, endOfToday } = getTodayRangeBD();



      let dateFilter = {};
    if (!queryFilter?.dateRange || queryFilter.dateRange === 'TODAY') {
        dateFilter = { createdAt: { $gte: startOfToday, $lte: endOfToday } };
    }





    // ২. আজকের দিনের সব ডাটা ফেচ করার কোয়েরি
      const dbQuery = {
        userId,
        sessionId,
        ...dateFilter
    };







      if (queryFilter?.transactionType === 'DUE') {
        // "বাকি" মানে dueAmount > 0 থাকা transaction
        dbQuery['dueAmount'] = { $gt: 0 };
    } else if (queryFilter?.transactionType === 'SALE') {
        dbQuery['transactionType'] = 'SALE';
    } else if (queryFilter?.transactionType === 'EXPENSE') {
        dbQuery['transactionType'] = 'EXPENSE';
    }







    // কাস্টমারের নির্দিষ্ট নাম থাকলে ফিল্টার যোগ করা
   if (queryFilter?.customerName) {
        dbQuery['customer.name'] = new RegExp(queryFilter.customerName, 'i');
    }








        const aggResult = await Transaction.aggregate([
        { $match: dbQuery },
        {
            $group: {
                _id: null,
                totalSalesAmount: { $sum: "$totalAmount" },
                totalPaidAmount: { $sum: "$paidAmount" },
                totalDueAmount: { $sum: "$dueAmount" },
                transactionCount: { $sum: 1 }
            }
        }
    ]);





   const totals = aggResult[0] || {
        totalSalesAmount: 0,
        totalPaidAmount: 0,
        totalDueAmount: 0,
        transactionCount: 0
    };






     // ৬. লিস্ট আকারে raw ডাটা ফেচ করা (যেমন "কে কে বাকি নিয়েছে" এর জন্য নাম-ভিত্তিক লিস্ট লাগবে)
    const rawTransactions = await Transaction.find(dbQuery).sort({ createdAt: 1 }).lean();

    const cleanedTransactions = rawTransactions.map(t => ({
        type: t.transactionType,
        items: t.items.map(i => `${i.itemName || ''} (${i.quantity || 1} ${i.unit || ''}) - ${i.totalPrice || 0}tk`),
        totalAmount: t.totalAmount,
        paidAmount: t.paidAmount,
        dueAmount: t.dueAmount,
        paymentMethod: t.paymentMethod,
        customerName: t.customer?.name || 'Unknown',
        customerPhone: t.customer?.phone || 'N/A',
        customerAddress: t.customer?.address || 'N/A',
        time: new Date(t.createdAt).toLocaleTimeString('bn-BD', { timeZone: 'Asia/Dhaka' })
    }));

    // ৭. Gemini কে পাঠানোর জন্য — এখন pre-calculated totals + list দুটোই দিচ্ছি
    //    যাতে Gemini হিসাব না করে শুধু সাজিয়ে বলে
    const dataForAI = {
        preCalculatedTotals: totals,   // এটাই ground truth, Gemini এর ওপর ভরসা না করে DB থেকেই সঠিক সংখ্যা
        transactionsList: cleanedTransactions
    };

    finalAiText = await generateSummaryReply(userMessageText, dataForAI, chatHistory);
    finalSummary = null;


}





 
        const aiMessage = await Message.create({
            userId,
            sessionId,
            sender: "AI",
            text: aiParsedResult.aiReply || 'মামা, হিসাবটা সেভ করে রেখেছি!',
            summary: aiParsedResult.summary || null,
            transactionId: savedTransaction ? savedTransaction._id : null
        });




        




        return res.status(200).json({
           success: true,
            message: 'মেসেজ প্রসেস সফল হয়েছে!',
            data: {
                userMessage: {
                    _id: userMessage._id,
                    userId: userMessage.userId,
                    sessionId: userMessage.sessionId,
                    sender: userMessage.sender,
                    text: userMessage.text,
                    summary: userMessage.summary,
                    createdAt: userMessage.createdAt
                },
                aiMessage: {
                    _id: aiMessage._id,
                    userId: aiMessage.userId,
                    sessionId: aiMessage.sessionId,
                    sender: aiMessage.sender,
                    text: aiMessage.text,
                    summary: aiMessage.summary,
                    createdAt: aiMessage.createdAt
                }
            }
        });




    }
    catch (error) {
    // শুধু error.message না দিয়ে পুরো error ও stack প্রিন্ট কর
        console.log("❌ EXACT ERROR OBJECT:", error);
        console.log("📍 ERROR STACK:", error.stack);

        return res.status(500).json({
            success: false,
            message: 'মেসেজ প্রসেস করতে সমস্যা হয়েছে!',
            error: error.message,
            fullError: error // টেস্ট করার জন্য রেসপন্সেও পাঠায় দে
        });

    }
}














// get message and session item 

exports.getMessageAndSessionItem = async (req, res) => {
    try {
       
        const { userId, sessionId } = req.params;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const skip = (page - 1) * limit;




        if (!sessionId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'sessionId এবং userId উভয়ই প্রদান করা আবশ্যক!'
            });
        }





        // total message count 

        const totalMessages = await Message.countDocuments({ userId, sessionId });





        // message fetch and pagination
        const messages = await Message.find({ userId, sessionId })
        .populate('transactionId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);





        // reverse message 
        const reversedMessages = messages.reverse();
        const totalPages = Math.ceil(totalMessages / limit);





        return res.status(200).json({
            success: true,
            isLoading: false,
            currentPage: page,
            totalPages,
            totalMessages,
            hasMore: page < totalPages,
            messages: reversedMessages
        });





    } catch (error) {
       console.error("Get Messages Error:", error);
        return res.status(500).json({
            success: false,
            isLoading: false,
            message: 'সার্ভারে অভ্যন্তরীণ সমস্যা হয়েছে!',
            error: error.message
        });
    }
};






