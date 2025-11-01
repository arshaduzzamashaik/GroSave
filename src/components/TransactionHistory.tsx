// src/components/TransactionHistory.tsx
import { useEffect, useMemo, useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { api } from '../lib/api';

type TxnType = 'credit' | 'debit' | 'refund' | string;

type UITransaction = {
  id: string;
  type: TxnType;
  description: string;
  amount: number;
  dateLabel: string;
  balanceAfter?: number | null;
};

const PAGE_SIZE = 10;

export function TransactionHistory() {
  const [items, setItems] = useState<UITransaction[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isEmpty = useMemo(() => !loading && items.length === 0, [loading, items.length]);

  useEffect(() => {
    // initial load
    void loadPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPage(p: number, replace = false) {
    if (loading) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await api.walletTransactions(p, PAGE_SIZE);
      const formatted: UITransaction[] = res.transactions.map((t) => {
        const d = new Date(t.createdAt);
        const dateLabel = isNaN(d.getTime())
          ? t.createdAt
          : d.toLocaleString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            });

        return {
          id: t.id,
          type: t.type,
          description: t.description ?? (t.type === 'credit' ? 'Wallet Credit' : 'Wallet Debit'),
          amount: t.amount,
          dateLabel,
          balanceAfter: t.balanceAfter ?? null,
        };
      });

      setItems((prev) => (replace ? formatted : [...prev, ...formatted]));
      setHasMore(res.pagination?.hasMore ?? formatted.length === PAGE_SIZE);
      setPage(p);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }

  const onLoadMore = () => {
    if (hasMore && !loading) void loadPage(page + 1);
  };

  return (
    <div>
      <h2 className="text-gray-900 mb-4">Recent Transactions</h2>

      {/* Error */}
      {err && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {/* Empty */}
      {isEmpty && (
        <div className="rounded-xl bg-white p-6 text-center text-gray-500 shadow-sm">
          No transactions yet.
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {items.map((tx) => (
          <div key={tx.id} className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  tx.type === 'credit' ? 'bg-green-100' : 'bg-purple-100'
                }`}
              >
                {tx.type === 'credit' ? (
                  <Plus className="w-5 h-5 text-[#5CB85C]" />
                ) : (
                  <Minus className="w-5 h-5 text-[#3D3B6B]" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <p className="truncate text-gray-900">{tx.description}</p>
                  <span
                    className={`flex-shrink-0 ${
                      tx.type === 'credit' ? 'text-[#5CB85C]' : 'text-[#3D3B6B]'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}
                    {tx.amount} coins
                  </span>
                </div>

                <p className="mb-1 text-sm text-gray-500">{tx.dateLabel}</p>
                {typeof tx.balanceAfter === 'number' && (
                  <p className="text-xs text-gray-400">Balance: {tx.balanceAfter} coins</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Loading skeleton */}
        {loading && (
          <div className="animate-pulse space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-gray-200" />
                    <div className="h-3 w-1/3 rounded bg-gray-200" />
                    <div className="h-3 w-1/4 rounded bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load more / view all */}
      <button
        onClick={onLoadMore}
        disabled={!hasMore || loading}
        className="w-full mt-4 text-[#3D3B6B] py-2 hover:underline disabled:opacity-50"
      >
        {hasMore ? (loading ? 'Loading…' : 'View more') : 'No more transactions'}
      </button>
    </div>
  );
}
