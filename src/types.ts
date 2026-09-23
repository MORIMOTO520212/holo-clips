export type Note = {
  /** 解説の見出し */
  term: string;
  /** トランスクリプト中でリンクにする文字列（省略時は term） */
  match?: string;
  meaning: string;
};

export type Line = {
  /** 元動画の先頭からの秒数 */
  start: number;
  end: number;
  en: string;
  ja: string;
  notes?: Note[];
};

export type Clip = {
  id: string;
  videoId: string;
  /** 元動画の先頭からの秒数 */
  start: number;
  end: number;
  title: string;
  talent: string;
  lines: Line[];
};

export type FeedItem = {
  /** フィード内で一意なキー（同じクリップがループで何度も現れるため clip.id とは別） */
  key: string;
  clip: Clip;
};
