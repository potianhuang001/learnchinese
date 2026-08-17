/**
 * MultipleChoiceExercise — 选择题（单选，即时判分）
 */
import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import QuestionCard from './QuestionCard';

export default function MultipleChoiceExercise({ question, onResult, onNext }) {
  const { t } = useLanguage();
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState(false);
  const isCorrect = selected === question.correctAnswer;

  const handleCheck = () => {
    if (selected == null) return;
    setChecked(true);
    onResult(isCorrect);
  };

  const handleRetry = () => {
    setChecked(false);
    setSelected(null);
  };

  return (
    <QuestionCard
      question={question}
      typeLabel={t('ex_multiple_choice')}
      checked={checked}
      isCorrect={isCorrect}
      onCheck={handleCheck}
      checkDisabled={selected == null}
      onRetry={handleRetry}
      onNext={onNext}
    >
      <div className="grid gap-2">
        {question.options.map((opt) => {
          const isSelected = opt === selected;
          const isRight = checked && opt === question.correctAnswer;
          const isWrong = checked && isSelected && opt !== question.correctAnswer;
          return (
            <button
              key={opt}
              type="button"
              disabled={checked}
              onClick={() => setSelected(opt)}
              aria-pressed={isSelected}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors disabled:cursor-default ${
                isRight
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : isWrong
                    ? 'border-red-300 bg-red-50 text-red-800'
                    : isSelected
                      ? 'border-primary-400 bg-primary-50 text-primary-800'
                      : 'border-ink/10 bg-white text-ink hover:border-primary-300 hover:bg-primary-50/50'
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                  isRight
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : isWrong
                      ? 'border-red-500 bg-red-500 text-white'
                      : isSelected
                        ? 'border-primary-500 bg-primary-500 text-white'
                        : 'border-ink/20 text-transparent'
                }`}
                aria-hidden="true"
              >
                {isRight ? '✓' : isWrong ? '✕' : ''}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    </QuestionCard>
  );
}
