import { CohereClient } from "cohere-ai";

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

export async function embedText(text) {
  try {
    const response = await cohere.embed({
      texts: [text],
      model: "embed-english-v3.0", // or use "embed-multilingual-v3.0"
      input_type: "search_document",
    });

    return response.embeddings[0];
  } catch (error) {
    console.error("Embedding error:", error);
    throw error;
  }
}
