import { type FormEvent, type ReactNode, useState } from "react";
import { FIXED_PASSWORD, isAuthed, markAuthed } from "../lib/auth";
import styles from "./AuthGate.module.css";

type Props = {
  children: ReactNode;
};

export function AuthGate({ children }: Props) {
  const [authed, setAuthed] = useState(isAuthed);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  if (authed) return children;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (password === FIXED_PASSWORD) {
      markAuthed();
      setAuthed(true);
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <div className={styles.screen}>
      <h1 className={styles.logo}>holo clips</h1>
      <p className={styles.lead}>パスワードを入力してください</p>
      <form className={styles.form} onSubmit={onSubmit}>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={12}
          autoFocus
          autoComplete="off"
          className={styles.input}
          value={password}
          onChange={(event) => {
            setError(false);
            setPassword(event.target.value.replace(/\D/g, "").slice(0, 12));
          }}
        />
        {error && <p className={styles.error}>パスワードが違います</p>}
        <button type="submit" className={styles.submit} disabled={password.length !== 12}>
          ログイン
        </button>
      </form>
    </div>
  );
}
