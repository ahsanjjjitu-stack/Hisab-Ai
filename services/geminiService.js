const { GoogleGenAI } = require('@google/genai');

// API Key সেট করা আছে কিনা চেক
if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing in environment variables!");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.parseTransactionWithMessage = async (userMessage) => {
    try {
        const systemPrompt = `
You are an expert AI accounting assistant for a Bangladeshi shopkeeper.
Your job is to read the shopkeeper's message (written in Bengali, Banglish, or English) and extract transaction details.

You MUST respond ONLY with a valid JSON object matching this structure:
{
  "aiReply": "A friendly Bengali response addressing the shopkeeper as 'মামা'. E.g., 'মামা, হিসাব লিখে রাখলাম!'",
  "isTransaction": true,
  "transactionData": {
    "transactionType": "SALE",
    "items": [
      {
        "itemName": "চাল",
        "quantity": 1,
        "unit": "kg",
        "unitPrice": 200,
        "totalPrice": 200
      }
    ],
    "totalAmount": 200,
    "paidAmount": 100,
    "dueAmount": 100,
    "paymentMethod": "PARTIAL_DUE",
    "customer": {
      "name": "রহিম",
      "phone": null,
      "address": null
    }
  }
}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: `${systemPrompt}\n\nShopkeeper Message: "${userMessage}"`,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const responseText = response.text.trim();
        return JSON.parse(responseText);

    } catch (error) {
        console.error('Gemini AI Processing Error Detail:', error);
        throw error; // সঠিক error log দেখার জন্য
    }
};