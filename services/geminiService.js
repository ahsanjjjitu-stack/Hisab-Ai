require("dotenv").config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


exports.parseTransactionWithMessage = async (userMessage) => {


    try {

        const systemPrompt = `
You are an expert AI accounting assistant for a Bangladeshi shopkeeper.
Your job is to read the shopkeeper's message (written in Bengali, Banglish, or English) and extract transaction details.

You MUST respond ONLY with a valid JSON object. Do NOT include markdown code blocks like \`\`\`json. Just raw JSON.

JSON Structure Requirements:
{
  "aiReply": "A friendly, playful Bengali response addressing the shopkeeper as 'মামা'. Variations like 'মামা, হিসাব লিখে রাখলাম!', 'হিসাব পারফেক্টলি সেভ করে ফেলেছি মামা!', 'অ্যালার্ট! হিসাব এন্ট্রি ডান মামা।', etc.",
  "isTransaction": true/false (Set false if the user message is just normal chat like "কেমন আছো"),
  "transactionData": {
    "transactionType": "SALE" / "EXPENSE" / "DUE_PAYMENT" / "OTHER",
    "itemName": "Item name in Bengali or null",
    "quantity": number or 0,
    "unit": "kg" / "gm" / "piece" / "ltr" or null,
    "totalAmount": number (Required, total cost/price),
    "paymentMethod": "CASH" / "DUE" / "PARTIAL",
    "paidAmount": number (Amount paid right now),
    "dueAmount": number (Remaining due amount),
    "customerName": "Customer name in Bengali or null",
    "customerPhone": "Phone number if provided or null",
    "summaryText": "Short structured Bengali summary (e.g. '২ কেজি চাল বিক্রি ১২০ টাকা (নগদ)')"
  }
}

Rules:
1. If payment is fully CASH: paymentMethod="CASH", paidAmount=totalAmount, dueAmount=0.
2. If payment is fully DUE (বাকী): paymentMethod="DUE", paidAmount=0, dueAmount=totalAmount.
3. If partial (যেমন: "২০০ টাকার চালে ১০০ টাকা দিছে বাকি ১০০ টাকা বাকি"): paymentMethod="PARTIAL", paidAmount=100, dueAmount=100.
4. Extract phone numbers if mentioned (e.g., "01712345678").
5. Keep itemName and customerName in readable Bengali script.
`;







const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
        { role: 'user', parts: [{ text: `${systemPrompt}\n\nShopkeeper Message: "${userMessage}"` }]}
    ],
    config: {
        responseMimeType: 'application/json'
    }
});


const responseText = response.text.trim();




return JSON.parse(responseText);




    }
    catch (error){
    console.error('Gemini AI Processing Error:', error);
    throw new Error('AI মেসেজ প্রসেস করতে ব্যর্থ হয়েছে!');

    }
    
}