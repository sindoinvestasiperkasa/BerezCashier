
"use client";

import React, { createContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User as FirebaseAuthUser } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, getFirestore, onSnapshot, addDoc, Timestamp, updateDoc, writeBatch, documentId, deleteDoc } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';

import en from '@/lib/locales/en.json';
import id from '@/lib/locales/id.json';


// --- Re-exportable Types ---
export type Product = {
  id: string;
  name: string;
  productCode?: string;
  productSubType: 'Produk Retail' | 'Produk Produksi' | 'Jasa' | 'Bahan Baku';
  productType?: 'Barang' | 'Jasa';
  price: number;
  hpp?: number; // Harga Pokok Penjualan
  description?: string;
  lowStockThreshold?: number;
  imageUrls?: string[];
  imageUrl?: string;
  categoryId?: string;
  unitId?: string;
  supplierId?: string;
  attributeValues?: ProductAttributeValue[];
  stock?: number;
  categoryName?: string;
  unitName?: string;
  supplierName?: string;
  availableBranchIds?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  branchId?: string; // To associate product with a branch
  warehouseId?: string; // To associate product with a warehouse
};

export type StockLot = {
    id: string;
    productId: string;
    warehouseId: string;
    initialQuantity: number;
    remainingQuantity: number;
    purchasePrice: number;
    expirationDate?: Date;
    createdAt: Date; // Keep this for general timestamping
    purchaseDate: Date; // Use this for FIFO logic
    idUMKM: string;
};


export type ProductCategory = {
  id: string;
  name: string | { id: string; en: string };
  description?: string;
  attributes?: AttributeDefinition[];
};

export type ProductUnit = {
  id: string;
  name: string;
  symbol: string;
  description?: string;
};

export type Supplier = {
  id: string;
  name: string;
  // add other supplier fields as needed
};

export type AttributeType = 'Teks' | 'Angka' | 'Paragraf' | 'Tanggal' | 'Pilihan Tunggal' | 'Checkbox';

export type AttributeDefinition = {
  id: string;
  name: string;
  type: AttributeType;
  options?: string[];
};

export type ProductAttributeValue = {
  attributeId: string;
  attributeName: string;
  type: AttributeType;
  value: any;
};

export type Branch = {
  id: string;
  name: string;
  [key: string]: any;
};

export type Warehouse = {
  id: string;
  name: string;
  branchId: string; // Crucial for filtering
  [key: string]: any;
};
// --- End of Re-exportable Types ---


export interface CartItem extends Product {
  quantity: number;
}

export interface SaleItem {
    productId: string;
    productName: string;
    productType?: 'Barang' | 'Jasa';
    quantity: number;
    unitPrice: number;
    cogs?: number; // COGS is optional from KDS perspective
    imageUrl?: string;
    [key: string]: any;
}

export interface Transaction {
  id: string;
  date: Date;
  total: number;
  status: 'Lunas' | 'Siap Diantar' | 'Sedang Disiapkan' | 'Diproses' | 'Dibatalkan' | 'Selesai Diantar';
  items: SaleItem[];
  paymentMethod: string;
  paymentStatus: 'Berhasil' | 'Pending' | 'Gagal';
  amount?: number;
  paidAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  transactionNumber?: string;
  branchId?: string;
  warehouseId?: string;
  tableNumber?: string;
  lines?: { accountId: string; debit: number; credit: number; description: string }[];
  employeeId?: string;
  employeeName?: string;
  preparationStartTime?: Date;
  isNotified?: boolean;
  isUpdated?: boolean; // To check if order was updated
  [key: string]: any;
}

export type NewTransactionClientData = {
    items: CartItem[]; 
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    customerId: string;
    customerName: string;
    branchId: string;
    warehouseId: string;
    isPkp?: boolean;
    serviceFee?: number;
    tableNumber?: string;
};


export type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

export type Account = {
  id: string;
  name: string;
  category: 'Aset' | 'Liabilitas' | 'Ekuitas' | 'Pendapatan' | 'Beban';
  [key:string]: any;
};

