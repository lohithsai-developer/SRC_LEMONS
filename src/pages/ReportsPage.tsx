import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  ShoppingBag,
  Scale,
  IndianRupee,
  Wallet,
  Clock,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { getSalesReport, getCustomers } from '../api';
import { Customer } from '../types';
import { Language, t } from '../i18n';

interface ReportsPageProps {
  lang: Language;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ lang }) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [customerId, setCustomerId] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'period' | 'customer'>('period');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCustomers().then((res) => setCustomers(res.customers));
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await getSalesReport({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        customerId: customerId !== 'ALL' ? customerId : undefined,
        status: status !== 'ALL' ? status : undefined,
        period,
      });
      setReportData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate, customerId, status, period]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!reportData) return;

    let headers: string[] = [];
    let rows: any[] = [];
    let filename = `Lemon-Report-${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeTab === 'period') {
      headers = ['Period', 'Bills Count', 'Large Bags', 'Small Bags', 'Total Bags', 'Total Weight (kg)', 'Sales (₹)', 'Paid (₹)', 'Balance (₹)'];
      rows = reportData.periodBreakdown.map((r: any) => [
        r.period,
        r.billCount,
        r.totalLargeBags,
        r.totalSmallBags,
        r.totalBags,
        r.totalWeight.toFixed(3),
        r.salesAmount.toFixed(2),
        r.amountPaid.toFixed(2),
        r.balanceAmount.toFixed(2),
      ]);
    } else {
      headers = ['Customer ID', 'Customer Name', 'Mobile', 'Village', 'Bills Count', 'Total Bags', 'Total Weight (kg)', 'Total Sales (₹)', 'Paid (₹)', 'Balance (₹)'];
      rows = reportData.customerBreakdown.map((r: any) => [
        r.customerId,
        `"${r.name}"`,
        r.mobile,
        `"${r.village}"`,
        r.billCount,
        r.totalBags,
        r.totalWeight.toFixed(3),
        r.salesAmount.toFixed(2),
        r.amountPaid.toFixed(2),
        r.balanceAmount.toFixed(2),
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-charcoal-900 tracking-tight flex items-center space-x-2">
            <span>📊</span>
            <span>{t('reports', lang)}</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Sales Analytics, Bag Statistics & Accounting Reports
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs sm:text-sm shadow-xs transition self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>{t('exportCsv', lang)}</span>
        </button>
      </div>

      {/* Date & Filter Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-800 block mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-lemon-400 bg-slate-50"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-800 block mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-lemon-400 bg-slate-50"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-800 block mb-1">
              Filter Customer
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-lemon-400"
            >
              <option value="ALL">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.mobile})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-800 block mb-1">
              Payment Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-lemon-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
        </div>

        {/* Period selection pills */}
        <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 uppercase mr-1">Group By:</span>
          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition ${
                period === p
                  ? 'bg-lemon-400 text-charcoal-900 border border-lemon-500/30'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      {reportData?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Total Volume</span>
            <div className="text-xl sm:text-2xl font-mono font-black text-fresh-700 mt-1">
              {reportData.summary.totalWeight.toFixed(3)} <span className="text-xs text-slate-500">kg</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {reportData.summary.totalLargeBags} Large ({reportData.summary.totalLargeWeight.toFixed(1)}kg) +{' '}
              {reportData.summary.totalSmallBags} Small ({reportData.summary.totalSmallWeight.toFixed(1)}kg)
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Net Sales</span>
            <div className="text-xl sm:text-2xl font-mono font-black text-charcoal-900 mt-1">
              ₹{reportData.summary.netTotalSales.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{reportData.summary.totalBills} bills generated</p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Total Received</span>
            <div className="text-xl sm:text-2xl font-mono font-black text-fresh-700 mt-1">
              ₹{reportData.summary.totalPaid.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-fresh-700 mt-0.5">Cash & UPI collections</p>
          </div>

          <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800 block">Outstanding Due</span>
            <div className="text-xl sm:text-2xl font-mono font-black text-rose-700 mt-1">
              ₹{reportData.summary.totalOutstanding.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-rose-600 mt-0.5">Market receivables</p>
          </div>
        </div>
      )}

      {/* Tabs: Breakdown Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3">
          <button
            onClick={() => setActiveTab('period')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'period'
                ? 'border-fresh-600 text-fresh-800'
                : 'border-transparent text-slate-500 hover:text-charcoal-900'
            }`}
          >
            Period Breakdown ({period.toUpperCase()})
          </button>
          <button
            onClick={() => setActiveTab('customer')}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'customer'
                ? 'border-fresh-600 text-fresh-800'
                : 'border-transparent text-slate-500 hover:text-charcoal-900'
            }`}
          >
            Customer-wise Breakdown
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-slate-400 font-medium text-xs">Generating report data...</div>
          ) : activeTab === 'period' ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="pb-3">Period</th>
                  <th className="pb-3 text-center">Bills</th>
                  <th className="pb-3 text-center">Large Bags</th>
                  <th className="pb-3 text-center">Small Bags</th>
                  <th className="pb-3 text-center">Total Bags</th>
                  <th className="pb-3 text-right">Weight (kg)</th>
                  <th className="pb-3 text-right">Sales (₹)</th>
                  <th className="pb-3 text-right">Received (₹)</th>
                  <th className="pb-3 text-right">Outstanding (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData?.periodBreakdown?.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No records for this range.
                    </td>
                  </tr>
                ) : (
                  reportData?.periodBreakdown?.map((row: any) => (
                    <tr key={row.period} className="hover:bg-slate-50 font-medium">
                      <td className="py-3 font-mono font-bold text-charcoal-900">{row.period}</td>
                      <td className="py-3 text-center font-mono">{row.billCount}</td>
                      <td className="py-3 text-center font-mono">{row.totalLargeBags}</td>
                      <td className="py-3 text-center font-mono">{row.totalSmallBags}</td>
                      <td className="py-3 text-center font-mono font-bold">{row.totalBags}</td>
                      <td className="py-3 text-right font-mono font-bold text-fresh-700">
                        {row.totalWeight.toFixed(3)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-charcoal-900">
                        ₹{row.salesAmount.toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-fresh-700">
                        ₹{row.amountPaid.toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-mono font-black text-rose-600">
                        ₹{row.balanceAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Mobile & Place</th>
                  <th className="pb-3 text-center">Bills</th>
                  <th className="pb-3 text-center">Total Bags</th>
                  <th className="pb-3 text-right">Weight (kg)</th>
                  <th className="pb-3 text-right">Total Purchases (₹)</th>
                  <th className="pb-3 text-right">Paid (₹)</th>
                  <th className="pb-3 text-right">Balance Due (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData?.customerBreakdown?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No records for this range.
                    </td>
                  </tr>
                ) : (
                  reportData?.customerBreakdown?.map((c: any) => (
                    <tr key={c.customerId} className="hover:bg-slate-50 font-medium">
                      <td className="py-3 font-bold text-charcoal-900">
                        {c.name}
                      </td>
                      <td className="py-3 font-mono text-slate-600">
                        {c.mobile}
                        <span className="block text-[10px] text-slate-400">{c.village}</span>
                      </td>
                      <td className="py-3 text-center font-mono">{c.billCount}</td>
                      <td className="py-3 text-center font-mono font-bold">{c.totalBags}</td>
                      <td className="py-3 text-right font-mono font-bold text-fresh-700">
                        {c.totalWeight.toFixed(3)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-charcoal-900">
                        ₹{c.salesAmount.toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-fresh-700">
                        ₹{c.amountPaid.toFixed(2)}
                      </td>
                      <td className="py-3 text-right font-mono font-black text-rose-600">
                        ₹{c.balanceAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
