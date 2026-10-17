import { videoFrameStyle } from '../services/videoAspectRatio';
import React, { useEffect, useRef, useState } from 'react';
import { Play } from 'lucide-react';
import { loadYoutubeApi, type YoutubePlayerHandle } from '../services/youtubePlayer';
import { observeVideoDwell } from '../services/videoDwell';

let activePlayer: YoutubePlayerHandle | null = null;

export function YouTubePlayer({ videoId, title, aspectRatio = 16 / 9 }: { videoId: string; title: string; aspectRatio?: number }) {
  const [activated, setActivated] = useState(false);
  const [error, setError] = useState(false);
  const player = useRef<YoutubePlayerHandle | null>(null);
  const mount = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const shouldPlay = useRef(false);
  const manuallyPaused = useRef(false);
  const automaticPause = useRef(false);
  const autoplayBlocked = useRef(false);

  const play = () => {
    const current = player.current;
    if (!current) return;
    if (activePlayer && activePlayer !== current) activePlayer.pauseVideo();
    activePlayer = current;
    automaticPause.current = false;
    current.playVideo();
  };

  useEffect(() => {
    if (!frame.current) return;
    return observeVideoDwell(frame.current, {
      onEnter: () => { manuallyPaused.current = false; },
      onWaiting: () => { shouldPlay.current = false; },
      onDwell: () => {
        shouldPlay.current = true;
        if (manuallyPaused.current || autoplayBlocked.current) return;
        setActivated(true);
        play();
      },
      onLeave: () => {
        shouldPlay.current = false;
        automaticPause.current = true;
        player.current?.pauseVideo();
      },
    });
  }, []);

  useEffect(() => {
    if (!activated || !mount.current) return;
    let cancelled = false;
    let instance: YoutubePlayerHandle | undefined;
    const loadingTimeout = window.setTimeout(() => { if (!cancelled && !player.current) setError(true); }, 25000);
    const target = document.createElement('div');
    mount.current.append(target);
    loadYoutubeApi().then(api => {
      if (cancelled) return;
      instance = new api.Player(target, {
        videoId, host: 'https://www.youtube-nocookie.com', width: '100%', height: '100%',
        playerVars: { controls: 1, playsinline: 1, rel: 0, autoplay: 0, origin: window.location.origin },
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
            // Preserve audio settings rather than muting to bypass browser restrictions.
            if (shouldPlay.current && !manuallyPaused.current && !autoplayBlocked.current) play();
          },
          onStateChange: event => {
            if (cancelled) return;
            if (event.data === 2) {
              if (!automaticPause.current) manuallyPaused.current = true;
              automaticPause.current = false;
            } else if (event.data === 1) {
              manuallyPaused.current = false;
              autoplayBlocked.current = false;
              if (activePlayer && activePlayer !== event.target) activePlayer.pauseVideo();
              activePlayer = event.target;
            } else if (event.data === 0) manuallyPaused.current = true;
          },
          onError: () => { if (!cancelled) setError(true); },
          onAutoplayBlocked: () => { autoplayBlocked.current = true; },
        },
      });
    }).catch(() => { if (!cancelled) setError(true); });
    return () => {
      cancelled = true;
      window.clearTimeout(loadingTimeout);
      if (activePlayer === player.current) activePlayer = null;
      player.current = null;
      instance?.destroy();
      target.remove();
    };
  }, [activated, videoId, title]);

  return <div ref={frame} style={videoFrameStyle(aspectRatio)} className="relative mx-auto bg-white text-black/65">
    {!activated ? <button type="button" onClick={() => { shouldPlay.current = true; setActivated(true); }} aria-label={`Play ${title}`} className="group absolute inset-0 w-full h-full bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
      <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" loading="lazy" className="w-full h-full object-cover" />
      <span className="absolute inset-0 flex items-center justify-center"><span className="rounded-full bg-white/90 text-black/65 p-3 group-hover:bg-white transition-colors"><Play size={26} strokeWidth={1.5} aria-hidden="true" /></span></span>
    </button> : <div ref={mount} className="absolute inset-0 [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0" />}
    {error && <p role="status" className="absolute inset-x-0 bottom-0 bg-white p-3 text-center text-xs">Video unavailable. Please try again later.</p>}
  </div>;
}
