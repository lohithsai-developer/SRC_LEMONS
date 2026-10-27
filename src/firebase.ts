import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { Customer, Bill, Payment, BusinessSettings, BillStage } from './types';

// Default Firebase config (Edit directly here or via environment variables)
const firebaseConfig = {
  apiKey: "AIzaSyDg67eukYUATBH7t0e8g_ulCusbTWd7_OI",
  authDomain: "src-lemons-4b048.firebaseapp.com",
  projectId: "src-lemons-4b048",
  storageBucket: "src-lemons-4b048.firebasestorage.app",
  messagingSenderId: "962532818897",
  appId: "1:962532818897:web:52a9145fbc91dec5e66af0",
  measurementId: "G-YJ4G29TXFM"
};


let app: any = null;
let db: any = null;
let isFirebaseLive = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    db = getFirestore(app);
    isFirebaseLive = true;
    console.log('🔥 Firebase Firestore initialized successfully for project:', firebaseConfig.projectId);
  }
} catch (err) {
  console.warn('Firebase initialization note (using local persistent storage fallback):', err);
}

export function isFirebaseConnected(): boolean {
  return isFirebaseLive && db !== null;
}

// ==========================================
// SEED DATA FOR NEW SESSIONS
// ==========================================
const DEFAULT_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    customerId: 'LM-CUST-1001',
    name: 'Rama Rao',
    mobile: '9848012345',
    village: 'Gudur Rural',
    notes: 'Regular supplier',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalBillsCount: 1,
    totalPurchases: 3430,
    totalPaid: 3430,
    outstandingBalance: 0,
    totalLemonWeight: 85.75,
  },
  {
    id: 'cust-2',
    customerId: 'LM-CUST-1002',
    name: 'Venkat Reddy',
    mobile: '9848023456',
    village: 'Podalakur',
    notes: 'Balaji variety lemon orchard',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalBillsCount: 1,
    totalPurchases: 4600,
    totalPaid: 2000,
    outstandingBalance: 2600,
    totalLemonWeight: 110.0,
  },
  {
    id: 'cust-3',
    customerId: 'LM-CUST-1003',
    name: 'Koteswara Rao',
    mobile: '9848034567',
    village: 'Tenali',
    notes: 'Large scale grower',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalBillsCount: 0,
    totalPurchases: 0,
    totalPaid: 0,
    outstandingBalance: 0,
    totalLemonWeight: 0,
  },
];

const DEFAULT_SETTINGS: BusinessSettings = {
  id: 'settings-default',
  businessName: 'SRC LEMONS',
  businessNameTelugu: 'SRC LEMONS',
  merchantName: 'K. Srinivasa Rao',
  phone: '+91 98480 99999',
  address: 'Lemon Wholesale Market Yard, Gudur, AP',
  defaultRatePerKg: 40.0,
  defaultCommissionRate: 5.0, // 5% commission
  defaultLabourPerBag: 10.0, // ₹10 per bag hamali
  currencySymbol: '₹',
  language: 'en',
};

// ==========================================
// LOCAL STORAGE DATA LAYER (FALLBACK)
// ==========================================
function getLocal<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(`lemon_db_${key}`);
  if (!data) {
    localStorage.setItem(`lemon_db_${key}`, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultValue;
  }
}

function setLocal<T>(key: string, val: T): void {
  localStorage.setItem(`lemon_db_${key}`, JSON.stringify(val));
}

// ==========================================
// FIREBASE FIRESTORE & ADAPTER METHODS
// ==========================================

// Customers
export async function fbGetCustomers(): Promise<Customer[]> {
  if (isFirebaseLive && db) {
    try {
      const snap = await getDocs(collection(db, 'customers'));
      if (!snap.empty) {
        return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Customer));
      }
    } catch (e) {
      console.warn('Firestore fetch failed, fallback to local:', e);
    }
  }
  return getLocal<Customer[]>('customers', DEFAULT_CUSTOMERS);
}

