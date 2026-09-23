import type { FeedItem } from "../types";
import { CLIP_COUNT, loadClip } from "./clips";

export type Page = {
  items: FeedItem[];
  nextCursor: number;
};

const PAGE_SIZE = 5;

/**
 * 起動時に 1 度だけ呼ぶ。0..CLIP_COUNT-1 の Fisher–Yates シャッフル順を返す。
 * ページングはこの順を消費して進む（同じクリップが重複して現れないようにするため）。
 */
export function shuffledOrder(): number[] {
  const order = Array.from({ length: CLIP_COUNT }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** API の代わりの疑似ページング。シャッフル順を消費して無限に返す（ループ）。 */
export async function fetchPage(cursor: number, order: readonly number[]): Promise<Page> {
  const items = await Promise.all(
    Array.from({ length: PAGE_SIZE }, async (_, i) => {
      const pos = cursor + i;
      const clipIndex = order[pos % order.length];
      return { key: String(pos), clip: await loadClip(clipIndex) };
    }),
  );
  return { items, nextCursor: cursor + PAGE_SIZE };
}
