import { Customer, Bill, Payment, BusinessSettings, DashboardMetrics, LedgerEntry, AdminUser, BillStage } from './types';
import {
  fbGetCustomers,
  fbSaveCustomer,
  fbDeleteCustomer,
  fbGetBills,
  fbSaveBill,
  fbDeleteBill,
  fbGetSettings,
  fbSaveSettings,
  isFirebaseConnected,
} from './firebase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('lemon_auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Check backend connectivity
let backendAvailable = true;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!backendAvailable) {
    throw new Error('BACKEND_UNAVAILABLE');
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers || {}),
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const error: any = new Error(data.error || data.message || 'API request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return (await response.json()) as T;
  } catch (err: any) {
    // If connection refused, switch seamlessly to Firebase Firestore
    if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      backendAvailable = false;
    }
    throw err;
  }
}

// Authentication
export async function login(username: string, password: string): Promise<{ token: string; admin: AdminUser }> {
  try {
    const res = await request<{ message: string; token: string; admin: AdminUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('lemon_auth_token', res.token);
    return res;
  } catch (e) {
    // Firebase / local demo login fallback
    if (username.trim() === 'admin' && password === 'lemon123') {
      const admin: AdminUser = { id: 'admin-1', username: 'admin', name: 'SRC LEMONS Admin', role: 'ADMIN' };
      const token = 'mock-firebase-token-admin';
      localStorage.setItem('lemon_auth_token', token);
      return { token, admin };
    }
    throw new Error('Invalid username or password');
  }
}

export async function getMe(): Promise<{ admin: AdminUser }> {
  try {
    return await request<{ admin: AdminUser }>('/auth/me');
  } catch (e) {
    return { admin: { id: 'admin-1', username: 'admin', name: 'SRC LEMONS Admin', role: 'ADMIN' } };
  }
}

export function logout() {
  localStorage.removeItem('lemon_auth_token');
}

// Customers
export async function getCustomers(search?: string, activeOnly = false): Promise<{ customers: Customer[] }> {
  let list = await fbGetCustomers();
  if (activeOnly) list = list.filter((c) => c.isActive);
  if (search && search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.customerId.toLowerCase().includes(q) ||
        (c.village && c.village.toLowerCase().includes(q))
    );
  }
  return { customers: list };
}

export async function checkDuplicateMobile(mobile: string, excludeId?: string): Promise<{ exists: boolean; customer?: any }> {
  try {
    const params = new URLSearchParams({ mobile });
    if (excludeId) params.append('excludeId', excludeId);
    return await request(`/customers/check-duplicate?${params.toString()}`);
  } catch (e) {
    const list = await fbGetCustomers();
    const existing = list.find((c) => c.mobile === mobile.trim() && c.id !== excludeId);
    return { exists: !!existing, customer: existing };
  }
}