export async function fbSaveCustomer(cust: Omit<Customer, 'id'>, existingId?: string): Promise<Customer> {
  const now = new Date().toISOString();
  if (isFirebaseLive && db) {
    try {
      if (existingId) {
        const ref = doc(db, 'customers', existingId);
        await updateDoc(ref, { ...cust, updatedAt: now });
        return { id: existingId, ...cust, updatedAt: now } as Customer;
      } else {
        const colRef = collection(db, 'customers');
        const docRef = await addDoc(colRef, { ...cust, createdAt: now, updatedAt: now });
        return { id: docRef.id, ...cust, createdAt: now, updatedAt: now } as Customer;
      }
    } catch (e) {
      console.warn('Firestore save failed, saving locally:', e);
    }
  }

  const list = getLocal<Customer[]>('customers', DEFAULT_CUSTOMERS);
  if (existingId) {
    const idx = list.findIndex((c) => c.id === existingId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...cust, updatedAt: now };
      setLocal('customers', list);
      return list[idx];
    }
  }

  const newCust: Customer = {
    id: `cust-${Date.now()}`,
    ...cust,
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(newCust);
  setLocal('customers', list);
  return newCust;
}

export async function fbDeleteCustomer(id: string): Promise<boolean> {
  if (isFirebaseLive && db) {
    try {
      await deleteDoc(doc(db, 'customers', id));
    } catch (e) { }
  }
  const list = getLocal<Customer[]>('customers', DEFAULT_CUSTOMERS);
  setLocal('customers', list.filter((c) => c.id !== id));
  return true;
}

// Bills & Lots
export async function fbGetBills(): Promise<Bill[]> {
  if (isFirebaseLive && db) {
    try {
      const snap = await getDocs(collection(db, 'bills'));
      if (!snap.empty) {
        return snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Bill));
      }
    } catch (e) {
      console.warn('Firestore bills fetch failed, using local:', e);
    }
  }
  return getLocal<Bill[]>('bills', []);
}

export async function fbSaveBill(billData: Omit<Bill, 'id'>, existingId?: string): Promise<Bill> {
  const now = new Date().toISOString();
  if (isFirebaseLive && db) {
    try {
      if (existingId) {
        const ref = doc(db, 'bills', existingId);
        await updateDoc(ref, { ...billData, updatedAt: now });
        return { id: existingId, ...billData, updatedAt: now } as Bill;
      } else {
        const colRef = collection(db, 'bills');
        const docRef = await addDoc(colRef, { ...billData, createdAt: now, updatedAt: now });
        return { id: docRef.id, ...billData, createdAt: now, updatedAt: now } as Bill;
      }
    } catch (e) {
      console.warn('Firestore bill save failed, saving locally:', e);
    }
  }

  const list = getLocal<Bill[]>('bills', []);
  if (existingId) {
    const idx = list.findIndex((b) => b.id === existingId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...billData, updatedAt: now };
      setLocal('bills', list);
      return list[idx];
    }
  }

  const newBill: Bill = {
    id: `bill-${Date.now()}`,
    ...billData,
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(newBill);
  setLocal('bills', list);
  return newBill;
}

export async function fbDeleteBill(id: string): Promise<boolean> {
  if (isFirebaseLive && db) {
    try {
      await deleteDoc(doc(db, 'bills', id));
    } catch (e) { }
  }
  const list = getLocal<Bill[]>('bills', []);
  setLocal('bills', list.filter((b) => b.id !== id));
  return true;
}

// Settings
export async function fbGetSettings(): Promise<BusinessSettings> {
  if (isFirebaseLive && db) {
    try {
      const snap = await getDoc(doc(db, 'settings', 'global'));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as BusinessSettings;
      }
    } catch (e) { }
  }
  return getLocal<BusinessSettings>('settings', DEFAULT_SETTINGS);
}

export async function fbSaveSettings(settings: Partial<BusinessSettings>): Promise<BusinessSettings> {
  const current = await fbGetSettings();
  const updated = { ...current, ...settings };
  if (isFirebaseLive && db) {
    try {
      await setDoc(doc(db, 'settings', 'global'), updated);
    } catch (e) { }
  }
  setLocal('settings', updated);
  return updated;
}
