const Message = require("../model/model.message");
const Transaction = require("../model/model.transaction");
const Session = require("../model/model.session");
const { parseTransactionWithMessage } = require("../services/geminiService");



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





       // save shop massage 
       const userMessage = await Message.create({
            userId,
            sessionId,
            sender: "USER",
            text: userMessageText
        });
       







       // Gemini ai massage parse 
       const aiParsedResult = await parseTransactionWithMessage(userMessageText);



       let savedTransaction = null;




       // ai transaction save 
       if (aiParsedResult.isTransaction && aiParsedResult.transactionData) {

        const tData = aiParsedResult.transactionData;


           savedTransaction = await Transaction.create({
               userId,
                sessionId,
                transactionType: tData.transactionType || 'SALE',
                items: tData.items || [],
                totalAmount: tData.totalAmount || 0,
                paidAmount: tData.paidAmount || 0,
                dueAmount: tData.dueAmount || 0,
                paymentMethod: tData.paymentMethod || 'CASH',
                customer: {
                    name: tData.customer?.name || null,
                    phone: tData.customer?.phone || null,
                    address: tData.customer?.address || null
                }
           });






            // session total hisab 

        const session = await Session.findById(sessionId);
            if (session) {
                if (tData.transactionType === 'SALE') {
                    session.totalSales = (session.totalSales || 0) + (tData.totalAmount || 0);
                } else if (tData.transactionType === 'EXPENSE') {
                    session.totalExpenses = (session.totalExpenses || 0) + (tData.totalAmount || 0);
                }

                if (tData.dueAmount > 0) {
                    session.totalDue = (session.totalDue || 0) + tData.dueAmount;
                }

                await session.save();
            }


    }






 
        const aiMessage = await Message.create({
            userId,
            sessionId,
            sender: "AI",
            text: aiParsedResult.aiReply || 'মামা, হিসাবটা সেভ করে রেখেছি!',
            transactionId: savedTransaction ? savedTransaction._id : null
        });




        




        return res.status(200).json({
            success: true,
            message: 'মেসেজ প্রসেস সফল হয়েছে!',
            data: {
                userMessage,
                aiMessage
            }
        });




    }
    catch (error) {
    console.error('Send Message Error:', error);
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'মেসেজ প্রসেস করতে সমস্যা হয়েছে!',
      error: error.message
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






