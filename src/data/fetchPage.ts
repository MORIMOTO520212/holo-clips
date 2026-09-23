import type { FeedItem } from "../types";
import { CLIPS } from "./clips";

export type Page = {
  items: FeedItem[];
  nextCursor: number;
};

const PAGE_SIZE = 5;
const LATENCY_MS = 300;

/** API の代わりの疑似ページング。定数のクリップをループさせて無限に返す。 */
export function fetchPage(cursor: number): Promise<Page> {
  const items = Array.from({ length: PAGE_SIZE }, (_, i) => {
    const index = cursor + i;
    return { key: String(index), clip: CLIPS[index % CLIPS.length] };
  });
  return new Promise((resolve) => {
    setTimeout(() => resolve({ items, nextCursor: cursor + PAGE_SIZE }), LATENCY_MS);
  });
}
