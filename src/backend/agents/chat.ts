import { generateText, isGeminiOnline } from '../services/geminiService';

export interface ChatAgentResult {
  reply: string;
  actions: { type: string; payload: any }[];
}

/**
 * Chat Agent: Standard conversational interface. Handles high-level productivity questions, general knowledge, or positive coaching.
 */
export async function converseChat(prompt: string, conversationHistory: any[] = []): Promise<ChatAgentResult> {
  if (!isGeminiOnline()) {
    return {
      reply: `[Chat Agent (Offline Fallback)] Hello! I am your offline executive Prodo coach. I am ready to help you plan, schedule, or track habits. Connect your Gemini API key in the Settings Panel for conversational chat capabilities!`,
      actions: []
    };
  }

  try {
    const sysMsg = `You are Prodo, a warm, professional, highly capable executive productivity assistant.
Your goal is to converse positively with the user, answer productivity questions, offer advice on time management, and keep responses clean, structured, and beautifully formatted with markdown.
Avoid generic conversational filler; be concrete and direct.`;

    const chatHistoryContext = conversationHistory
      .slice(-6)
      .map(m => `${m.sender === 'prodo' ? 'Prodo' : 'User'}: ${m.text}`)
      .join('\n');

    const fullPrompt = `${chatHistoryContext}\nUser: ${prompt}\nProdo:`;

    const reply = await generateText(fullPrompt, sysMsg);

    return {
      reply: `[Chat Agent] ${reply.trim()}`,
      actions: []
    };
  } catch (error) {
    console.error('Chat Agent execution failed:', error);
    return {
      reply: `[Chat Agent] I am here, but I encountered an issue formulating an executive response. Feel free to try again or ask me to schedule an event instead!`,
      actions: []
    };
  }
}
