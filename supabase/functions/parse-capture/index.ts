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

const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
  }
  if (!GEMINI_KEY) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), { status: 500 });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userErr } = await supabaseAuth.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Sign in required" }), { status: 401 });
  }

  let body: { text?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Bad JSON" }), { status: 400 });
  }

  const text = (body.text || "").trim();
  if (!text) return new Response(JSON.stringify({ error: "Missing text" }), { status: 400 });

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
    return new Response(JSON.stringify({ error: "AI request failed" }), { status: 502 });
  }

  if (!res.ok) {
    console.error("Gemini error", res.status, await res.text());
    return new Response(JSON.stringify({ error: "AI request failed" }), { status: 502 });
  }

  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    return new Response(JSON.stringify({ error: "No AI response" }), { status: 502 });
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: "Could not parse AI response" }), { status: 502 });
  }

  return new Response(JSON.stringify(parsed), { headers: { "Content-Type": "application/json" } });
});