export type Notification = {
  id: string;
  type: 'low_stock' | 'daily_summary' | 'transaction_failed' | 'shift_report';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  relatedId?: string; // e.g., productId for low_stock
};


export type UserData = {
    uid: string;
    role: 'UMKM' | 'Employee' | 'SuperAdmin';
    email: string;
    ownerName?: string;
    umkmName?: string;
    businessName?: string;
    photoUrl?: string; 
    address?: string;
    phone?: string;
    serviceFeeTier1?: number;
    serviceFeeTier2?: number;
    serviceFeeTier3?: number;
    name?: string;
    employeeDocId?: string; 
    branchId?: string; 
    warehouseId?: string;
    [key: string]: any;
};

type Locale = 'en' | 'id';
type Translations = typeof en;

interface AppContextType {
  transactions: Transaction[];
  branches: Branch[];
  warehouses: Warehouse[];
  filteredWarehouses: Warehouse[];
  selectedBranchId?: string;
  setSelectedBranchId: (id: string) => void;
  selectedWarehouseId?: string;
  setSelectedWarehouseId: (id: string) => void;
  saveCartAsPendingTransaction: (data: NewTransactionClientData) => Promise<{ success: boolean; transactionId: string }>;
  updateTransactionOnly: (transactionId: string, updatedItems: SaleItem[], newTotal: number, newSubtotal: number, newDiscount: number) => Promise<boolean>;
  deleteTransaction: (transactionId: string) => Promise<boolean>;
  updateTransactionStatus: (transactionId: string, status: "Sedang Disiapkan" | "Siap Diantar" | "Selesai Diantar") => Promise<void>;
  markTransactionAsNotified: (transactionId: string) => void;
  updateUserData: (data: Partial<UserData>) => Promise<boolean>;
  isAuthenticated: boolean;
  user: UserData | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  locale: Locale;
  changeLocale: (locale: Locale) => void;
  t: (key: keyof Translations) => string;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const locales = { en, id };

const removeUndefinedDeep = (val: any): any => {
    if (val instanceof Date) {
        return val;
    }
    if (Array.isArray(val)) {
        return val.map(removeUndefinedDeep).filter(v => v !== undefined);
    }
    if (val !== null && typeof val === 'object') {
        return Object.fromEntries(
            Object.entries(val)
                .map(([k, v]) => [k, removeUndefinedDeep(v)])
                .filter(([, v]) => v !== undefined)
        );
    }
    return val;
};


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  
  const [selectedBranchId, setSelectedBranchIdState] = useState<string | undefined>();
  const [selectedWarehouseId, setSelectedWarehouseIdState] = useState<string | undefined>();
  
