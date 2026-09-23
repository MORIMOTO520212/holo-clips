import { useEffect } from "react";
import type { Line, Note } from "../types";
import styles from "./NoteModal.module.css";

type Props = {
  note: Note;
  line: Line;
  onClose: () => void;
};

export function NoteModal({ note, line, onClose }: Props) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-term"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id="note-term" className={styles.term}>
          {note.term}
        </h3>
        <p className={styles.meaning}>{note.meaning}</p>
        <blockquote className={styles.context}>
          <p className={styles.en}>{line.en}</p>
          <p className={styles.ja}>{line.ja}</p>
        </blockquote>
        <button type="button" className={styles.close} onClick={onClose}>
          閉じる
        </button>
      </div>
    </div>
  );
}
