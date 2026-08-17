/**
 * VocabularyPage — 词汇本
 * 展示已收藏的词汇（含音频播放与例句），可移除
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useVocabulary, useRemoveVocabulary } from '../hooks/useVocabulary';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import AudioButton from '../components/AudioButton';
import Button from '../components/Button';

export default function VocabularyPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, isLoading, isError } = useVocabulary(user?._id);
  const { mutate: removeWord } = useRemoveVocabulary(user?._id);

  const words = data?.vocabulary || [];

  const handleRemove = (word) => {
    removeWord(word._id);
    toast.info(t('vocab_removed'));
  };

  if (isLoading) return <Spinner />;

  if (isError) {
    return (
      <div className="container-page py-12">
        <Alert type="error" className="mx-auto max-w-md">
          {t('common_error')}
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">{t('vocab_title')}</h1>
        <p className="mt-2 text-ink-light">{t('vocab_subtitle')}</p>
      </div>

      {words.length === 0 ? (
        <EmptyState
          icon="📖"
          title={t('vocab_empty')}
          description={t('vocab_empty_desc')}
          action={
            <Link to="/lessons" className="btn-primary">
              {t('vocab_go_lessons')} →
            </Link>
          }
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-lighter">
            {t('vocab_count', { n: words.length })}
          </p>
          <ul className="card divide-y divide-ink/5 overflow-hidden">
            {words.map((word) => (
              <li key={word._id} className="flex items-center gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-xl font-bold">{word.word}</span>
                    <span className="text-sm font-medium text-primary-600">{word.pinyin}</span>
                    <span className="text-sm text-ink-light">{word.translation}</span>
                  </div>
                  {word.example && (
                    <p className="mt-1 text-sm text-ink-lighter">{word.example}</p>
                  )}
                  {word.lessonId && (
                    <p className="mt-1.5 text-xs text-ink-lighter">
                      {t('vocab_from_lesson', { title: word.lessonId.title || '—' })}
                    </p>
                  )}
                </div>
                <AudioButton
                  text={word.word}
                  audioUrl={word.audioUrl}
                  label={word.word}
                  className="shrink-0"
                />
                <Button
                  variant="ghost"
                  className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => handleRemove(word)}
                >
                  {t('vocab_remove')}
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
