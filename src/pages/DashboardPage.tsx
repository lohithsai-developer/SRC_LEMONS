import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Scale,
  ShoppingBag,
  Tag,
  Scissors,
  Printer,
  Trash2,
  Eye,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Edit3,
} from 'lucide-react';
import { Bill } from '../types';
import { getBills, updateLotPrice, finalizeBillWithCharges, deleteBill } from '../api';
import { Language } from '../i18n';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  onOpenReceipt: (bill: Bill) => void;
  onOpenEdit?: (bill: Bill) => void;
  onOpenRecordPayment?: (bill?: Bill, customer?: any) => void;
  onOpenAddCustomer?: () => void;
  lang: Language;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenReceipt,
  onOpenEdit,
}) => {
  const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal: Set / Update Price
  const [priceModalLot, setPriceModalLot] = useState<Bill | null>(null);
  const [inputPrice, setInputPrice] = useState<string>('40.00');
  const [inputPandluPrice, setInputPandluPrice] = useState<string>('25.00');

  // Modal: Create Bill (Cut Deductions)
  const [billModalLot, setBillModalLot] = useState<Bill | null>(null);
  const [commissionRate, setCommissionRate] = useState<string>('5.0');
  const [labourCharges, setLabourCharges] = useState<string>('0');
  const [transportCharges, setTransportCharges] = useState<string>('0');
  const [otherCharges, setOtherCharges] = useState<string>('0');

  const fetchDashboardData = async (date: string) => {
    setLoading(true);
    try {
      const res = await getBills({ date });
      setBills(res.bills);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedDate);
  }, [selectedDate]);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  // KPI Calculations: "today total bills (no of count) & total bags thats it"
  const totalBillsCount = bills.length;
  const totalBagsCount = bills.reduce((acc, b) => acc + (b.totalBags || 0), 0);
  const totalLargeBags = bills.reduce((acc, b) => acc + (b.totalLargeBags || 0), 0);
  const totalSmallBags = bills.reduce((acc, b) => acc + (b.totalSmallBags || 0), 0);
  const totalPandluBags = bills.reduce((acc, b) => acc + (b.totalPandluBags || 0), 0);
  const totalWeightKg = bills.reduce((acc, b) => acc + (b.totalWeight || 0), 0);

  // Format bag summary text
  const renderBagSummary = (bill: Bill) => {
    const parts = [];
    if (bill.totalLargeBags > 0) parts.push(`${bill.totalLargeBags} Large`);
    if (bill.totalSmallBags > 0) parts.push(`${bill.totalSmallBags} Small`);
    if ((bill.totalPandluBags || 0) > 0) parts.push(`${bill.totalPandluBags} Ripe`);

    return (
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-charcoal-700">
        <span className="font-extrabold text-charcoal-950 font-mono text-sm">
          {bill.totalBags} {bill.totalBags === 1 ? 'Bag' : 'Bags'}
        </span>
        {parts.length > 0 && (
          <span className="text-slate-500 font-medium text-xs">
            ({parts.join(', ')})
          </span>
        )}
      </div>
    );
  };

  // Submit Price Modal
  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceModalLot) return;
    const r = parseFloat(inputPrice);
    if (isNaN(r) || r <= 0) {
      alert('Please enter a valid normal price per kg');
      return;
    }

    const hasPandlu = (priceModalLot.totalPandluBags || 0) > 0;
    const p = hasPandlu ? parseFloat(inputPandluPrice) || r : undefined;

    try {
      await updateLotPrice(priceModalLot.id, r, p);
      setPriceModalLot(null);
      fetchDashboardData(selectedDate);
    } catch (err: any) {
      alert(err.message || 'Failed to update price');
    }
  };

  // Open Create Bill Modal
  const handleOpenCreateBill = (lot: Bill) => {
    setBillModalLot(lot);
    setCommissionRate('5.0');
    const defaultLabour = lot.totalBags * 10;
    setLabourCharges(String(defaultLabour));
    setTransportCharges('0');
    setOtherCharges('0');
  };

  // Submit Final Bill
  const handleFinalizeBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billModalLot) return;
    try {
      const res = await finalizeBillWithCharges(billModalLot.id, {
        commissionRate: parseFloat(commissionRate) || 0,
        labourCharges: parseFloat(labourCharges) || 0,
        transportCharges: parseFloat(transportCharges) || 0,
        otherCharges: parseFloat(otherCharges) || 0,
      });
      setBillModalLot(null);
      fetchDashboardData(selectedDate);
      onOpenReceipt(res.bill);
    } catch (err: any) {
      alert(err.message || 'Failed to create bill');
    }
  };

  const handleDelete = async (bill: Bill) => {
    if (window.confirm(`Delete lot #${bill.billNumber} for ${bill.customer.name}?`)) {
      try {
        await deleteBill(bill.id);
        fetchDashboardData(selectedDate);
      } catch (e: any) {
        alert(e.message || 'Failed to delete');
      }
    }
  };

  return (
    <div className="space-y-5 pb-24 max-w-4xl mx-auto">
      {/* Top Header with Date Controls & Weigh Bags Action */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight flex items-center space-x-2">
            <span>🍋</span>
            <span>Dashboard</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {new Date(selectedDate).toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto flex-wrap">
          {/* Date Navigator */}
          <div className="flex items-center space-x-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-charcoal-900 focus:outline-none px-1"
            />
            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(getTodayString())}
              className="px-2 py-1 rounded-lg bg-lemon-200 hover:bg-lemon-300 text-amber-950 text-xs font-bold transition ml-0.5"
            >
              Today
            </button>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => onNavigate('new-bill')}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-lemon-400 hover:bg-lemon-500 text-charcoal-950 font-black text-xs sm:text-sm shadow-xs border border-lemon-500/40 transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Weigh Bags</span>
          </button>
        </div>
      </div>

      {/* TOP 2 METRICS ONLY: Total Bills Count & Total Bags */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Metric 1: Total Bills Count */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Today's Bills
            </span>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-2xl sm:text-3xl font-mono font-black text-charcoal-950">
                {totalBillsCount}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {totalBillsCount === 1 ? 'Bill' : 'Bills'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              Recorded entries today
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Scale className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Metric 2: Total Bags */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Today's Bags
            </span>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-2xl sm:text-3xl font-mono font-black text-charcoal-950">
                {totalBagsCount}
              </span>
              <span className="text-xs font-bold text-slate-400">Bags</span>
            </div>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Weight: <span className="font-mono text-fresh-700">{totalWeightKg.toFixed(2)} kg</span>
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-lemon-100 flex items-center justify-center text-amber-800">
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* BILLS LIST: Clean, Simple, and Uncluttered */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-black text-charcoal-900 tracking-tight">
              Today's Entries
            </h3>
            <p className="text-xs text-slate-400">Tap any entry to view full bag & price details</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
            {bills.length} {bills.length === 1 ? 'Record' : 'Records'}
          </span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 font-medium text-xs">
            Loading today's entries...
          </div>
        ) : bills.length === 0 ? (
          <div className="py-14 text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-lemon-100 text-amber-900 flex items-center justify-center text-xl mx-auto mb-2.5">
              🍋
            </div>
            <h4 className="text-sm font-bold text-charcoal-900">No entries recorded for this date</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Start by weighing bags from arriving lemon farmers.
            </p>
            <button
              onClick={() => onNavigate('new-bill')}
              className="mt-3.5 px-4 py-2 rounded-xl bg-lemon-400 hover:bg-lemon-500 text-charcoal-950 font-black text-xs shadow-xs transition"
            >
              + Weigh Bags
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {bills.map((bill, index) => {
              const isPriced = bill.pricePerKg > 0;
              const isBilled = bill.stage === 'FINAL_BILLED';
              const hasPandlu = (bill.totalPandluBags || 0) > 0;

              return (
                <div
                  key={bill.id}
                  onClick={() => onOpenReceipt(bill)}
                  className="p-4 sm:p-5 hover:bg-lemon-50/40 transition cursor-pointer group flex flex-col space-y-3"
                >
                  {/* Row 1: Header (Farmer Info + Price / Status Badge) */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-lemon-200 font-mono font-black text-xs text-slate-700 group-hover:text-amber-950 flex items-center justify-center flex-shrink-0 transition">
                        #{index + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-extrabold text-charcoal-900 group-hover:text-amber-950">
                            {bill.customer.name}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          📱 {bill.customer.mobile} {bill.customer.village ? `• 📍 ${bill.customer.village}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Price / Status Badge */}
                    <div className="text-right flex-shrink-0">
                      {isPriced ? (
                        <div className="inline-flex flex-col items-end">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-fresh-50 text-fresh-800 border border-fresh-200">
                            ₹{bill.pricePerKg.toFixed(2)}/kg
                          </span>
                          {hasPandlu && bill.pricePerKgPandlu ? (
                            <span className="text-[11px] font-mono font-semibold text-amber-800 mt-0.5">
                              Ripe: ₹{bill.pricePerKgPandlu.toFixed(2)}/kg
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          No price decided
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Bags & Weight Summary + Financials */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100/80">
                    <div className="flex items-center space-x-4">
                      {renderBagSummary(bill)}
                      <span className="text-slate-300">•</span>
                      <span className="font-mono font-extrabold text-fresh-700 text-sm">
                        {bill.totalWeight.toFixed(3)} kg
                      </span>
                    </div>

                    {isPriced && (
                      <div className="text-right font-mono text-xs">
                        {isBilled ? (
                          <span className="font-extrabold text-charcoal-950">
                            Net: ₹{bill.netPayable.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-bold">
                            Gross: ₹{bill.grossAmount.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Row 3: Action Buttons */}
                  <div
                    className="flex items-center justify-between pt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* View Details Link */}
                    <button
                      type="button"
                      onClick={() => onOpenReceipt(bill)}
                      className="text-xs font-bold text-slate-500 hover:text-charcoal-900 flex items-center space-x-1 transition group-hover:text-amber-900"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>

                    {/* Stage Actions */}
                    <div className="flex items-center space-x-1.5">
                      {onOpenEdit && (
                        <button
                          type="button"
                          onClick={() => onOpenEdit(bill)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-charcoal-900 font-bold text-xs shadow-2xs flex items-center space-x-1 transition"
                          title="Edit bill details, weights, rates, or deductions"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-700" />
                          <span>Edit</span>
                        </button>
                      )}

                      {!isPriced && (
                        <button
                          type="button"
                          onClick={() => {
                            setPriceModalLot(bill);
                            setInputPrice('40.00');
                            setInputPandluPrice('25.00');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-lemon-400 hover:bg-lemon-500 text-charcoal-950 font-bold text-xs shadow-2xs transition"
                        >
                          Set Price
                        </button>
                      )}

                      {isPriced && !isBilled && (
                        <button
                          type="button"
                          onClick={() => handleOpenCreateBill(bill)}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-2xs transition"
                        >
                          Create Bill
                        </button>
                      )}

                      {isBilled && (
                        <button
                          type="button"
                          onClick={() => onOpenReceipt(bill)}
                          className="px-3 py-1.5 rounded-lg bg-fresh-600 hover:bg-fresh-700 text-white font-bold text-xs shadow-2xs flex items-center space-x-1 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDelete(bill)}
                        className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* POPUP MODAL: SET PRICE PER KG */}
      {priceModalLot && (() => {
        const hasPandlu = (priceModalLot.totalPandluBags || 0) > 0;
        const normalWeight = Number(((priceModalLot.totalLargeWeight || 0) + (priceModalLot.totalSmallWeight || 0)).toFixed(3));
        const pandluWeight = Number((priceModalLot.totalPandluWeight || 0).toFixed(3));
        const normalRate = parseFloat(inputPrice) || 0;
        const pandluRate = parseFloat(inputPandluPrice) || 0;
        const previewNormalGross = Number((normalWeight * normalRate).toFixed(2));
        const previewPandluGross = Number((pandluWeight * pandluRate).toFixed(2));
        const previewTotalGross = hasPandlu
          ? Number((previewNormalGross + previewPandluGross).toFixed(2))
          : Number((priceModalLot.totalWeight * normalRate).toFixed(2));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-base font-black text-charcoal-900">
                Set Price for {priceModalLot.customer.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Total Weight: <span className="font-bold text-fresh-700">{priceModalLot.totalWeight.toFixed(3)} kg</span> ({priceModalLot.totalBags} bags)
              </p>

              <form onSubmit={handleSavePrice} className="mt-4 space-y-4">
                {/* Normal Lemons Rate */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-charcoal-800 block mb-1">
                    {hasPandlu ? 'Normal Lemon Rate (₹/kg) *' : 'Price per kg (₹) *'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      autoFocus
                      required
                      value={inputPrice}
                      onChange={(e) => setInputPrice(e.target.value)}
                      placeholder="40.00"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-xl text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-lemon-400"
                    />
                  </div>
                  {/* Quick Presets */}
                  <div className="flex space-x-1.5 overflow-x-auto pt-1.5 pb-1">
                    {[35, 38, 40, 42, 45].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setInputPrice(r.toFixed(2))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-lemon-100 font-mono font-bold text-xs"
                      >
                        ₹{r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ripe Lemons Rate */}
                {hasPandlu && (
                  <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-950 block">
                      Ripe Lemons Rate (₹/kg) *
                    </label>
                    <span className="text-[11px] text-amber-800 block font-medium">
                      {priceModalLot.totalPandluBags} Ripe bags ({pandluWeight.toFixed(3)} kg)
                    </span>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 font-bold text-amber-600">₹</span>
                      <input
                        type="number"
                        step="0.5"
                        min="1"
                        required
                        value={inputPandluPrice}
                        onChange={(e) => setInputPandluPrice(e.target.value)}
                        placeholder="25.00"
                        className="w-full pl-8 pr-4 py-2 rounded-xl border border-amber-300 font-mono font-bold text-lg text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                      />
                    </div>
                    {/* Quick Presets */}
                    <div className="flex space-x-1.5 overflow-x-auto pt-1">
                      {[20, 24, 25, 28, 30].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setInputPandluPrice(r.toFixed(2))}
                          className="px-2.5 py-1 rounded-lg border border-amber-300 bg-white hover:bg-amber-100 font-mono font-bold text-xs text-amber-950"
                        >
                          ₹{r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gross Preview */}
                <div className="p-3 bg-slate-50 rounded-xl text-xs font-mono font-bold text-charcoal-900 space-y-1">
                  {hasPandlu && (
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Normal ({normalWeight.toFixed(2)} kg @ ₹{normalRate}):</span>
                      <span>₹{previewNormalGross.toFixed(2)}</span>
                    </div>
                  )}
                  {hasPandlu && (
                    <div className="flex justify-between text-amber-800 text-[11px]">
                      <span>Ripe ({pandluWeight.toFixed(2)} kg @ ₹{pandluRate}):</span>
                      <span>₹{previewPandluGross.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-black text-charcoal-950">
                    <span>Total Gross Amount:</span>
                    <span>₹{previewTotalGross.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPriceModalLot(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-lemon-400 hover:bg-lemon-500 text-charcoal-950 text-xs font-black rounded-xl shadow-xs"
                  >
                    Save Price
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* POPUP MODAL: CREATE BILL & CUT DEDUCTIONS */}
      {billModalLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 my-auto">
            <h3 className="text-base font-black text-charcoal-900">
              Create Final Bill for {billModalLot.customer.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {billModalLot.totalWeight.toFixed(3)} kg @ ₹{billModalLot.pricePerKg.toFixed(2)}/kg = Gross ₹{billModalLot.grossAmount.toFixed(2)}
            </p>

            <form onSubmit={handleFinalizeBill} className="mt-4 space-y-3.5">
              {/* Deductions Section */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-600 block">
                  Deductions (Commission, Labour, Transport, Other)
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Commission %</label>
                    <input
                      type="number"
                      step="0.5"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Labour / Hamali ₹</label>
                    <input
                      type="number"
                      step="1"
                      value={labourCharges}
                      onChange={(e) => setLabourCharges(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Transport ₹</label>
                    <input
                      type="number"
                      step="1"
                      value={transportCharges}
                      onChange={(e) => setTransportCharges(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block">Other / Bag Charges ₹</label>
                    <input
                      type="number"
                      step="1"
                      value={otherCharges}
                      onChange={(e) => setOtherCharges(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border font-mono font-bold text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Net Payable Result */}
              {(() => {
                const comm = (billModalLot.grossAmount * (parseFloat(commissionRate) || 0)) / 100;
                const lab = parseFloat(labourCharges) || 0;
                const tr = parseFloat(transportCharges) || 0;
                const oth = parseFloat(otherCharges) || 0;
                const totalDeductions = comm + lab + tr + oth;
                const netPayable = Math.max(0, billModalLot.grossAmount - totalDeductions);

                return (
                  <div className="p-3 bg-fresh-50 rounded-2xl border border-fresh-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-fresh-900 block">Net Payable to Farmer:</span>
                      <span className="text-[10px] text-fresh-700">Gross ₹{billModalLot.grossAmount} - Deductions ₹{totalDeductions.toFixed(2)}</span>
                    </div>
                    <span className="text-xl font-mono font-black text-fresh-950">₹{netPayable.toFixed(2)}</span>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBillModalLot(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-fresh-600 hover:bg-fresh-700 text-white text-xs font-black rounded-xl shadow-xs"
                >
                  Generate Final Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
