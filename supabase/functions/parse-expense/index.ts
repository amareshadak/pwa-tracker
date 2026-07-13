// =========================================================
// Daily Tracker — parse-expense Edge Function (Deno)
// Turns a free-text note ("250 lunch swiggy hdfc") into a
// structured expense using Gemini. Called from the quick-add
// sheet as an optional prefill — never auto-saves anything.
//
// verify_jwt=true alone is NOT enough here: this project uses the
// legacy JWT-format anon key, which is itself a validly-signed JWT,
// so the platform gate lets it through same as a real user session.
// We additionally call auth.getUser() with the caller's token to
// confirm it's a genuine logged-in user, not just the public anon key
// (which is committed in config.js and visible to anyone).
//
// Secret required: supabase secrets set GEMINI_API_KEY=...
// =========================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
const TZ = "Asia/Kolkata";
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

interface Ref { id: string; name: string; }

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

  let body: { text?: string; categories?: Ref[]; accounts?: Ref[] };
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "BAD_JSON", "Invalid request");
  }

  const text = (body.text || "").trim();
  const categories = body.categories || [];
  const accounts = body.accounts || [];
  if (!text) return jsonError(400, "MISSING_TEXT", "Missing text");
  if (!categories.length || !accounts.length) {
    return jsonError(400, "MISSING_REFERENCES", "Missing categories or accounts");
  }

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date()); // YYYY-MM-DD

  const schema = {
    type: "OBJECT",
    properties: {
      amount: { type: "NUMBER" },
      category_id: { type: "STRING", enum: categories.map((c) => c.id) },
      account_id: { type: "STRING", enum: accounts.map((a) => a.id) },
      note: { type: "STRING" },
      date: { type: "STRING" },
    },
    required: ["amount", "category_id", "account_id"],
  };

  const prompt =
    `You extract a single expense from a short note written by an Indian user tracking personal spending.\n` +
    `Today's date is ${today} (Asia/Kolkata).\n` +
    `Categories (pick the closest one, by id):\n${categories.map((c) => `- ${c.id}: ${c.name}`).join("\n")}\n` +
    `Accounts / payment methods (pick the closest one, by id):\n${accounts.map((a) => `- ${a.id}: ${a.name}`).join("\n")}\n` +
    `Note from user: "${text}"\n` +
    `Return the amount in rupees (number only, no symbol or commas), the best-matching category_id and account_id ` +
    `from the lists above, a short cleaned-up note (strip the amount/account words, keep the merchant/reason), ` +
    `and the date as YYYY-MM-DD (default ${today} if no date is mentioned).`;

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
