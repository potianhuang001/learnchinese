/**
 * LessonForm — 课程创建/编辑表单（模态框内容）
 * 包含：基本信息、内容区（拼音/汉字/语法/对话）、词汇行、题目行
 */
import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useSaveLesson } from '../../hooks/useAdmin';
import { getApiError } from '../../utils/helpers';
import Button from '../Button';
import Input from '../Input';
import Alert from '../Alert';

const QUESTION_TYPES = ['multiple_choice', 'fill_blank', 'listening'];
const emptyWord = () => ({ word: '', pinyin: '', translation: '', example: '' });
const emptyQuestion = () => ({
  type: 'multiple_choice',
  prompt: '',
  options: '',
  correctAnswer: '',
  explanation: '',
});

export default function LessonForm({ initial = null, initialQuestions = [], onDone, onCancel }) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { mutateAsync: saveLesson, isPending } = useSaveLesson();

  const [form, setForm] = useState(() => ({
    title: initial?.title || '',
    description: initial?.description || '',
    level: initial?.level || 'beginner',
    order: initial?.order ?? '',
    audioUrl: initial?.audioUrl || '',
    videoType: initial?.video?.type || '',
    videoUrl: initial?.video?.url || '',
    videoTitle: initial?.video?.title || '',
    pinyin: initial?.content?.pinyin || '',
    characters: initial?.content?.characters || '',
    grammar: initial?.content?.grammar || '',
    dialogue: initial?.content?.dialogue || '',
  }));

  const [vocab, setVocab] = useState(() =>
    initial?.content?.vocabulary?.length
      ? initial.content.vocabulary.map((v) => ({ ...v }))
      : [emptyWord()],
  );

  const [questions, setQuestions] = useState(() =>
    initialQuestions?.length
      ? initialQuestions.map((q) => ({
          type: q.type,
          prompt: q.prompt,
          options: Array.isArray(q.options) ? q.options.join(', ') : '',
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || '',
        }))
      : [emptyQuestion()],
  );

  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim() || !form.description.trim() || !form.order) {
      setError(t('common_required'));
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      level: form.level,
      order: Number(form.order),
      audioUrl: form.audioUrl.trim(),
      video:
        form.videoType && form.videoUrl.trim()
          ? {
              type: form.videoType,
              url: form.videoUrl.trim(),
              title: form.videoTitle.trim(),
            }
          : { type: '', url: '', title: '' },
      content: {
        pinyin: form.pinyin.trim(),
        characters: form.characters.trim(),
        grammar: form.grammar.trim(),
        dialogue: form.dialogue.trim(),
        vocabulary: vocab
          .filter((v) => v.word.trim() && v.pinyin.trim() && v.translation.trim())
          .map((v) => ({
            word: v.word.trim(),
            pinyin: v.pinyin.trim(),
            translation: v.translation.trim(),
            example: v.example.trim(),
          })),
      },
      questions: questions
        .filter((q) => q.prompt.trim() && q.correctAnswer.trim())
        .map((q) => ({
          type: q.type,
          prompt: q.prompt.trim(),
          options: q.options
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          correctAnswer: q.correctAnswer.trim(),
          explanation: q.explanation.trim(),
        })),
    };

    try {
      await saveLesson({ id: initial?._id, payload });
      toast.success(t('admin_saved'));
      onDone();
    } catch (err) {
      setError(getApiError(err));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && <Alert type="error">{error}</Alert>}

      {/* 基本信息 */}
      <fieldset className="space-y-4">
        <legend className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-lighter">
          {t('admin_form_content_label')}
        </legend>
        <Input
          name="title"
          label={t('admin_form_title')}
          required
          value={form.title}
          onChange={set('title')}
          placeholder="Greetings & Introductions"
        />
        <div>
          <label htmlFor="description" className="label">
            {t('admin_form_description')} *
          </label>
          <textarea
            id="description"
            rows={2}
            className="input"
            value={form.description}
            onChange={set('description')}
            placeholder="Learn how to greet people and introduce yourself…"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="level" className="label">
              {t('admin_form_level')}
            </label>
            <select id="level" className="input" value={form.level} onChange={set('level')}>
              <option value="beginner">{t('lessons_beginner')}</option>
              <option value="intermediate">{t('lessons_intermediate')}</option>
              <option value="advanced">{t('lessons_advanced')}</option>
            </select>
            {form.level !== 'beginner' && (
              <p className="mt-1 text-xs font-semibold text-amber-600">
                👑 {t('admin_level_premium_hint')}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="order" className="label">
              {t('admin_form_order')} *
            </label>
            <input
              id="order"
              type="number"
              min="1"
              className="input"
              value={form.order}
              onChange={set('order')}
            />
          </div>
          <div>
            <label htmlFor="audioUrl" className="label">
              {t('admin_form_audio_url')}
            </label>
            <input
              id="audioUrl"
              type="url"
              className="input"
              value={form.audioUrl}
              onChange={set('audioUrl')}
              placeholder="https://…"
            />
          </div>
        </div>
      </fieldset>

      {/* 视频教学（MP4 / YouTube / B站） */}
      <fieldset className="space-y-4 rounded-xl border border-ink/10 p-4">
        <legend className="px-1 text-sm font-bold text-ink-lighter">
          🎬 {t('admin_form_video_label')}
        </legend>
        <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
          <div>
            <label htmlFor="videoType" className="label">
              {t('admin_form_video_type')}
            </label>
            <select
              id="videoType"
              className="input"
              value={form.videoType}
              onChange={set('videoType')}
            >
              <option value="">{t('admin_form_video_none')}</option>
              <option value="mp4">MP4</option>
              <option value="youtube">YouTube</option>
              <option value="bilibili">Bilibili</option>
            </select>
          </div>
          <div>
            <label htmlFor="videoUrl" className="label">
              {t('admin_form_video_url')}
            </label>
            <input
              id="videoUrl"
              type="url"
              className="input"
              value={form.videoUrl}
              onChange={set('videoUrl')}
              placeholder="https://… 或 BV…"
            />
          </div>
        </div>
        <div>
          <label htmlFor="videoTitle" className="label">
            {t('admin_form_video_title')}
          </label>
          <input
            id="videoTitle"
            type="text"
            className="input"
            value={form.videoTitle}
            onChange={set('videoTitle')}
            placeholder="Lesson intro video"
          />
        </div>
        <p className="text-xs text-ink-lighter">{t('admin_form_video_hint')}</p>
      </fieldset>

      {/* 内容区 */}
      <fieldset className="space-y-4 rounded-xl border border-ink/10 p-4">
        <legend className="px-1 text-sm font-bold text-ink-lighter">{t('lesson_characters')} / {t('lesson_pinyin')} / {t('lesson_grammar')} / {t('lesson_dialogue')}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="pinyin" label={t('admin_form_pinyin')} value={form.pinyin} onChange={set('pinyin')} placeholder="nǐ hǎo" />
          <Input name="characters" label={t('admin_form_characters')} value={form.characters} onChange={set('characters')} placeholder="你好" />
        </div>
        <div>
          <label htmlFor="grammar" className="label">{t('admin_form_grammar')}</label>
          <textarea id="grammar" rows={3} className="input" value={form.grammar} onChange={set('grammar')} />
        </div>
        <div>
          <label htmlFor="dialogue" className="label">{t('admin_form_dialogue')}</label>
          <textarea id="dialogue" rows={3} className="input" value={form.dialogue} onChange={set('dialogue')} />
        </div>
      </fieldset>

      {/* 词汇行 */}
      <fieldset className="space-y-3 rounded-xl border border-ink/10 p-4">
        <legend className="px-1 text-sm font-bold text-ink-lighter">{t('admin_form_vocabulary')}</legend>
        {vocab.map((v, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
            <input className="input" placeholder={t('admin_v_word')} value={v.word} onChange={(e) => setVocab((prev) => prev.map((x, j) => (j === i ? { ...x, word: e.target.value } : x)))} />
            <input className="input" placeholder={t('admin_v_pinyin')} value={v.pinyin} onChange={(e) => setVocab((prev) => prev.map((x, j) => (j === i ? { ...x, pinyin: e.target.value } : x)))} />
            <input className="input" placeholder={t('admin_v_translation')} value={v.translation} onChange={(e) => setVocab((prev) => prev.map((x, j) => (j === i ? { ...x, translation: e.target.value } : x)))} />
            <input className="input" placeholder={t('admin_v_example')} value={v.example} onChange={(e) => setVocab((prev) => prev.map((x, j) => (j === i ? { ...x, example: e.target.value } : x)))} />
            <Button variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => setVocab((prev) => prev.filter((_, j) => j !== i))} aria-label={t('admin_row_remove')}>✕</Button>
          </div>
        ))}
        <Button variant="secondary" onClick={() => setVocab((prev) => [...prev, emptyWord()])}>
          + {t('admin_row_add')}
        </Button>
      </fieldset>

      {/* 题目行 */}
      <fieldset className="space-y-4 rounded-xl border border-ink/10 p-4">
        <legend className="px-1 text-sm font-bold text-ink-lighter">{t('admin_form_questions')}</legend>
        {questions.map((q, i) => (
          <div key={i} className="space-y-2 rounded-lg bg-cream-100/60 p-3">
            <div className="grid gap-2 sm:grid-cols-[auto_1fr_auto]">
              <select
                className="input"
                value={q.type}
                onChange={(e) => setQuestions((prev) => prev.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)))}
              >
                {QUESTION_TYPES.map((tp) => (
                  <option key={tp} value={tp}>{t(`ex_${tp}`)}</option>
                ))}
              </select>
              <input
                className="input"
                placeholder={t('admin_q_prompt')}
                value={q.prompt}
                onChange={(e) => setQuestions((prev) => prev.map((x, j) => (j === i ? { ...x, prompt: e.target.value } : x)))}
              />
              <Button variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => setQuestions((prev) => prev.filter((_, j) => j !== i))} aria-label={t('admin_row_remove')}>✕</Button>
            </div>
            {q.type !== 'fill_blank' && (
              <input
                className="input"
                placeholder={t('admin_q_options')}
                value={q.options}
                onChange={(e) => setQuestions((prev) => prev.map((x, j) => (j === i ? { ...x, options: e.target.value } : x)))}
              />
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="input"
                placeholder={t('admin_q_correct')}
                value={q.correctAnswer}
                onChange={(e) => setQuestions((prev) => prev.map((x, j) => (j === i ? { ...x, correctAnswer: e.target.value } : x)))}
              />
              <input
                className="input"
                placeholder={t('admin_q_explanation')}
                value={q.explanation}
                onChange={(e) => setQuestions((prev) => prev.map((x, j) => (j === i ? { ...x, explanation: e.target.value } : x)))}
              />
            </div>
          </div>
        ))}
        <Button variant="secondary" onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}>
          + {t('admin_row_add')}
        </Button>
      </fieldset>

      {/* 操作 */}
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onCancel}>
          {t('common_cancel')}
        </Button>
        <Button type="submit" loading={isPending}>
          {t('common_save')}
        </Button>
      </div>
    </form>
  );
}