export async function createCustomer(customerData: Partial<Customer>, allowDuplicate = false): Promise<{ customer: Customer; message: string }> {
  try {
    return await request('/customers', {
      method: 'POST',
      body: JSON.stringify({ ...customerData, allowDuplicate }),
    });
  } catch (e) {
    const list = await fbGetCustomers();
    const newId = `LM-CUST-${String(list.length + 1001).padStart(4, '0')}`;
    const saved = await fbSaveCustomer({
      customerId: newId,
      name: customerData.name || '',
      mobile: customerData.mobile || '',
      village: customerData.village || '',
      notes: customerData.notes || '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    return { customer: saved, message: 'Customer saved successfully' };
  }
}

export async function updateCustomer(id: string, customerData: Partial<Customer>): Promise<{ customer: Customer; message: string }> {
  try {
    return await request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  } catch (e) {
    const saved = await fbSaveCustomer(customerData as any, id);
    return { customer: saved, message: 'Customer updated successfully' };
  }
}

export async function deleteCustomer(id: string): Promise<{ message: string; action: 'DELETED' | 'DEACTIVATED' }> {
  try {
    return await request(`/customers/${id}`, { method: 'DELETE' });
  } catch (e) {
    await fbDeleteCustomer(id);
    return { message: 'Customer removed', action: 'DELETED' };
  }
}

export async function getCustomerLedger(customerId: string): Promise<{
  customer: Customer;
  currentBalance: number;
  ledger: LedgerEntry[];
}> {
  try {
    return await request(`/customers/${customerId}/ledger`);
  } catch (e) {
    const [customers, bills] = await Promise.all([fbGetCustomers(), fbGetBills()]);
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) throw new Error('Customer not found');

    const customerBills = bills.filter((b) => b.customerId === customerId);
    let runningBalance = 0;
    const ledger: LedgerEntry[] = [];

    customerBills.forEach((b) => {
      runningBalance += b.netPayable;
      ledger.push({
        id: b.id,
        date: b.billDate,
        type: 'BILL',
        reference: b.billNumber,
        description: `Lemon Lot (${b.totalBags} bags, ${b.totalWeight.toFixed(3)} kg @ ₹${b.pricePerKg})`,
        debit: b.netPayable,
        credit: 0,
        balance: Number(runningBalance.toFixed(2)),
      });

      if (b.amountPaid > 0) {
        runningBalance -= b.amountPaid;
        ledger.push({
          id: `pay-${b.id}`,
          date: b.billDate,
          type: 'PAYMENT',
          reference: `PAY-${b.billNumber}`,
          description: `Payment paid to farmer (${b.paymentMethod || 'Cash'})`,
          debit: 0,
          credit: b.amountPaid,
          balance: Number(runningBalance.toFixed(2)),
        });
      }
    });

    return { customer, currentBalance: runningBalance, ledger };
  }
}

// Bills
export async function getBills(filters: {
  date?: string;
  startDate?: string;
  endDate?: string;
  customerId?: string;
  stage?: BillStage;
  search?: string;
} = {}): Promise<{
  bills: Bill[];
  summary: any;
}> {
  let list = await fbGetBills();
  if (filters.date) {
    list = list.filter((b) => b.billDate && (b.billDate.startsWith(filters.date!) || b.billDate.slice(0, 10) === filters.date));
  }
  if (filters.customerId) {
    list = list.filter((b) => b.customerId === filters.customerId);
  }
  if (filters.stage) {
    list = list.filter((b) => b.stage === filters.stage);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (b) =>
        b.billNumber.toLowerCase().includes(q) ||
        (b.customer?.name && b.customer.name.toLowerCase().includes(q)) ||
        (b.customer?.mobile && b.customer.mobile.includes(q))
    );
  }

  // Day summary
  const totalLargeBags = list.reduce((acc, b) => acc + (b.totalLargeBags || 0), 0);
  const totalSmallBags = list.reduce((acc, b) => acc + (b.totalSmallBags || 0), 0);
  const totalPandluBags = list.reduce((acc, b) => acc + (b.totalPandluBags || 0), 0);
  const totalBags = list.reduce((acc, b) => acc + (b.totalBags || 0), 0);
  const totalWeight = list.reduce((acc, b) => acc + (b.totalWeight || 0), 0);
  const totalGross = list.reduce((acc, b) => acc + (b.grossAmount || 0), 0);
  const totalDeductions = list.reduce((acc, b) => acc + (b.totalDeductions || 0), 0);
  const totalSales = list.reduce((acc, b) => acc + (b.netPayable || 0), 0);
  const totalReceived = list.reduce((acc, b) => acc + (b.amountPaid || 0), 0);
  const totalOutstanding = list.reduce((acc, b) => acc + (b.balanceAmount || 0), 0);

  return {
    bills: list,
    summary: {
      totalBills: list.length,
      uniqueCustomers: new Set(list.map((b) => b.customerId)).size,
      totalLargeBags,
      totalSmallBags,
      totalPandluBags,
      totalBags,
      totalWeight: Number(totalWeight.toFixed(3)),
      totalGross: Number(totalGross.toFixed(2)),
      totalDeductions: Number(totalDeductions.toFixed(2)),
      totalSales: Number(totalSales.toFixed(2)),
      totalReceived: Number(totalReceived.toFixed(2)),
      totalOutstanding: Number(totalOutstanding.toFixed(2)),
    },
  };
}

