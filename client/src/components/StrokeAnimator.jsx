/**
 * StrokeAnimator — 汉字手绘笔顺动画（基于 hanzi-writer）
 * - 逐笔手绘绘制汉字，可播放 / 暂停 / 重播 / 调速
 * - 字符数据从本地 public/hanzi-data/<字>.json 加载（离线可用）
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import { useLanguage } from '../context/LanguageContext';

/** 从本地加载单个汉字的笔顺数据（缺失或格式异常时返回 null，组件降级为静态显示） */
async function loadCharData(char) {
  try {
    const res = await fetch(`/hanzi-data/${encodeURIComponent(char)}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !Array.isArray(data.strokes)) return null;
    return data;
  } catch {
    return null;
  }
}

const SPEEDS = [0.5, 1, 1.5];

export default function StrokeAnimator({
  char,
  pinyin = '',
  size = 120,
  autoPlay = false,
  showPinyin = true,
  className = '',
}) {
  const containerRef = useRef(null);
  const writerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(1);
  const [hasData, setHasData] = useState(true);
  const { t } = useLanguage();

  // 创建 / 重建 writer
  useEffect(() => {
    if (!containerRef.current || !char) return undefined;
    // 清空容器（React 重建时避免残留 SVG）
    containerRef.current.innerHTML = '';

    let disposed = false;
    let writer;

    (async () => {
      const charData = await loadCharData(char);
      if (disposed) return;
      if (!charData) {
        setHasData(false);
        return;
      }
      setHasData(true);
      writer = HanziWriter.create(containerRef.current, char, {
        width: size,
        height: size,
        padding: 8,
        showOutline: true,
        showCharacter: false,
        strokeColor: '#0f766e',
        highlightColor: '#f59e0b',
        strokeAnimationSpeed: SPEEDS[speedIdx],
        charDataLoader: () => charData,
      });
      writerRef.current = writer;
      if (autoPlay) {
        writer.animateCharacter();
        setPlaying(true);
      }
    })();

    return () => {
      disposed = true;
      writer?.cancelAnimation();
      writerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 重建时机：char / size / autoPlay 变化
  }, [char, size, autoPlay]);

  // 速度变化时应用
  useEffect(() => {
    writerRef.current?.setStrokeAnimationSpeed(SPEEDS[speedIdx]);
  }, [speedIdx]);

  const play = useCallback(() => {
    writerRef.current?.animateCharacter(() => setPlaying(false));
    setPlaying(true);
  }, []);

  const pause = useCallback(() => {
    writerRef.current?.pauseAnimation();
    setPlaying(false);
  }, []);

  const toggle = () => (playing ? pause() : play());

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative flex items-center justify-center rounded-xl border border-ink/10 bg-white">
        <div ref={containerRef} style={{ width: size, height: size }} />
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold" style={{ color: '#0f766e' }}>
              {char}
            </span>
          </div>
        )}
      </div>

      {showPinyin && pinyin && (
        <span className="mt-1.5 text-sm font-medium text-primary-600">{pinyin}</span>
      )}

      <div className="mt-2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggle}
          disabled={!hasData}
          className="rounded-md bg-primary-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-40"
        >
          {playing ? '⏸' : '▶'}
        </button>
        <button
          type="button"
          onClick={play}
          disabled={!hasData}
          className="rounded-md border border-ink/10 px-2 py-1 text-xs font-medium text-ink-light transition-colors hover:bg-ink/5 disabled:opacity-40"
          aria-label={t('stroke_restart')}
        >
          ↻
        </button>
        {SPEEDS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setSpeedIdx(i)}
            disabled={!hasData}
            className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors disabled:opacity-40 ${
              speedIdx === i
                ? 'bg-primary-100 text-primary-700'
                : 'text-ink-lighter hover:bg-ink/5'
            }`}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}
