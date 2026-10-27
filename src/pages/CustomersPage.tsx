import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  MapPin,
  FileText,
  BookOpen,
  DollarSign,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Plus,
} from 'lucide-react';
import { Customer } from '../types';
import { getCustomers, deleteCustomer } from '../api';
import { Language, t } from '../i18n';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface CustomersPageProps {
  onOpenAddModal: (customerToEdit?: Customer) => void;
  onOpenRecordPayment?: (customer: Customer) => void;
  onSelectForNewBill?: (customer: Customer) => void;
  lang: Language;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({
  onOpenAddModal,
  onOpenRecordPayment,
  onSelectForNewBill,
  lang,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // Deletion modal state
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await getCustomers(search || undefined, activeOnly);
      setCustomers(res.customers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, activeOnly]);

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    try {
      const res = await deleteCustomer(customerToDelete.id);
      alert(res.message);
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to remove customer');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight flex items-center space-x-2">
            <span>👥</span>
            <span>{t('customers', lang)}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Lemon Farmers & Buyer Accounts Directory
          </p>
        </div>

        <button
          onClick={() => onOpenAddModal()}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-lemon-400 hover:bg-lemon-500 text-charcoal-900 font-extrabold text-xs sm:text-sm shadow-xs transition border border-lemon-500/30 self-start sm:self-auto transform active:scale-95"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('addCustomer', lang)}</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, village..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-lemon-400 bg-slate-50"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveOnly(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-1 sm:flex-none ${
              !activeOnly ? 'bg-charcoal-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            All Accounts
          </button>
          <button
            onClick={() => setActiveOnly(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-1 sm:flex-none ${
              activeOnly ? 'bg-charcoal-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            Active Only
          </button>
        </div>
      </div>

      {/* Customer Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-medium text-sm">Loading customers...</div>
      ) : customers.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <span className="text-4xl block mb-2">👤</span>
          <h3 className="text-base font-bold text-charcoal-900">No customers found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or add a new customer.</p>
          <button
            onClick={() => onOpenAddModal()}
            className="mt-4 inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-lemon-400 hover:bg-lemon-500 text-charcoal-900 font-extrabold text-xs shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('addCustomer', lang)}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((c) => (
            <div
              key={c.id}
              className={`bg-white rounded-3xl border p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between ${
                c.isActive ? 'border-slate-200' : 'border-slate-200 bg-slate-50/70 opacity-80'
              }`}
            >
              <div>
                {/* Top Actions & Status */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onOpenAddModal(c)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-charcoal-900 hover:bg-slate-100 transition flex items-center space-x-1 text-xs font-bold"
                      title="Edit Customer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setCustomerToDelete(c);
                        setIsDeleteModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition flex items-center space-x-1 text-xs font-bold"
                      title="Remove Customer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                  <div>
                    {c.isActive ? (
                      <span className="text-[10px] font-bold text-fresh-700 bg-fresh-50 px-2 py-0.5 rounded-full border border-fresh-200 flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-fresh-600 inline" />
                        <span>Active</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                        <XCircle className="w-3 h-3 text-slate-400 inline" />
                        <span>Deactivated</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Name & Contact */}
                <div className="mt-3">
                  <h4 className="text-base font-extrabold text-charcoal-900">{c.name}</h4>
                  <div className="space-y-1 mt-1 text-xs text-slate-600">
                    <p className="flex items-center space-x-1.5 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{c.mobile}</span>
                    </p>
                    {c.village && (
                      <p className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.village}</span>
                      </p>
                    )}
                    {c.notes && (
                      <p className="text-[11px] text-slate-400 italic">"{c.notes}"</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Stats Pill */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Purchases:</span>
                  <span className="font-mono font-bold text-charcoal-900">
                    ₹{(c.totalPurchases || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Weight:</span>
                  <span className="font-mono font-bold text-fresh-700">
                    {(c.totalLemonWeight || 0).toFixed(3)} kg
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                  <span>{t('currentBalance', lang)}:</span>
                  <span
                    className={`font-mono font-black ${
                      (c.outstandingBalance || 0) > 0 ? 'text-rose-600' : 'text-slate-600'
                    }`}
                  >
                    ₹{(c.outstandingBalance || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400 font-mono">
                  {c.totalBillsCount || 0} {(c.totalBillsCount || 0) === 1 ? 'bill' : 'bills'}
                </span>

                {onSelectForNewBill && (
                  <button
                    onClick={() => onSelectForNewBill(c)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-lemon-400 hover:bg-lemon-500 text-charcoal-950 font-bold text-xs transition"
                  >
                    <span>Weigh Bags</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal for Delete/Deactivation */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title={customerToDelete ? `Remove ${customerToDelete.name}?` : 'Remove Customer?'}
        message={
          customerToDelete && (customerToDelete.totalBillsCount || 0) > 0
            ? `Customer "${customerToDelete.name}" has ${customerToDelete.totalBillsCount} existing bills. To preserve complete financial ledger and audit history, this account will be DEACTIVATED safely rather than permanently erased. All historical bills and payments will remain 100% intact.`
            : `Are you sure you want to permanently delete this customer? This action cannot be undone.`
        }
        confirmText={
          customerToDelete && (customerToDelete.totalBillsCount || 0) > 0
            ? 'Deactivate Safely'
            : 'Delete Customer'
        }
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setCustomerToDelete(null);
        }}
      />
    </div>
  );
};
