import {
  getCurrentCleanUserId,
  normalizeCleanErrorMessage,
} from "@/lib/clean/family/client";
import {
  getLearningQueueMoveUpdates,
  isPathwayStepEligibleForOnDeck,
  sortLearningQueueItems,
  toLearningQueueItem,
  type LearningQueueItem,
  type LearningQueueItemRow,
} from "@/lib/clean/onDeck/learningQueue";
import type { PathwayStepRegistryItem } from "@/lib/clean/pathways/pathwayStepRegistry";
import { supabase } from "@/lib/supabaseClient";

const LEARNING_QUEUE_SELECT =
  "id,family_id,learner_id,source_type,subject_key,strand_key,stage_key,step_key,pathway_step_id,custom_learning_item_id,display_title,position,created_by_user_id,created_at,updated_at,custom_learning_item:custom_learning_items(id,title,learning_area,note)";

export const ON_DECK_NOT_READY_MESSAGE =
  "On Deck is not ready yet. Please try again shortly.";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

function isMissingLearningQueueTable(error: unknown) {
  const record = error as { code?: unknown; message?: unknown; details?: unknown };
  const text = `${safe(record?.code)} ${safe(record?.message)} ${safe(record?.details)}`;
  return (
    /learning_queue_items/i.test(text) &&
    /(does not exist|schema cache|could not find|PGRST|42P01)/i.test(text)
  );
}

function isUniqueQueueItemConflict(error: unknown) {
  const record = error as { code?: unknown; message?: unknown; details?: unknown };
  const text = `${safe(record?.code)} ${safe(record?.message)} ${safe(record?.details)}`;
  return /23505|learning_queue_items_unique_source/i.test(text);
}

function normalizeOnDeckError(error: unknown, fallback: string) {
  if (isMissingLearningQueueTable(error)) return ON_DECK_NOT_READY_MESSAGE;
  return normalizeCleanErrorMessage(error, fallback);
}

export async function listLearningQueueItems(
  familyId: string,
  learnerId?: string | null,
) {
  let query = supabase
    .from("learning_queue_items")
    .select(LEARNING_QUEUE_SELECT)
    .eq("family_id", familyId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (safe(learnerId)) {
    query = query.eq("learner_id", safe(learnerId));
  }

  const response = await query;

  if (response.error) {
    if (isMissingLearningQueueTable(response.error)) return [];
    throw new Error(
      normalizeOnDeckError(response.error, "We could not load On Deck just now."),
    );
  }

  return sortLearningQueueItems(
    ((response.data ?? []) as LearningQueueItemRow[]).map((row) =>
      toLearningQueueItem(row),
    ),
  );
}

async function findExistingLearningQueueItem(
  familyId: string,
  learnerId: string,
  pathwayStepId: string,
) {
  const response = await supabase
    .from("learning_queue_items")
    .select(LEARNING_QUEUE_SELECT)
    .eq("family_id", familyId)
    .eq("learner_id", learnerId)
    .eq("source_type", "pathway_step")
    .eq("pathway_step_id", pathwayStepId)
    .maybeSingle();

  if (response.error) {
    throw new Error(
      normalizeOnDeckError(response.error, "We could not confirm this On Deck item."),
    );
  }

  return response.data ? toLearningQueueItem(response.data as LearningQueueItemRow) : null;
}

export async function addPathwayStepToLearningQueue(input: {
  familyId: string;
  learnerId: string;
  registryItem: PathwayStepRegistryItem;
}) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) {
    throw new Error("You need to sign in before adding a step to On Deck.");
  }

  const learnerId = safe(input.learnerId);
  if (!learnerId) throw new Error("Choose a learner before using On Deck.");
  if (!isPathwayStepEligibleForOnDeck(input.registryItem)) {
    throw new Error("This learning step is not available for On Deck yet.");
  }

  const existingItems = await listLearningQueueItems(input.familyId, learnerId);
  const nextPosition =
    existingItems.reduce((max, item) => Math.max(max, item.position), -1) + 1;

  const response = await supabase
    .from("learning_queue_items")
    .insert({
      family_id: input.familyId,
      learner_id: learnerId,
      source_type: "pathway_step",
      subject_key: input.registryItem.subjectKey,
      strand_key: input.registryItem.strandKey,
      stage_key: input.registryItem.stageKey,
      step_key: input.registryItem.stepKey,
      pathway_step_id: input.registryItem.id,
      display_title: input.registryItem.stepTitle,
      position: nextPosition,
      created_by_user_id: currentUserId,
    })
    .select(LEARNING_QUEUE_SELECT)
    .maybeSingle();

  if (response.error) {
    if (isUniqueQueueItemConflict(response.error)) {
      return {
        item: await findExistingLearningQueueItem(
          input.familyId,
          learnerId,
          input.registryItem.id,
        ),
        created: false,
      };
    }

    throw new Error(
      normalizeOnDeckError(response.error, "We could not add this step to On Deck."),
    );
  }

  return {
    item: response.data ? toLearningQueueItem(response.data as LearningQueueItemRow) : null,
    created: true,
  };
}

export async function createCustomLearningOnDeck(input: {
  familyId: string;
  learnerId: string;
  title: string;
  learningArea?: string | null;
  note?: string | null;
}) {
  const currentUserId = await getCurrentCleanUserId();
  if (!currentUserId) throw new Error("You need to sign in before adding learning.");
  if (!safe(input.learnerId)) throw new Error("Choose a learner before adding learning.");
  if (!safe(input.title)) throw new Error("Add a title before putting learning On Deck.");

  const response = await supabase.rpc("mylearna_create_custom_learning_queue_item", {
    p_family_id: input.familyId,
    p_learner_id: input.learnerId,
    p_title: input.title,
    p_learning_area: input.learningArea || null,
    p_note: input.note || null,
  });
  if (response.error) {
    throw new Error(normalizeOnDeckError(response.error, "We could not add this learning to On Deck."));
  }
  return response.data as string;
}

export async function removeLearningQueueItem(familyId: string, itemId: string) {
  const response = await supabase
    .from("learning_queue_items")
    .delete()
    .eq("family_id", familyId)
    .eq("id", itemId);

  if (response.error) {
    throw new Error(
      normalizeOnDeckError(response.error, "We could not remove this On Deck item."),
    );
  }
}

export async function moveLearningQueueItem(
  familyId: string,
  learnerId: string,
  itemId: string,
  direction: "up" | "down",
) {
  const currentItems = await listLearningQueueItems(familyId, learnerId);
  const updates = getLearningQueueMoveUpdates(currentItems, itemId, direction);
  if (!updates.length) return currentItems;

  await Promise.all(
    updates.map(async (update) => {
      const response = await supabase
        .from("learning_queue_items")
        .update({ position: update.position })
        .eq("family_id", familyId)
        .eq("learner_id", learnerId)
        .eq("id", update.id);

      if (response.error) {
        throw new Error(
          normalizeOnDeckError(
            response.error,
            "We could not update the On Deck order.",
          ),
        );
      }
    }),
  );

  return listLearningQueueItems(familyId, learnerId);
}

export function hasLearningQueueItemForStep(
  items: readonly LearningQueueItem[],
  learnerId: string,
  pathwayStepId: string,
) {
  const expectedLearnerId = safe(learnerId);
  const expectedStepId = safe(pathwayStepId);
  return items.some(
    (item) =>
      item.learnerId === expectedLearnerId &&
      item.sourceType === "pathway_step" &&
      item.pathwayStepId === expectedStepId,
  );
}
