/**
 * 支付 / 会员数据 hooks
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import { paymentsApi } from '../services/api';

/** 会员套餐列表 */
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => paymentsApi.plans(),
    staleTime: 5 * 60 * 1000,
  });
}

/** 创建订单（选套餐 → 获取支付参数） */
export function useCreateOrder() {
  return useMutation({
    mutationFn: ({ planId, provider }) => paymentsApi.createOrder(planId, provider),
  });
}

/** 查询订单状态 */
export function useOrder(id) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => paymentsApi.getOrder(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      // 订单未支付时每 5 秒轮询一次
      const order = query.state.data;
      return order?.status === 'pending' ? 5000 : false;
    },
  });
}

/** 开发模式模拟支付 */
export function useDevPay() {
  return useMutation({
    mutationFn: (orderId) => paymentsApi.devPay(orderId),
  });
}

/** 取消订单 */
export function useCancelOrder() {
  return useMutation({
    mutationFn: (orderId) => paymentsApi.cancelOrder(orderId),
  });
}

/** 用户提交二维码支付凭证 */
export function useConfirmQr() {
  return useMutation({
    mutationFn: ({ orderId, payerName, note }) => paymentsApi.confirmQr(orderId, payerName, note),
  });
}

/** PayPal 支付成功后捕获订单 */
export function useCapturePayPal() {
  return useMutation({
    mutationFn: ({ orderId, paypalOrderId }) => paymentsApi.capturePayPal(orderId, paypalOrderId),
  });
}
