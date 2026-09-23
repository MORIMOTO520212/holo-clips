import type { Clip, Line, Note } from "../types";
import styles from "./Slide.module.css";
import { Transcript } from "./Transcript";

type Props = {
  clip: Clip;
  lineIndex: number;
  errorCode: number | null;
  onTogglePlay: () => void;
  onSeekLine: (line: Line) => void;
  onOpenNote: (note: Note, line: Line) => void;
};

export function Slide({ clip, lineIndex, errorCode, onTogglePlay, onSeekLine, onOpenNote }: Props) {
  const watchUrl = `https://www.youtube.com/watch?v=${clip.videoId}&t=${Math.floor(clip.start)}s`;

  return (
    <div className={styles.slide}>
      {/* 動画の色を上下の余白へにじませる背景（サムネイルをぼかして拡大） */}
      <div
        className={styles.backdrop}
        style={{ backgroundImage: `url(https://i.ytimg.com/vi/${clip.videoId}/mqdefault.jpg)` }}
      />
      {errorCode === null && (
        // スライド全体をタップで再生 / 一時停止にする。iframe はタッチを奪うので、その上にも被せる
        <button
          type="button"
          className={styles.tapLayer}
          aria-label="再生 / 一時停止"
          onClick={onTogglePlay}
        />
      )}

      {/* 上下の領域を同じ比率で伸ばし、動画を画面の縦中央に置く */}
      <header className={styles.header}>
        <p className={styles.talent}>{clip.talent}</p>
        <h2 className={styles.title}>{clip.title}</h2>
      </header>

      <div className={styles.video}>
        <img
          className={styles.thumbnail}
          src={`https://i.ytimg.com/vi/${clip.videoId}/hqdefault.jpg`}
          alt=""
          loading="lazy"
        />
        {errorCode !== null && (
          <div className={styles.error}>
            <p>この動画はここでは再生できません</p>
            <a href={watchUrl} target="_blank" rel="noreferrer">
              YouTubeで開く
            </a>
          </div>
        )}
      </div>

      <div className={styles.bottom}>
        <Transcript
          lines={clip.lines}
          lineIndex={lineIndex}
          onSeekLine={onSeekLine}
          onOpenNote={onOpenNote}
        />
      </div>
    </div>
  );
}
