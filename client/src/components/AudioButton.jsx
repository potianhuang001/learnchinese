/**
 * AudioButton — 音频播放按钮
 * - 有 audioUrl 时播放真实音频
 * - 否则使用浏览器 SpeechSynthesis 朗读中文文本（占位方案，无需外部资源）
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function AudioButton({ text, audioUrl = '', label, className = '' }) {
  const { t } = useLanguage();
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  const speechRef = useRef(null);

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (speechRef.current) {
      window.speechSynthesis?.cancel();
      speechRef.current = null;
    }
    setPlaying(false);
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  const handlePlay = () => {
    if (playing) {
      stopAll();
      return;
    }

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      audio.play().catch(() => setPlaying(false));
      audioRef.current = audio;
      setPlaying(true);
      return;
    }

    // SpeechSynthesis 占位方案
    if ('speechSynthesis' in window && text) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'zh-CN';
      utter.rate = 0.9;
      const voices = window.speechSynthesis.getVoices();
      const zh = voices.find((v) => v.lang.toLowerCase().startsWith('zh'));
      if (zh) utter.voice = zh;
      utter.onend = () => setPlaying(false);
      utter.onerror = () => setPlaying(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
      speechRef.current = utter;
      setPlaying(true);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePlay}
      aria-label={label || t('lesson_audio')}
      title={t('lesson_audio_placeholder')}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        playing
          ? 'bg-primary-100 text-primary-700'
          : 'bg-ink/5 text-ink-light hover:bg-primary-100 hover:text-primary-700'
      } ${className}`}
    >
      <span aria-hidden="true" className="text-sm leading-none">
        {playing ? '⏹' : '🔊'}
      </span>
      {label || t('lesson_audio')}
    </button>
  );
}
