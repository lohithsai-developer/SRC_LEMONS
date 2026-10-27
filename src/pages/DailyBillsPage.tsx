import React, { useState, useEffect } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  Printer,
  Trash2,
  Plus,
  Scale,
  Tag,
  Scissors,
  CheckCircle,
  Clock,
  ArrowRight,
  Share2,
  Edit3,
} from 'lucide-react';
import { Bill, BillStage } from '../types';
import { getBills, deleteBill, updateLotPrice, finalizeBillWithCharges } from '../api';
import { Language, t } from '../i18n';

interface DailyBillsPageProps {
  onOpenReceipt: (bill: Bill) => void;
  onOpenEdit?: (bill: Bill) => void;
  onOpenRecordPayment: (bill: Bill) => void;
  onNavigateToNewBill: () => void;
  lang: Language;
}

export const DailyBillsPage: React.FC<DailyBillsPageProps> = ({
  onOpenReceipt,
  onOpenEdit,
  onOpenRecordPayment,
  onNavigateToNewBill,
  lang,
}) => {
  const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [currentDate, setCurrentDate] = useState<string>(getTodayString());
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // 3 Primary Tabs
  const [activeStageTab, setActiveStageTab] = useState<'WEIGHED' | 'PRICED' | 'FINAL_BILLED'>('WEIGHED');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modal: Enter Price
  const [priceModalLot, setPriceModalLot] = useState<Bill | null>(null);
  const [inputPrice, setInputPrice] = useState<string>('40.00');
  const [inputPandluPrice, setInputPandluPrice] = useState<string>('25.00');

  // Modal: Create Bill (Cut Charges)
  const [billModalLot, setBillModalLot] = useState<Bill | null>(null);
  const [commissionRate, setCommissionRate] = useState<string>('5.0');
  const [labourCharges, setLabourCharges] = useState<string>('0');
  const [transportCharges, setTransportCharges] = useState<string>('0');
  const [otherCharges, setOtherCharges] = useState<string>('0');

  const fetchDailyBills = async () => {
    setLoading(true);
    try {
      const res = await getBills({
        date: currentDate,
        search: searchQuery || undefined,
      });
      setBills(res.bills);
      setSummary(res.summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyBills();
  }, [currentDate]);

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  };

  const handleDelete = async (bill: Bill) => {
    if (window.confirm(`Delete lot #${bill.billNumber} for ${bill.customer.name}?`)) {
      try {
        await deleteBill(bill.id);
        fetchDailyBills();
      } catch (err: any) {
        alert(err.message || 'Failed to delete');
      }
    }
  };

  // Submit Price
  const handleSavePriceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceModalLot) return;
    const r = parseFloat(inputPrice);
    if (isNaN(r) || r <= 0) {
      alert('Please enter a valid price per kg');
      return;
    }

    const hasPandlu = (priceModalLot.totalPandluBags || 0) > 0;
    const p = hasPandlu ? parseFloat(inputPandluPrice) || r : undefined;

    try {
      await updateLotPrice(priceModalLot.id, r, p);
      setPriceModalLot(null);
      await fetchDailyBills();
      setActiveStageTab('PRICED'); // Move to Priced tab to see ready-to-bill lots!
    } catch (e: any) {
      alert(e.message || 'Failed to update price');
    }
  };

  // Open Create Bill Modal
  const handleOpenCreateBill = (lot: Bill) => {
    setBillModalLot(lot);
    setCommissionRate('5.0');
    // Default labour: ₹10 per bag
    setLabourCharges(String(lot.totalBags * 10));
    setTransportCharges('0');
    setOtherCharges('0');
  };

  // Submit Final Bill with Deductions
  const handleFinalizeBillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billModalLot) return;

    try {
      const commRate = parseFloat(commissionRate) || 0;
      const res = await finalizeBillWithCharges(billModalLot.id, {
        commissionRate: commRate,
        labourCharges: parseFloat(labourCharges) || 0,
        transportCharges: parseFloat(transportCharges) || 0,
        otherCharges: parseFloat(otherCharges) || 0,
      });

      setBillModalLot(null);
      await fetchDailyBills();
      setActiveStageTab('FINAL_BILLED'); // Move to Final Bills tab
      onOpenReceipt(res.bill); // Show receipt right away!
    } catch (e: any) {
      alert(e.message || 'Failed to generate bill');
    }
  };

  // Filter bills by active stage tab
  const filteredBills = bills.filter((b) => {
    const matchesStage = b.stage === activeStageTab;
    if (!matchesStage) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.customer.name.toLowerCase().includes(q) ||
      b.customer.mobile.includes(q) ||
      b.billNumber.toLowerCase().includes(q)
    );
  });

  const weighedCount = bills.filter((b) => b.stage === 'WEIGHED').length;
  const pricedCount = bills.filter((b) => b.stage === 'PRICED').length;
  const finalBilledCount = bills.filter((b) => b.stage === 'FINAL_BILLED').length;

  return (
    <div className="space-y-6 pb-24">
      {/* Top Header & Day Navigation */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight flex items-center space-x-2">
            <span>🍋</span>
            <span>Daily Lots & Billing</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Add prices and create bills whenever you want.
          </p>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button onClick={handlePrevDay} className="p-1.5 rounded-xl hover:bg-white text-slate-600 transition">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-bold text-charcoal-900 focus:outline-none"
          />
          <button onClick={handleNextDay} className="p-1.5 rounded-xl hover:bg-white text-slate-600 transition">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(getTodayString())}
            className="px-2.5 py-1 rounded-xl bg-lemon-200 hover:bg-lemon-300 text-amber-950 text-xs font-bold transition ml-1"
          >
            Today
          </button>
        </div>
      </div>

      {/* 3 Main Workflow Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Tab 1: Weighed (Price Pending) */}
        <button
          onClick={() => setActiveStageTab('WEIGHED')}
          className={`p-4 rounded-3xl border transition text-left flex items-center justify-between ${
            activeStageTab === 'WEIGHED'
              ? 'bg-lemon-400 border-lemon-500 shadow-sm ring-2 ring-lemon-200 text-charcoal-950'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center space-x-1.5">
              <Scale className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-wider">1. Weighed Lots</span>
            </div>
            <p className="text-xs font-semibold mt-1">
              Add Price Later
            </p>
          </div>
          <span className="text-2xl font-mono font-black">{weighedCount}</span>
        </button>

        {/* Tab 2: Priced (Ready to Bill) */}
        <button
          onClick={() => setActiveStageTab('PRICED')}
          className={`p-4 rounded-3xl border transition text-left flex items-center justify-between ${
            activeStageTab === 'PRICED'
              ? 'bg-lemon-400 border-lemon-500 shadow-sm ring-2 ring-lemon-200 text-charcoal-950'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center space-x-1.5">
              <Tag className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-black uppercase tracking-wider">2. Priced Lots</span>
            </div>
            <p className="text-xs font-semibold mt-1">
              Create Bill Whenever
            </p>
          </div>
          <span className="text-2xl font-mono font-black">{pricedCount}</span>
        </button>

        {/* Tab 3: Completed Bills */}
        <button
          onClick={() => setActiveStageTab('FINAL_BILLED')}
          className={`p-4 rounded-3xl border transition text-left flex items-center justify-between ${
            activeStageTab === 'FINAL_BILLED'
              ? 'bg-fresh-600 border-fresh-700 text-white shadow-sm ring-2 ring-fresh-200'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-wider">3. Final Bills</span>
            </div>
            <p className="text-xs font-semibold mt-1">
              Completed Bills
            </p>
          </div>
          <span className="text-2xl font-mono font-black">{finalBilledCount}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-2">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by farmer name or mobile..."
          className="w-full bg-transparent text-xs sm:text-sm font-medium focus:outline-none"
        />
      </div>

      {/* TAB 1: WEIGHED LOTS LIST */}
      {activeStageTab === 'WEIGHED' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Weighed Lots Awaiting Price ({filteredBills.length})
            </span>
            <button
              onClick={onNavigateToNewBill}
              className="text-xs font-bold text-fresh-700 hover:text-fresh-800 flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Weigh Another Farmer</span>
            </button>
          </div>

          {filteredBills.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <Scale className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-charcoal-900">No pending lots awaiting price</h3>
              <p className="text-xs text-slate-400 mt-1">All weighed lots have prices updated, or no lots weighed yet today.</p>
              <button
                onClick={onNavigateToNewBill}
                className="mt-4 px-5 py-2.5 rounded-xl bg-lemon-400 hover:bg-lemon-500 text-charcoal-950 font-bold text-xs"
              >
                + Weigh Farmer Bags
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBills.map((lot) => (
                <div
                  key={lot.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-lemon-100 text-amber-950">
                        {lot.billNumber}
                      </span>
                      <h4 className="text-base font-extrabold text-charcoal-900 mt-1">{lot.customer.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">
                        📱 {lot.customer.mobile} {lot.customer.village ? `• ${lot.customer.village}` : ''}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-mono font-black text-fresh-700">
                        {lot.totalWeight.toFixed(3)} kg
                      </span>
                      <p className="text-[11px] text-slate-400">{lot.totalBags} Bags total</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex flex-wrap justify-between gap-1">
                    <span>Large: <strong>{lot.totalLargeBags}</strong> ({lot.totalLargeWeight.toFixed(2)}kg)</span>
                    <span>Small: <strong>{lot.totalSmallBags}</strong> ({lot.totalSmallWeight.toFixed(2)}kg)</span>
                    {(lot.totalPandluBags || 0) > 0 && (
                      <span className="text-amber-900 font-bold bg-amber-100 px-1.5 py-0.5 rounded-md">
                        Pandlu: <strong>{lot.totalPandluBags}</strong> ({lot.totalPandluWeight.toFixed(2)}kg)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleDelete(lot)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl"
                      title="Delete lot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center space-x-2">
                      {onOpenEdit && (
                        <button
                          onClick={() => onOpenEdit(lot)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-charcoal-900 font-bold text-xs flex items-center space-x-1 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-700" />
                          <span>Edit</span>
                        </button>
                      )}

                      {/* BUTTON TO ENTER PRICE LATER */}
                      <button
                        onClick={() => {
                          setPriceModalLot(lot);
                          setInputPrice('40.00');
                        }}
                        className="px-5 py-2.5 rounded-2xl bg-lemon-400 hover:bg-lemon-500 text-charcoal-950 font-black text-xs shadow-xs border border-lemon-500/30 flex items-center space-x-1.5 transform active:scale-95"
                      >
                        <Tag className="w-4 h-4" />
                        <span>Enter Price</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRICED LOTS (READY TO BILL) */}
      {activeStageTab === 'PRICED' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Priced Lots Ready for Bill ({filteredBills.length})
            </span>
            <p className="text-xs text-slate-400">Click Create Bill whenever you want to cut charges and settle</p>
          </div>

          {filteredBills.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <Tag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-charcoal-900">No priced lots awaiting bill</h3>
              <p className="text-xs text-slate-400 mt-1">Enter prices on your weighed lots to make them ready for billing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBills.map((lot) => (
                <div
                  key={lot.id}
                  className="bg-white rounded-3xl border-2 border-lemon-300 p-5 shadow-xs hover:shadow-md transition space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900">
                        {lot.billNumber}
                      </span>
                      <h4 className="text-base font-extrabold text-charcoal-900 mt-1">{lot.customer.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">
                        {lot.totalWeight.toFixed(3)} kg @ <strong className="text-charcoal-900">₹{lot.pricePerKg}/kg</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-mono font-black text-charcoal-950">
                        ₹{lot.grossAmount.toFixed(2)}
                      </span>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Gross Amount</p>
                    </div>
                  </div>

                  <div className="p-3 bg-lemon-50 rounded-2xl border border-lemon-200 text-xs flex justify-between font-medium text-amber-950">
                    <span>{lot.totalBags} Bags total</span>
                    <span>Ready for Charges & Net Bill</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setPriceModalLot(lot);
                          setInputPrice(String(lot.pricePerKg));
                        }}
                        className="text-xs text-slate-500 hover:text-charcoal-900 underline font-semibold"
                      >
                        Change Price
                      </button>

                      {onOpenEdit && (
                        <button
                          onClick={() => onOpenEdit(lot)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-charcoal-900 font-bold text-xs flex items-center space-x-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>

                    {/* BUTTON TO CREATE BILL WHENEVER YOU WANT! */}
                    <button
                      onClick={() => handleOpenCreateBill(lot)}
                      className="px-6 py-2.5 rounded-2xl bg-fresh-600 hover:bg-fresh-700 text-white font-black text-xs shadow-md flex items-center space-x-1.5 transform active:scale-95"
                    >
                      <Scissors className="w-4 h-4" />
                      <span>Create Bill</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: FINAL BILLED COMPLETED */}
      {activeStageTab === 'FINAL_BILLED' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Completed Final Bills ({filteredBills.length})
            </span>
          </div>

          {filteredBills.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-charcoal-900">No finalized bills yet for this date</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBills.map((bill) => (
                <div
                  key={bill.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                        {bill.billNumber}
                      </span>
                      <h4 className="text-base font-extrabold text-charcoal-900 mt-1">{bill.customer.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">📱 {bill.customer.mobile}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-mono font-black text-charcoal-950">
                        ₹{bill.netPayable.toFixed(2)}
                      </span>
                      <p className="text-[10px] text-rose-600 font-bold">
                        Deductions: -₹{bill.totalDeductions.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex justify-between">
                    <span>{bill.totalBags} Bags • {bill.totalWeight.toFixed(2)}kg @ ₹{bill.pricePerKg}</span>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-1">
                    {onOpenEdit && (
                      <button
                        onClick={() => onOpenEdit(bill)}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center space-x-1.5 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Bill</span>
                      </button>
                    )}

                    <button
                      onClick={() => onOpenReceipt(bill)}
                      className="px-4 py-2 rounded-xl bg-lemon-400 hover:bg-lemon-500 text-charcoal-950 font-bold text-xs flex items-center space-x-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Receipt</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ENTER / UPDATE PRICE */}
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-fade-in">
              <h3 className="text-lg font-black text-charcoal-900">
                Enter Price for {priceModalLot.customer.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Lot weight: <span className="font-bold text-fresh-700">{priceModalLot.totalWeight.toFixed(3)} kg</span> ({priceModalLot.totalBags} bags)
              </p>

              <form onSubmit={handleSavePriceSubmit} className="mt-5 space-y-4">
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
                  {/* Quick Preset Rates */}
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

                {/* Pandlu Rate */}
                {hasPandlu && (
                  <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-amber-950 block">
                      Ripe Lemons Rate (₹/kg) *
                    </label>
                    <span className="text-[11px] text-amber-800 block font-medium">
                      {priceModalLot.totalPandluBags} Pandlu bags ({pandluWeight.toFixed(3)} kg)
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
                    {/* Quick Preset Rates for Pandlu */}
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

                <div className="p-3 bg-lemon-50 rounded-xl text-xs font-mono font-bold text-charcoal-900 space-y-1">
                  {hasPandlu && (
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Normal ({normalWeight.toFixed(2)} kg @ ₹{normalRate}):</span>
                      <span>₹{previewNormalGross.toFixed(2)}</span>
                    </div>
                  )}
                  {hasPandlu && (
                    <div className="flex justify-between text-amber-800 text-[11px]">
                      <span>Pandlu ({pandluWeight.toFixed(2)} kg @ ₹{pandluRate}):</span>
                      <span>₹{previewPandluGross.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-lemon-200 text-sm font-black text-charcoal-950">
                    <span>Total Gross:</span>
                    <span>₹{previewTotalGross.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPriceModalLot(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
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

      {/* MODAL 2: CREATE FINAL BILL & CUT DEDUCTIONS */}
      {billModalLot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-fade-in my-auto">
            <h3 className="text-lg font-black text-charcoal-900">
              Apply Deductions & Create Bill
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {billModalLot.customer.name} • Gross: <span className="font-mono font-bold text-charcoal-900">₹{billModalLot.grossAmount.toFixed(2)}</span> ({billModalLot.totalWeight.toFixed(2)}kg @ ₹{billModalLot.pricePerKg})
            </p>

            <form onSubmit={handleFinalizeBillSubmit} className="mt-4 space-y-4">
              <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-2.5">
                <span className="text-[11px] font-black uppercase text-rose-900 block">
                  Deductions (Commission, Labour, Transport, Other)
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Commission %</label>
                    <input
                      type="number"
                      step="0.5"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Labour / Hamali ₹</label>
                    <input
                      type="number"
                      step="1"
                      value={labourCharges}
                      onChange={(e) => setLabourCharges(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Transport ₹</label>
                    <input
                      type="number"
                      step="1"
                      value={transportCharges}
                      onChange={(e) => setTransportCharges(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block">Other / Sanchi ₹</label>
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

              {/* Net Farmer Payable Summary */}
              {(() => {
                const comm = (billModalLot.grossAmount * (parseFloat(commissionRate) || 0)) / 100;
                const lab = parseFloat(labourCharges) || 0;
                const tr = parseFloat(transportCharges) || 0;
                const oth = parseFloat(otherCharges) || 0;
                const totalDeductions = comm + lab + tr + oth;
                const netPayable = Math.max(0, billModalLot.grossAmount - totalDeductions);

                return (
                  <div className="p-3 bg-fresh-50 rounded-2xl border border-fresh-300 flex items-center justify-between text-xs">
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
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-fresh-600 hover:bg-fresh-700 text-white text-xs font-black rounded-xl shadow-md"
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
