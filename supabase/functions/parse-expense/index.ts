// =========================================================
// Daily Tracker — parse-expense Edge Function (Deno)
// Turns a free-text note ("250 lunch swiggy hdfc") into a
// structured expense using Gemini. Called from the quick-add
// sheet as an optional prefill — never auto-saves anything.
// JWT-verified by the platform (deploy WITHOUT --no-verify-jwt),
// so only signed-in app users can call it.
// Secret required: supabase secrets set GEMINI_API_KEY=...
// =========================================================

const GEMINI_MODEL = "gemini-2.5-flash-lite";
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY");
const TZ = "Asia/Kolkata";

interface Ref { id: string; name: string; }

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), { status: 405 });
  }
  if (!GEMINI_KEY) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), { status: 500 });
  }

  let body: { text?: string; categories?: Ref[]; accounts?: Ref[] };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Bad JSON" }), { status: 400 });
  }

  const text = (body.text || "").trim();
  const categories = body.categories || [];
  const accounts = body.accounts || [];
  if (!text) return new Response(JSON.stringify({ error: "Missing text" }), { status: 400 });
  if (!categories.length || !accounts.length) {
    return new Response(JSON.stringify({ error: "Missing categories/accounts" }), { status: 400 });
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
