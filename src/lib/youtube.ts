// YouTube IFrame Player API の必要最小限の型
export const PlayerState = {
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
} as const;

export type YTPlayer = {
  loadVideoById(args: { videoId: string; startSeconds?: number; endSeconds?: number }): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  unMute(): void;
  destroy(): void;
};

type PlayerOptions = {
  videoId: string;
  playerVars?: Record<string, string | number>;
  events?: {
    onReady?: () => void;
    onStateChange?: (event: { data: number }) => void;
    onError?: (event: { data: number }) => void;
  };
};

declare global {
  interface Window {
    YT?: { Player: new (element: HTMLElement, options: PlayerOptions) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<NonNullable<Window["YT"]>> | undefined;

export function loadYouTubeApi(): Promise<NonNullable<Window["YT"]>> {
  apiPromise ??= new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }
    window.onYouTubeIframeAPIReady = () => resolve(window.YT!);
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.append(script);
  });
  return apiPromise;
}

export function createPlayer(container: HTMLElement, options: PlayerOptions): Promise<YTPlayer> {
  return loadYouTubeApi().then((YT) => {
    // YT.Player は渡した要素を iframe に置き換えるので、React 管理外の要素を渡す
    const target = document.createElement("div");
    container.append(target);
    return new YT.Player(target, options);
  });
}

/** 101 / 150 は埋め込み禁止 */
export function isEmbedBlocked(code: number): boolean {
  return code === 101 || code === 150;
}
