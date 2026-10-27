import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertTriangle } from 'lucide-react';
import { Customer } from '../types';
import { checkDuplicateMobile, createCustomer, updateCustomer } from '../api';
import { Language, t } from '../i18n';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: Customer) => void;
  editCustomer?: Customer | null;
  lang: Language;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editCustomer,
  lang,
}) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [village, setVillage] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  useEffect(() => {
    if (editCustomer) {
      setName(editCustomer.name);
      setMobile(editCustomer.mobile);
      setVillage(editCustomer.village || '');
      setNotes(editCustomer.notes || '');
    } else {
      setName('');
      setMobile('');
      setVillage('');
      setNotes('');
    }
    setError(null);
    setDuplicateWarning(null);
  }, [editCustomer, isOpen]);

  if (!isOpen) return null;

  const handleMobileBlur = async () => {
    if (mobile.length === 10 && /^[0-9]+$/.test(mobile)) {
      try {
        const res = await checkDuplicateMobile(mobile, editCustomer?.id);
        if (res.exists) {
          setDuplicateWarning(
            `Warning: A customer with mobile ${mobile} already exists (${res.customer.name}). You can still proceed if they are related.`
          );
        } else {
          setDuplicateWarning(null);
        }
      } catch (e) {
        // ignore check error
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter customer name.');
      return;
    }

    if (!/^[0-9]{10}$/.test(mobile.trim())) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      if (editCustomer) {
        const res = await updateCustomer(editCustomer.id, {
          name: name.trim(),
          mobile: mobile.trim(),
          village: village.trim() || undefined,
          notes: notes.trim() || undefined,
        });
        onSuccess(res.customer);
      } else {
        const res = await createCustomer(
          {
            name: name.trim(),
            mobile: mobile.trim(),
            village: village.trim() || undefined,
            notes: notes.trim() || undefined,
          },
          true // allow duplicate if confirmed
        );
        onSuccess(res.customer);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save customer');
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
            <div className="p-2 rounded-xl bg-lemon-200 text-charcoal-900">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-charcoal-900">
              {editCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-charcoal-900 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {error}
            </div>
          )}

          {duplicateWarning && (
            <div className="flex items-start space-x-2 p-3 rounded-xl bg-lemon-50 border border-lemon-300 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-1">
              Customer Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rama Rao / Venkat Reddy"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-lemon-400 focus:border-lemon-400 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-1">
              Mobile Number (10 Digits) *
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              onBlur={handleMobileBlur}
              placeholder="e.g. 9848012345"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-lemon-400 focus:border-lemon-400 text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-1">
              Village / Address (Optional)
            </label>
            <input
              type="text"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="e.g. Gudur / Podalakur / Tenali"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-lemon-400 focus:border-lemon-400 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-800 mb-1">
              Notes / Remarks (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Balaji variety supplier"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-lemon-400 focus:border-lemon-400 text-sm font-medium"
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
              className="px-6 py-2.5 rounded-xl bg-lemon-400 text-charcoal-900 text-sm font-bold hover:bg-lemon-500 transition shadow-xs border border-lemon-500/30 disabled:opacity-50"
            >
              {loading ? 'Saving...' : editCustomer ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
