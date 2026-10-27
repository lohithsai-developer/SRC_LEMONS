import React, { useState, useEffect } from 'react';
import { X, DollarSign, Wallet } from 'lucide-react';
import { Bill, Customer, Payment } from '../types';
import { recordBillPayment, recordPayment } from '../api';
import { Language, t } from '../i18n';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payment: Payment) => void;
  bill?: Bill | null;
  customer?: Customer | null;
  lang: Language;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  bill,
  customer,
  lang,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [notes, setNotes] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (bill) {
      setAmount(bill.balanceAmount > 0 ? String(bill.balanceAmount) : '');
      setNotes(`Payment for Bill #${bill.billNumber}`);
    } else if (customer && customer.outstandingBalance) {
      setAmount(String(customer.outstandingBalance));
      setNotes('');
    } else {
      setAmount('');
      setNotes('');
    }
    setPaymentMethod('CASH');
    setReference('');
    setError(null);
  }, [bill, customer, isOpen]);

  if (!isOpen) return null;

  const targetName = bill ? bill.customer.name : customer ? customer.name : '';
  const currentDue = bill ? bill.balanceAmount : customer?.outstandingBalance || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive payment amount.');
      return;
    }

    setLoading(true);
    try {
      if (bill) {
        const res = await recordBillPayment(bill.id, {
          amount: numAmount,
          paymentMethod,
          reference: reference || undefined,
          notes: notes || undefined,
        });
        onSuccess(res.payment);
      } else if (customer) {
        const res = await recordPayment({
          customerId: customer.id,
          amount: numAmount,
          paymentMethod,
          reference: reference || undefined,
          notes: notes || undefined,
          autoAllocate: true,
        });
        onSuccess(res.payment);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-fresh-100 text-fresh-700">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-charcoal-900 leading-tight">
                Record Payment
              </h3>
              <p className="text-xs text-slate-500 font-medium">{targetName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-charcoal-900 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Due amount info badge */}
        <div className="p-4 bg-lemon-50/70 border-b border-lemon-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">
            {bill ? 'Bill Balance Due:' : 'Total Outstanding Balance:'}
          </span>
          <span className="text-base font-mono font-black text-charcoal-900">
            ₹{currentDue.toFixed(2)}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-1">
              Payment Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-fresh-500 focus:border-fresh-500 text-base font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-1">
              Reference / Note (Optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. UPI Ref / Cheque No"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-fresh-500 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-1">
              {t('notes', lang)}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Paid in cash at shop"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-fresh-500 text-sm font-medium"
            />
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-fresh-600 text-white text-sm font-bold hover:bg-fresh-700 transition shadow-xs disabled:opacity-50"
            >
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
