require("dotenv").config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.parseUserIntentAndMessage = async (userMessage, chatHistory = []) => {
    try {
        const systemPrompt = `
You are an expert AI accounting assistant for a Bangladeshi shopkeeper.
Your job is to read the shopkeeper's latest message alongside recent chat history and return a valid JSON object.

Identify the INTENT of the message:
1. "SAVE_TRANSACTION": If the user is entering a new sale, expense, or due entry (e.g., "চাল ২ কেজি ১২০ টাকা").
2. "QUERY_SUMMARY": If the user is asking to view/know past transactions, totals, or customer dues (e.g., "আজকে মোট বাকি কত?", "রহিমের হিসেব দেখাও").
3. "NORMAL_CHAT": If the user is having normal conversion, greetings, or complimenting previous work (e.g., "কেমন আছো", "আগের হিসাব সুন্দর লিখেছিস").

JSON Output Structure:
{
  "intent": "SAVE_TRANSACTION" | "QUERY_SUMMARY" | "NORMAL_CHAT",
  "aiReply": "A warm Bengali response starting with 'মামা'. ONLY provide this if intent is 'SAVE_TRANSACTION' or 'NORMAL_CHAT'. If intent is 'QUERY_SUMMARY', set this to null (the backend will fetch data and ask you again). Always end with a natural, dynamic follow-up question.",
  "summary": "Short clean Bengali summary if intent is SAVE_TRANSACTION (e.g., '২ কেজি চাল - ১২০ টাকা (নগদ)'). Otherwise set to null.",
  "queryFilter": {
    "dateRange": "TODAY" | "THIS_MONTH" | "ALL_TIME" | null,
    "transactionType": "SALE" | "EXPENSE" | "DUE" | "ALL" | null,
    "customerName": "Customer name in Bengali if specified or null"
  },
  "transactionData": {
    "transactionType": "SALE" | "EXPENSE" | "DUE_COLLECTION",
    "items": [
      {
        "itemName": "Item name in Bengali",
        "quantity": number or 1,
        "unit": "kg" / "gm" / "piece" / "ltr" or null,
        "unitPrice": number or 0,
        "totalPrice": number
      }
    ],
    "totalAmount": number,
    "paidAmount": number,
    "dueAmount": number,
    "paymentMethod": "CASH" | "DUE" | "PARTIAL_DUE" | "DIGITAL",
    "customer": {
      "name": "Customer name in Bengali or null",
      "phone": "Phone number or null",
      "address": "Address or null"
    }
  }
}

Rules:
- If intent is "NORMAL_CHAT", set queryFilter to null and transactionData to null.
- If intent is "QUERY_SUMMARY", extract filter params into queryFilter, set transactionData to null.
- Never use markdown formatting like \`\`\`json. Return pure JSON only.
`;

        // ইতিহাস ফরম্যাট করা (Recent History Context)
        const formattedHistory = chatHistory.map(msg => `${msg.sender}: ${msg.text}`).join("\n");

        const promptText = `
Recent Conversation History:
${formattedHistory || "No previous history"}

Current Shopkeeper Message: "${userMessage}"
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `${systemPrompt}\n\n${promptText}`,
            config: {
                responseMimeType: 'application/json'
            }
        });

        return JSON.parse(response.text.trim());

    } catch (error) {
        console.error('Gemini Parsing Error:', error);
        throw new Error('AI মেসেজ প্রসেস করতে ব্যর্থ হয়েছে!');
    }
};


















exports.generateSummaryReply = async (userMessage, dbResults, chatHistory = []) => {

  try {

    const systemPrompt = `
You are an expert AI accounting assistant for a Bangladeshi shopkeeper.
The shopkeeper asked a question about their transaction history.
Backend has fetched the relevant data from the MongoDB database.

Your Job:
Read the fetched database data and answer the shopkeeper's question accurately in warm, natural Bengali.
Always address them as 'মামা' and end with a natural, dynamic follow-up question.

Rules:
- Be precise with amounts and quantities based ONLY on the provided database data.
- If database data is empty or zero, politely inform the shopkeeper that no such transactions were found.
- Do NOT output JSON here. Just return pure text.
`;


const promptText = `
Database Query Results:
${JSON.stringify(dbResults, null, 2)}
User Question: "${userMessage}"
`;




const response = await ai.models.generateContent({
     model: 'gemini-2.5-flash',
     contents: `${systemPrompt}\n\n${promptText}`
});




return response.text.trim();



  }
  catch (error) {
      console.error('Summary Reply Generation Error:', error);
      return "মামা, ডাটাবেজ থেকে হিসাবটা সাজিয়ে বলতে একটু সমস্যা হচ্ছে। আবার একটু বলবেন?";
  }



}