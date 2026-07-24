import { validateSourceUrl } from "@/lib/intelligence/validation";
import type { Idea } from "@/lib/intelligence/types";
import {
  createSupabaseIdeasRepository,
  type CreateIdeaRepositoryInput,
  type IdeasRepository,
} from "@/lib/intelligence/ideas/repository";

export type CreateIdeaInput = {
  url: string;
  title?: string | null;
};

export interface IdeasService {
  listForUser(userId: string): Promise<Idea[]>;
  createForUser(userId: string, input: CreateIdeaInput): Promise<Idea>;
}

function clean(value: string | null | undefined) {
  return value?.trim() || null;
}

export function createIdeasService(repository: IdeasRepository): IdeasService {
  return {
    async listForUser(userId) {
      if (!userId.trim()) throw new Error("A signed-in user is required.");
      return repository.listByUser(userId);
    },

    async createForUser(userId, input) {
      if (!userId.trim()) throw new Error("A signed-in user is required.");

      const validation = validateSourceUrl(input.url);
      if (!validation.valid) throw new Error(validation.message);

      const repositoryInput: CreateIdeaRepositoryInput = {
        url: input.url.trim(),
        title: clean(input.title),
      };
      return repository.createForUser(userId, repositoryInput);
    },
  };
}

export const defaultIdeasService = createIdeasService(createSupabaseIdeasRepository());
