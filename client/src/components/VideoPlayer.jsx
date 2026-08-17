/**
 * VideoPlayer — 视频教学播放器
 * 支持三种来源：
 * - mp4      原生 <video>
 * - youtube  iframe 嵌入
 * - bilibili iframe 嵌入（player.bilibili.com）
 * 传入空 / 无效 video 时不渲染。
 * 增强：iframe 加载失败 / 超时时显示友好回退 UI。
 */
import React, { useEffect, useRef, useState } from 'react';

/** 从各种 YouTube 链接形态中提取视频 ID */
export function extractYouTubeId(url) {
  if (!url) return '';
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  return m ? m[1] : '';
}

/** 从 B站链接中提取 BV 号 */
export function extractBilibiliBv(url) {
  if (!url) return '';
  const m = url.match(/BV[0-9A-Za-z]+/);
  return m ? m[0] : '';
}

function VideoFallback({ heading, videoUrl, onRetry, type }) {
  const isYouTube = type === 'youtube';
  const platformName = isYouTube ? 'YouTube' : 'Bilibili';
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center rounded-xl bg-slate-100 p-6 text-center">
      <div className="mb-3 text-4xl">{isYouTube ? '📺' : '📹'}</div>
      <p className="mb-1 text-sm font-semibold text-ink">Video failed to load</p>
      <p className="mb-4 max-w-md text-xs text-ink-light">
        {isYouTube
          ? 'YouTube may be unreachable from your current network. Try opening it in a new tab or switch to a Bilibili / local video source.'
          : 'The video could not be loaded. You can open it on Bilibili or try again.'}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-600"
        >
          Retry
        </button>
        <a
          href={videoUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-ink/5"
        >
          Open on {platformName}
        </a>
      </div>
    </div>
  );
}

export default function VideoPlayer({ video, title, className = '' }) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef(null);

  if (!video || !video.type || !video.url) return null;

  const heading = title || video.title || '';

  useEffect(() => {
    // 每次切换 video 时重置状态
    setError(false);
    setLoaded(false);
    return () => clearTimeout(timerRef.current);
  }, [video?.type, video?.url]);

  const startLoadTimer = () => {
    setLoaded(false);
    clearTimeout(timerRef.current);
    // iframe 超过 12 秒没有触发 onLoad 视为超时（国内 YouTube 常见）
    timerRef.current = setTimeout(() => {
      if (!loaded) setError(true);
    }, 12000);
  };

  const handleLoad = () => {
    setLoaded(true);
    setError(false);
    clearTimeout(timerRef.current);
  };

  const handleError = () => {
    setError(true);
    setLoaded(false);
    clearTimeout(timerRef.current);
  };

  const handleRetry = () => {
    setError(false);
    startLoadTimer();
  };

  if (video.type === 'mp4') {
    return (
      <div className={className}>
        {heading && <p className="mb-2 text-sm font-semibold text-ink">{heading}</p>}
        <video controls playsInline preload="metadata" className="w-full rounded-xl bg-black">
          <source src={video.url} />
          Your browser does not support video playback.
        </video>
      </div>
    );
  }

  if (video.type === 'youtube') {
    const vid = extractYouTubeId(video.url);
    if (!vid) return null;
    if (error) {
      return (
        <div className={className}>
          {heading && <p className="mb-2 text-sm font-semibold text-ink">{heading}</p>}
          <VideoFallback
            heading={heading}
            videoUrl={video.url}
            onRetry={handleRetry}
            type="youtube"
          />
        </div>
      );
    }
    return (
      <div className={className}>
        {heading && <p className="mb-2 text-sm font-semibold text-ink">{heading}</p>}
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${vid}`}
            title={heading || 'Video lesson'}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      </div>
    );
  }

  if (video.type === 'bilibili') {
    const bv = extractBilibiliBv(video.url);
    if (!bv) return null;
    if (error) {
      return (
        <div className={className}>
          {heading && <p className="mb-2 text-sm font-semibold text-ink">{heading}</p>}
          <VideoFallback
            heading={heading}
            videoUrl={video.url}
            onRetry={handleRetry}
            type="bilibili"
          />
        </div>
      );
    }
    return (
      <div className={className}>
        {heading && <p className="mb-2 text-sm font-semibold text-ink">{heading}</p>}
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          <iframe
            src={`https://player.bilibili.com/player.html?bvid=${bv}&autoplay=0&danmaku=0`}
            title={heading || 'Video lesson'}
            className="h-full w-full"
            scrolling="no"
            frameBorder="0"
            allowFullScreen
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      </div>
    );
  }

  return null;
}
