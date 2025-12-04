// ai-builder/actions.ts

"use server";

import { createClient } from "@supabase/supabase-js";

/**
 * Supabase admin client
 */
function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Save an individual answer to Supabase
 */
export async function saveAnswer(userId: string, stepIndex: number, answer: any) {
  const supabase = supabaseAdmin();

  await supabase
    .from("ai_builder_answers")
    .upsert(
      {
        user_id: userId,
        step: stepIndex,
        answer,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,step" }
    );

  return true;
}

/**
 * Load all answers for a user
 */
export async function loadAnswers(userId: string) {
  const supabase = supabaseAdmin();

  const { data } = await supabase
    .from("ai_builder_answers")
    .select("*")
    .eq("user_id", userId)
    .order("step", { ascending: true });

  const results: any = {};
  for (const row of data || []) {
    results[row.step] = row.answer;
  }

  return results;
}

/**
 * Save final generated build output
 */
export async function saveFinalBuild(userId: string, buildOutput: any) {
  const supabase = supabaseAdmin();

  await supabase.from("ai_builder_builds").insert({
    user_id: userId,
    output: buildOutput,
    created_at: new Date().toISOString(),
  });

  return true;
}

/**
 * Fetch final output for a user
 */
export async function getBuilds(userId: string) {
  const supabase = supabaseAdmin();

  const { data } = await supabase
    .from("ai_builder_builds")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data || [];
}

/**
 * Optional: Log user activity for analytics
 */
export async function logBuilderEvent(userId: string, event: string, meta: any = {}) {
  const supabase = supabaseAdmin();

  await supabase.from("ai_builder_logs").insert({
    user_id: userId,
    event,
    meta,
    created_at: new Date().toISOString(),
  });
}
