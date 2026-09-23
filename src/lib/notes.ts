import type { Note } from "../types";

export type Segment = { text: string; note?: Note };

/** 英文を、語句解説の対象部分（リンク）とそれ以外に分割する */
export function splitByNotes(text: string, notes: Note[] = []): Segment[] {
  const ranges = notes
    .map((note) => {
      const match = note.match ?? note.term;
      const start = text.indexOf(match);
      return { note, start, end: start + match.length };
    })
    .filter((range) => range.start >= 0)
    .sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let cursor = 0;
  for (const range of ranges) {
    // 重なる範囲は先に出てきたものを優先する
    if (range.start < cursor) continue;
    if (range.start > cursor) segments.push({ text: text.slice(cursor, range.start) });
    segments.push({ text: text.slice(range.start, range.end), note: range.note });
    cursor = range.end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor) });
  return segments;
}
