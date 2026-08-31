require("dotenv").config();
const { GoogleGenAI } = require('@google/genai');

// Google Gen AI SDK Initialization
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.parseTransactionWithMessage = async (userMessage) => {
    try {
        const systemPrompt = `
You are an expert AI accounting assistant for a Bangladeshi shopkeeper.
Your job is to read the shopkeeper's message (written in Bengali, Banglish, or English) and extract transaction details.

You MUST respond ONLY with a valid JSON object matching this structure:

{
  "aiReply": "A friendly, playful Bengali response addressing the shopkeeper as 'মামা'. E.g., 'মামা, হিসাব লিখে রাখলাম!', 'অ্যালার্ট! হিসাব এন্ট্রি ডান মামা।'",
  "isTransaction": true/false (Set false if it is just normal greetings like 'কেমন আছো'),
  "transactionData": {
    "transactionType": "SALE" / "EXPENSE" / "DUE_COLLECTION",
    "items": [
      {
        "itemName": "Item name in Bengali",
        "quantity": number or 1,
        "unit": "kg" / "gm" / "piece" / "ltr" or null,
        "unitPrice": number or 0,
        "totalPrice": number
      }
    ],
    "totalAmount": number (Required, total cost/price),
    "paidAmount": number (Amount paid right now),
    "dueAmount": number (Remaining due amount),
    "paymentMethod": "CASH" / "DUE" / "PARTIAL_DUE" / "DIGITAL",
    "customer": {
      "name": "Customer name in Bengali or null",
      "phone": "Phone number if provided or null",
      "address": "Address if provided or null"
    }
  }
}

Rules:
1. If payment is fully CASH: paymentMethod="CASH", paidAmount=totalAmount, dueAmount=0.
2. If payment is fully DUE (বাকি): paymentMethod="DUE", paidAmount=0, dueAmount=totalAmount.
3. If partial: paymentMethod="PARTIAL_DUE", paidAmount=number, dueAmount=number.
4. If old due is collected: transactionType="DUE_COLLECTION".
5. Extract items into the items array properly.
6. Keep names and text in readable Bengali script.
`;

        // Correct API Call method for new @google/genai SDK
        const response = await ai.models.generateContent({
            model: 'gemini-3.6-flash',
            contents: userMessage,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: 'application/json'
            }
        });

        // Get text response
        const responseText = response.text.trim();

        return JSON.parse(responseText);

    } catch (error) {
        console.error('Gemini AI Processing Exact Error:', error);
        throw new Error(`AI Processing Error: ${error.message}`);
    }
};