import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  User,
  Plus,
  Trash2,
  Scale,
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { Customer, Bill } from '../types';
import { getCustomers, saveWeighedLot } from '../api';
import { Language, t } from '../i18n';

interface BagRow {
  id: string;
  weightKg: string;
}

interface NewBillPageProps {
  onBillSaved: (bill: Bill) => void;
  onOpenAddCustomerModal: () => void;
  onNavigateToBills: () => void;
  newlyCreatedCustomer?: Customer | null;
  lang: Language;
}

export const NewBillPage: React.FC<NewBillPageProps> = ({
  onBillSaved,
  onOpenAddCustomerModal,
  onNavigateToBills,
  newlyCreatedCustomer,
  lang,
}) => {
  const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const [billDate, setBillDate] = useState<string>(getTodayString());
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // Bag rows: ONLY weights!
  const [largeBags, setLargeBags] = useState<BagRow[]>([
    { id: 'lb-1', weightKg: '' },
  ]);
  const [smallBags, setSmallBags] = useState<BagRow[]>([]);
  const [pandluBags, setPandluBags] = useState<BagRow[]>([]);
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedLot, setLastSavedLot] = useState<Bill | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (newlyCreatedCustomer) {
      setCustomers((prev) => [newlyCreatedCustomer, ...prev]);
      setSelectedCustomerId(newlyCreatedCustomer.id);
      setCustomerSearch(newlyCreatedCustomer.name);
    }
  }, [newlyCreatedCustomer]);

  const loadCustomers = async () => {
    try {
      const res = await getCustomers(undefined, true);
      setCustomers(res.customers);
    } catch (e) {}
  };

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 8);
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.customerId.toLowerCase().includes(q) ||
        (c.village && c.village.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  // Bag manipulations
  const addLargeBag = (presetWeight?: number) => {
    setLargeBags((prev) => {
      if (prev.length === 1 && (!prev[0].weightKg || prev[0].weightKg.trim() === '')) {
        return [{ id: prev[0].id, weightKg: presetWeight ? presetWeight.toFixed(3) : '' }];
      }
      return [
        ...prev,
        { id: `lb-${Date.now()}-${prev.length + 1}`, weightKg: presetWeight ? presetWeight.toFixed(3) : '' },
      ];
    });
  };

  const removeLargeBag = (idx: number) => {
    setLargeBags((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLargeBag = (idx: number, val: string) => {
    setLargeBags((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], weightKg: val };
      return next;
    });
  };

  const addSmallBag = (presetWeight?: number) => {
    setSmallBags((prev) => [
      ...prev,
      { id: `sb-${Date.now()}-${prev.length + 1}`, weightKg: presetWeight ? presetWeight.toFixed(3) : '' },
    ]);
  };

  const removeSmallBag = (idx: number) => {
    setSmallBags((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateSmallBag = (idx: number, val: string) => {
    setSmallBags((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], weightKg: val };
      return next;
    });
  };

  const addPandluBag = (presetWeight?: number) => {
    setPandluBags((prev) => {
      if (prev.length === 1 && (!prev[0].weightKg || prev[0].weightKg.trim() === '')) {
        return [{ id: prev[0].id, weightKg: presetWeight ? presetWeight.toFixed(3) : '' }];
      }
      return [
        ...prev,
        { id: `pb-${Date.now()}-${prev.length + 1}`, weightKg: presetWeight ? presetWeight.toFixed(3) : '' },
      ];
    });
  };

  const removePandluBag = (idx: number) => {
    setPandluBags((prev) => prev.filter((_, i) => i !== idx));
  };

  const updatePandluBag = (idx: number, val: string) => {
    setPandluBags((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], weightKg: val };
      return next;
    });
  };

  // Real-time calculations of weights ONLY
  const calculations = useMemo(() => {
    let validLargeCount = 0;
    let largeWeightGrams = 0;
    largeBags.forEach((b) => {
      const w = parseFloat(b.weightKg);
      if (!isNaN(w) && w > 0) {
        validLargeCount += 1;
        largeWeightGrams += Math.round(w * 1000);
      }
    });

    let validSmallCount = 0;
    let smallWeightGrams = 0;
    smallBags.forEach((b) => {
      const w = parseFloat(b.weightKg);
      if (!isNaN(w) && w > 0) {
        validSmallCount += 1;
        smallWeightGrams += Math.round(w * 1000);
      }
    });

    let validPandluCount = 0;
    let pandluWeightGrams = 0;
    pandluBags.forEach((b) => {
      const w = parseFloat(b.weightKg);
      if (!isNaN(w) && w > 0) {
        validPandluCount += 1;
        pandluWeightGrams += Math.round(w * 1000);
      }
    });

    const totalBags = validLargeCount + validSmallCount + validPandluCount;
    const totalWeightKg = (largeWeightGrams + smallWeightGrams + pandluWeightGrams) / 1000;
    const totalLargeWeightKg = largeWeightGrams / 1000;
    const totalSmallWeightKg = smallWeightGrams / 1000;
    const totalPandluWeightKg = pandluWeightGrams / 1000;

    return {
      validLargeCount,
      validSmallCount,
      validPandluCount,
      totalBags,
      totalLargeWeightKg,
      totalSmallWeightKg,
      totalPandluWeightKg,
      totalWeightKg,
    };
  }, [largeBags, smallBags, pandluBags]);

  // Reset for next farmer
  const handleResetForNextFarmer = () => {
    setSelectedCustomerId('');
    setCustomerSearch('');
    setLargeBags([{ id: `lb-${Date.now()}`, weightKg: '' }]);
    setSmallBags([]);
    setPandluBags([]);
    setNotes('');
    setLastSavedLot(null);
    setErrorMessage(null);
  };

  // Submit weights ONLY
  const handleSaveWeightsOnly = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCustomerId) {
      setErrorMessage('Please select a farmer/customer.');
      return;
    }

    const validLarge = largeBags
      .map((b) => parseFloat(b.weightKg))
      .filter((w) => !isNaN(w) && w > 0)
      .map((w, idx) => ({ bagIndex: idx + 1, weightKg: w }));

    const validSmall = smallBags
      .map((b) => parseFloat(b.weightKg))
      .filter((w) => !isNaN(w) && w > 0)
      .map((w, idx) => ({ bagIndex: idx + 1, weightKg: w }));

    const validPandlu = pandluBags
      .map((b) => parseFloat(b.weightKg))
      .filter((w) => !isNaN(w) && w > 0)
      .map((w, idx) => ({ bagIndex: idx + 1, weightKg: w }));

    if (validLarge.length === 0 && validSmall.length === 0 && validPandlu.length === 0) {
      setErrorMessage('Please enter at least one bag weight.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await saveWeighedLot({
        customerId: selectedCustomerId,
        customerObj: selectedCustomer || undefined,
        billDate,
        largeBags: validLarge,
        smallBags: validSmall,
        pandluBags: validPandlu,
        notes: notes.trim() || undefined,
      });

      setLastSavedLot(res.bill);
      onBillSaved(res.bill);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save weights');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-24 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">⚖️</span>
            <h2 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight">
              Enter Lemon Bag Weights
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Enter weights and save. Price and final bill can be added later whenever you want.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-fresh-600 flex-shrink-0" />
          <input
            type="date"
            value={billDate}
            onChange={(e) => setBillDate(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-bold text-charcoal-900 focus:outline-none"
          />
        </div>
      </div>

      {/* Success Notification after Saving Weights */}
      {lastSavedLot && (
        <div className="bg-fresh-50 border-2 border-fresh-500 rounded-3xl p-6 shadow-xl animate-fade-in text-charcoal-900">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="w-7 h-7 text-fresh-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-base font-black text-fresh-950">
                Bill saved successfully! 🍋
              </h3>
              <p className="text-xs sm:text-sm text-fresh-800 mt-1">
                Lot <span className="font-mono font-bold">#{lastSavedLot.billNumber}</span> •{' '}
                <span className="font-bold">{lastSavedLot.totalBags} Bags</span> •{' '}
                <span className="font-mono font-black text-fresh-900">{lastSavedLot.totalWeight.toFixed(3)} kg</span>
              </p>
              <p className="text-xs text-fresh-700 mt-1 italic">
                Price not added yet. You can update price and create bill whenever you want from the Dashboard.
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleResetForNextFarmer}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-lemon-400 hover:bg-lemon-500 text-charcoal-950 font-black text-xs shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Weigh Next Farmer</span>
                </button>

                <button
                  type="button"
                  onClick={onNavigateToBills}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-950 text-white font-bold text-xs shadow-xs transition"
                >
                  <Clock className="w-4 h-4" />
                  <span>View on Dashboard & Add Price ➔</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Weighing Form: ONLY Customer & Weights! */}
      <form onSubmit={handleSaveWeightsOnly} className="space-y-6">
        {/* 1. Farmer Selection */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-800 flex items-center space-x-1.5">
              <User className="w-4 h-4 text-fresh-600" />
              <span>Select Farmer *</span>
            </span>

            <button
              type="button"
              onClick={onOpenAddCustomerModal}
              className="px-3 py-1 rounded-xl bg-lemon-400 hover:bg-lemon-500 text-charcoal-950 font-bold text-xs shadow-2xs transition"
            >
              + New Farmer
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search or select farmer..."
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setIsCustomerDropdownOpen(true);
              }}
              onFocus={() => setIsCustomerDropdownOpen(true)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-lemon-400"
            />

            {isCustomerDropdownOpen && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-xl divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No matching farmer found.{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomerDropdownOpen(false);
                        onOpenAddCustomerModal();
                      }}
                      className="text-fresh-700 font-bold underline ml-1"
                    >
                      Add new?
                    </button>
                  </div>
                ) : (
                  filteredCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setCustomerSearch(`${c.name} (${c.mobile})`);
                        setIsCustomerDropdownOpen(false);
                      }}
                      className="p-3 hover:bg-lemon-50 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-charcoal-900 text-sm">{c.name}</p>
                        <p className="text-slate-500 font-mono">
                          📱 {c.mobile} {c.village ? `• ${c.village}` : ''}
                        </p>
                      </div>
                      {c.outstandingBalance ? (
                        <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Balance: ₹{c.outstandingBalance.toFixed(2)}
                        </span>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedCustomer && (
            <div className="p-3 bg-fresh-50 rounded-xl border border-fresh-200 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-fresh-900 text-sm">{selectedCustomer.name}</p>
                <p className="text-fresh-700 font-mono text-[11px]">
                  📱 {selectedCustomer.mobile} {selectedCustomer.village ? `• ${selectedCustomer.village}` : ''}
                </p>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-fresh-200 text-fresh-900 font-bold">
                Selected ✓
              </span>
            </div>
          )}
        </div>

        {/* 2. Large Bags Section */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-900 flex items-center space-x-1.5">
                <span className="text-base">🛍️</span>
                <span>Large Bags</span>
                <span className="px-2 py-0.5 rounded-full bg-lemon-100 text-amber-900 text-xs font-mono font-bold ml-1">
                  {calculations.validLargeCount} ({calculations.totalLargeWeightKg.toFixed(3)} kg)
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => addLargeBag()}
              className="px-3 py-1.5 rounded-xl bg-lemon-400 hover:bg-lemon-500 text-charcoal-950 font-bold text-xs shadow-2xs transition"
            >
              + Add
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center space-x-1 py-0.5 overflow-x-auto text-xs text-slate-500">
            <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap mr-1">Quick:</span>
            {[48, 49, 50, 51, 52].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => addLargeBag(w)}
                className="px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-lemon-100 font-mono font-bold text-xs text-charcoal-900 whitespace-nowrap transition"
              >
                +{w}kg
              </button>
            ))}
          </div>

          {/* Bag Input Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {largeBags.map((bag, i) => (
              <div
                key={bag.id}
                className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-lemon-400 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-lemon-100 text-amber-900 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                  #{i + 1}
                </div>
                <div className="flex-1 relative">
                  <input
                    type="number"
                    step="0.001"
                    min="0.1"
                    placeholder="50.000"
                    value={bag.weightKg}
                    onChange={(e) => updateLargeBag(i, e.target.value)}
                    className="w-full bg-transparent px-2 py-1 text-sm font-mono font-bold text-charcoal-900 focus:outline-none"
                  />
                  <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400">kg</span>
                </div>
                {largeBags.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLargeBag(i)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Small Bags Section */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal-900 flex items-center space-x-1.5">
                <span className="text-base">👜</span>
                <span>Small Bags</span>
                <span className="px-2 py-0.5 rounded-full bg-fresh-100 text-fresh-900 text-xs font-mono font-bold ml-1">
                  {calculations.validSmallCount} ({calculations.totalSmallWeightKg.toFixed(3)} kg)
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => addSmallBag()}
              className="px-3 py-1.5 rounded-xl bg-fresh-600 hover:bg-fresh-700 text-white font-bold text-xs shadow-2xs transition"
            >
              + Add
            </button>
          </div>

          {smallBags.length === 0 ? (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
              No small bags. Tap + Add if needed.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {smallBags.map((bag, i) => (
                <div
                  key={bag.id}
                  className="flex items-center space-x-2 p-2 rounded-xl bg-slate-50 border border-slate-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-fresh-500 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-fresh-100 text-fresh-900 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                    S#{i + 1}
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      step="0.001"
                      min="0.1"
                      placeholder="5.000"
                      value={bag.weightKg}
                      onChange={(e) => updateSmallBag(i, e.target.value)}
                      className="w-full bg-transparent px-2 py-1 text-sm font-mono font-bold text-charcoal-900 focus:outline-none"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400">kg</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSmallBag(i)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Pandlu Bags Section */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-amber-100 gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-950 flex items-center space-x-1.5">
                <span className="text-base">🍋</span>
                <span>Ripe Lemon Bags (Pandlu)</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-mono font-bold ml-1">
                  {calculations.validPandluCount} ({calculations.totalPandluWeightKg.toFixed(3)} kg)
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={() => addPandluBag()}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs shadow-2xs transition"
            >
              + Add
            </button>
          </div>

          {/* Quick presets for Pandlu */}
          <div className="flex items-center space-x-1 py-0.5 overflow-x-auto text-xs text-slate-500">
            <span className="text-[10px] font-bold text-amber-700 whitespace-nowrap mr-1">Quick:</span>
            {[48, 49, 50, 51, 52].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => addPandluBag(w)}
                className="px-2 py-0.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 font-mono font-bold text-xs text-amber-950 whitespace-nowrap transition"
              >
                +{w}kg
              </button>
            ))}
          </div>

          {pandluBags.length === 0 ? (
            <div className="p-2.5 rounded-xl bg-amber-50/50 border border-dashed border-amber-200 text-center text-xs text-amber-800">
              No ripe lemon bags. Tap + Add if needed.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {pandluBags.map((bag, i) => (
                <div
                  key={bag.id}
                  className="flex items-center space-x-2 p-2 rounded-xl bg-amber-50/60 border border-amber-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-400 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-200 text-amber-950 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                    P#{i + 1}
                  </div>
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      step="0.001"
                      min="0.1"
                      placeholder="50.000"
                      value={bag.weightKg}
                      onChange={(e) => updatePandluBag(i, e.target.value)}
                      className="w-full bg-transparent px-2 py-1 text-sm font-mono font-bold text-charcoal-900 focus:outline-none"
                    />
                    <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400">kg</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePandluBag(i)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. Sticky Bottom Summary & Save Button */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400 block">Total</span>
              <div className="text-xl sm:text-2xl font-mono font-black text-charcoal-900">
                {calculations.totalBags} <span className="text-xs font-bold text-slate-500">bags</span> •{' '}
                <span className="text-fresh-700">{calculations.totalWeightKg.toFixed(3)} kg</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || calculations.totalBags === 0 || !selectedCustomerId}
              className="px-6 py-3 rounded-xl bg-lemon-400 hover:bg-lemon-500 text-charcoal-950 text-sm font-black shadow-md transition transform active:scale-95 disabled:opacity-50 flex items-center space-x-1.5"
            >
              <span>{isSubmitting ? 'Saving...' : 'Save Weights'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
