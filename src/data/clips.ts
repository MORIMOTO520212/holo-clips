import type { Clip, ClipFile } from "../types";

// クリップは src/data/clips/<id>.json に 1 ファイルずつ置く。
// 必要になったものだけ読み込む（初回の JS にクリップのデータを含めない）。
const loaders = import.meta.glob<ClipFile>("./clips/*.json", { import: "default" });
const paths = Object.keys(loaders).sort();

export const CLIP_COUNT = paths.length;

export function loadClip(index: number): Promise<Clip> {
  return loaders[paths[index]]();
}
