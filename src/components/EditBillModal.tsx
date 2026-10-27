import React, { useState, useEffect } from 'react';
import { X, Trash2, Check, AlertCircle } from 'lucide-react';
import { Bill } from '../types';
import { updateFullBill } from '../api';

interface EditBillModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedBill: Bill) => void;
}

export const EditBillModal: React.FC<EditBillModalProps> = ({
  bill,
  isOpen,
  onClose,
  onSaved,
}) => {
  if (!isOpen || !bill) return null;

  const [billDate, setBillDate] = useState<string>('');
  const [largeBags, setLargeBags] = useState<Array<{ id: string; weightKg: string }>>([]);
  const [smallBags, setSmallBags] = useState<Array<{ id: string; weightKg: string }>>([]);
  const [pandluBags, setPandluBags] = useState<Array<{ id: string; weightKg: string }>>([]);

  const [pricePerKg, setPricePerKg] = useState<string>('0');
  const [pricePerKgPandlu, setPricePerKgPandlu] = useState<string>('0');

  const [commissionRate, setCommissionRate] = useState<string>('5.0');
  const [labourCharges, setLabourCharges] = useState<string>('0');
  const [transportCharges, setTransportCharges] = useState<string>('0');
  const [otherCharges, setOtherCharges] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');

  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize form when bill opens
  useEffect(() => {
    if (bill) {
      setBillDate(bill.billDate ? bill.billDate.slice(0, 10) : '');

      const l = bill.bags ? bill.bags.filter((b) => b.bagType === 'LARGE') : [];
      const s = bill.bags ? bill.bags.filter((b) => b.bagType === 'SMALL') : [];
      const p = bill.bags ? bill.bags.filter((b) => b.bagType === 'PANDLU') : [];

      setLargeBags(
        l.length > 0
          ? l.map((b, i) => ({ id: `l-${i}-${Date.now()}`, weightKg: b.weightKg ? String(b.weightKg) : '' }))
          : [{ id: `l-init-${Date.now()}`, weightKg: '' }]
      );

      setSmallBags(
        s.map((b, i) => ({ id: `s-${i}-${Date.now()}`, weightKg: b.weightKg ? String(b.weightKg) : '' }))
      );

      setPandluBags(
        p.map((b, i) => ({ id: `p-${i}-${Date.now()}`, weightKg: b.weightKg ? String(b.weightKg) : '' }))
      );

      setPricePerKg(bill.pricePerKg ? String(bill.pricePerKg) : '0');
      setPricePerKgPandlu(bill.pricePerKgPandlu ? String(bill.pricePerKgPandlu) : '0');

      setCommissionRate(String(bill.commissionRate ?? 5.0));
      setLabourCharges(String(bill.labourCharges ?? 0));
      setTransportCharges(String(bill.transportCharges ?? 0));
      setOtherCharges(String(bill.otherCharges ?? 0));
      setNotes(bill.notes || '');
      setErrorMsg(null);
    }
  }, [bill, isOpen]);

  // Bag management functions
  const addLargeBag = (presetWeight?: number) => {
    setLargeBags((prev) => [
      ...prev,
      { id: `l-${Date.now()}-${Math.random()}`, weightKg: presetWeight ? String(presetWeight) : '' },
    ]);
  };

  const removeLargeBag = (index: number) => {
    setLargeBags((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLargeBag = (index: number, val: string) => {
    setLargeBags((prev) => {
      const copy = [...prev];
      copy[index].weightKg = val;
      return copy;
    });
  };

  const addSmallBag = (presetWeight?: number) => {
    setSmallBags((prev) => [
      ...prev,
      { id: `s-${Date.now()}-${Math.random()}`, weightKg: presetWeight ? String(presetWeight) : '' },
    ]);
  };

  const removeSmallBag = (index: number) => {
    setSmallBags((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSmallBag = (index: number, val: string) => {
    setSmallBags((prev) => {
      const copy = [...prev];
      copy[index].weightKg = val;
      return copy;
    });
  };

  const addPandluBag = (presetWeight?: number) => {
    setPandluBags((prev) => [
      ...prev,
      { id: `p-${Date.now()}-${Math.random()}`, weightKg: presetWeight ? String(presetWeight) : '' },
    ]);
  };

  const removePandluBag = (index: number) => {
    setPandluBags((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePandluBag = (index: number, val: string) => {
    setPandluBags((prev) => {
      const copy = [...prev];
      copy[index].weightKg = val;
      return copy;
    });
  };

  // Live calculations
  const parsedLarge = largeBags
    .map((b) => parseFloat(b.weightKg))
    .filter((w) => !isNaN(w) && w > 0);
  const totalLargeWeightKg = Number(
    (parsedLarge.reduce((a, b) => a + Math.round(b * 1000), 0) / 1000).toFixed(3)
  );

  const parsedSmall = smallBags
    .map((b) => parseFloat(b.weightKg))
    .filter((w) => !isNaN(w) && w > 0);
  const totalSmallWeightKg = Number(
    (parsedSmall.reduce((a, b) => a + Math.round(b * 1000), 0) / 1000).toFixed(3)
  );

  const parsedPandlu = pandluBags
    .map((b) => parseFloat(b.weightKg))
    .filter((w) => !isNaN(w) && w > 0);
  const totalPandluWeightKg = Number(
    (parsedPandlu.reduce((a, b) => a + Math.round(b * 1000), 0) / 1000).toFixed(3)
  );

  const totalBags = parsedLarge.length + parsedSmall.length + parsedPandlu.length;
  const totalWeightKg = Number(
    (totalLargeWeightKg + totalSmallWeightKg + totalPandluWeightKg).toFixed(3)
  );

  const normalRate = parseFloat(pricePerKg) || 0;
  const pandluRate = parseFloat(pricePerKgPandlu) || normalRate;

  const normalWeight = Number((totalLargeWeightKg + totalSmallWeightKg).toFixed(3));
  const grossNormal = Number((normalWeight * normalRate).toFixed(2));
  const grossPandlu = Number((totalPandluWeightKg * pandluRate).toFixed(2));
  const calculatedGross = Number((grossNormal + grossPandlu).toFixed(2));

  const commRate = parseFloat(commissionRate) || 0;
  const calculatedCommission = Number(((calculatedGross * commRate) / 100).toFixed(2));
  const calculatedLabour = parseFloat(labourCharges) || 0;
  const calculatedTransport = parseFloat(transportCharges) || 0;
  const calculatedOther = parseFloat(otherCharges) || 0;

  const calculatedTotalDeductions = Number(
    (calculatedCommission + calculatedLabour + calculatedTransport + calculatedOther).toFixed(2)
  );
  const calculatedNetPayable = Math.max(0, Number((calculatedGross - calculatedTotalDeductions).toFixed(2)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalBags === 0) {
      setErrorMsg('Please enter at least one bag weight.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const res = await updateFullBill(bill.id, {
        billDate,
        largeBags: parsedLarge.map((w, i) => ({ bagIndex: i + 1, weightKg: w })),
        smallBags: parsedSmall.map((w, i) => ({ bagIndex: i + 1, weightKg: w })),
        pandluBags: parsedPandlu.map((w, i) => ({ bagIndex: i + 1, weightKg: w })),
        pricePerKg: normalRate,
        pricePerKgPandlu: parsedPandlu.length > 0 ? pandluRate : undefined,
        commissionRate: commRate,
        labourCharges: calculatedLabour,
        transportCharges: calculatedTransport,
        otherCharges: calculatedOther,
        notes,
      });

      onSaved(res.bill);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update bill');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl">✏️</span>
              <h3 className="text-base font-black text-charcoal-900">
                Edit Bill #{bill.billNumber}
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-lemon-200 text-amber-950 border border-lemon-400">
                {bill.customer.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Modify bag weights, prices, and deductions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-charcoal-900 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Bill Date */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-700">Bill Date:</span>
            <input
              type="date"
              value={billDate}
              onChange={(e) => setBillDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 font-bold text-xs bg-white focus:ring-2 focus:ring-lemon-400 focus:outline-none"
            />
          </div>

          {/* Section 1: Large Bags */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-charcoal-900 block">
                  🛍️ Large Bags ({parsedLarge.length})
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Subtotal: <strong className="text-fresh-700">{totalLargeWeightKg.toFixed(3)} kg</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => addLargeBag()}
                className="px-3 py-1.5 rounded-xl bg-lemon-400 hover:bg-lemon-500 text-charcoal-950 font-bold text-xs shadow-2xs transition"
              >
                + Add Bag
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {largeBags.map((bag, idx) => (
                <div
                  key={bag.id}
                  className="flex items-center space-x-1.5 p-1.5 bg-white border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-lemon-400"
                >
                  <span className="text-[11px] font-mono font-bold text-slate-400 pl-1">
                    #{idx + 1}
                  </span>
                  <input
                    type="number"
                    step="0.001"
                    min="0.1"
                    placeholder="kg"
                    value={bag.weightKg}
                    onChange={(e) => updateLargeBag(idx, e.target.value)}
                    className="w-full bg-transparent text-xs font-mono font-bold text-charcoal-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => removeLargeBag(idx)}
                    className="p-1 text-slate-300 hover:text-rose-600 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Small Bags */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-charcoal-900 block">
                  👜 Small Bags ({parsedSmall.length})
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Subtotal: <strong className="text-fresh-700">{totalSmallWeightKg.toFixed(3)} kg</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => addSmallBag()}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-charcoal-900 font-bold text-xs shadow-2xs transition"
              >
                + Add Small Bag
              </button>
            </div>

            {smallBags.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No small bags in this bill.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {smallBags.map((bag, idx) => (
                  <div
                    key={bag.id}
                    className="flex items-center space-x-1.5 p-1.5 bg-white border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-lemon-400"
                  >
                    <span className="text-[11px] font-mono font-bold text-slate-400 pl-1">
                      S#{idx + 1}
                    </span>
                    <input
                      type="number"
                      step="0.001"
                      min="0.1"
                      placeholder="kg"
                      value={bag.weightKg}
                      onChange={(e) => updateSmallBag(idx, e.target.value)}
                      className="w-full bg-transparent text-xs font-mono font-bold text-charcoal-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeSmallBag(idx)}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Ripe Lemon Bags (Pandlu) */}
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-950 block">
                  🍋 Ripe Lemon Bags ({parsedPandlu.length})
                </span>
                <span className="text-[11px] text-amber-800 font-mono">
                  Subtotal: <strong>{totalPandluWeightKg.toFixed(3)} kg</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => addPandluBag()}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs shadow-2xs transition"
              >
                + Add Ripe Bag
              </button>
            </div>

            {pandluBags.length === 0 ? (
              <p className="text-xs text-amber-800/60 italic">No ripe lemon bags in this bill.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {pandluBags.map((bag, idx) => (
                  <div
                    key={bag.id}
                    className="flex items-center space-x-1.5 p-1.5 bg-white border border-amber-300 rounded-xl focus-within:ring-2 focus-within:ring-amber-400"
                  >
                    <span className="text-[11px] font-mono font-bold text-amber-700 pl-1">
                      R#{idx + 1}
                    </span>
                    <input
                      type="number"
                      step="0.001"
                      min="0.1"
                      placeholder="kg"
                      value={bag.weightKg}
                      onChange={(e) => updatePandluBag(idx, e.target.value)}
                      className="w-full bg-transparent text-xs font-mono font-bold text-amber-950 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removePandluBag(idx)}
                      className="p-1 text-slate-300 hover:text-rose-600 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Rates / Pricing */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal-900 block">
              🏷️ Prices per Kilogram
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Normal Lemon Rate (₹/kg) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={pricePerKg}
                    onChange={(e) => setPricePerKg(e.target.value)}
                    className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-sm text-charcoal-900 bg-white focus:outline-none focus:ring-2 focus:ring-lemon-400"
                  />
                </div>
              </div>

              {parsedPandlu.length > 0 && (
                <div>
                  <label className="text-[11px] font-bold text-amber-900 block mb-1">
                    Ripe Lemons Rate (₹/kg) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-amber-600 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={pricePerKgPandlu}
                      onChange={(e) => setPricePerKgPandlu(e.target.value)}
                      className="w-full pl-7 pr-3 py-1.5 rounded-xl border border-amber-300 font-mono font-bold text-sm text-amber-950 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-600">Calculated Gross:</span>
              <span className="text-base font-mono font-black text-charcoal-950">
                ₹{calculatedGross.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Section 5: Deductions */}
          <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-900 block">
              ✂️ Deductions
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Commission %</label>
                <input
                  type="number"
                  step="0.5"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-rose-200 bg-white font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Labour / Hamali ₹</label>
                <input
                  type="number"
                  step="1"
                  value={labourCharges}
                  onChange={(e) => setLabourCharges(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-rose-200 bg-white font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Transport ₹</label>
                <input
                  type="number"
                  step="1"
                  value={transportCharges}
                  onChange={(e) => setTransportCharges(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-rose-200 bg-white font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Other Charges ₹</label>
                <input
                  type="number"
                  step="1"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-rose-200 bg-white font-mono font-bold text-xs"
                />
              </div>
            </div>

            {/* Net Payable Summary Banner */}
            <div className="p-3 bg-fresh-50 rounded-2xl border-2 border-fresh-400 flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-fresh-950 block">Net Payable to Farmer</span>
                <span className="text-[10px] text-fresh-700 font-mono">
                  Gross ₹{calculatedGross.toFixed(2)} − Deductions ₹{calculatedTotalDeductions.toFixed(2)}
                </span>
              </div>
              <span className="text-2xl font-mono font-black text-fresh-950">
                ₹{calculatedNetPayable.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">
              Notes / Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Rate adjusted after negotiation"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none"
            />
          </div>
        </form>

        {/* Modal Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2.5 bg-fresh-600 hover:bg-fresh-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
