import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Toast, ToastMessage } from './components/Toast';
import { BillReceiptModal } from './components/BillReceiptModal';
import { EditBillModal } from './components/EditBillModal';
import { AddCustomerModal } from './components/AddCustomerModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { DashboardPage } from './pages/DashboardPage';
import { NewBillPage } from './pages/NewBillPage';
import { DailyBillsPage } from './pages/DailyBillsPage';
import { CustomersPage } from './pages/CustomersPage';
import { ReportsPage } from './pages/ReportsPage';
import { LoginPage } from './pages/LoginPage';
import { AdminUser, Bill, Customer, BusinessSettings, Payment } from './types';
import { getMe, logout, getSettings } from './api';
import { Language } from './i18n';

export const App: React.FC = () => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [lang, setLang] = useState<Language>('en');
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [activeBillReceipt, setActiveBillReceipt] = useState<Bill | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [isEditBillOpen, setIsEditBillOpen] = useState(false);

  const handleOpenEditBill = (bill: Bill) => {
    setIsReceiptOpen(false);
    setEditingBill(bill);
    setIsEditBillOpen(true);
  };

  const [paymentModalState, setPaymentModalState] = useState<{
    isOpen: boolean;
    bill?: Bill | null;
    customer?: Customer | null;
  }>({ isOpen: false });

  const [addCustomerModalState, setAddCustomerModalState] = useState<{
    isOpen: boolean;
    customerToEdit?: Customer | null;
  }>({ isOpen: false });

  const [newlyCreatedCustomer, setNewlyCreatedCustomer] = useState<Customer | null>(null);

  const addToast = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check initial login session
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('lemon_auth_token');
      if (token) {
        try {
          const res = await getMe();
          setUser(res.admin);
        } catch (e) {
          logout();
          setUser(null);
        }
      }
      setAuthChecked(true);
    };

    checkAuth();
    getSettings()
      .then((res) => {
        setSettings(res.settings);
        if (res.settings.language) setLang(res.settings.language);
      })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    setUser(null);
    addToast('info', 'Logged out successfully');
  };

  const handleLoginSuccess = (admin: AdminUser) => {
    setUser(admin);
    addToast('success', `Welcome back, ${admin.name || admin.username}! 🍋`);
  };

  const handleBillSaved = (_bill: Bill) => {
    addToast('success', 'Bill saved successfully! 🍋');
  };

  const handlePaymentSuccess = (payment: Payment) => {
    addToast('success', `Payment of ₹${payment.amount.toFixed(2)} recorded successfully!`);
    setPaymentModalState({ isOpen: false });
  };

  const handleCustomerCreated = (customer: Customer) => {
    setNewlyCreatedCustomer(customer);
    addToast('success', `Customer ${customer.name} saved successfully!`);
    setAddCustomerModalState({ isOpen: false });
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-3">
          <span className="text-4xl animate-bounce">🍋</span>
          <p className="text-sm font-bold text-slate-600">Loading SRC LEMONS App...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toast toasts={toasts} onDismiss={removeToast} />
        <LoginPage onLoginSuccess={handleLoginSuccess} lang={lang} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        user={user}
        onLogout={handleLogout}
        settings={settings}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardPage
            onNavigate={setActiveTab}
            onOpenReceipt={(bill) => {
              setActiveBillReceipt(bill);
              setIsReceiptOpen(true);
            }}
            onOpenEdit={handleOpenEditBill}
            onOpenRecordPayment={(bill?: Bill | null, customer?: Customer | null) => {
              setPaymentModalState({ isOpen: true, bill, customer });
            }}
            onOpenAddCustomer={() => {
              setAddCustomerModalState({ isOpen: true });
            }}
            lang={lang}
          />
        )}

        {activeTab === 'new-bill' && (
          <NewBillPage
            onBillSaved={handleBillSaved}
            onOpenAddCustomerModal={() => {
              setAddCustomerModalState({ isOpen: true });
            }}
            onNavigateToBills={() => setActiveTab('dashboard')}
            newlyCreatedCustomer={newlyCreatedCustomer}
            lang={lang}
          />
        )}

        {activeTab === 'daily-bills' && (
          <DailyBillsPage
            onOpenReceipt={(bill) => {
              setActiveBillReceipt(bill);
              setIsReceiptOpen(true);
            }}
            onOpenEdit={handleOpenEditBill}
            onOpenRecordPayment={(bill) => {
              setPaymentModalState({ isOpen: true, bill });
            }}
            onNavigateToNewBill={() => setActiveTab('new-bill')}
            lang={lang}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersPage
            onOpenAddModal={(customerToEdit) => {
              setAddCustomerModalState({ isOpen: true, customerToEdit });
            }}
            onSelectForNewBill={(customer) => {
              setNewlyCreatedCustomer(customer);
              setActiveTab('new-bill');
            }}
            lang={lang}
          />
        )}

        {activeTab === 'reports' && <ReportsPage lang={lang} />}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} lang={lang} />

      {/* Global Modals */}
      <BillReceiptModal
        bill={activeBillReceipt}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        onOpenEdit={handleOpenEditBill}
        settings={settings}
        lang={lang}
      />

      <EditBillModal
        bill={editingBill}
        isOpen={isEditBillOpen}
        onClose={() => setIsEditBillOpen(false)}
        onSaved={(updated) => {
          setIsEditBillOpen(false);
          setEditingBill(null);
          addToast('success', 'Bill updated successfully! 🍋');
          setActiveBillReceipt(updated);
          setIsReceiptOpen(true);
        }}
      />

      <RecordPaymentModal
        isOpen={paymentModalState.isOpen}
        onClose={() => setPaymentModalState({ isOpen: false })}
        onSuccess={handlePaymentSuccess}
        bill={paymentModalState.bill}
        customer={paymentModalState.customer}
        lang={lang}
      />

      <AddCustomerModal
        isOpen={addCustomerModalState.isOpen}
        onClose={() => setAddCustomerModalState({ isOpen: false })}
        onSuccess={handleCustomerCreated}
        editCustomer={addCustomerModalState.customerToEdit}
        lang={lang}
      />
    </div>
  );
};

export default App;