  const [locale, setLocale] = useState<Locale>('id');
  const { toast } = useToast();
  const db = getFirestore();

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'id')) {
      setLocale(savedLocale);
    }
  }, []);

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = useCallback((key: keyof Translations) => {
    return locales[locale][key] || key;
  }, [locale]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBranchId = localStorage.getItem('selectedBranchId');
      if (storedBranchId) setSelectedBranchIdState(storedBranchId);
      const storedWarehouseId = localStorage.getItem('selectedWarehouseId');
      if (storedWarehouseId) setSelectedWarehouseIdState(storedWarehouseId);
    }
  }, []);

  const setSelectedBranchId = (id: string) => {
    if (user?.role === 'Employee') return;
    setSelectedBranchIdState(id);
    localStorage.setItem('selectedBranchId', id);
    const newFilteredWarehouses = warehouses.filter(wh => wh.branchId === id);
    if (!newFilteredWarehouses.some(wh => wh.id === selectedWarehouseId)) {
        setSelectedWarehouseId(''); 
    }
  };
  
  const setSelectedWarehouseId = (id: string) => {
    if (user?.role === 'Employee') return; 
    setSelectedWarehouseIdState(id);
    if(id) {
        localStorage.setItem('selectedWarehouseId', id);
    } else {
        localStorage.removeItem('selectedWarehouseId');
    }
  };
  
  const filteredWarehouses = useMemo(() => {
    if (!selectedBranchId) {
      return [];
    }
    return warehouses.filter(wh => wh.branchId === selectedBranchId);
  }, [warehouses, selectedBranchId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseAuthUser | null) => {
        if (firebaseUser) {
            let finalUserData: UserData | null = null;
      
            const umkmDocRef = doc(db, 'dataUMKM', firebaseUser.uid);
            const umkmDocSnap = await getDoc(umkmDocRef);

            if (umkmDocSnap.exists()) {
                const data = umkmDocSnap.data();
                finalUserData = { 
                    uid: firebaseUser.uid, 
                    ...data, 
                    role: data.role || 'UMKM',
                    email: firebaseUser.email || data.email,
                } as UserData;
            } else {
              const employeesQuery = query(collection(db, "employees"), where("uid", "==", firebaseUser.uid));
              const employeeSnapshot = await getDocs(employeesQuery);

              if (!employeeSnapshot.empty) {
                  const employeeDoc = employeeSnapshot.docs[0];
                  const employeeData = employeeDoc.data();

                  if (employeeData.canLogin !== true) {
                      await signOut(auth);
                      toast({ title: "Akses Ditolak", description: "Akun karyawan Anda tidak aktif.", variant: 'destructive' });
                      return;
                  }
                  
                  const divisionIds = employeeData.divisionIds || [];
                  if (divisionIds.length > 0) {
                      const divisionsQuery = query(collection(db, 'divisions'), where(documentId(), 'in', divisionIds));
                      const divisionsSnapshot = await getDocs(divisionsQuery);
                      const divisionNames = divisionsSnapshot.docs.map(d => d.data().name.toLowerCase());
                      
                      if (divisionNames.includes('dapur') || divisionNames.includes('kitchen')) {
                          finalUserData = {
                              uid: firebaseUser.uid,
                              ...employeeData,
                              employeeDocId: employeeDoc.id,
                              role: 'Employee',
                              email: firebaseUser.email || employeeData.email,
                          } as UserData;
                      } else {
                          await signOut(auth);
                          toast({ title: "Akses Ditolak", description: "Anda tidak memiliki divisi yang sesuai untuk aplikasi ini.", variant: 'destructive' });
                          return;
                      }
                  } else {
                      await signOut(auth);
                      toast({ title: "Akses Ditolak", description: "Akun Anda tidak terdaftar dalam divisi manapun.", variant: 'destructive' });
                      return;
                  }
              }
            }

            if (finalUserData) {
              setUser(finalUserData);
              setIsAuthenticated(true);
              if (finalUserData.role === 'Employee') {
                if(finalUserData.branchId) setSelectedBranchIdState(finalUserData.branchId);
                if(finalUserData.warehouseId) setSelectedWarehouseIdState(finalUserData.warehouseId);
              }
            } else {
              await signOut(auth);
              setUser(null);
              setIsAuthenticated(false);
              toast({ title: "Login Gagal", description: "Data pengguna tidak ditemukan.", variant: 'destructive' });
            }

        } else {
            setUser(null);
            setIsAuthenticated(false);
        }
    });
    return () => unsubscribe();
  }, [db, toast]);

  useEffect(() => {
    if (!user) {
        setTransactions([]);
        setBranches([]);
        setWarehouses([]);
        return;
    };
    
    const idUMKM = user.idUMKM || (user.role === 'UMKM' ? user.uid : undefined);
    if (!idUMKM) return;

    const transactionsQuery = query(
        collection(db, "transactions"), 
        where("idUMKM", "==", idUMKM),
        where("status", "in", ["Diproses", "Sedang Disiapkan", "Siap Diantar", "Selesai Diantar"])
    );
    const unsubTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const { date, ...rest } = data;
        const jsDate = (data.date instanceof Timestamp) ? data.date.toDate() : new Date();
        const prepDate = (data.preparationStartTime instanceof Timestamp) ? data.preparationStartTime.toDate() : undefined;
        
        return {
            id: doc.id,
            ...rest,
            date: jsDate,
            preparationStartTime: prepDate,
            total: data.total || data.amount || 0,
            transactionNumber: data.transactionNumber || doc.id,
        } as Transaction;
      });
      setTransactions(transactionsData);
    });

    const branchesQuery = query(collection(db, "branches"), where("idUMKM", "==", idUMKM));
    const unsubBranches = onSnapshot(branchesQuery, (snapshot) => {
        const branchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
        setBranches(branchesData);
        if (user.role === 'UMKM' && !selectedBranchId && branchesData.length > 0) {
            setSelectedBranchId(branchesData[0].id);
        }
    });
    
    const warehousesQuery = query(collection(db, "warehouses"), where("idUMKM", "==", idUMKM));
    const unsubWarehouses = onSnapshot(warehousesQuery, (snapshot) => {
        const warehousesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warehouse));
        setWarehouses(warehousesData);
    });

    return () => {
        unsubTransactions();
        unsubBranches();
        unsubWarehouses();
    };
  }, [user, db, selectedBranchId]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return true;
    } catch (error: any) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            throw new Error("Kombinasi email dan password salah. Mohon periksa kembali.");
        }
        throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const saveCartAsPendingTransaction = useCallback(async (data: NewTransactionClientData): Promise<{ success: boolean; transactionId: string }> => {
    if (!user) {
        toast({ title: "Anda harus login", variant: "destructive" });
        throw new Error("User not authenticated.");
    }
    const idUMKM = user.role === 'UMKM' ? user.uid : user.idUMKM;
    if (!idUMKM) throw new Error("UMKM ID is missing.");
    
    // Logic for kitchen is only to record order, no stock or accounting.
    try {
        const itemsForTransaction: SaleItem[] = data.items.map(item => ({
            productId: item.id,
            productName: item.name,
            productType: item.productType,
            quantity: item.quantity,
            unitPrice: item.price,
            imageUrl: item.imageUrls?.[0] || item.imageUrl,
        }));

        const txDocRef = await addDoc(collection(db, 'transactions'), removeUndefinedDeep({
            ...data,
            idUMKM,
            date: new Date(),
            description: `Pesanan Dapur - Atas Nama: ${data.customerName}`,
            type: 'Sale',
            status: 'Diproses',
            paymentStatus: 'Pending',
            transactionNumber: `KSR-${Date.now()}`,
            items: itemsForTransaction,
            paymentMethod: 'Belum Dipilih',
            employeeId: user.role === 'Employee' ? user.employeeDocId : undefined,
            employeeName: user.role ==='Employee' ? user.name : undefined,
            isNotified: false,
        }));

        return { success: true, transactionId: txDocRef.id };
    } catch (error: any) {
        console.error("Error saving pending transaction:", error);
        toast({ title: 'Gagal Menyimpan', description: error.message || 'Terjadi kesalahan.', variant: 'destructive'});
        throw error;
    }
  }, [user, db, toast]);

  const updateTransactionOnly = async (transactionId: string, updatedItems: SaleItem[], newTotal: number, newSubtotal: number, newDiscount: number): Promise<boolean> => {
    if (!user) {
        toast({ title: "Anda harus login", variant: "destructive" });
        return false;
    }
    const txDocRef = doc(db, 'transactions', transactionId);

    try {
        const txSnap = await getDoc(txDocRef);
        if (!txSnap.exists()) throw new Error("Transaksi tidak ditemukan.");
        
        const currentStatus = txSnap.data().status;
        let newStatus = currentStatus;
        let isUpdated = false;
        
        if (currentStatus === 'Siap Diantar' || currentStatus === 'Selesai Diantar') {
            newStatus = 'Diproses';
            isUpdated = true;
        }

        const dataToUpdate = {
            items: updatedItems,
            total: newTotal,
            subtotal: newSubtotal,
            discountAmount: newDiscount,
            status: newStatus,
            isUpdated: isUpdated,
            date: new Date(), // Update timestamp on modification to bring it to front
        };

        await updateDoc(txDocRef, removeUndefinedDeep(dataToUpdate));

        toast({ title: 'Sukses', description: 'Perubahan pesanan berhasil disimpan.' });
        return true;
    } catch (error: any) {
        console.error("Error updating transaction:", error);
        toast({ title: 'Gagal', description: error.message || 'Gagal menyimpan perubahan pesanan.', variant: 'destructive' });
        return false;
    }
  };


  const deleteTransaction = async (transactionId: string): Promise<boolean> => {
    if (!user) {
        toast({ title: "Anda harus login", variant: "destructive" });
        return false;
    }

    const txDocRef = doc(db, 'transactions', transactionId);

    try {
        await updateDoc(txDocRef, { status: 'Dibatalkan' });
        toast({ title: 'Sukses', description: 'Pesanan telah berhasil dibatalkan.' });
        return true;
    } catch (error: any) {
        console.error("Error canceling transaction:", error);
        toast({ title: 'Gagal', description: error.message || 'Gagal membatalkan pesanan.', variant: 'destructive' });
        return false;
    }
  };

  const updateTransactionStatus = async (transactionId: string, status: 'Sedang Disiapkan' | 'Siap Diantar' | 'Selesai Diantar') => {
      const txDocRef = doc(db, 'transactions', transactionId);
      try {
          const updateData: { status: string, preparationStartTime?: Date, completedAt?: Date, isUpdated?: boolean } = { status };
          
          const docSnap = await getDoc(txDocRef);
          const currentData = docSnap.data();

          if (status === 'Sedang Disiapkan') {
              if (currentData && !currentData.preparationStartTime) {
                updateData.preparationStartTime = new Date();
              }
              // Reset the isUpdated flag when kitchen starts preparing
              updateData.isUpdated = false;
          } else if (status === 'Siap Diantar' || status === 'Selesai Diantar') {
              updateData.completedAt = new Date();
          }
          await updateDoc(txDocRef, updateData as { [x: string]: any; });
          toast({ title: 'Status Diperbarui', description: `Pesanan sekarang berstatus: ${status}` });
      } catch (error) {
          console.error("Error updating transaction status: ", error);
          toast({ title: 'Gagal', description: 'Gagal memperbarui status pesanan.', variant: 'destructive' });
      }
  };

  const markTransactionAsNotified = useCallback(async (transactionId: string) => {
    const txDocRef = doc(db, 'transactions', transactionId);
    try {
        await updateDoc(txDocRef, { isNotified: true });
    } catch(e) {
        console.error("Failed to mark transaction as notified in Firestore:", e);
    }
  }, [db]);
  
  const updateUserData = async (data: Partial<UserData>): Promise<boolean> => {
    if (!user || (!user.uid && !user.employeeDocId)) {
        toast({ title: "Anda harus login", variant: "destructive" });
        return false;
    }
    const docRef = doc(db, user.role === 'UMKM' ? 'dataUMKM' : 'employees', user.role === 'UMKM' ? user.uid : user.employeeDocId!);
    try {
        await updateDoc(docRef, data);
        setUser(prev => prev ? { ...prev, ...data } : null);
        return true;
    } catch (error) {
        console.error("Error updating user data:", error);
        return false;
    }
  };

  return (
    <AppContext.Provider
      value={{ 
        transactions,
        branches,
        warehouses,
        filteredWarehouses,
        selectedBranchId,
        setSelectedBranchId,
        selectedWarehouseId,
        setSelectedWarehouseId,
        saveCartAsPendingTransaction,
        updateTransactionOnly,
        deleteTransaction,
        updateTransactionStatus,
        markTransactionAsNotified,
        updateUserData,
        isAuthenticated,
        user,
        login,
        logout,
        locale,
        changeLocale,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
