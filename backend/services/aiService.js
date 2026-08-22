const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

async function generateAIExplanation(exception) {
  const prompt = `
You are an AI employee helping a finance reviewer resolve transaction exceptions.

Analyze the following exception using ONLY the provided data.

Exception ID: ${exception.id}
Invoice Number: ${exception.invoiceNumber}
Vendor: ${exception.vendor}
Exception Type: ${exception.type}
Expected Amount: ${exception.expectedAmount}
Actual Amount: ${exception.actualAmount}
Difference: ${exception.difference}
Description: ${exception.description}

Explain why the transaction was flagged and recommend an appropriate resolution.

Do not invent facts that are not present in the supplied data.
`;

  const response = await client.chat.completions.create({
    model: "openrouter/free",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  });

  return response.choices[0].message.content;
}

module.exports = {
  generateAIExplanation
};