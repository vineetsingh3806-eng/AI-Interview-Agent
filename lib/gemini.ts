// ============================================================
// GEMINI CLIENT
// Server-side Gemini API calls for local and Vercel deployments.
// ============================================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export interface GeminiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GeminiOptions {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  timeoutMs?: number;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  error?: { message?: string; code?: number; status?: string };
}

function requireApiKey() {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured. Add it to .env.local or Vercel Environment Variables.");
  }
}

function toGeminiContents(messages: GeminiMessage[]) {
  const system = messages.find((m) => m.role === "system")?.content;
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  return { system, contents };
}

export async function geminiChat(
  messages: GeminiMessage[],
  options: GeminiOptions = {}
): Promise<string> {
  requireApiKey();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 30000);
  const { system, contents } = toGeminiContents(messages);

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY!)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          contents,
          generationConfig: {
            temperature: options.temperature ?? 0.3,
            topP: options.top_p ?? 0.8,
            maxOutputTokens: options.max_tokens ?? 1100,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const data = (await response.json()) as GeminiResponse;
    if (!response.ok) {
      const message = data.error?.message || `Gemini API error ${response.status}`;
      throw new Error(message);
    }

    const content = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!content) throw new Error("Gemini returned an empty response");
    return content;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Gemini request timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Kept for compatibility with the existing non-streaming interview architecture.
export async function* geminiChatStream(
  messages: GeminiMessage[],
  options: GeminiOptions = {}
): AsyncGenerator<string> {
  yield await geminiChat(messages, options);
}

export function parseJsonFromLLM<T>(raw: string): T {
  let cleaned = raw.trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1)) as T;
    throw new Error("LLM returned invalid JSON");
  }
}

export async function checkGeminiHealth(): Promise<boolean> {
  if (!GEMINI_API_KEY) return false;
  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/${encodeURIComponent(GEMINI_MODEL)}?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    return response.ok;
  } catch {
    return false;
  }
}
