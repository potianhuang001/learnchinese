/**
 * QuizRunner — 单元测验引擎
 * 流程：介绍页 → 随机抽题逐题作答（不即时反馈）→ 提交自动评分 → 结果与解析
 * 登录用户完成测验后自动保存进度（最高分保留）并标记课程完成
 */
import React, { useMemo, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useUpdateProgress } from '../../hooks/useProgress';
import { shuffle, normalizeAnswer } from '../../utils/helpers';
import Button from '../Button';
import AudioButton from '../AudioButton';

const QUIZ_SIZE = 5;

export default function QuizRunner({ lessonId, questions }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const { mutateAsync: saveProgress } = useUpdateProgress();

  const [phase, setPhase] = useState('intro'); // intro | running | result
  const [quiz, setQuiz] = useState([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // questionId -> 用户答案
  const [result, setResult] = useState(null);
  const startTimeRef = useRef(0);
  const [saving, setSaving] = useState(false);

  const poolSize = useMemo(() => Math.min(QUIZ_SIZE, questions.length), [questions.length]);
  const current = quiz[idx];

  const start = () => {
    startTimeRef.current = Date.now();
    setQuiz(shuffle(questions).slice(0, QUIZ_SIZE));
    setAnswers({});
    setIdx(0);
    setResult(null);
    setPhase('running');
  };

  const setAnswer = (value) => {
    setAnswers((prev) => ({ ...prev, [current._id]: value }));
  };

  const goNext = () => {
    if (idx + 1 < quiz.length) setIdx((i) => i + 1);
  };

  const goPrev = () => {
    if (idx > 0) setIdx((i) => i - 1);
  };

  const allAnswered = quiz.every((q) => (answers[q._id] ?? '').toString().trim() !== '');

  /** 提交：判分 → 展示结果 → 保存进度 */
  const submit = async () => {
    const graded = quiz.map((q) => {
      const userAnswer = answers[q._id];
      const correct = normalizeAnswer(userAnswer) === normalizeAnswer(q.correctAnswer);
      return { ...q, userAnswer, correct };
    });
    const correctCount = graded.filter((g) => g.correct).length;
    const score = Math.round((correctCount / quiz.length) * 100);
    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    setResult({ graded, score, correctCount, total: quiz.length, timeSpent });
    setPhase('result');

    // 登录用户自动保存进度
    if (user) {
      setSaving(true);
      try {
        await saveProgress({ lessonId, score, completed: true, timeSpent });
        toast.success(t('ex_quiz_saved'));
      } catch {
        /* 保存失败不阻塞结果展示 */
      } finally {
        setSaving(false);
      }
    }
  };

  // ---- 介绍页 ----
  if (phase === 'intro') {
    return (
      <div className="card p-8 text-center">
        <div className="mb-3 text-4xl" aria-hidden="true">
          📝
        </div>
        <h3 className="text-xl font-bold">{t('ex_quiz_title')}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-light">{t('ex_quiz_subtitle')}</p>
        <p className="mt-3 text-sm font-semibold text-primary-600">
          {poolSize} {t('common_questions', { fallback: '' })} · {t('ex_quiz_retry_hint')}
        </p>
        {!user && (
          <p className="mt-2 text-xs text-ink-lighter">{t('lesson_quiz_needs_login')}</p>
        )}
        <Button className="mt-6 px-8" onClick={start} disabled={quiz.length === 0}>
          {t('ex_quiz_start')}
        </Button>
      </div>
    );
  }

  // ---- 结果页 ----
  if (phase === 'result') {
    const { graded, score, correctCount, total } = result;
    return (
      <div className="card p-8">
        <div className="text-center">
          <div
            className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold ${
              score >= 60 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {t('ex_quiz_percent', { percent: score })}
          </div>
          <h3 className="mt-4 text-xl font-bold">{t('ex_quiz_result')}</h3>
          <p className="mt-1 text-sm text-ink-light">
            {t('ex_quiz_score', { score: correctCount, max: total })} {saving && '· …'}
          </p>
          <Button variant="secondary" className="mt-4" onClick={start}>
            {t('ex_quiz_again')}
          </Button>
        </div>

        {/* 答案回顾 */}
        <div className="mt-8 space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-ink-lighter">
            {t('ex_quiz_review')}
          </h4>
          {graded.map((q, i) => (
            <div
              key={q._id}
              className={`rounded-xl border px-4 py-3 text-sm ${
                q.correct
                  ? 'border-emerald-200 bg-emerald-50/60'
                  : 'border-red-200 bg-red-50/60'
              }`}
            >
              <p className="font-medium">
                <span className="mr-2 text-ink-lighter">{i + 1}.</span>
                {q.correct ? '✓' : '✕'} {q.prompt}
              </p>
              {!q.correct && (
                <p className="mt-1 text-ink-light">
                  {t('ex_your_answer')}: <span className="line-through">{q.userAnswer}</span> ·{' '}
                  {q.correctAnswer}
                </p>
              )}
              {q.explanation && (
                <p className="mt-1 text-xs text-ink-lighter">
                  {t('ex_explanation')}: {q.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- 作答页 ----
  const isFillBlank = current.type === 'fill_blank';
  const currentAnswer = answers[current._id];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between text-sm text-ink-light">
        <span>
          {t('ex_question_of', { current: idx + 1, total: quiz.length })}
        </span>
        <span>{t(`ex_${current.type}`)}</span>
      </div>
      <div
        className="mb-5 h-1.5 overflow-hidden rounded-full bg-ink/10"
        role="progressbar"
        aria-valuenow={idx + 1}
        aria-valuemin={0}
        aria-valuemax={quiz.length}
        aria-label="Quiz progress"
      >
        <div
          className="h-full rounded-full bg-primary-500 transition-all duration-300"
          style={{ width: `${((idx + 1) / quiz.length) * 100}%` }}
        />
      </div>

      <div className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
            {t(`ex_${current.type}`)}
          </span>
          {current.type === 'listening' && (
            <AudioButton text={current.prompt} audioUrl={current.audioUrl} />
          )}
        </div>

        <p className="mb-5 text-lg font-medium leading-relaxed">{current.prompt}</p>

        {isFillBlank ? (
          <input
            type="text"
            value={currentAnswer || ''}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={t('ex_enter_answer')}
            autoComplete="off"
            className="input"
          />
        ) : (
          <div className="grid gap-2">
            {current.options.map((opt) => {
              const isSelected = opt === currentAnswer;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setAnswer(opt)}
                  aria-pressed={isSelected}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    isSelected
                      ? 'border-primary-400 bg-primary-50 text-primary-800'
                      : 'border-ink/10 bg-white text-ink hover:border-primary-300 hover:bg-primary-50/50'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${
                      isSelected
                        ? 'border-primary-500 bg-primary-500 text-white'
                        : 'border-ink/20'
                    }`}
                    aria-hidden="true"
                  />
                  {opt}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" onClick={goPrev} disabled={idx === 0}>
            ← {t('common_previous')}
          </Button>
          {idx + 1 < quiz.length ? (
            <Button onClick={goNext} disabled={!currentAnswer?.toString().trim()}>
              {t('common_next')} →
            </Button>
          ) : (
            <Button onClick={submit} disabled={!allAnswered}>
              {t('common_submit')} ✓
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
