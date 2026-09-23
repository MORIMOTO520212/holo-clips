import type { FeedItem } from "../types";
import { CLIP_COUNT, loadClip } from "./clips";

export type Page = {
  items: FeedItem[];
  nextCursor: number;
};

const PAGE_SIZE = 5;

/** API の代わりの疑似ページング。クリップをループさせて無限に返す。 */
export async function fetchPage(cursor: number): Promise<Page> {
  const items = await Promise.all(
    Array.from({ length: PAGE_SIZE }, async (_, i) => {
      const index = cursor + i;
      return { key: String(index), clip: await loadClip(index % CLIP_COUNT) };
    }),
  );
  return { items, nextCursor: cursor + PAGE_SIZE };
}
