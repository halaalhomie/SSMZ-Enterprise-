import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Product, PaginatedResponse, DashboardStats, StockTransaction,
  StockAudit, Supplier, Category, Note, ActivityLog, Notification,
  StockMovementPoint, CategoryDistributionItem,
} from '@/types';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const QK = {
  products: (params?: object) => ['products', params],
  product: (id: string) => ['products', id],
  categories: () => ['categories'],
  suppliers: (params?: object) => ['suppliers', params],
  ledger: (params?: object) => ['ledger', params],
  audits: (params?: object) => ['audits', params],
  dashboardStats: () => ['dashboard', 'stats'],
  stockMovement: (days: number) => ['dashboard', 'stock-movement', days],
  categoryDist: () => ['dashboard', 'categories'],
  movers: (days: number) => ['dashboard', 'movers', days],
  notes: () => ['notes'],
  activityLogs: (params?: object) => ['activity-logs', params],
  notifications: (unread?: boolean) => ['notifications', unread],
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const useDashboardStats = () =>
  useQuery<DashboardStats>({
    queryKey: QK.dashboardStats(),
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
    refetchInterval: 60000,
  });

export const useStockMovement = (days = 30) =>
  useQuery<StockMovementPoint[]>({
    queryKey: QK.stockMovement(days),
    queryFn: () => api.get(`/dashboard/stock-movement?days=${days}`).then((r) => r.data),
  });

export const useCategoryDistribution = () =>
  useQuery<CategoryDistributionItem[]>({
    queryKey: QK.categoryDist(),
    queryFn: () => api.get('/dashboard/categories').then((r) => r.data),
  });

export const useMovers = (days = 30) =>
  useQuery({
    queryKey: QK.movers(days),
    queryFn: () => api.get(`/dashboard/movers?days=${days}`).then((r) => r.data),
  });

// ─── Products ─────────────────────────────────────────────────────────────────

export const useProducts = (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  category_id?: string;
  low_stock?: boolean;
}) =>
  useQuery<PaginatedResponse<Product>>({
    queryKey: QK.products(params),
    queryFn: () => api.get('/products', { params }).then((r) => r.data),
  });

export const useProduct = (id: string) =>
  useQuery<Product>({
    queryKey: QK.product(id),
    queryFn: () => api.get(`/products/${id}`).then((r) => r.data),
    enabled: !!id,
  });

export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => api.post('/products', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useUpdateProduct = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => api.patch(`/products/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: QK.product(id) });
    },
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
};

export const useProductHistory = (id: string, page = 1) =>
  useQuery({
    queryKey: ['product-history', id, page],
    queryFn: () => api.get(`/products/${id}/history?page=${page}`).then((r) => r.data),
    enabled: !!id,
  });

// ─── Categories ───────────────────────────────────────────────────────────────

export const useCategories = () =>
  useQuery<Category[]>({
    queryKey: QK.categories(),
    queryFn: () => api.get('/categories').then((r) => r.data),
  });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => api.post('/categories', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.categories() }),
  });
};

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const useSuppliers = (params?: { page?: number; search?: string }) =>
  useQuery({
    queryKey: QK.suppliers(params),
    queryFn: () => api.get('/suppliers', { params }).then((r) => r.data),
  });

export const useCreateSupplier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => api.post('/suppliers', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
};

export const useUpdateSupplier = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => api.patch(`/suppliers/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
};

export const useDeleteSupplier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/suppliers/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['suppliers'] }),
  });
};

// ─── Stock ────────────────────────────────────────────────────────────────────

export const useLedger = (params?: {
  page?: number;
  transaction_type?: string;
  product_id?: string;
}) =>
  useQuery<PaginatedResponse<StockTransaction>>({
    queryKey: QK.ledger(params),
    queryFn: () => api.get('/stock/ledger', { params }).then((r) => r.data),
  });

export const useStockIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => api.post('/stock/in', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

export const useStockOut = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => api.post('/stock/out', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['ledger'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// ─── Audits ───────────────────────────────────────────────────────────────────

export const useAudits = (params?: { page?: number; product_id?: string }) =>
  useQuery({
    queryKey: QK.audits(params),
    queryFn: () => api.get('/audits', { params }).then((r) => r.data),
  });

export const useCreateAudit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => api.post('/audits', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['audits'] }),
  });
};

export const useDiscrepancyReport = () =>
  useQuery({
    queryKey: ['audit-discrepancies'],
    queryFn: () => api.get('/audits/discrepancies').then((r) => r.data),
  });

// ─── Notes ───────────────────────────────────────────────────────────────────

export const useNotes = () =>
  useQuery<Note[]>({
    queryKey: QK.notes(),
    queryFn: () => api.get('/notes').then((r) => r.data),
  });

export const useCreateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => api.post('/notes', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.notes() }),
  });
};

export const useDeleteNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/notes/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.notes() }),
  });
};

// ─── Activity & Notifications ─────────────────────────────────────────────────

export const useActivityLogs = (params?: { page?: number }) =>
  useQuery({
    queryKey: QK.activityLogs(params),
    queryFn: () => api.get('/activity-logs', { params }).then((r) => r.data),
  });

export const useNotifications = (unreadOnly = false) =>
  useQuery<Notification[]>({
    queryKey: QK.notifications(unreadOnly),
    queryFn: () => api.get(`/notifications?unread_only=${unreadOnly}`).then((r) => r.data),
    refetchInterval: 30000,
  });

export const useMarkNotificationsRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/notifications/mark-read').then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const useUsers = (params?: { page?: number; search?: string }) =>
  useQuery({
    queryKey: ['users', params],
    queryFn: () => api.get('/users', { params }).then((r) => r.data),
  });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => api.post('/users', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};

export const useUpdateUser = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: object) => api.patch(`/users/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
};
