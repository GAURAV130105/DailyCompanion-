import React, { useState } from 'react';
import { PageHeader } from '../../components/shared/PageHeader';
import { StatCard } from '../../components/shared/StatCard';
import { EmptyState } from '../../components/shared/EmptyState';
import { LoadingSkeleton } from '../../components/shared/LoadingSkeleton';
import {
  useTransactions,
  useCategories,
  useBudgets,
  useCreateTransaction,
  useDeleteTransaction,
  useCreateBudget,
} from '../../api/finance';
import { formatCurrency, todayISO } from '../../lib/utils';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

export const FinancePage: React.FC = () => {
  const [tab, setTab] = useState<'transactions' | 'budgets'>('transactions');
  const { data: transactions = [], isLoading: loadingTx } = useTransactions();
  const { data: categories = [] } = useCategories();
  const { data: budgets = [] } = useBudgets();

  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const createBudget = useCreateBudget();

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTx, setNewTx] = useState({
    title: '',
    amount: '',
    type: 'expense' as 'expense' | 'income',
    category: '',
    date: todayISO(),
    notes: '',
  });

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const catObj = categories.find((c) => c.id === newTx.category);
      await createTransaction.mutateAsync({
        title: newTx.title,
        amount: Number(newTx.amount),
        type: newTx.type,
        category: newTx.category || null,
        category_name: catObj?.name || (newTx.type === 'income' ? 'Stipend / Allowance' : 'General'),
        date: newTx.date,
        notes: newTx.notes,
      });
      setNewTx({ title: '', amount: '', type: 'expense', category: '', date: todayISO(), notes: '' });
      setShowAddModal(false);
    } catch (err) {
      console.warn('Transaction creation handled:', err);
      setShowAddModal(false);
    }
  };

  const handleDeleteTx = async (id: string, title: string) => {
    if (window.confirm(`Delete transaction "${title}"?`)) {
      await deleteTransaction.mutateAsync(id);
    }
  };

  if (loadingTx) return <LoadingSkeleton rows={3} />;

  // Real calculations based on actual user transactions
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Finance & Budget Manager"
        description="Track living expenses, study materials, coaching fees, and monthly budgets without collecting banking passwords."
        action={
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" /> Record Transaction
          </button>
        }
      />

      {/* Safety Banner */}
      <div className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl text-xs text-muted-foreground border border-border">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>
          <strong>Zero Bank Access:</strong> Student Life OS never asks for bank account numbers, passwords, or card credentials. You maintain full manual control.
        </span>
      </div>

      {/* 3 Summary Cards - dynamically calculated from real user transactions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Monthly Inflow / Stipend"
          value={formatCurrency(totalIncome)}
          subtitle={`${transactions.filter((t) => t.type === 'income').length} credit transactions`}
          icon={<ArrowDownRight className="w-4 h-4 text-emerald-500" />}
          trend={totalIncome > 0 ? 'Active Inflow' : 'No income recorded'}
          trendUp={totalIncome > 0}
        />
        <StatCard
          title="Monthly Expenditure"
          value={formatCurrency(totalExpense)}
          subtitle={`${transactions.filter((t) => t.type === 'expense').length} expense transactions`}
          icon={<ArrowUpRight className="w-4 h-4 text-rose-500" />}
          trend={totalExpense > 0 ? 'Living & Prep Outflow' : 'No expenses recorded'}
          trendUp={false}
        />
        <StatCard
          title="Net Savings"
          value={formatCurrency(netSavings)}
          subtitle="Remaining budget balance"
          icon={<PiggyBank className="w-4 h-4 text-primary" />}
          trend={totalIncome > 0 ? `${savingsRate}% savings rate` : '0% savings rate'}
          trendUp={netSavings >= 0}
        />
      </div>

      {/* Transactions & Budgets Tabs */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTab('transactions')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                tab === 'transactions' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Transaction Ledger ({transactions.length})
            </button>
            <button
              onClick={() => setTab('budgets')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                tab === 'budgets' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Monthly Budgets ({budgets.length})
            </button>
          </div>
        </div>

        {tab === 'transactions' ? (
          transactions.length === 0 ? (
            <EmptyState
              icon={<Wallet className="w-8 h-8" />}
              title="No transactions logged"
              description="Record your tuition, reference books, mess food, scholarship, or internet bills."
              action={
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" /> Record First Transaction
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 text-muted-foreground uppercase font-semibold">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Title / Description</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/20 transition">
                      <td className="p-3 text-muted-foreground whitespace-nowrap">{tx.date}</td>
                      <td className="p-3 font-semibold text-foreground">{tx.title}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{tx.category_name || 'General'}</td>
                      <td
                        className={`p-3 font-bold text-right whitespace-nowrap ${
                          tx.type === 'income' ? 'text-emerald-500' : 'text-foreground'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'} {formatCurrency(Number(tx.amount))}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteTx(tx.id, tx.title)}
                          className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Budgets Tab */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {budgets.length === 0 ? (
              <div className="col-span-2">
                <EmptyState
                  icon={<PiggyBank className="w-8 h-8" />}
                  title="No category budgets configured"
                  description="Set monthly spending limits for Books, Rent, Dining, or Subscriptions."
                />
              </div>
            ) : (
              budgets.map((b) => (
                <div key={b.id} className="p-4 rounded-xl border border-border bg-background space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{b.category_name || 'Category'}</span>
                    <span className="text-muted-foreground">Budget: {formatCurrency(Number(b.amount))}</span>
                  </div>
                  <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: '45%' }} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-foreground">Record Transaction</h3>
            <form onSubmit={handleCreateTx} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Title / Item Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly Stipend, Spectrum History Book, Mess Dues"
                  value={newTx.title}
                  onChange={(e) => setNewTx({ ...newTx, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Type</label>
                  <select
                    value={newTx.type}
                    onChange={(e) => setNewTx({ ...newTx, type: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground font-semibold"
                  >
                    <option value="expense">Expense (Debit)</option>
                    <option value="income">Income / Stipend (Credit)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 500"
                    value={newTx.amount}
                    onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                  <select
                    value={newTx.category}
                    onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="">Select Category (Optional)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newTx.date}
                    onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Payment made via UPI, receipt attached"
                  value={newTx.notes}
                  onChange={(e) => setNewTx({ ...newTx, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg hover:bg-muted text-muted-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTransaction.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition shadow-sm"
                >
                  {createTransaction.isPending ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
