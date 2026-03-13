import { Router, Request, Response } from 'express';

export const reportChatRouter = Router();

const GROQ_CHAT_API = 'https://api.groq.com/openai/v1/chat/completions';
const SYSTEM_PROMPT = `You are a disaster response assistant guiding survivors to create a structured emergency report for authorities.
Ask ONE question at a time, in a calm, clear way.
Follow this order:
1. Location - Where are you? (address or landmark)
2. Disaster type - What happened? (flood, earthquake, fire, landslide, etc.)
3. Severity - How severe? 1=minor, 5=critical
4. People affected - How many people with you?
5. Injuries - Anyone injured or needing medical help?
6. Immediate needs - What do you need now? (water, shelter, medicine, rescue)
7. Contact - Your phone or how to reach you (if not already known)
8. Additional details - Anything else authorities should know?

When the user answers, acknowledge briefly and ask the next question.
When you have enough info (at least location, disaster type, severity), say "Report complete. Submitting to authorities."
Output ONLY the next question or confirmation. Be concise.`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ReportChatBody {
  messages: ChatMessage[];
  preferredLanguage?: string;
}

reportChatRouter.post('/', async (req: Request, res: Response) => {
  try {
    // Report chat uses Groq for LLM (ElevenLabs does TTS/STT only; no chat API). Prefer GROQ_API_KEY.
    const apiKey = process.env.GROQ_API_KEY || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'GROQ_API_KEY or ELEVENLABS_API_KEY not configured (required for Report chat)' });
      return;
    }

    const { messages, preferredLanguage = 'en' }: ReportChatBody = req.body;

    const effectiveMessages = Array.isArray(messages) && messages.length > 0
      ? messages
      : [{ role: 'user' as const, content: 'I need to make an emergency report.' }];

    const langNote = preferredLanguage !== 'en'
      ? `\n\nIMPORTANT: Respond in the user's preferred language: ${preferredLanguage}.`
      : '';

    const systemContent = SYSTEM_PROMPT + langNote;
    const apiMessages: Array<{ role: string; content: string }> = [
      { role: 'system', content: systemContent },
      ...effectiveMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch(GROQ_CHAT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: apiMessages,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[ElevenLabs/ReportChat]', response.status, errText);
      res.status(response.status).json({
        error: `ElevenLabs API error: ${response.status}`,
      });
      return;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content?.trim() ?? '';

    res.json({ reply: content });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[/api/report-chat]', msg);
    res.status(500).json({ error: msg });
  }
});
