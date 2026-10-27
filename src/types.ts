export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

export interface Customer {
  id: string;
  customerId: string;
  name: string;
  mobile: string;
  village: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalBillsCount?: number;
  totalPurchases?: number;
  totalPaid?: number;
  outstandingBalance?: number;
  totalLemonWeight?: number;
}

export interface BillBag {
  id?: string;
  billId?: string;
  bagType: 'LARGE' | 'SMALL' | 'PANDLU';
  bagIndex: number;
  weightKg: number;
}

export type BillStage = 'WEIGHED' | 'PRICED' | 'FINAL_BILLED';
export type PaymentStatus = 'PAID' | 'PARTIALLY_PAID' | 'UNPAID';

export interface Bill {
  id: string;
  billNumber: string;
  customerId: string;
  customer: {
    id: string;
    customerId: string;
    name: string;
    mobile: string;
    village?: string;
  };
  billDate: string;
  stage: BillStage; // 'WEIGHED' (only weight saved) | 'PRICED' (rate added) | 'FINAL_BILLED' (deductions cut)

  // Bags info
  totalLargeBags: number;
  totalLargeWeight: number;
  totalSmallBags: number;
  totalSmallWeight: number;
  totalPandluBags: number;
  totalPandluWeight: number;
  totalBags: number;
  totalWeight: number;

  // Pricing
  pricePerKg: number; // Normal lemon rate (₹/kg)
  pricePerKgPandlu: number; // Pandlu (ripe lemons) rate (₹/kg)
  grossNormalAmount: number;
  grossPandluAmount: number;
  grossAmount: number;

  // Deductions
  commissionRate: number; // e.g. 5% or 0
  commissionAmount: number; // calculated or fixed ₹
  labourCharges: number; // Labour / Hamali
  transportCharges: number; // Transport charges
  otherCharges: number; // Other / Bag charges
  totalDeductions: number; // Commission + Labour + Transport + Other

  // Net settlement to farmer
  netPayable: number; // Gross - Total Deductions
  amountPaid: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  notes?: string;
  bags: BillBag[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  customerId: string;
  customer?: {
    id: string;
    customerId: string;
    name: string;
    mobile: string;
    village?: string;
  };
  billId?: string;
  bill?: {
    id: string;
    billNumber: string;
    netPayable: number;
    balanceAmount: number;
  };
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

export interface BusinessSettings {
  id: string;
  businessName: string;
  businessNameTelugu: string;
  merchantName: string;
  phone: string;
  address: string;
  defaultRatePerKg: number;
  defaultCommissionRate: number; // default commission % (e.g. 5%)
  defaultLabourPerBag: number; // default hamali per bag (e.g. ₹10)
  currencySymbol: string;
  language: 'en' | 'te';
  firebaseConfig?: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  logoUrl?: string;
}

export interface DashboardMetrics {
  totalActiveCustomers: number;
  totalCustomersAll: number;
  todayBillsCount: number;
  todayPendingPriceCount: number; // lots weighed but price pending
  todayPendingFinalBillCount: number; // lots priced but final bill pending
  todayUniqueCustomers: number;
  todayLargeBags: number;
  todaySmallBags: number;
  todayPandluBags?: number;
  todayTotalBags: number;
  todayTotalWeight: number;
  todayGrossSales: number;
  todayTotalDeductions: number;
  todayNetPayable: number;
  todayAmountReceived: number; // paid out
  todayPendingPayments: number;
  overallSales: number;
  overallReceived: number;
  overallPendingBalance: number;
  overallWeight: number;
}

export interface LedgerEntry {
  id: string;
  date: string;
  type: 'BILL' | 'PAYMENT';
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  details?: any;
}
