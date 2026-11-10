import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getAuthenticatedUser } from '../lib/authHelper';
import { localGet, localInsert, localDelete } from '../lib/localDb';
import type { Transaction, TransactionCategory, Budget } from '../types';

export const useCategories = () => {
  return useQuery({
    queryKey: ['financeCategories'],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      try {
        const { data, error } = await supabase
          .from('transaction_categories')
          .select('*')
          .or(`user_id.eq.${user.id},is_default.eq.true`)
          .order('name');
        if (!error && Array.isArray(data) && data.length > 0) return data as TransactionCategory[];
      } catch (err) {
        // Fall back
      }
      return [
        { id: 'cat-1', name: 'Allowance & Stipend', color: '#10b981', is_default: true, type: 'income' },
        { id: 'cat-2', name: 'Books & Stationery', color: '#3b82f6', is_default: true, type: 'expense' },
        { id: 'cat-3', name: 'Mess, Meals & Food', color: '#f59e0b', is_default: true, type: 'expense' },
        { id: 'cat-4', name: 'Courses & Test Series', color: '#8b5cf6', is_default: true, type: 'expense' },
        { id: 'cat-5', name: 'Rent & Accommodation', color: '#ec4899', is_default: true, type: 'expense' },
        { id: 'cat-6', name: 'Personal & General', color: '#6b7280', is_default: true, type: 'expense' },
      ] as TransactionCategory[];
    },
  });
};

export const useTransactions = (params?: { type?: string; category?: string; date?: string }) => {
  return useQuery({
    queryKey: ['transactions', params],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      let cloudTx: Transaction[] = [];
      try {
        let query = supabase
          .from('transactions')
          .select('*, transaction_categories(name, color, icon)')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (params?.type) query = query.eq('type', params.type);
        if (params?.category) query = query.eq('category_id', params.category);
        if (params?.date) query = query.eq('date', params.date);

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          cloudTx = data.map((t: any) => ({
            ...t,
            category_name: t.transaction_categories?.name || t.category_name,
          })) as Transaction[];
        }
      } catch (err) {
        // Fall back
      }

      let localTx = localGet<Transaction>('transactions');
      if (params?.type) localTx = localTx.filter((t) => t.type === params.type);
      if (params?.category) localTx = localTx.filter((t) => t.category === params.category || (t as any).category_id === params.category);
      if (params?.date) localTx = localTx.filter((t) => t.date === params.date);

      const txMap = new Map<string, Transaction>();
      for (const t of localTx) {
        if (t && t.id) txMap.set(t.id, t);
      }
      for (const t of cloudTx) {
        if (t && t.id) txMap.set(t.id, t);
      }

      return Array.from(txMap.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    },
  });
};

export const useFinanceSummary = () => {
  return useQuery({
    queryKey: ['financeSummary'],
    queryFn: async () => {
      const txs = localGet<Transaction>('transactions');
      let total_income = 0;
      let total_expense = 0;

      for (const t of txs) {
        const amt = Number(t.amount) || 0;
        if (t.type === 'income') total_income += amt;
        else total_expense += amt;
      }

      return {
        total_income,
        total_expense,
        net_savings: total_income - total_expense,
        savings_rate: total_income > 0 ? Math.round(((total_income - total_expense) / total_income) * 100) : 0,
      };
    },
  });
};

// Check if string is a valid UUID
function isValidUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export const useCreateTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Transaction> & { category_name?: string }) => {
      const user = await getAuthenticatedUser();
      const catId = (data as any).category || (data as any).category_id;

      const payload: Record<string, any> = {
        title: data.title,
        amount: Number(data.amount),
        type: data.type || 'expense',
        date: data.date || new Date().toISOString().split('T')[0],
        notes: data.notes || '',
        user_id: user.id,
      };

      if (catId && isValidUUID(catId)) {
        payload.category_id = catId;
      }

      // Save locally first to guarantee immediate rendering
      const localRecord = localInsert<Transaction>('transactions', {
        ...data,
        ...payload,
        category: catId,
        category_name: data.category_name,
      } as any);

      try {
        const { data: result, error } = await supabase
          .from('transactions')
          .insert(payload)
          .select()
          .single();
        if (!error && result) {
          localDelete('transactions', localRecord.id);
          localInsert<Transaction>('transactions', {
            ...result,
            category_name: data.category_name,
          } as any);
          return result as Transaction;
        }
      } catch (err) {
        // Handled via localRecord
      }
      return localRecord;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['financeSummary'] });
      qc.invalidateQueries({ queryKey: ['financeAnalytics'] });
      qc.invalidateQueries({ queryKey: ['analyticsOverview'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      localDelete('transactions', id);
      try {
        await supabase.from('transactions').delete().eq('id', id);
      } catch (err) {
        // ignore
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
      qc.invalidateQueries({ queryKey: ['financeSummary'] });
      qc.invalidateQueries({ queryKey: ['financeAnalytics'] });
      qc.invalidateQueries({ queryKey: ['analyticsOverview'] });
    },
  });
};

export const useBudgets = () => {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const user = await getAuthenticatedUser();
      try {
        const { data, error } = await supabase
          .from('budgets')
          .select('*, transaction_categories(name, color)')
          .eq('user_id', user.id);
        if (!error && Array.isArray(data) && data.length > 0) return data as Budget[];
      } catch (err) {
        // Fall back
      }
      return localGet<Budget>('budgets');
    },
  });
};

export const useCreateBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Budget>) => {
      const user = await getAuthenticatedUser();
      const localBudget = localInsert<Budget>('budgets', { ...data, user_id: user.id } as any);
      try {
        const { data: result, error } = await supabase
          .from('budgets')
          .insert({ ...data, user_id: user.id })
          .select()
          .single();
        if (!error && result) return result as Budget;
      } catch (err) {
        // ignore
      }
      return localBudget;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
};

export const useUpdateBudget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Budget> & { id: string }) => {
      try {
        const { data: result, error } = await supabase
          .from('budgets')
          .update(data)
          .eq('id', id)
          .select()
          .single();
        if (!error && result) return result as Budget;
      } catch (err) {
        // Fall through
      }
      return data as Budget;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
};
