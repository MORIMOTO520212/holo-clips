// src/data/clip.schema.json はこのファイルの ClipFile 型から生成している（pnpm schema）。
// JSDoc の @pattern / @minimum などはスキーマの制約になる。

export type Note = {
  /**
   * 解説の見出し
   * @minLength 1
   */
  term: string;
  /**
   * トランスクリプト中でリンクにする文字列（省略時は term）
   * @minLength 1
   */
  match?: string;
  /** @minLength 1 */
  meaning: string;
};

export type Line = {
  /**
   * 元動画の先頭からの秒数
   * @minimum 0
   */
  start: number;
  /** @minimum 0 */
  end: number;
  /** @minLength 1 */
  en: string;
  /** @minLength 1 */
  ja: string;
  notes?: Note[];
};

export type Clip = {
  /**
   * クリップの ID。ファイル名（拡張子なし）と一致させる
   * @pattern ^[a-z0-9]+(-[a-z0-9]+)*$
   */
  id: string;
  /**
   * YouTube の動画 ID
   * @pattern ^[A-Za-z0-9_-]{11}$
   */
  videoId: string;
  /**
   * 元動画の先頭からの秒数
   * @minimum 0
   */
  start: number;
  /** @minimum 0 */
  end: number;
  /** @minLength 1 */
  title: string;
  /** @minLength 1 */
  talent: string;
  /** @minItems 1 */
  lines: Line[];
  /** 編集用のメモ（画面には表示しない） */
  memo?: string;
};

/** src/data/clips/*.json の中身 */
export type ClipFile = Clip & {
  /** エディタでスキーマ検証を有効にするための参照 */
  $schema?: string;
};

export type FeedItem = {
  /** フィード内で一意なキー（同じクリップがループで何度も現れるため clip.id とは別） */
  key: string;
  clip: Clip;
};
