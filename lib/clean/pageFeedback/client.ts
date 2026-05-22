import { supabase } from "@/lib/supabaseClient";

export const PAGE_FEEDBACK_MAX_LENGTH = 1500;

export type CleanPageFeedbackInsert = {
  userId: string | null;
  pageKey: string;
  pageTitle: string | null;
  currentUrl: string | null;
  feedbackText: string;
  feedbackType?: string | null;
  userAgent?: string | null;
};

export async function submitCleanPageFeedback(input: CleanPageFeedbackInsert) {
  const { error } = await supabase.from("page_feedback").insert({
    user_id: input.userId,
    page_key: input.pageKey,
    page_title: input.pageTitle,
    current_url: input.currentUrl,
    feedback_text: input.feedbackText,
    feedback_type: input.feedbackType ?? "general",
    user_agent: input.userAgent ?? null,
  });

  if (error) {
    throw error;
  }
}
