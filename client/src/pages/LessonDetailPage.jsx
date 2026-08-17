/**
 * LessonDetailPage — 课程详情页
 * 内容区：拼音 / 汉字 / 词汇（可收藏）/ 语法 / 对话
 * 学习区：练习（即时反馈）+ 单元测验（自动评分保存进度）+ 标记完成
 */
import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLesson } from '../hooks/useLessons';
import useQuestions from '../hooks/useQuestions';
import { useProgress, useUpdateProgress } from '../hooks/useProgress';
import { useVocabulary, useAddVocabulary, useRemoveVocabulary } from '../hooks/useVocabulary';
import LevelBadge from '../components/LevelBadge';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import AudioButton from '../components/AudioButton';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import StrokeAnimator from '../components/StrokeAnimator';
import VideoPlayer from '../components/VideoPlayer';
import PremiumLock from '../components/PremiumLock';
import PracticePanel from '../components/practice/PracticePanel';
import QuizRunner from '../components/practice/QuizRunner';

/** 分节标题（带图标） */
function SectionHeading({ icon, title, hint }) {
  return (
    <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
      <span aria-hidden="true">{icon}</span>
      {title}
      {hint && <span className="text-xs font-medium text-ink-lighter">{hint}</span>}
    </h2>
  );
}

/** 从句子中提取不重复的汉字（按出现顺序） */
function extractChars(str) {
  if (!str) return [];
  return [...new Set(str.match(/[\u4e00-\u9fff]/g) || [])];
}

/** 词汇笔顺弹窗：展示一个词中每个汉字的笔顺动画 */
function StrokeModal({ open, onClose, word }) {
  const { t } = useLanguage();
  if (!word) return null;
  const chars = extractChars(word.word);
  return (
    <Modal open={open} onClose={onClose} title={`${word.word} · ${word.pinyin}`}>
      <div className="flex flex-wrap justify-center gap-4">
        {chars.map((c) => (
          <StrokeAnimator key={c} char={c} size={110} autoPlay />
        ))}
      </div>
      <p className="mt-4 text-center text-sm text-ink-light">{t('stroke_modal_hint')}</p>
    </Modal>
  );
}

