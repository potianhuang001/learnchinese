/**
 * 练习题数据 hooks
 */
import { useQuery } from '@tanstack/react-query';
import { questionsApi } from '../services/api';

/** 某课程的练习题列表 */
const useQuestions = (lessonId) =>
  useQuery({
    queryKey: ['questions', lessonId],
    queryFn: () => questionsApi.listByLesson(lessonId),
    enabled: Boolean(lessonId),
  });

export default useQuestions;
