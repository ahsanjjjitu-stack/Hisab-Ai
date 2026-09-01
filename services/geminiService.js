require("dotenv").config();
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.parseTransactionWithMessage = async (userMessage, chatHistory = []) => {
    try {
        const systemPrompt = `
You are an expert AI accounting assistant for a Bangladeshi shopkeeper.
Analyze the user's input (written in Bengali, Banglish, or English) and classify the intent correctly.

CRITICAL INTENT RULES:
1. "QUERY_SUMMARY": If the user is asking to view/know/see past records, today's totals, remaining dues, or customer info/addresses. (e.g., "আজকের বাকি কত", "কে কে বাকি নিছে", "কার কার ঠিকানা কি", "হিসাব দেখা", "hisab ta de", "total baki", "k k baki nise").
2. "SAVE_TRANSACTION": ONLY if the user is explicitly recording a NEW transaction with items/amounts (e.g., "চাল ২ কেজি ১২০ টাকা", "রহিমকে ১০০ টাকা বাকি দিলাম").
3. "NORMAL_CHAT": Casual greetings, thanks, or general feedback.

JSON Structure:
{
  "intent": "SAVE_TRANSACTION" | "QUERY_SUMMARY" | "NORMAL_CHAT",
  "aiReply": "A warm Bengali message starting with 'মামা'. Provide this ONLY for SAVE_TRANSACTION or NORMAL_CHAT. For QUERY_SUMMARY, set this strictly to null.",
  "summary": "Short clean Bengali summary if SAVE_TRANSACTION. Otherwise null.",
  "queryFilter": {
    "dateRange": "TODAY" | "THIS_MONTH" | "ALL_TIME" | null,
    "transactionType": "SALE" | "EXPENSE" | "DUE" | "ALL" | null,
    "customerName": "Customer name in Bengali or null"
  },
  "transactionData": {
    "transactionType": "SALE" | "EXPENSE" | "DUE_COLLECTION",
    "items": [],
    "totalAmount": 0,
    "paidAmount": 0,
    "dueAmount": 0,
    "paymentMethod": "CASH",
    "customer": { "name": null, "phone": null, "address": null }
  }
}

Rules:
- If intent is QUERY_SUMMARY: transactionData MUST be null. Extract queryFilter (e.g., for "ajker total baki", dateRange="TODAY", transactionType="DUE").
- Never mistake a question or a request to view data as a new transaction entry.
`;

        const formattedHistory = chatHistory.map(msg => `${msg.sender}: ${msg.text}`).join("\n");
        const promptText = `Recent History:\n${formattedHistory || "None"}\n\nCurrent Message: "${userMessage}"`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
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
     model: 'gemini-3.6-flash',
     contents: `${systemPrompt}\n\n${promptText}`
});




return response.text.trim();



  }
  catch (error) {
      console.error('Summary Reply Generation Error:', error);
      return "মামা, ডাটাবেজ থেকে হিসাবটা সাজিয়ে বলতে একটু সমস্যা হচ্ছে। আবার একটু বলবেন?";
  }



}