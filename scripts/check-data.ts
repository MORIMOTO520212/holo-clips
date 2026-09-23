// クリップデータ（src/data/clips/*.json）の検証。
// 1. スキーマが src/types.ts から生成した最新のものか
// 2. 各ファイルがスキーマに合っているか（構造）
// 3. スキーマでは表せない中身の整合性
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { Ajv } from "ajv";
import { createGenerator } from "ts-json-schema-generator";
import type { ClipFile } from "../src/types.ts";

const DATA_DIR = "src/data";
const CLIPS_DIR = join(DATA_DIR, "clips");
const SCHEMA_PATH = join(DATA_DIR, "clip.schema.json");
const SCHEMA_REF = "../clip.schema.json";

const errors: string[] = [];

/** キーの順序に依存しない比較用の文字列 */
function canonical(value: unknown): string {
  return JSON.stringify(value, (_, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );
}

const schema = JSON.parse(readFileSync(SCHEMA_PATH, "utf8"));
const generated = createGenerator({
  path: "src/types.ts",
  type: "ClipFile",
  tsconfig: "tsconfig.app.json",
  topRef: false,
}).createSchema("ClipFile");
if (canonical(generated) !== canonical(schema)) {
  errors.push(`${SCHEMA_PATH}: src/types.ts と一致しません。pnpm schema で再生成してください`);
}

const validate = new Ajv({ allErrors: true }).compile<ClipFile>(schema);

for (const file of readdirSync(CLIPS_DIR)
  .filter((name) => name.endsWith(".json"))
  .sort()) {
  const path = join(CLIPS_DIR, file);
  const report = (message: string) => errors.push(`${path}: ${message}`);

  let data: unknown;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    report(`JSON として読めません（${(error as Error).message}）`);
    continue;
  }

  if (!validate(data)) {
    for (const error of validate.errors ?? [])
      report(`${error.instancePath || "/"} ${error.message}`);
    continue;
  }

  const clip = data;
  if (clip.$schema !== SCHEMA_REF) report(`$schema は "${SCHEMA_REF}" にしてください`);
  if (clip.id !== basename(file, ".json")) report(`id "${clip.id}" がファイル名と一致しません`);
  if (clip.start >= clip.end) report(`start (${clip.start}) が end (${clip.end}) 以上です`);

  clip.lines.forEach((line, i) => {
    const at = `lines[${i}] (${line.start}s)`;
    if (line.start >= line.end) report(`${at}: start が end 以上です`);
    if (line.start < clip.start || line.end > clip.end) {
      report(`${at}: クリップの範囲 ${clip.start}〜${clip.end}s の外です`);
    }
    const prev = clip.lines[i - 1];
    if (prev && line.start < prev.start) report(`${at}: 前の行より start が早いです`);

    for (const note of line.notes ?? []) {
      const match = note.match ?? note.term;
      if (!line.en.includes(match))
        report(`${at}: 解説「${note.term}」の "${match}" が英文にありません`);
    }
  });
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  console.error(`\n${errors.length} 件のエラー`);
  process.exit(1);
}
console.log("クリップデータに問題はありません");
