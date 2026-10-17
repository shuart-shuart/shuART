export interface YoutubePlayerHandle {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getIframe(): HTMLIFrameElement;
  destroy(): void;
}

interface PlayerEvent { target: YoutubePlayerHandle; data: number }
export interface YoutubePlayerOptions {
  videoId: string;
  host: string;
  width: string;
  height: string;
  playerVars: Record<string, string | number>;
  events: {
    onReady(event: PlayerEvent): void;
    onStateChange(event: PlayerEvent): void;
    onError(event: PlayerEvent): void;
    onAutoplayBlocked(): void;
  };
}
interface YoutubeApi { Player: new (element: HTMLElement, options: YoutubePlayerOptions) => YoutubePlayerHandle }
type YoutubeWindow = Window & { YT?: YoutubeApi; onYouTubeIframeAPIReady?: () => void };
let pendingApi: Promise<YoutubeApi> | undefined;

export function youtubeVideoId(value: string): string | null {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^(www\.|m\.)/, '');
    if (!['youtube.com', 'youtube-nocookie.com', 'youtu.be'].includes(host) || url.protocol !== 'https:') return null;
    const id = host === 'youtu.be' ? url.pathname.slice(1) : url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1];
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}

export function loadYoutubeApi(): Promise<YoutubeApi> {
  const host = window as YoutubeWindow;
  if (host.YT?.Player) return Promise.resolve(host.YT);
  if (pendingApi) return pendingApi;
  pendingApi = new Promise<YoutubeApi>((resolve, reject) => {
    const previous = host.onYouTubeIframeAPIReady;
    const script = document.createElement('script');
    const fail = () => {
      clearTimeout(timeout);
      pendingApi = undefined;
      script.remove();
      if (host.onYouTubeIframeAPIReady === ready) host.onYouTubeIframeAPIReady = previous;
      reject(new Error('YouTube player could not load'));
    };
    const ready = () => {
      clearTimeout(timeout);
      if (host.onYouTubeIframeAPIReady === ready) host.onYouTubeIframeAPIReady = previous;
      if (host.YT?.Player) resolve(host.YT);
      else fail();
      previous?.();
    };
    const timeout = window.setTimeout(fail, 20000);
    host.onYouTubeIframeAPIReady = ready;
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = fail;
    document.head.append(script);
  });
  return pendingApi;
}

export function videoTime(seconds: number): string {
  const time = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`;
}
