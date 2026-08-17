/**
 * 课程数据 hooks
 */
import { useQuery } from '@tanstack/react-query';
import { lessonsApi } from '../services/api';

/** 课程列表（支持 level / page / limit 过滤分页） */
export function useLessons(params = {}) {
  return useQuery({
    queryKey: ['lessons', params],
    queryFn: () => lessonsApi.list(params),
    placeholderData: (prev) => prev, // 翻页时保留上一页数据
  });
}

/** 课程详情 + vocabItems */
export function useLesson(id) {
  return useQuery({
    queryKey: ['lesson', id],
    queryFn: () => lessonsApi.detail(id),
    enabled: Boolean(id),
  });
}
