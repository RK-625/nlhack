import { Memory } from "@mastra/memory";

// One shared instance; storage is inherited from the Mastra instance.
// Recent history only: no semantic recall, working memory or auto titles.
export const memory = new Memory({
  options: { lastMessages: 20, semanticRecall: false, workingMemory: { enabled: false }, generateTitle: false },
});
