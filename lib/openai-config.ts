/**
 * OpenAI Configuration — model selection and validation.
 * Reused from CreditIQ project.
 */
import { openai } from "@ai-sdk/openai"

const CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small"

export const getOpenAIModel = (modelType: "chat" | "embedding" = "chat") => {
  return openai(modelType === "embedding" ? EMBEDDING_MODEL : CHAT_MODEL)
}

export const getModelName = (modelType: "chat" | "embedding" = "chat") => {
  return modelType === "embedding" ? EMBEDDING_MODEL : CHAT_MODEL
}

export const validateOpenAIConfig = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is required")
  }
  console.log(`Using OpenAI Chat Model: ${CHAT_MODEL}`)
  console.log(`Using OpenAI Embedding Model: ${EMBEDDING_MODEL}`)
}
