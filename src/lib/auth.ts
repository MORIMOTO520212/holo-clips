/** ログイン用の固定パスワード（12桁）。ビルド時に環境変数から埋め込まれる */
export const FIXED_PASSWORD = import.meta.env.VITE_AUTH_PASSWORD;

const STORAGE_KEY = "holo-clips-authed";

export function isAuthed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markAuthed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ストレージが使えない場合は何もしない（今回のセッションだけ都度ログインになる）
  }
}
