import React from 'react';
import { X, Printer, Share2, CheckCircle2, Edit3 } from 'lucide-react';
import { Bill, BusinessSettings } from '../types';
import { Language } from '../i18n';
import { Logo } from './Logo';

interface BillReceiptModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenEdit?: (bill: Bill) => void;
  settings?: BusinessSettings | null;
  lang?: Language;
}

export const BillReceiptModal: React.FC<BillReceiptModalProps> = ({
  bill,
  isOpen,
  onClose,
  onOpenEdit,
  settings,
}) => {
  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const bizName = settings?.businessName || 'SRC LEMONS';
    const dateFormatted = new Date(bill.billDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const largeBags = bill.bags ? bill.bags.filter((b) => b.bagType === 'LARGE') : [];
    const smallBags = bill.bags ? bill.bags.filter((b) => b.bagType === 'SMALL') : [];
    const pandluBags = bill.bags ? bill.bags.filter((b) => b.bagType === 'PANDLU') : [];

    let text = `🍋 *${bizName.toUpperCase()} - PURCHASE RECEIPT*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📄 *Bill No:* ${bill.billNumber}\n`;
    text += `📅 *Date:* ${dateFormatted}\n`;
    text += `👤 *Farmer:* ${bill.customer.name} (${bill.customer.mobile})\n`;
    if (bill.customer.village) text += `📍 *Place:* ${bill.customer.village}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;

    if (largeBags.length > 0) {
      text += `*LARGE BAGS (${largeBags.length}):*\n`;
      largeBags.forEach((b) => {
        text += `  • #${b.bagIndex}: ${b.weightKg.toFixed(3)} kg\n`;
      });
      text += `  *Subtotal:* ${bill.totalLargeWeight.toFixed(3)} kg\n\n`;
    }

    if (smallBags.length > 0) {
      text += `*SMALL BAGS (${smallBags.length}):*\n`;
      smallBags.forEach((b) => {
        text += `  • S#${b.bagIndex}: ${b.weightKg.toFixed(3)} kg\n`;
      });
      text += `  *Subtotal:* ${bill.totalSmallWeight.toFixed(3)} kg\n\n`;
    }

    if (pandluBags.length > 0) {
      text += `*RIPE LEMON BAGS (${pandluBags.length}):*\n`;
      pandluBags.forEach((b) => {
        text += `  • R#${b.bagIndex}: ${b.weightKg.toFixed(3)} kg\n`;
      });
      text += `  *Subtotal:* ${(bill.totalPandluWeight || 0).toFixed(3)} kg\n\n`;
    }

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📦 *Total Bags:* ${bill.totalBags}\n`;
    text += `⚖️ *Total Weight:* ${bill.totalWeight.toFixed(3)} kg\n`;

    if (bill.pricePerKg > 0) {
      text += `🏷️ *Normal Rate:* ₹${bill.pricePerKg.toFixed(2)}/kg\n`;
      if ((bill.totalPandluBags || 0) > 0 && bill.pricePerKgPandlu) {
        text += `🏷️ *Ripe Lemons Rate:* ₹${bill.pricePerKgPandlu.toFixed(2)}/kg\n`;
      }
      text += `💰 *Gross Amount:* ₹${bill.grossAmount.toFixed(2)}\n`;
      if (bill.stage === 'FINAL_BILLED') {
        text += `━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `*DEDUCTIONS:*\n`;
        if (bill.commissionAmount > 0) {
          text += `  • Commission (${bill.commissionRate}%): -₹${bill.commissionAmount.toFixed(2)}\n`;
        }
        if (bill.labourCharges > 0) {
          text += `  • Hamali / Labour: -₹${bill.labourCharges.toFixed(2)}\n`;
        }
        if (bill.transportCharges > 0) {
          text += `  • Transport: -₹${bill.transportCharges.toFixed(2)}\n`;
        }
        if (bill.otherCharges > 0) {
          text += `  • Other Charges: -₹${bill.otherCharges.toFixed(2)}\n`;
        }
        text += `━━━━━━━━━━━━━━━━━━━━━\n`;
        text += `💵 *NET PAYABLE TO FARMER:* ₹${bill.netPayable.toFixed(2)}\n`;
      }
    } else {
      text += `🏷️ *Rate:* Auction price pending (Will be calculated once rate is set)\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `🙏 *Thank you - ${bizName}*`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?phone=+91${bill.customer.mobile}&text=${encoded}`, '_blank');
  };

  const largeBags = bill.bags ? bill.bags.filter((b) => b.bagType === 'LARGE') : [];
  const smallBags = bill.bags ? bill.bags.filter((b) => b.bagType === 'SMALL') : [];
  const pandluBags = bill.bags ? bill.bags.filter((b) => b.bagType === 'PANDLU') : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-charcoal-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Modal Top Bar */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🍋</span>
            <span className="font-bold text-charcoal-900 text-sm">
              {bill.stage === 'WEIGHED'
                ? 'Lemon Bags Weighing Details'
                : 'Farmer Purchase Receipt'}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-lemon-100 text-amber-800 border border-lemon-300">
              {bill.billNumber}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-charcoal-900 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Area */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-5 printable-receipt text-charcoal-900 bg-white">
          {/* Business Header with Brand Logo */}
          <div className="text-center pb-4 border-b-2 border-dashed border-slate-300 flex flex-col items-center">
            <Logo size="lg" />
            <h2 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight mt-2">
              SRC LEMONS
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-sm">
              Lakshmipuram Market Yard, Eluru District
            </p>
            <p className="text-xs font-semibold text-slate-700 mt-0.5">
              📞 9441728444
            </p>
          </div>

          {/* Farmer & Bill Metadata */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <p className="text-slate-500 font-medium">Farmer / Supplier:</p>
              <p className="font-bold text-sm text-charcoal-900 mt-0.5">{bill.customer.name}</p>
              <p className="text-slate-600 font-mono mt-0.5">📱 {bill.customer.mobile}</p>
              {bill.customer.village && <p className="text-slate-600 mt-0.5">📍 {bill.customer.village}</p>}
            </div>
            <div className="text-right">
              <p className="text-slate-500 font-medium">Bill No & Date:</p>
              <p className="font-mono font-bold text-xs text-charcoal-900 mt-0.5">{bill.billNumber}</p>
              <p className="text-slate-600 mt-0.5">
                {new Date(bill.billDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          {/* Large Bags */}
          {largeBags.length > 0 && (
            <div>
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="text-xs font-bold uppercase text-charcoal-800">
                  🛍️ Large Bags ({largeBags.length})
                </span>
                <span className="text-xs font-mono font-bold text-fresh-700">{bill.totalLargeWeight.toFixed(3)} kg</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {largeBags.map((bag) => (
                  <div key={bag.bagIndex} className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between">
                    <span className="text-slate-400">#{bag.bagIndex}</span>
                    <span className="font-mono font-bold">{bag.weightKg.toFixed(3)} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Small Bags */}
          {smallBags.length > 0 && (
            <div>
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="text-xs font-bold uppercase text-charcoal-800">
                  👜 Small Bags ({smallBags.length})
                </span>
                <span className="text-xs font-mono font-bold text-fresh-700">{bill.totalSmallWeight.toFixed(3)} kg</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {smallBags.map((bag) => (
                  <div key={bag.bagIndex} className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex justify-between">
                    <span className="text-slate-400">S#{bag.bagIndex}</span>
                    <span className="font-mono font-bold">{bag.weightKg.toFixed(3)} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ripe Lemon Bags (Pandlu) */}
          {pandluBags.length > 0 && (
            <div>
              <div className="flex items-center justify-between pb-1 border-b border-amber-200">
                <span className="text-xs font-bold uppercase text-amber-950">
                  🍋 Ripe Lemon Bags ({pandluBags.length})
                </span>
                <span className="text-xs font-mono font-bold text-amber-900">{(bill.totalPandluWeight || 0).toFixed(3)} kg</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                {pandluBags.map((bag) => (
                  <div key={bag.bagIndex} className="p-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs flex justify-between text-amber-950">
                    <span className="text-amber-600 font-bold">R#{bag.bagIndex}</span>
                    <span className="font-mono font-bold">{bag.weightKg.toFixed(3)} kg</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Financial Breakdown with Deductions */}
          <div className="border-t-2 border-dashed border-slate-300 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-700">
              <span>Total Bags & Weight:</span>
              <span className="font-mono font-bold text-charcoal-900">
                {bill.totalBags} bags • {bill.totalWeight.toFixed(3)} kg
              </span>
            </div>

            {bill.pricePerKg > 0 ? (
              <>
                {/* Rates */}
                <div className="flex justify-between text-slate-700">
                  <span>Normal Lemon Rate:</span>
                  <span className="font-mono font-bold text-charcoal-900">₹{bill.pricePerKg.toFixed(2)}/kg</span>
                </div>

                {(bill.totalPandluBags || 0) > 0 && bill.pricePerKgPandlu ? (
                  <div className="flex justify-between text-amber-900 font-medium">
                    <span>Ripe Lemons Rate:</span>
                    <span className="font-mono font-bold text-amber-950">₹{bill.pricePerKgPandlu.toFixed(2)}/kg</span>
                  </div>
                ) : null}

                <div className="flex justify-between text-slate-800 font-bold pt-1 border-t border-slate-100">
                  <span>Gross Bill Amount:</span>
                  <span className="font-mono text-sm font-black text-charcoal-950">₹{bill.grossAmount.toFixed(2)}</span>
                </div>

                {/* Deductions Sub-block */}
                {bill.stage === 'FINAL_BILLED' && (
                  <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-200 space-y-1 mt-2 text-[11px]">
                    <span className="font-bold text-rose-900 uppercase block">Deductions:</span>
                    {bill.commissionAmount > 0 && (
                      <div className="flex justify-between text-rose-800">
                        <span>Commission ({bill.commissionRate}%):</span>
                        <span className="font-mono font-bold">-₹{bill.commissionAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {bill.labourCharges > 0 && (
                      <div className="flex justify-between text-rose-800">
                        <span>Labour / Hamali:</span>
                        <span className="font-mono font-bold">-₹{bill.labourCharges.toFixed(2)}</span>
                      </div>
                    )}
                    {bill.transportCharges > 0 && (
                      <div className="flex justify-between text-rose-800">
                        <span>Transport Charges:</span>
                        <span className="font-mono font-bold">-₹{bill.transportCharges.toFixed(2)}</span>
                      </div>
                    )}
                    {bill.otherCharges > 0 && (
                      <div className="flex justify-between text-rose-800">
                        <span>Other / Bag Charges:</span>
                        <span className="font-mono font-bold">-₹{bill.otherCharges.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-rose-900 font-bold pt-1 border-t border-rose-200">
                      <span>Total Deductions:</span>
                      <span className="font-mono font-black">-₹{bill.totalDeductions.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Net Payable to Farmer */}
                {bill.stage === 'FINAL_BILLED' && (
                  <div className="flex justify-between items-center py-2.5 px-3 bg-fresh-100/90 rounded-xl border border-fresh-300 font-black text-sm text-fresh-950 mt-2">
                    <span>Net Payable to Farmer:</span>
                    <span className="font-mono text-lg font-black">₹{bill.netPayable.toFixed(2)}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-center space-y-1 mt-2">
                <span className="text-xs font-black text-amber-950 uppercase block">
                  ⚠️ Lemon Price Pending
                </span>
                <p className="text-[11px] text-amber-800">
                  Bag weights are safely recorded. Tap "Set Price" on the dashboard once auction price is decided.
                </p>
              </div>
            )}
          </div>

          {/* Footer Signature */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              <p>SRC LEMONS Billing System</p>
              <p className="text-[10px] text-slate-400">{new Date().toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <div className="h-8 border-b border-slate-300 w-28 mb-1"></div>
              <p className="font-semibold text-slate-700">Merchant Signature</p>
            </div>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="print:hidden p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-white transition"
          >
            Close
          </button>

          <div className="flex items-center space-x-2">
            {onOpenEdit && (
              <button
                onClick={() => {
                  onClose();
                  onOpenEdit(bill);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-black transition shadow-xs"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Bill</span>
              </button>
            )}

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-lemon-400 text-charcoal-900 text-sm font-bold hover:bg-lemon-500 transition border border-lemon-500/30"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
