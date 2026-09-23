import { useCallback, useEffect, useRef, useState } from "react";
import { fetchPage, shuffledOrder } from "../data/fetchPage";
import { findLineIndex } from "../lib/lines";
import { createPlayer, PlayerState, type YTPlayer } from "../lib/youtube";
import type { FeedItem, Line, Note } from "../types";
import styles from "./Feed.module.css";
import { NoteModal } from "./NoteModal";
import { Slide } from "./Slide";

/** 描画するスライドの範囲（表示中の前後 N 枚） */
const RENDER_RANGE = 2;
/** スクロールが止まったとみなすまでの時間（scrollend 非対応ブラウザ向け） */
const SETTLE_DELAY_MS = 150;
const SYNC_INTERVAL_MS = 200;
/** PAUSED が継続したら広告とみなして次の動画へ送る秒数 */
const AD_DETECT_SECONDS = 5;

export function Feed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const nextCursorRef = useRef(0);
  const loadingRef = useRef(false);
  // 起動時に 1 度だけ決まるシャッフル順。全ページで同じ順を消費する
  const orderRef = useRef<number[]>(shuffledOrder());

  const scrollerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [viewIndex, setViewIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrolling, setScrolling] = useState(false);

  const playerLayerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  /** 最後に loadVideoById したアイテムの key */
  const loadedKeyRef = useRef<string | null>(null);
  /** 実際に再生が始まったアイテムの key。これが一致するまでプレイヤーを隠す */
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<{ key: string; code: number } | null>(null);
  const [lineIndex, setLineIndex] = useState(0);
  const [openNote, setOpenNote] = useState<{ note: Note; line: Line } | null>(null);
  /** モーダルを開く前に再生中だったか（閉じたときに再開するため） */
  const resumeOnCloseRef = useRef(false);
  /** ユーザーが togglePlay で意図的に一時停止したか（広告検知では使わない） */
  const manualPausedRef = useRef(false);
  /** PAUSED に遷移した時刻（広告検知用）。PLAYING でリセット */
  const pausedSinceRef = useRef<number | null>(null);

  const activeItem = items[activeIndex] as FeedItem | undefined;
  const activeItemRef = useRef(activeItem);
  useEffect(() => {
    activeItemRef.current = activeItem;
  }, [activeItem]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    const page = await fetchPage(nextCursorRef.current, orderRef.current);
    nextCursorRef.current = page.nextCursor;
    setItems((prev) => [...prev, ...page.items]);
    loadingRef.current = false;
  }, []);

  useEffect(() => {
    void loadMore();
  }, [loadMore]);

  // 末尾の sentinel が近づいたら次のページを読む
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { root: scrollerRef.current, rootMargin: "0px 0px 200% 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  // スクロール位置から表示中・確定したスライドを求める
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let timer: number | undefined;
    let fingerLifted = false;
    let lastTop = scroller.scrollTop;
    const indexAt = () => Math.round(scroller.scrollTop / scroller.clientHeight);
    const settle = () => {
      window.clearTimeout(timer);
      fingerLifted = false;
      setScrolling(false);
      setActiveIndex(indexAt());
    };
    const onScroll = () => {
      const top = scroller.scrollTop;
      const delta = top - lastTop;
      lastTop = top;
      setScrolling(true);
      setViewIndex(indexAt());
      // 指を離した後はスナップ先へ一方向に進むので、進行方向から行き先を確定し、
      // スナップのアニメーション中に動画の読み込みを始めておく（scroll-snap-stop: always で 1 枚ずつ進む）
      if (fingerLifted && delta !== 0) {
        const position = top / scroller.clientHeight;
        setActiveIndex(delta > 0 ? Math.ceil(position) : Math.floor(position));
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, SETTLE_DELAY_MS);
    };
    const onTouchStart = () => {
      fingerLifted = false;
    };
    const onTouchEnd = () => {
      fingerLifted = true;
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    scroller.addEventListener("scrollend", settle);
    scroller.addEventListener("touchstart", onTouchStart, { passive: true });
    scroller.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.clearTimeout(timer);
      scroller.removeEventListener("scroll", onScroll);
      scroller.removeEventListener("scrollend", settle);
      scroller.removeEventListener("touchstart", onTouchStart);
      scroller.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  // プレイヤーは 1 つだけ作って使い回す（iOS で音ありの連続再生を維持するため）
  const firstClip = items[0]?.clip;
  useEffect(() => {
    const layer = playerLayerRef.current;
    if (!firstClip || !layer) return;
    let cancelled = false;
    let player: YTPlayer | undefined;

    void createPlayer(layer, {
      videoId: firstClip.videoId,
      playerVars: {
        playsinline: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        rel: 0,
        iv_load_policy: 3,
        start: Math.floor(firstClip.start),
        end: Math.ceil(firstClip.end),
      },
      events: {
        onReady: () => {
          if (!cancelled) setReady(true);
        },
        onStateChange: ({ data }) => {
          const item = activeItemRef.current;
          if (data === PlayerState.PLAYING) {
            setPlayingKey(loadedKeyRef.current);
            setPaused(false);
            pausedSinceRef.current = null;
          } else if (data === PlayerState.PAUSED) {
            setPaused(true);
            if (pausedSinceRef.current === null) pausedSinceRef.current = Date.now();
          } else if (data === PlayerState.ENDED && item) {
            // クリップを繰り返す
            playerRef.current?.seekTo(item.clip.start, true);
            playerRef.current?.playVideo();
          }
        },
        onError: ({ data }) => {
          const key = loadedKeyRef.current;
          if (key) setError({ key, code: data });
        },
      },
    }).then((created) => {
      player = created;
      if (cancelled) {
        created.destroy();
        return;
      }
      playerRef.current = created;
    });

    return () => {
      cancelled = true;
      player?.destroy();
      playerRef.current = null;
      layer.replaceChildren();
      setReady(false);
    };
  }, [firstClip]);

  const start = () => {
    const player = playerRef.current;
    const item = items[0];
    if (!player || !item) return;
    // ユーザー操作の中で同期的に呼ぶ（await を挟むと iOS で音が出なくなる）
    player.unMute();
    player.playVideo();
    loadedKeyRef.current = item.key;
    setStarted(true);
  };

  // 確定したスライドの動画を読み込む
  useEffect(() => {
    const player = playerRef.current;
    if (!started || !ready || !player || !activeItem) return;
    if (loadedKeyRef.current === activeItem.key) return;
    loadedKeyRef.current = activeItem.key;
    setPlayingKey(null);
    setError(null);
    setLineIndex(0);
    const { clip } = activeItem;
    player.loadVideoById({
      videoId: clip.videoId,
      startSeconds: clip.start,
      endSeconds: clip.end,
    });
  }, [started, ready, activeItem]);

  // 再生位置に合わせて現在の行を更新する
  useEffect(() => {
    if (!activeItem || playingKey !== activeItem.key) return;
    const { clip } = activeItem;
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      const time = player.getCurrentTime();
      if (time >= clip.end) {
        player.seekTo(clip.start, true);
        return;
      }
      const index = findLineIndex(clip.lines, time);
      setLineIndex((prev) => (prev === index ? prev : index));
    }, SYNC_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [activeItem, playingKey]);

  // 広告検知: PAUSED が AD_DETECT_SECONDS 続いたら次の動画へ自動送り
  useEffect(() => {
    if (!paused || manualPausedRef.current || pausedSinceRef.current === null) return;
    const since = pausedSinceRef.current;
    const timer = window.setTimeout(() => {
      if (manualPausedRef.current) return;
      if (pausedSinceRef.current !== since) return;
      pausedSinceRef.current = null;
      const scroller = scrollerRef.current;
      if (!scroller) return;
      if (activeIndex + 1 >= items.length) return;
      scroller.scrollTo({ top: scroller.clientHeight * (activeIndex + 1), behavior: "smooth" });
    }, AD_DETECT_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [paused, activeIndex, items.length]);

  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    if (player.getPlayerState() === PlayerState.PLAYING) {
      // ユーザー操作によるポーズは広告ではない
      manualPausedRef.current = true;
      pausedSinceRef.current = null;
      player.pauseVideo();
    } else {
      manualPausedRef.current = false;
      player.playVideo();
    }
  };

  const seekLine = (line: Line) => {
    const player = playerRef.current;
    if (!player || !activeItem) return;
    player.seekTo(line.start, true);
    player.playVideo();
    setLineIndex(activeItem.clip.lines.indexOf(line));
  };

  const openNoteModal = (note: Note, line: Line) => {
    const player = playerRef.current;
    resumeOnCloseRef.current = player?.getPlayerState() === PlayerState.PLAYING;
    pausedSinceRef.current = null;
    manualPausedRef.current = true;
    player?.pauseVideo();
    setOpenNote({ note, line });
  };

  const closeNoteModal = useCallback(() => {
    if (resumeOnCloseRef.current) playerRef.current?.playVideo();
    manualPausedRef.current = false;
    setOpenNote(null);
  }, []);

  const playerVisible =
    started && !scrolling && activeItem !== undefined && playingKey === activeItem.key && !error;

  return (
    <div className={styles.feed}>
      <div ref={scrollerRef} className={styles.scroller}>
        {items.map((item, index) => {
          const isActive = started && index === activeIndex;
          return (
            <section key={item.key} className={styles.shell}>
              {Math.abs(index - viewIndex) <= RENDER_RANGE && (
                <Slide
                  clip={item.clip}
                  lineIndex={isActive ? lineIndex : 0}
                  errorCode={isActive && error?.key === item.key ? error.code : null}
                  onTogglePlay={isActive ? togglePlay : () => {}}
                  onSeekLine={isActive ? seekLine : () => {}}
                  onOpenNote={isActive ? openNoteModal : () => {}}
                />
              )}
            </section>
          );
        })}
        <div ref={sentinelRef} className={styles.sentinel} />
      </div>

      {/* iframe を別の親に移すと再読み込みされるため、固定位置に置いたまま表示だけ切り替える */}
      <div className={styles.player} data-visible={playerVisible}>
        <div ref={playerLayerRef} className={styles.playerFrame} />
        {playerVisible && paused && <div className={styles.pausedIcon}>▶</div>}
      </div>

      {openNote && <NoteModal note={openNote.note} line={openNote.line} onClose={closeNoteModal} />}

      {!started && (
        <div className={styles.startScreen}>
          <h1 className={styles.logo}>holo clips</h1>
          <p className={styles.lead}>hololive English の切り抜きで英語を学ぼう</p>
          <button type="button" className={styles.startButton} disabled={!ready} onClick={start}>
            {ready ? "タップして開始" : "読み込み中…"}
          </button>
        </div>
      )}
    </div>
  );
}
