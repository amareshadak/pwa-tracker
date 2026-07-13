// =========================================================
// Daily Tracker — parse-capture Edge Function (Deno)
// Best-effort classification of a quick-captured note/idea/task:
// picks a type (habit/expense/reminder/note) and a short summary.
// Called async, after the raw capture is already saved locally —
// this only adds a label, it never creates/edits any other record.
//
// Same auth pattern as parse-expense: verify_jwt=true alone doesn't
// reject this project's legacy-format anon key, so we additionally
// require a real user via auth.getUser().
//
// Secret required: supabase secrets set GEMINI_API_KEY=... (shared
// with parse-expense — same key, same free-tier quota)
// =========================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonError = (status: number, code: string, message: string) =>
  new Response(JSON.stringify({ error: code, message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonError(405, "METHOD_NOT_ALLOWED", "POST only");
  }
  if (!GEMINI_KEY) {
    return jsonError(500, "AI_NOT_CONFIGURED", "AI is not configured");
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
  if (userErr || !userData?.user) {
    return jsonError(401, "AUTH_REQUIRED", "Sign in required");
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "BAD_JSON", "Invalid request");
  }

  const text = (body.text || "").trim();
  if (!text) return jsonError(400, "MISSING_TEXT", "Missing text");

  const schema = {
    type: "OBJECT",
    properties: {
      type: { type: "STRING", enum: ["habit", "expense", "reminder", "note"] },
      summary: { type: "STRING" },
    },
    required: ["type", "summary"],
  };

  const prompt =
    `A user quickly jotted down (typed or dictated) this thought in a personal habit+expense tracker app:\n` +
    `"${text}"\n` +
    `Classify it as one of: "habit" (something they want to start doing regularly), ` +
    `"expense" (money they spent or need to spend), "reminder" (a one-off task/thing to do), ` +
    `or "note" (a general idea that doesn't fit the others).\n` +
    `Also give a short (under 8 words) cleaned-up summary/title for it.`;

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0 },
        }),
      },
    );
  } catch (e) {
    console.error("Gemini fetch failed", e);
    return jsonError(502, "AI_UNAVAILABLE", "AI service is temporarily unavailable");
  }

  if (!res.ok) {
    const detail = await res.text();
    console.error("Gemini error", res.status, detail);
    const code = res.status === 429 ? "AI_QUOTA_EXCEEDED" : res.status === 404 ? "AI_MODEL_UNAVAILABLE" : "AI_UPSTREAM_ERROR";
    const message = res.status === 429 ? "AI quota exceeded; try again later" : "AI service rejected the request";
    return jsonError(res.status === 429 ? 429 : 502, code, message);
  }

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    return jsonError(502, "AI_EMPTY_RESPONSE", "AI returned no result");
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return jsonError(502, "AI_INVALID_RESPONSE", "AI returned an invalid result");
  }

  return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
