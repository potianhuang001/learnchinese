/**
 * 词汇本 hooks
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { vocabularyApi } from '../services/api';

/** 用户收藏的词汇列表 */
export function useVocabulary(userId) {
  return useQuery({
    queryKey: ['vocabulary', userId],
    queryFn: () => vocabularyApi.getByUser(userId),
    enabled: Boolean(userId),
  });
}

/** 收藏词汇 */
export function useAddVocabulary(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vocabularyApi.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary', userId] });
    },
  });
}

/** 移除收藏 */
export function useRemoveVocabulary(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vocabularyApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary', userId] });
    },
  });
}
