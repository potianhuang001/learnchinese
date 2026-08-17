/**
 * PracticePanel — 练习面板
 * 按顺序遍历课程题目（选择题/填空题/听力题/口语题），即时反馈，答完显示小结
 * speakingText：口语练习文本（跟读最后一步，占位录音）
 */
import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import MultipleChoiceExercise from './MultipleChoiceExercise';
import FillBlankExercise from './FillBlankExercise';
import ListeningExercise from './ListeningExercise';
import SpeakingExercise from './SpeakingExercise';

const EXERCISE_COMPONENTS = {
  multiple_choice: MultipleChoiceExercise,
  fill_blank: FillBlankExercise,
  listening: ListeningExercise,
  speaking: SpeakingExercise,
};

export default function PracticePanel({ questions, speakingText = '' }) {
  const { t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]); // 每题首次作答是否正确
  const [done, setDone] = useState(false);

  // 题库 + 口语跟读（合成一个 speaking 题挂在最后）
  const queue = useMemo(() => {
    const list = questions.map((q) => ({ ...q }));
    if (speakingText?.trim()) {
      list.push({ _id: 'speaking-practice', type: 'speaking', prompt: speakingText.trim() });
    }
    return list;
  }, [questions, speakingText]);

  const question = queue[index];
  const ExerciseComponent = EXERCISE_COMPONENTS[question?.type] || MultipleChoiceExercise;

  // 已答题目数（用于进度条）
  const answered = results.length;

  const handleResult = (correct) => {
    setResults((prev) => [...prev, correct]);
  };

  const handleNext = () => {
    if (index + 1 >= queue.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const correctCount = useMemo(() => results.filter(Boolean).length, [results]);

  // ---- 完成页 ----
  if (done) {
    return (
      <div className="card p-8 text-center">
        <div className="mb-3 text-5xl" aria-hidden="true">
          🎉
        </div>
        <h3 className="text-xl font-bold">{t('ex_done')}</h3>
        <p className="mt-1 text-sm text-ink-light">{t('ex_done_desc')}</p>
        {queue.length > 0 && (
          <p className="mt-3 text-sm font-semibold text-primary-600">
            {correctCount} / {queue.length} {t('common_correct').toLowerCase()}
          </p>
        )}
      </div>
    );
  }

  if (!question) return null;

  return (
    <div>
      {/* 进度 */}
      <div className="mb-4 flex items-center justify-between gap-3 text-sm text-ink-light">
        <span>
          {t('ex_question_of', { current: index + 1, total: queue.length })}
        </span>
        <span>
          {correctCount} {t('common_correct')} ✓
        </span>
      </div>
      <div
        className="mb-5 h-1.5 overflow-hidden rounded-full bg-ink/10"
        role="progressbar"
        aria-valuenow={answered}
        aria-valuemin={0}
        aria-valuemax={queue.length}
        aria-label="Exercise progress"
      >
        <div
          className="h-full rounded-full bg-primary-500 transition-all duration-300"
          style={{ width: `${(answered / queue.length) * 100}%` }}
        />
      </div>

      {/* 当前题目（用 key 强制重挂载，保证内部状态重置） */}
      <ExerciseComponent
        key={`${question._id}-${index}`}
        question={question}
        onResult={handleResult}
        onNext={handleNext}
      />
    </div>
  );
}
