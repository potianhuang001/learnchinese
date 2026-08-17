/**
 * AdminLessons — 课程管理（列表 + 新建/编辑模态框 + 删除确认）
 * 编辑时拉取完整课程与题目，回填表单
 */
import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useLessons } from '../../hooks/useLessons';
import { useLesson } from '../../hooks/useLessons';
import useQuestions from '../../hooks/useQuestions';
import { useDeleteLesson } from '../../hooks/useAdmin';
import { getApiError } from '../../utils/helpers';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import LevelBadge from '../../components/LevelBadge';
import AdminNav from '../../components/admin/AdminNav';
import LessonForm from '../../components/admin/LessonForm';

export default function AdminLessons() {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [modal, setModal] = useState(null); // { mode: 'create' } | { mode: 'edit', id }
  const [deleting, setDeleting] = useState(null); // lesson 对象

  const { data, isLoading, isError } = useLessons({ page: 1, limit: 50 });
  const { data: editData } = useLesson(modal?.mode === 'edit' ? modal.id : undefined);
  const { data: editQuestions } = useQuestions(modal?.mode === 'edit' ? modal.id : undefined);
  const { mutateAsync: deleteLesson, isPending: deletingNow } = useDeleteLesson();

  const lessons = data?.lessons || [];

  const closeModal = () => setModal(null);

  const handleDelete = async () => {
    try {
      await deleteLesson(deleting._id);
      toast.success(t('admin_deleted'));
      setDeleting(null);
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  return (
    <div className="container-page py-12">
      <h1 className="mb-2 text-3xl font-bold">{t('admin_lessons_title')}</h1>
      <p className="mb-8 text-ink-light">{t('admin_lessons_subtitle')}</p>

      <AdminNav />

      <div className="mb-6 flex justify-end">
        <Button onClick={() => setModal({ mode: 'create' })}>+ {t('admin_new_lesson')}</Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <Alert type="error" className="mx-auto max-w-md">
          {t('common_error')}
        </Alert>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-lighter">
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">{t('admin_form_title')}</th>
                <th className="px-5 py-3">{t('admin_form_level')}</th>
                <th className="px-5 py-3 text-right">{t('common_edit')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {lessons.map((lesson) => (
                <tr key={lesson._id} className="hover:bg-cream-100/50">
                  <td className="px-5 py-3 font-semibold text-ink-lighter">{lesson.order}</td>
                  <td className="px-5 py-3">
                    <p className="font-semibold">
                      {lesson.level !== 'beginner' && (
                        <span className="mr-1.5 text-sm" title={t('admin_level_premium_hint')}>
                          👑
                        </span>
                      )}
                      {lesson.title}
                    </p>
                    <p className="max-w-md truncate text-xs text-ink-lighter">{lesson.description}</p>
                  </td>
                  <td className="px-5 py-3">
                    <LevelBadge level={lesson.level} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setModal({ mode: 'edit', id: lesson._id })}>
                        {t('common_edit')}
                      </Button>
                      <Button variant="danger" onClick={() => setDeleting(lesson)}>
                        {t('common_delete')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 新建/编辑模态框 */}
      <Modal
        open={Boolean(modal)}
        title={modal?.mode === 'edit' ? t('admin_edit_lesson') : t('admin_new_lesson')}
        onClose={closeModal}
      >
        {modal?.mode === 'edit' && (!editData?.lesson || !editQuestions) ? (
          <Spinner />
        ) : (
          <LessonForm
            key={modal?.mode === 'edit' ? modal.id : 'create'}
            initial={modal?.mode === 'edit' ? editData?.lesson : null}
            initialQuestions={modal?.mode === 'edit' ? editQuestions?.questions || [] : []}
            onDone={closeModal}
            onCancel={closeModal}
          />
        )}
      </Modal>

      {/* 删除确认 */}
      <Modal
        open={Boolean(deleting)}
        title={t('common_delete')}
        onClose={() => setDeleting(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              {t('common_cancel')}
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deletingNow}>
              {t('common_delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-ink">
          <span className="font-bold">{deleting?.title}</span>
        </p>
        <p className="mt-2 text-sm text-ink-light">{t('admin_delete_confirm')}</p>
      </Modal>
    </div>
  );
}
