import { splitByNotes } from "../lib/notes";
import type { Line, Note } from "../types";
import styles from "./Transcript.module.css";

type Props = {
  lines: Line[];
  lineIndex: number;
  onSeekLine: (line: Line) => void;
  onOpenNote: (note: Note, line: Line) => void;
};

export function Transcript({ lines, lineIndex, onSeekLine, onOpenNote }: Props) {
  const prev = lines[lineIndex - 1];
  const current = lines[lineIndex];
  const next = lines[lineIndex + 1];

  return (
    <div className={styles.transcript}>
      <button
        type="button"
        className={styles.sub}
        disabled={!prev}
        onClick={() => prev && onSeekLine(prev)}
      >
        {prev?.en}
      </button>
      {current && (
        // 語句リンク（button）を内包するため、行全体は button ではなく div にする
        <div className={styles.current} onClick={() => onSeekLine(current)}>
          <p className={styles.en}>
            {splitByNotes(current.en, current.notes).map((segment, i) =>
              segment.note ? (
                <button
                  key={i}
                  type="button"
                  className={styles.noteLink}
                  onClick={(event) => {
                    event.stopPropagation();
                    onOpenNote(segment.note!, current);
                  }}
                >
                  {segment.text}
                </button>
              ) : (
                segment.text
              ),
            )}
          </p>
          <p className={styles.ja}>{current.ja}</p>
        </div>
      )}
      <button
        type="button"
        className={styles.sub}
        disabled={!next}
        onClick={() => next && onSeekLine(next)}
      >
        {next?.en}
      </button>
    </div>
  );
}
