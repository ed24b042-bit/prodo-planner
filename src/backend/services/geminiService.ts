import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      aiInstance = new GoogleGenAI({ apiKey });
    }
  }
  return aiInstance;
}

export function isGeminiOnline(): boolean {
  return !!process.env.GEMINI_API_KEY;
}

export function cleanAndParseJson(text: string): any {
  try {
    // Strips markdown backticks if returned by Gemini
    const cleaned = text
      .replace(/^```json\s*/i, '')
      .replace(/```\s*$/, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Error parsing JSON from Gemini response:', error, text);
    throw new Error('Invalid JSON format returned by AI assistant.');
  }
}
