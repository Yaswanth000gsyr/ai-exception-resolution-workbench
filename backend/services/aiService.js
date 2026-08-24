const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

async function generateAIExplanation(exception) {
  const prompt = `
You are an AI employee assisting a finance operations reviewer.

Analyze ONLY the transaction data provided below.
Do not invent facts or assume information that is not present.

TRANSACTION EXCEPTION

Exception ID: ${exception.id}
Invoice Number: ${exception.invoiceNumber}
Vendor: ${exception.vendor}
Exception Type: ${exception.type}
Expected Amount: ${exception.expectedAmount}
Actual Amount: ${exception.actualAmount}
Difference: ${exception.difference}
Purchase Order: ${exception.purchaseOrderNumber || "Not provided"}
Expected Purchase Order: ${exception.expectedPurchaseOrderNumber || "Not provided"}
Description: ${exception.description}

Your task:

1. Explain clearly why the transaction was flagged.
2. Recommend the most appropriate next action based ONLY on the supplied information.
3. Give a confidence score from 0 to 100.

Return ONLY valid JSON in exactly this format:

{
  "explanation": "Concise explanation of why the transaction was flagged.",
  "resolution": "Recommended action for the finance reviewer.",
  "confidence": 0
}

Do not include markdown.
Do not include additional fields.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt
    });

    const text = response.text.trim();

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error("AI returned invalid JSON:", text);

      return {
        explanation: text,
        resolution:
          "Human review required because the AI response could not be parsed.",
        confidence: 0
      };
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

module.exports = {
  generateAIExplanation
};