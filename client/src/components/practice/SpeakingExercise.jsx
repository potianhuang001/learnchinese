/**
 * SpeakingExercise — 口语练习（跟读 + 录音占位）
 * 无标准答案：跟读后标记“已练习”即可进入下一题
 */
import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import AudioButton from '../AudioButton';
import Button from '../Button';

export default function SpeakingExercise({ question, onResult, onNext }) {
  const { t } = useLanguage();
  const [recording, setRecording] = useState(false);

  const toggleRecord = () => setRecording((r) => !r);

  const handleDone = () => {
    onResult(true);
    onNext();
  };

  return (
    <div className="card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
          {t('ex_speaking')}
        </span>
        <AudioButton text={question.prompt} audioUrl={question.audioUrl} />
      </div>

      <p className="mb-2 text-lg font-medium leading-relaxed">{question.prompt}</p>
      <p className="mb-5 text-sm text-ink-light">{t('ex_speaking_hint')}</p>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={recording ? 'danger' : 'secondary'}
          onClick={toggleRecord}
          aria-pressed={recording}
        >
          {recording ? `⏹ ${t('ex_recording')}` : `🎙 ${t('ex_record')}`}
        </Button>
        <Button onClick={handleDone}>{t('common_continue')}</Button>
      </div>

      <p className="mt-4 rounded-xl bg-ink/5 px-4 py-3 text-xs leading-relaxed text-ink-light">
        {t('ex_speaking_placeholder')}
      </p>
    </div>
  );
}
