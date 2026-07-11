// =========================================================
// Daily Tracker — send-reminders Edge Function (Deno)
// Runs on a cron every 5 minutes. Sends web push for:
//  1. Habit reminders (at each habit's reminder_time)
//  2. Missed-habit alert (~22:30 local)
//  3. Expense nudge (~21:00 local, if nothing logged today)
// Secrets required (supabase secrets set):
//  VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@example.com)
// Uses the service-role key automatically available in edge functions.
// =========================================================
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const TZ = "Asia/Kolkata";
const MISSED_ALERT_AT = "22:30";
const EXPENSE_NUDGE_AT = "21:00";
const WEEKLY_DIGEST_AT = "20:00"; // Sundays
const WINDOW_MIN = 5; // cron interval — match your schedule

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// VAPID keys: env vars take priority; embedded fallback (server-side only, never shipped to browsers)
const VAPID_PUB = Deno.env.get("VAPID_PUBLIC_KEY") ?? "BC3hn1L8e06eEM8_CAt57NFNKOZ96_b1nXkqDBS4e3Babwb9aNm44cGa5sHp5yb8o3nOz6EBdkaIKCUKUpV-r8s";
const VAPID_PRIV = Deno.env.get("VAPID_PRIVATE_KEY") ?? "ejoscHegjhHAkno-gR1pr7I8NtHvw5XpeRgtpmQVoH8";
webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") ?? "mailto:amareshadak2014@gmail.com",
  VAPID_PUB,
  VAPID_PRIV,
);

function localNow(): { hm: string; date: string; dow: number; minutes: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit",
    year: "numeric", month: "2-digit", day: "2-digit", hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const hm = `${get("hour")}:${get("minute")}`;
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  const dowStr = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(now);
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(dowStr);
  const minutes = parseInt(get("hour")) * 60 + parseInt(get("minute"));
  return { hm, date, dow, minutes };
}
const toMin = (hm: string) => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};
const inWindow = (target: string, nowMin: number) => {
  const t = toMin(target);
  return nowMin >= t && nowMin < t + WINDOW_MIN;
};

async function sendTo(userId: string, payload: Record<string, string>) {
  const { data: subs } = await supabase.from("push_subs").select("*").eq("user_id", userId);
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(s.subscription, JSON.stringify(payload));
    } catch (e: unknown) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) {
        await supabase.from("push_subs").delete().eq("id", s.id); // expired sub
      } else console.error("push error", e);
    }
  }
}

Deno.serve(async () => {
  const { hm, date, dow, minutes } = localNow();
  const { data: habits } = await supabase.from("habits").select("*").eq("archived", false);
  const { data: logs } = await supabase.from("habit_logs").select("*").eq("date", date);
  let sent = 0;

  const scheduledToday = (h: { schedule: number[] | null }) => {
    const sch = (h.schedule as number[] | null) ?? [];
    return sch.length === 0 || sch.includes(dow);
  };
  const doneToday = (h: { id: string; user_id: string }) =>
    (logs ?? []).some((l) => l.habit_id === h.id && l.completed);

  // 1) per-habit reminders
  for (const h of habits ?? []) {
    if (!scheduledToday(h) || doneToday(h)) continue;
    if (h.reminder_time && inWindow(h.reminder_time, minutes)) {
      await sendTo(h.user_id, {
        title: `${h.icon} ${h.name}`,
        body: h.type === "yesno" ? "Time for your habit — tap to log it!" : `Target: ${h.target} ${h.unit ?? ""} — you got this! 💪`,
        tag: `habit-${h.id}`,
      });
      sent++;
    }
  }

  // 2) missed-habit alert
  if (inWindow(MISSED_ALERT_AT, minutes)) {
    const byUser = new Map<string, string[]>();
    for (const h of habits ?? []) {
      if (!scheduledToday(h) || doneToday(h)) continue;
      byUser.set(h.user_id, [...(byUser.get(h.user_id) ?? []), `${h.icon} ${h.name}`]);
    }
    for (const [uid, names] of byUser) {
      await sendTo(uid, {
        title: "🔥 Streaks at risk!",
        body: `Still not logged: ${names.slice(0, 3).join(", ")}${names.length > 3 ? ` +${names.length - 3} more` : ""}`,
        tag: "missed-alert",
      });
      sent++;
    }
  }

  // 3) expense nudge
  if (inWindow(EXPENSE_NUDGE_AT, minutes)) {
    const { data: users } = await supabase.from("push_subs").select("user_id");
    const uids = [...new Set((users ?? []).map((u) => u.user_id))];
    for (const uid of uids) {
      const { count } = await supabase.from("expenses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid).eq("date", date);
      if (!count) {
        await sendTo(uid, {
          title: "💸 No expenses today?",
          body: "Spent nothing, or forgot to log? Tap to add.",
          tag: "expense-nudge",
        });
        sent++;
      }
    }
  }

  // 4) weekly digest (Sundays)
  if (dow === 0 && inWindow(WEEKLY_DIGEST_AT, minutes)) {
    const weekAgo = new Date(new Date(date + "T00:00:00Z").getTime() - 6 * 86400000)
      .toISOString().slice(0, 10);
    const { data: weekLogs } = await supabase.from("habit_logs").select("*").gte("date", weekAgo);
    const { data: weekExp } = await supabase.from("expenses").select("*").gte("date", weekAgo);
    const { data: cats } = await supabase.from("categories").select("id,name,icon");
    const { data: subUsers } = await supabase.from("push_subs").select("user_id");
    const uids = [...new Set((subUsers ?? []).map((u) => u.user_id))];
    for (const uid of uids) {
      const myHabits = (habits ?? []).filter((h) => h.user_id === uid);
      if (!myHabits.length) continue;
      // scheduled slots over the 7 days vs completed
      let slots = 0, doneCt = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(new Date(date + "T00:00:00Z").getTime() - i * 86400000);
        const ds = d.toISOString().slice(0, 10);
        const wd = d.getUTCDay();
        for (const h of myHabits) {
          const sch = (h.schedule as number[] | null) ?? [];
          if (sch.length && !sch.includes(wd)) continue;
          slots++;
          if ((weekLogs ?? []).some((l) => l.habit_id === h.id && l.date === ds && l.completed)) doneCt++;
        }
      }
      const pct = slots ? Math.round((doneCt / slots) * 100) : 0;
      const myExp = (weekExp ?? []).filter((e) => e.user_id === uid);
      const total = myExp.reduce((s, e) => s + Number(e.amount), 0);
      const byCat = new Map<string, number>();
      myExp.forEach((e) => byCat.set(e.category_id, (byCat.get(e.category_id) ?? 0) + Number(e.amount)));
      const topId = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      const top = (cats ?? []).find((c) => c.id === topId);
      await sendTo(uid, {
        title: "📊 Your week in review",
        body: `Habits: ${pct}% done. Spent ₹${total.toLocaleString("en-IN")}${top ? `, top: ${top.icon} ${top.name}` : ""}. Keep going! 💪`,
        tag: "weekly-digest",
      });
      sent++;
    }
  }

  return new Response(JSON.stringify({ ok: true, time: hm, sent }), {
    headers: { "Content-Type": "application/json" },
  });
});