export default function LessonDetailPage() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data, isLoading, isError, error } = useLesson(id);
  const lesson = data?.lesson;
  // 会员课程未解锁（初级免费，中/高级需会员）
  const locked = Boolean(lesson?.locked);
  // 会员课程未解锁时不请求题目（后端会 403）
  const { data: questionData, isLoading: questionsLoading } = useQuestions(locked ? null : id);
  const { data: progressData } = useProgress(user?._id);
  const { data: vocabData } = useVocabulary(user?._id);

  const { mutate: saveProgress, isPending: savingProgress } = useUpdateProgress();
  const { mutate: addWord, isPending: addingWord } = useAddVocabulary(user?._id);
  const { mutate: removeWord } = useRemoveVocabulary(user?._id);

  const [activeTab, setActiveTab] = useState('learn'); // learn | practice | quiz
  const [strokeWord, setStrokeWord] = useState(null); // 词汇笔顺弹窗

  const vocabItems = data?.vocabItems || [];

  const questions = questionData?.questions || [];

  // 课程核心汉字（用于手绘笔画区）
  const lessonChars = useMemo(
    () => extractChars(lesson?.content?.characters || lesson?.content?.dialogue || ''),
    [lesson],
  );

  // 用户收藏的词汇 id 集合
  const savedIds = useMemo(
    () => new Set((vocabData?.vocabulary || []).map((w) => w._id)),
    [vocabData],
  );

  // 本课完成状态
  const isCompleted = progressData?.progress?.some(
    (p) => p.lessonId?._id === lesson?._id && p.completed,
  );

  const handleMarkComplete = () => {
    if (!user) {
      toast.info(t('lesson_quiz_needs_login'));
      return;
    }
    saveProgress({ lessonId: id, completed: true });
    toast.success(t('lesson_completed'));
  };

  const handleToggleSave = (word) => {
    if (!user) {
      toast.info(t('lesson_vocab_login_hint'));
      return;
    }
    if (savedIds.has(word._id)) {
      removeWord(word._id);
      toast.info(t('vocab_removed'));
    } else {
      addWord(word._id);
      toast.success(t('vocab_saved'));
    }
  };

  if (isLoading) return <Spinner />;

  if (isError || !lesson) {
    return (
      <div className="container-page py-12">
        <Alert type="error" className="mx-auto max-w-md">
          {error?.message || t('lesson_not_found')}
        </Alert>
        <div className="mt-6 text-center">
          <Link to="/lessons" className="btn-secondary">
            ← {t('lesson_not_found_desc')}
          </Link>
        </div>
      </div>
    );
  }

  const content = lesson.content || {};

  return (
    <div className="container-page py-12">
      {/* 面包屑 + 头部 */}
      <nav className="mb-4 text-sm text-ink-light" aria-label="Breadcrumb">
        <Link to="/lessons" className="hover:text-primary-600">
          {t('nav_lessons')}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink">{lesson.title}</span>
      </nav>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-3">
            <LevelBadge level={lesson.level} />
            <span className="text-xs font-medium text-ink-lighter">
              {t('lesson_level')} {lesson.order}
            </span>
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">{lesson.title}</h1>
          <p className="mt-3 max-w-2xl text-ink-light">{lesson.description}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {(lesson.audioUrl || content.characters) && !locked && (
            <AudioButton
              text={content.characters || lesson.title}
              audioUrl={lesson.audioUrl}
              label={`${t('lesson_audio')} · ${lesson.title}`}
            />
          )}
          {lesson.premium && !locked && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
              👑 {t('premium_badge')}
            </span>
          )}
          {isCompleted ? (
            <span className="rounded-lg bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
              {t('lesson_completed')}
            </span>
          ) : !locked ? (
            <Button variant="secondary" onClick={handleMarkComplete} loading={savingProgress}>
              {t('lesson_mark_complete')}
            </Button>
          ) : null}
        </div>
      </div>

      {/* 会员锁定横幅（中级/高级课程未解锁时） */}
      {locked && (
        <div className="mb-8">
          <PremiumLock compact />
        </div>
      )}

      {/* 内容/练习/测验 Tab */}
      <div className="mb-8 flex gap-1 border-b border-ink/10" role="tablist">
        {[
          { key: 'learn', icon: '📖', label: t('common_learn') },
          { key: 'practice', icon: '✏️', label: t('lesson_exercises') },
          { key: 'quiz', icon: '📝', label: t('lesson_quiz') },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === tab.key
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-ink-light hover:text-ink'
            }`}
          >
            <span aria-hidden="true">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---- 学习内容 ---- */}
      {activeTab === 'learn' && (
        <div className="space-y-8">
          {/* 视频教学（会员课程解锁后可见） */}
          {lesson.video?.type && !locked && (
            <section className="card p-6">
              <SectionHeading icon="🎬" title={t('lesson_video')} />
              <VideoPlayer video={lesson.video} />
            </section>
          )}

          {content.pinyin && (
            <section className="card p-6">
              <SectionHeading icon="🔤" title={t('lesson_pinyin')} />
              <p className="text-lg font-medium text-primary-600">{content.pinyin}</p>
            </section>
          )}

          {/* 手绘笔画教学：课程核心汉字逐笔动画 */}
          {lessonChars.length > 0 && (
            <section className="card p-6">
              <SectionHeading icon="✍️" title={t('lesson_strokes')} hint={t('stroke_hint')} />
              <div className="flex flex-wrap justify-center gap-5">
                {lessonChars.map((c) => (
                  <StrokeAnimator key={c} char={c} size={110} autoPlay showPinyin={false} />
                ))}
              </div>
            </section>
          )}

          {content.characters && (
            <section className="card p-6">
              <SectionHeading icon="🀄" title={t('lesson_characters')} />
              <p className="text-3xl font-bold tracking-widest">{content.characters}</p>
              {(lesson.audioUrl || content.characters) && (
                <div className="mt-4">
                  <AudioButton text={content.characters} audioUrl={lesson.audioUrl} />
                </div>
              )}
            </section>
          )}

          {/* 词汇（含收藏） */}
          <section className="card p-6">
            <SectionHeading icon="📚" title={t('lesson_vocabulary')} />
            {vocabItems.length === 0 ? (
              <p className="text-sm text-ink-lighter">{t('common_empty')}</p>
            ) : (
              <ul className="divide-y divide-ink/5">
                {vocabItems.map((word) => {
                  const saved = savedIds.has(word._id);
                  return (
                    <li key={word._id} className="flex items-center gap-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-lg font-bold">{word.word}</span>
                          <span className="text-sm font-medium text-primary-600">
                            {word.pinyin}
                          </span>
                          <span className="text-sm text-ink-light">{word.translation}</span>
                        </div>
                        {word.example && (
                          <p className="mt-0.5 truncate text-sm text-ink-lighter">
                            {word.example}
                          </p>
                        )}
                      </div>
                      <AudioButton
                        text={word.word}
                        audioUrl={word.audioUrl}
                        label={word.word}
                      />
                      <button
                        type="button"
                        onClick={() => setStrokeWord(word)}
                        className="shrink-0 rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold text-ink-light transition-colors hover:border-primary-400 hover:text-primary-600"
                        title={t('stroke_view')}
                      >
                        ✍️ {t('stroke_view')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleSave(word)}
                        disabled={addingWord}
                        className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          saved
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                        }`}
                      >
                        {saved ? t('lesson_vocab_saved') : t('lesson_vocab_save')}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {content.grammar && (
            <section className="card p-6">
              <SectionHeading icon="🧩" title={t('lesson_grammar')} />
              <p className="whitespace-pre-line leading-relaxed text-ink">{content.grammar}</p>
            </section>
          )}

          {content.dialogue && (
            <section className="card p-6">
              <SectionHeading icon="💬" title={t('lesson_dialogue')} />
              <p className="whitespace-pre-line leading-relaxed text-ink">{content.dialogue}</p>
              <div className="mt-4">
                <AudioButton text={content.dialogue} />
              </div>
            </section>
          )}
        </div>
      )}

      {/* ---- 练习 ---- */}
      {activeTab === 'practice' && (
        <div>
          {locked ? (
            <PremiumLock />
          ) : questionsLoading ? (
            <Spinner />
          ) : questions.length === 0 && !(content.characters || content.dialogue) ? (
            <EmptyState
              icon="✏️"
              title={t('common_empty')}
              description={t('lessons_empty_desc')}
            />
          ) : (
            <PracticePanel
              questions={questions}
              speakingText={content.characters || content.dialogue}
            />
          )}
        </div>
      )}

      {/* ---- 测验 ---- */}
      {activeTab === 'quiz' && (
        <div>
          {locked ? (
            <PremiumLock />
          ) : questionsLoading ? (
            <Spinner />
          ) : questions.length === 0 ? (
            <EmptyState
              icon="📝"
              title={t('common_empty')}
              description={t('lessons_empty_desc')}
            />
          ) : (
            <QuizRunner lessonId={lesson._id} questions={questions} />
          )}
        </div>
      )}

      {/* 词汇笔顺弹窗 */}
      <StrokeModal open={Boolean(strokeWord)} onClose={() => setStrokeWord(null)} word={strokeWord} />
    </div>
  );
}
