/**
 * QuestionCard — 练习题通用外壳
 * 展示题目标签 + 题干 + 音频按钮 + 答案区 + 反馈与操作按钮
 */
import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import AudioButton from '../AudioButton';
import Button from '../Button';

export default function QuestionCard({
  question,
  typeLabel,
  audioText = '',
  children,
  checked = false,
  isCorrect = false,
  onCheck,
  checkDisabled = false,
  onRetry,
  onNext,
  nextLabel = '',
}) {
  const { t } = useLanguage();

  return (
    <div className="card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
          {typeLabel}
        </span>
        {audioText && (
          <AudioButton text={audioText} audioUrl={question.audioUrl} />
        )}
      </div>

      <p className="mb-5 text-lg font-medium leading-relaxed">{question.prompt}</p>

      {children}

      {checked && (
        <div
          className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
            isCorrect
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <p className="font-semibold">
            {isCorrect
              ? t('ex_correct_msg')
              : t('ex_incorrect_msg', { answer: question.correctAnswer })}
          </p>
          {question.explanation && (
            <p className="mt-1 opacity-80">
              {t('ex_explanation')}: {question.explanation}
            </p>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap justify-end gap-2">
        {!checked ? (
          <Button onClick={onCheck} disabled={checkDisabled}>
            {t('ex_check')}
          </Button>
        ) : (
          <>
            {!isCorrect && (
              <Button variant="secondary" onClick={onRetry}>
                {t('ex_retry')}
              </Button>
            )}
            <Button onClick={onNext}>{nextLabel || t('ex_next')}</Button>
          </>
        )}
      </div>
    </div>
  );
}
