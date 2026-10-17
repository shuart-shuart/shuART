import React, { useEffect, useId, useRef, useState } from 'react';
import { Maximize, Pause, Play, SlidersHorizontal, Volume2, VolumeX } from 'lucide-react';
import { loadYoutubeApi, videoTime, type YoutubePlayerHandle } from '../services/youtubePlayer';

export function YouTubePlayer({ videoId, title }: { videoId: string; title: string }) {
  const [activated, setActivated] = useState(false);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [controls, setControls] = useState(false);
  const [error, setError] = useState(false);
  const player = useRef<YoutubePlayerHandle | null>(null);
  const mount = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const controlsId = useId();

  useEffect(() => {
    if (!activated || !mount.current) return;
    let cancelled = false;
    let instance: YoutubePlayerHandle | undefined;
    const loadingTimeout = window.setTimeout(() => { if (!cancelled && !player.current) setError(true); }, 25000);
    // The API replaces its mount node; keep that mutation outside React's children.
    const target = document.createElement('div');
    mount.current.append(target);
    loadYoutubeApi().then(api => {
      if (cancelled) return;
      instance = new api.Player(target, {
        videoId, host: 'https://www.youtube-nocookie.com', width: '100%', height: '100%',
        playerVars: { controls: 0, playsinline: 1, rel: 0, autoplay: 0, origin: window.location.origin },
        events: {
          onReady: event => {
            if (cancelled) return;
            window.clearTimeout(loadingTimeout);
            setError(false);
            player.current = event.target;
            const iframe = event.target.getIframe();
            iframe.title = title;
            iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
            setReady(true);
            event.target.playVideo();
          },
          onStateChange: event => {
            if (cancelled) return;
            setPlaying(event.data === 1);
            if (event.data === 0 || event.data === 2) setControls(true);
          },
          onError: () => { if (!cancelled) setError(true); },
          onAutoplayBlocked: () => { if (!cancelled) setControls(true); },
        },
      });
    }).catch(() => { if (!cancelled) setError(true); });
    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimeout);
      player.current = null;
      instance?.destroy();
      target.remove();
    };
  }, [activated, videoId, title]);

  useEffect(() => {
    if (!ready || error) return;
    const timer = window.setInterval(() => {
      const current = player.current;
      if (!current) return;
      setTime(current.getCurrentTime() || 0);
      setDuration(current.getDuration() || 0);
      setMuted(current.isMuted());
    }, 500);
    return () => window.clearInterval(timer);
  }, [ready, error]);

  const buttonClass = 'p-2 hover:text-white focus-visible:outline focus-visible:outline-1 disabled:opacity-30';
  return <div ref={frame} className="bg-black text-white/80 w-full fullscreen:flex fullscreen:flex-col fullscreen:justify-center">
    <div className="relative w-full aspect-video min-h-[200px] max-h-[calc(100vh-100px)]">
      {!activated ? <button type="button" onClick={() => setActivated(true)} aria-label={`Play ${title}`} className="group absolute inset-0 w-full h-full bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
        <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" loading="lazy" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
        <span className="absolute inset-0 flex items-center justify-center"><span className="rounded-full bg-black/65 p-4"><Play size={26} strokeWidth={1.5} aria-hidden="true" /></span></span>
      </button> : <div ref={mount} className="absolute inset-0 [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0" />}
    </div>
    {activated && <div className="px-2 py-1 text-xs font-mono-quiet">
      <div className="flex items-center justify-between">
        <span role="status">{error ? 'Video unavailable. Use Open video below.' : !ready ? 'Loading video…' : ''}</span>
        {ready && !error && <button type="button" onClick={() => setControls(value => !value)} aria-expanded={controls} aria-controls={controlsId} aria-label={controls ? 'Hide video controls' : 'Show video controls'} title={controls ? 'Hide controls' : 'Show controls'} className={buttonClass}><SlidersHorizontal size={16} aria-hidden="true" /></button>}
      </div>
      {controls && ready && !error && <div id={controlsId} className="flex flex-wrap items-center gap-2 pb-1" aria-label="Video controls">
        <button type="button" onClick={() => playing ? player.current?.pauseVideo() : player.current?.playVideo()} aria-label={playing ? 'Pause video' : 'Play video'} className={buttonClass}>{playing ? <Pause size={17} /> : <Play size={17} />}</button>
        <input type="range" aria-label="Video position" min={0} max={duration || 1} step={0.1} value={Math.min(time, duration || 1)} disabled={!duration} onChange={event => { const next = Number(event.target.value); setTime(next); player.current?.seekTo(next, true); }} className="min-w-20 flex-1 accent-white h-1" />
        <span className="tabular-nums text-[11px]">{videoTime(time)} / {videoTime(duration)}</span>
        <button type="button" onClick={() => { if (muted) player.current?.unMute(); else player.current?.mute(); setMuted(!muted); }} aria-label={muted ? 'Unmute video' : 'Mute video'} className={buttonClass}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
        <button type="button" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}); else void frame.current?.requestFullscreen?.().catch(() => {}); }} aria-label="Toggle video fullscreen" className={buttonClass}><Maximize size={17} /></button>
      </div>}
    </div>}
  </div>;
}