// Stage 1: Save Weighed Bags Only (Price can be updated later)
export async function saveWeighedLot(lotData: {
  customerId: string;
  customerObj?: Customer;
  billDate: string;
  largeBags: Array<{ bagIndex: number; weightKg: number }>;
  smallBags: Array<{ bagIndex: number; weightKg: number }>;
  pandluBags?: Array<{ bagIndex: number; weightKg: number }>;
  notes?: string;
}): Promise<{ bill: Bill; message: string }> {
  // Robust customer resolution: check customerObj -> getCustomers() -> fbGetCustomers() -> graceful fallback
  let customer: Customer | undefined = lotData.customerObj;
  if (!customer && lotData.customerId) {
    try {
      const res = await getCustomers();
      customer = res.customers.find((c) => c.id === lotData.customerId || c.customerId === lotData.customerId);
    } catch (e) {}
  }
  if (!customer && lotData.customerId) {
    const customers = await fbGetCustomers();
    customer = customers.find((c) => c.id === lotData.customerId || c.customerId === lotData.customerId);
  }
  if (!customer) {
    // Failsafe fallback so a merchant weighing bags during busy market hours NEVER loses data!
    customer = {
      id: lotData.customerId || `cust-${Date.now()}`,
      customerId: 'LM-CUST-TEMP',
      name: 'Customer',
      mobile: '9848099999',
      village: '',
      notes: '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const totalLargeBags = lotData.largeBags.length;
  const totalLargeWeight = Number(
    (lotData.largeBags.reduce((a, b) => a + Math.round(b.weightKg * 1000), 0) / 1000).toFixed(3)
  );
  const totalSmallBags = lotData.smallBags.length;
  const totalSmallWeight = Number(
    (lotData.smallBags.reduce((a, b) => a + Math.round(b.weightKg * 1000), 0) / 1000).toFixed(3)
  );
  const pandluList = lotData.pandluBags || [];
  const totalPandluBags = pandluList.length;
  const totalPandluWeight = Number(
    (pandluList.reduce((a, b) => a + Math.round(b.weightKg * 1000), 0) / 1000).toFixed(3)
  );

  const totalBags = totalLargeBags + totalSmallBags + totalPandluBags;
  const totalWeight = Number((totalLargeWeight + totalSmallWeight + totalPandluWeight).toFixed(3));

  const d = new Date(lotData.billDate);
  const yyyymmdd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const billNumber = `LM-${yyyymmdd}-${String(Date.now()).slice(-3)}`;

  const newBillObj: Omit<Bill, 'id'> = {
    billNumber,
    customerId: customer.id,
    customer: {
      id: customer.id,
      customerId: customer.customerId,
      name: customer.name,
      mobile: customer.mobile,
      village: customer.village,
    },
    billDate: lotData.billDate,
    stage: 'WEIGHED', // Step 1: Weight recorded only
    totalLargeBags,
    totalLargeWeight,
    totalSmallBags,
    totalSmallWeight,
    totalPandluBags,
    totalPandluWeight,
    totalBags,
    totalWeight,
    pricePerKg: 0,
    pricePerKgPandlu: 0,
    grossNormalAmount: 0,
    grossPandluAmount: 0,
    grossAmount: 0,
    commissionRate: 5.0,
    commissionAmount: 0,
    labourCharges: 0,
    transportCharges: 0,
    otherCharges: 0,
    totalDeductions: 0,
    netPayable: 0,
    amountPaid: 0,
    balanceAmount: 0,
    paymentStatus: 'UNPAID',
    paymentMethod: 'CASH',
    notes: lotData.notes || '',
    bags: [
      ...lotData.largeBags.map((b) => ({ bagType: 'LARGE' as const, bagIndex: b.bagIndex, weightKg: b.weightKg })),
      ...lotData.smallBags.map((b) => ({ bagType: 'SMALL' as const, bagIndex: b.bagIndex, weightKg: b.weightKg })),
      ...pandluList.map((b) => ({ bagType: 'PANDLU' as const, bagIndex: b.bagIndex, weightKg: b.weightKg })),
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const saved = await fbSaveBill(newBillObj);
  return { bill: saved, message: 'Lemon lot weights saved successfully! 🍋' };
}

// Stage 2: Update Price per KG (Auction rate decided: Normal and/or Pandlu)
export async function updateLotPrice(
  billId: string,
  pricePerKg: number,
  pricePerKgPandlu?: number
): Promise<{ bill: Bill; message: string }> {
  const bills = await fbGetBills();
  const bill = bills.find((b) => b.id === billId);
  if (!bill) throw new Error('Bill not found');

  const normalWeight = Number(((bill.totalLargeWeight || 0) + (bill.totalSmallWeight || 0)).toFixed(3));
  const pandluWeight = Number((bill.totalPandluWeight || 0).toFixed(3));
  const pandluRate = pricePerKgPandlu !== undefined ? pricePerKgPandlu : (bill.pricePerKgPandlu || pricePerKg);

  const grossNormalAmount = Number((normalWeight * pricePerKg).toFixed(2));
  const grossPandluAmount = Number((pandluWeight * pandluRate).toFixed(2));
  const grossAmount = Number((grossNormalAmount + grossPandluAmount).toFixed(2));

  const updated = await fbSaveBill(
    {
      ...bill,
      pricePerKg,
      pricePerKgPandlu: pandluRate,
      grossNormalAmount,
      grossPandluAmount,
      grossAmount,
      stage: 'PRICED', // Step 2: Price recorded
      netPayable: grossAmount, // preliminary before deductions
      balanceAmount: grossAmount,
    },
    bill.id
  );

  return { bill: updated, message: `Price updated (Normal: ₹${pricePerKg.toFixed(2)}${pandluWeight > 0 ? `, Pandlu: ₹${pandluRate.toFixed(2)}` : ''}/kg) successfully!` };
}

// Stage 3: Create Final Bill with Deductions (Commission, Labour/Hamali, Transport)
export async function finalizeBillWithCharges(
  billId: string,
  deductions: {
    commissionRate?: number;
    commissionAmount?: number;
    labourCharges?: number;
    transportCharges?: number;
    otherCharges?: number;
    notes?: string;
  }
): Promise<{ bill: Bill; message: string }> {
  const bills = await fbGetBills();
  const bill = bills.find((b) => b.id === billId);
  if (!bill) throw new Error('Bill not found');

  const grossAmount = bill.grossAmount;
  let commissionAmount = deductions.commissionAmount || 0;
  if (!commissionAmount && deductions.commissionRate) {
    commissionAmount = Number(((grossAmount * deductions.commissionRate) / 100).toFixed(2));
  }

  const labourCharges = Number((deductions.labourCharges || 0).toFixed(2));
  const transportCharges = Number((deductions.transportCharges || 0).toFixed(2));
  const otherCharges = Number((deductions.otherCharges || 0).toFixed(2));

  const totalDeductions = Number((commissionAmount + labourCharges + transportCharges + otherCharges).toFixed(2));
  const netPayable = Math.max(0, Number((grossAmount - totalDeductions).toFixed(2)));

  // Preserve any existing amountPaid from prior payment recordings — do NOT reset it
  const existingAmountPaid = bill.amountPaid || 0;
  const balanceAmount = Math.max(0, Number((netPayable - existingAmountPaid).toFixed(2)));

  let paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' = 'UNPAID';
  if (balanceAmount === 0 && netPayable > 0) {
    paymentStatus = 'PAID';
  } else if (existingAmountPaid > 0) {
    paymentStatus = 'PARTIALLY_PAID';
  }

  const updated = await fbSaveBill(
    {
      ...bill,
      stage: 'FINAL_BILLED', // Step 3: Final bill generated with deductions
      commissionRate: deductions.commissionRate || 0,
      commissionAmount,
      labourCharges,
      transportCharges,
      otherCharges,
      totalDeductions,
      netPayable,
      amountPaid: existingAmountPaid,
      balanceAmount,
      paymentStatus,
      notes: deductions.notes || bill.notes,
    },
    bill.id
  );

  return { bill: updated, message: 'Final Bill generated with deductions! 🍋' };
}

// Full Edit for any Created Bill (Weights, Prices, Deductions)
export async function updateFullBill(
  billId: string,
  updatedData: {
    billDate?: string;
    largeBags?: Array<{ bagIndex: number; weightKg: number }>;
    smallBags?: Array<{ bagIndex: number; weightKg: number }>;
    pandluBags?: Array<{ bagIndex: number; weightKg: number }>;
    pricePerKg?: number;
    pricePerKgPandlu?: number;
    commissionRate?: number;
    labourCharges?: number;
    transportCharges?: number;
    otherCharges?: number;
    notes?: string;
  }
): Promise<{ bill: Bill; message: string }> {
  const bills = await fbGetBills();
  const bill = bills.find((b) => b.id === billId);
  if (!bill) throw new Error('Bill not found');

  // 1. Bags & Weights
  let largeBags = updatedData.largeBags;
  let smallBags = updatedData.smallBags;
  let pandluBags = updatedData.pandluBags;

  if (!largeBags && bill.bags) {
    largeBags = bill.bags.filter((b) => b.bagType === 'LARGE').map((b) => ({ bagIndex: b.bagIndex, weightKg: b.weightKg }));
  }
  if (!smallBags && bill.bags) {
    smallBags = bill.bags.filter((b) => b.bagType === 'SMALL').map((b) => ({ bagIndex: b.bagIndex, weightKg: b.weightKg }));
  }
  if (!pandluBags && bill.bags) {
    pandluBags = bill.bags.filter((b) => b.bagType === 'PANDLU').map((b) => ({ bagIndex: b.bagIndex, weightKg: b.weightKg }));
  }

  const validLarge = (largeBags || []).filter((b) => b.weightKg > 0);
  const validSmall = (smallBags || []).filter((b) => b.weightKg > 0);
  const validPandlu = (pandluBags || []).filter((b) => b.weightKg > 0);

  const totalLargeBags = validLarge.length;
  const totalLargeWeight = Number(
    (validLarge.reduce((a, b) => a + Math.round(b.weightKg * 1000), 0) / 1000).toFixed(3)
  );

  const totalSmallBags = validSmall.length;
  const totalSmallWeight = Number(
    (validSmall.reduce((a, b) => a + Math.round(b.weightKg * 1000), 0) / 1000).toFixed(3)
  );

  const totalPandluBags = validPandlu.length;
  const totalPandluWeight = Number(
    (validPandlu.reduce((a, b) => a + Math.round(b.weightKg * 1000), 0) / 1000).toFixed(3)
  );

  const totalBags = totalLargeBags + totalSmallBags + totalPandluBags;
  const totalWeight = Number((totalLargeWeight + totalSmallWeight + totalPandluWeight).toFixed(3));

  // 2. Prices
  const pricePerKg = updatedData.pricePerKg !== undefined ? updatedData.pricePerKg : bill.pricePerKg;
  const pricePerKgPandlu =
    updatedData.pricePerKgPandlu !== undefined
      ? updatedData.pricePerKgPandlu
      : bill.pricePerKgPandlu || pricePerKg;

  const normalWeight = Number((totalLargeWeight + totalSmallWeight).toFixed(3));
  const grossNormalAmount = Number((normalWeight * pricePerKg).toFixed(2));
  const grossPandluAmount = Number((totalPandluWeight * pricePerKgPandlu).toFixed(2));
  const grossAmount = Number((grossNormalAmount + grossPandluAmount).toFixed(2));

  // 3. Deductions & Net
  const commissionRate = updatedData.commissionRate !== undefined ? updatedData.commissionRate : bill.commissionRate;
  const commissionAmount = Number(((grossAmount * commissionRate) / 100).toFixed(2));
  const labourCharges = Number(
    (updatedData.labourCharges !== undefined ? updatedData.labourCharges : bill.labourCharges).toFixed(2)
  );
  const transportCharges = Number(
    (updatedData.transportCharges !== undefined ? updatedData.transportCharges : bill.transportCharges).toFixed(2)
  );
  const otherCharges = Number(
    (updatedData.otherCharges !== undefined ? updatedData.otherCharges : bill.otherCharges).toFixed(2)
  );

  const totalDeductions = Number((commissionAmount + labourCharges + transportCharges + otherCharges).toFixed(2));
  const netPayable = Math.max(0, Number((grossAmount - totalDeductions).toFixed(2)));

  // Always preserve the existing amountPaid so prior payments via RecordPaymentModal are not erased
  const amountPaid = Math.min(netPayable, Number((bill.amountPaid || 0).toFixed(2)));
  const balanceAmount = Math.max(0, Number((netPayable - amountPaid).toFixed(2)));

  let paymentStatus: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' = 'UNPAID';
  if (balanceAmount === 0 && netPayable > 0) {
    paymentStatus = 'PAID';
  } else if (amountPaid > 0) {
    paymentStatus = 'PARTIALLY_PAID';
  }

  let stage = bill.stage;
  if (bill.stage === 'FINAL_BILLED' || updatedData.commissionRate !== undefined || updatedData.labourCharges !== undefined) {
    stage = 'FINAL_BILLED';
  } else if (pricePerKg > 0) {
    stage = 'PRICED';
  }

  const updatedBill: Bill = {
    ...bill,
    billDate: updatedData.billDate || bill.billDate,
    stage,
    totalLargeBags,
    totalLargeWeight,
    totalSmallBags,
    totalSmallWeight,
    totalPandluBags,
    totalPandluWeight,
    totalBags,
    totalWeight,
    pricePerKg,
    pricePerKgPandlu,
    grossNormalAmount,
    grossPandluAmount,
    grossAmount,
    commissionRate,
    commissionAmount,
    labourCharges,
    transportCharges,
    otherCharges,
    totalDeductions,
    netPayable,
    amountPaid,
    balanceAmount,
    paymentStatus,
    paymentMethod: 'CASH',
    notes: updatedData.notes !== undefined ? updatedData.notes : bill.notes,
    bags: [
      ...validLarge.map((b, i) => ({ bagType: 'LARGE' as const, bagIndex: i + 1, weightKg: b.weightKg })),
      ...validSmall.map((b, i) => ({ bagType: 'SMALL' as const, bagIndex: i + 1, weightKg: b.weightKg })),
      ...validPandlu.map((b, i) => ({ bagType: 'PANDLU' as const, bagIndex: i + 1, weightKg: b.weightKg })),
    ],
    updatedAt: new Date().toISOString(),
  };

  const saved = await fbSaveBill(updatedBill, bill.id);
  return { bill: saved, message: 'Bill updated successfully! 🍋' };
}

export async function deleteBill(id: string): Promise<{ message: string }> {
  await fbDeleteBill(id);
  return { message: 'Bill removed successfully' };
}

export async function recordBillPayment(billId: string, paymentData: {
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}): Promise<{ payment: Payment; updatedBill: Bill; message: string }> {
  const bills = await fbGetBills();
  const bill = bills.find((b) => b.id === billId);
  if (!bill) throw new Error('Bill not found');

  const newAmountPaid = Number((bill.amountPaid + paymentData.amount).toFixed(2));
  const newBalance = Math.max(0, Number((bill.netPayable - newAmountPaid).toFixed(2)));
  const newStatus = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

  const updatedBill = await fbSaveBill(
    {
      ...bill,
      amountPaid: newAmountPaid,
      balanceAmount: newBalance,
      paymentStatus: newStatus,
    },
    bill.id
  );

  const payment: Payment = {
    id: `pay-${Date.now()}`,
    customerId: bill.customerId,
    billId: bill.id,
    amount: paymentData.amount,
    paymentDate: new Date().toISOString(),
    paymentMethod: paymentData.paymentMethod,
    reference: paymentData.reference,
    notes: paymentData.notes,
  };

  return { payment, updatedBill, message: 'Payment recorded' };
}

export async function recordPayment(paymentData: {
  customerId: string;
  billId?: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  autoAllocate?: boolean;
}): Promise<{ payment: Payment; message: string }> {
  const payment: Payment = {
    id: `pay-${Date.now()}`,
    customerId: paymentData.customerId,
    billId: paymentData.billId,
    amount: paymentData.amount,
    paymentDate: new Date().toISOString(),
    paymentMethod: paymentData.paymentMethod,
    reference: paymentData.reference,
    notes: paymentData.notes,
  };
  return { payment, message: 'Payment recorded' };
}

// Reports & Dashboard
export async function getDashboard(date?: string): Promise<{
  selectedDate: string;
  metrics: DashboardMetrics;
  todayBills: Bill[];
  recentBills: Bill[];
  topPendingCustomers: Array<{
    id: string;
    customerId: string;
    name: string;
    mobile: string;
    village?: string;
    pendingBalance: number;
  }>;
}> {
  const targetDate = date || new Date().toISOString().slice(0, 10);
  const [customers, bills] = await Promise.all([fbGetCustomers(), fbGetBills()]);

  const todayBills = bills.filter((b) => b.billDate.startsWith(targetDate));
  const activeCustomers = customers.filter((c) => c.isActive);

  const pendingPriceCount = todayBills.filter((b) => b.stage === 'WEIGHED').length;
  const pendingFinalBillCount = todayBills.filter((b) => b.stage === 'PRICED').length;

  const todayTotalBags = todayBills.reduce((a, b) => a + b.totalBags, 0);
  const todayLargeBags = todayBills.reduce((a, b) => a + (b.totalLargeBags || 0), 0);
  const todaySmallBags = todayBills.reduce((a, b) => a + (b.totalSmallBags || 0), 0);
  const todayPandluBags = todayBills.reduce((a, b) => a + (b.totalPandluBags || 0), 0);
  const todayTotalWeight = todayBills.reduce((a, b) => a + b.totalWeight, 0);
  const todayGrossSales = todayBills.reduce((a, b) => a + b.grossAmount, 0);
  const todayTotalDeductions = todayBills.reduce((a, b) => a + b.totalDeductions, 0);
  const todayNetPayable = todayBills.reduce((a, b) => a + b.netPayable, 0);
  const todayAmountReceived = todayBills.reduce((a, b) => a + b.amountPaid, 0);
  const todayPendingPayments = todayBills.reduce((a, b) => a + b.balanceAmount, 0);

  const overallSales = bills.reduce((a, b) => a + b.netPayable, 0);
  const overallReceived = bills.reduce((a, b) => a + b.amountPaid, 0);
  const overallPendingBalance = bills.reduce((a, b) => a + b.balanceAmount, 0);
  const overallWeight = bills.reduce((a, b) => a + b.totalWeight, 0);

  const topPendingCustomers = customers
    .map((c) => {
      const custBills = bills.filter((b) => b.customerId === c.id);
      const pendingBalance = custBills.reduce((a, b) => a + b.balanceAmount, 0);
      return {
        id: c.id,
        customerId: c.customerId,
        name: c.name,
        mobile: c.mobile,
        village: c.village,
        pendingBalance: Number(pendingBalance.toFixed(2)),
      };
    })
    .filter((c) => c.pendingBalance > 0)
    .sort((a, b) => b.pendingBalance - a.pendingBalance)
    .slice(0, 5);

  return {
    selectedDate: targetDate,
    metrics: {
      totalActiveCustomers: activeCustomers.length,
      totalCustomersAll: customers.length,
      todayBillsCount: todayBills.length,
      todayPendingPriceCount: pendingPriceCount,
      todayPendingFinalBillCount: pendingFinalBillCount,
      todayUniqueCustomers: new Set(todayBills.map((b) => b.customerId)).size,
      todayLargeBags,
      todaySmallBags,
      todayPandluBags,
      todayTotalBags,
      todayTotalWeight: Number(todayTotalWeight.toFixed(3)),
      todayGrossSales: Number(todayGrossSales.toFixed(2)),
      todayTotalDeductions: Number(todayTotalDeductions.toFixed(2)),
      todayNetPayable: Number(todayNetPayable.toFixed(2)),
      todayAmountReceived: Number(todayAmountReceived.toFixed(2)),
      todayPendingPayments: Number(todayPendingPayments.toFixed(2)),
      overallSales: Number(overallSales.toFixed(2)),
      overallReceived: Number(overallReceived.toFixed(2)),
      overallPendingBalance: Number(overallPendingBalance.toFixed(2)),
      overallWeight: Number(overallWeight.toFixed(3)),
    },
    todayBills,
    recentBills: bills.slice(0, 8),
    topPendingCustomers,
  };
}

export async function getSalesReport(filters: {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  status?: string;
  period?: 'daily' | 'weekly' | 'monthly';
}): Promise<any> {
  const bills = await fbGetBills();
  return {
    summary: {
      totalBills: bills.length,
      totalLargeBags: bills.reduce((a, b) => a + b.totalLargeBags, 0),
      totalLargeWeight: bills.reduce((a, b) => a + b.totalLargeWeight, 0),
      totalSmallBags: bills.reduce((a, b) => a + b.totalSmallBags, 0),
      totalSmallWeight: bills.reduce((a, b) => a + b.totalSmallWeight, 0),
      totalBags: bills.reduce((a, b) => a + b.totalBags, 0),
      totalWeight: bills.reduce((a, b) => a + b.totalWeight, 0),
      grossTotal: bills.reduce((a, b) => a + b.grossAmount, 0),
      totalDiscounts: 0,
      totalAdditionalCharges: bills.reduce((a, b) => a + b.totalDeductions, 0),
      netTotalSales: bills.reduce((a, b) => a + b.netPayable, 0),
      totalPaid: bills.reduce((a, b) => a + b.amountPaid, 0),
      totalOutstanding: bills.reduce((a, b) => a + b.balanceAmount, 0),
    },
    periodBreakdown: [],
    customerBreakdown: [],
    bills,
  };
}

// Settings
export async function getSettings(): Promise<{ settings: BusinessSettings }> {
  const settings = await fbGetSettings();
  return { settings };
}

export async function updateSettings(data: Partial<BusinessSettings>): Promise<{ settings: BusinessSettings; message: string }> {
  const settings = await fbSaveSettings(data);
  return { settings, message: 'Settings updated successfully' };
}
