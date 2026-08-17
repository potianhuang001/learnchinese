/**
 * FillBlankExercise — 填空题（输入答案，归一化后比对）
 */
import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { normalizeAnswer } from '../../utils/helpers';
import QuestionCard from './QuestionCard';

export default function FillBlankExercise({ question, onResult, onNext }) {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [checked, setChecked] = useState(false);
  const isCorrect = normalizeAnswer(input) === normalizeAnswer(question.correctAnswer);

  const handleCheck = () => {
    if (!input.trim()) return;
    setChecked(true);
    onResult(isCorrect);
  };

  const handleRetry = () => {
    setChecked(false);
    setInput('');
  };

  return (
    <QuestionCard
      question={question}
      typeLabel={t('ex_fill_blank')}
      checked={checked}
      isCorrect={isCorrect}
      onCheck={handleCheck}
      checkDisabled={!input.trim()}
      onRetry={handleRetry}
      onNext={onNext}
    >
      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          placeholder={t('ex_enter_answer')}
          disabled={checked}
          autoComplete="off"
          className="input"
        />
        {checked && (
          <p className="text-xs text-ink-lighter">
            {t('ex_your_answer')}: {input || '—'}
          </p>
        )}
      </div>
    </QuestionCard>
  );
}
