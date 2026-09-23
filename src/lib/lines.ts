import type { Line } from "../types";

/** start <= time を満たす最後の行。セリフの間でも直前の行を表示し続ける。 */
export function findLineIndex(lines: Line[], time: number): number {
  let found = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].start > time) break;
    found = i;
  }
  return found;
}
