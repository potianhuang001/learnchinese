/**
 * 学习进度 hooks
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { progressApi } from '../services/api';

/** 用户进度列表 + 汇总统计 */
export function useProgress(userId) {
  return useQuery({
    queryKey: ['progress', userId],
    queryFn: () => progressApi.getByUser(userId),
    enabled: Boolean(userId),
  });
}

/** 更新进度（练习/测验完成后调用），成功后自动刷新进度缓存 */
export function useUpdateProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: progressApi.update,
    onSuccess: (_data, variables) => {
      // 刷新当前用户进度缓存
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['lesson', variables.lessonId] });
    },
  });
}
