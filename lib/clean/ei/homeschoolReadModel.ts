import { buildEiCompetencyReadModel } from "@/lib/clean/ei/readModel";
import {
  buildHomeschoolLearnerThread,
  type BuildHomeschoolLearnerThreadInput,
} from "@/lib/clean/learnerThread/homeschoolAdapter";

export type BuildHomeschoolEiCompetencyReadModelInput =
  BuildHomeschoolLearnerThreadInput & {
    competencyId: string;
  };

/**
 * Composes the existing Homeschool source adapter with the shared EI read model.
 *
 * This function is pure/read-only. It performs no database calls and no writes.
 */
export function buildHomeschoolEiCompetencyReadModel(
  input: BuildHomeschoolEiCompetencyReadModelInput,
) {
  const { competencyId, ...threadInput } = input;
  const thread = buildHomeschoolLearnerThread(threadInput);

  return buildEiCompetencyReadModel(thread, competencyId);
}
