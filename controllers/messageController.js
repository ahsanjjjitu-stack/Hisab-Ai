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
               rawMessage: userMessageText,
               transactionType: tData.transactionType || 'SALE',
               itemName: tData.itemName || null,
               quantity: tData.quantity || 0,
               unit: tData.unit || null,
               totalAmount: tData.totalAmount || 0,
               paymentMethod: tData.paymentMethod || 'CASH',
               paidAmount: tData.paidAmount || 0,
               dueAmount: tData.dueAmount || 0,
               customerName: tData.customerName || null,
               customerPhone: tData.customerPhone || null,
               summaryText: tData.summaryText || 'হিসাব সংরক্ষণ করা হয়েছে'
           });








            // session total hisab 

        const session = await Session.findById(sessionId);


        if (session) {

            if (tData.transactionType === 'SALE'){
                session.totalSales = (session.totalSales || 0) + (tData.totalAmount || 0);
            }
            else if (tData.transactionType === 'EXPENSE') {
                session.totalExpenses = (session.totalExpenses || 0) + (tData.totalAmount || 0);
            }

            if (tData.dueAmount > 0){
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







        // ai massage population 
        const populatedAiMessage = await Message.findById(aiMessage._id).populate('transactionId');




        return res.status(200).json({
            success: true,
            message: 'মেসেজ প্রসেস সফল হয়েছে!',
            data: {
                userMessage,
                aiMessage: populatedAiMessage
            }
        });




    }
    catch (error) {

    console.error('Send Message Error:', error);
    return res.status(500).json({
      success: false,
      message: 'মেসেজ প্রসেস করতে সমস্যা হয়েছে!',
      error: error.message
    });

    }
}














// get message and session item 
// get message and session item 
exports.getMessageAndSessionItem = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user ? req.user.id : req.params.userId; 

        if (!userId || !sessionId) {
            return res.status(400).json({
                success: false,
                message: 'userId এবং sessionId প্রদান করা আবশ্যক!'
            });
        }

        const messages = await Message.find({ userId, sessionId })
            .populate('transactionId')
            .sort({ createdAt: 1 }); 

        return res.status(200).json({
            success: true,
            count: messages.length,
            messages
        });

    } catch (error) {
        console.error("Get Messages Error:", error);
        return res.status(500).json({
            success: false,
            message: 'সার্ভারে অভ্যন্তরীণ সমস্যা হয়েছে!'
        });
    }
};






