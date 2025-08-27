
"use client";

import React, { createContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User as FirebaseAuthUser, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, getFirestore, onSnapshot, addDoc, Timestamp, updateDoc, writeBatch, runTransaction, serverTimestamp, documentId, orderBy, deleteDoc } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';

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
    cogs: number;
    imageUrl?: string;
    [key: string]: any;
}

export interface Transaction {
  id: string;
  date: Date;
  total: number;
  status: 'Selesai' | 'Dikirim' | 'Diproses' | 'Dibatalkan' | 'Lunas';
  items: SaleItem[];
  paymentMethod: string;
  paymentStatus: 'Berhasil' | 'Pending' | 'Gagal';
  amount?: number;
  paidAmount?: number;
  taxAmount?: number;
  discountAmount?: number;
  serviceFee?: number;
  transactionNumber?: string;
  branchId?: string;
  warehouseId?: string;
  tableNumber?: string;
  lines?: { accountId: string; debit: number; credit: number; description: string }[];
  employeeId?: string;
  employeeName?: string;
  [key: string]: any;
}

export type NewTransactionClientData = {
    items: CartItem[]; // Changed to CartItem for client-side processing
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    paymentMethod: string;
    customerId: string;
    customerName: string;
    branchId: string;
    warehouseId: string;
    salesAccountId: string;
    cogsAccountId: string;
    inventoryAccountId: string;
    paymentAccountId: string;
    discountAccountId?: string;
    taxAccountId?: string;
    isPkp?: boolean;
    serviceFee?: number;
    tableNumber?: string;
};

export type PendingTransactionClientData = Omit<NewTransactionClientData, 
  'paymentMethod' | 'salesAccountId' | 'cogsAccountId' | 'inventoryAccountId' | 'paymentAccountId' | 'taxAccountId' | 'discountAccountId'
>;


export type UpdatedAccountInfo = {
  isPkp?: boolean;
  paymentAccountId?: string;
  salesAccountId?: string;
  discountAccountId?: string;
  cogsAccountId?: string;
  inventoryAccountId?: string;
  taxAccountId?: string;
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


export type HeldCart = {
  id: number;
  cart: CartItem[];
  customerName: string;
  customerId?: string;
  heldAt: Date;
};

export type UserData = {
    uid: string;
    role: 'UMKM' | 'Employee' | 'SuperAdmin';
    email: string;
    // UMKM fields
    ownerName?: string;
    umkmName?: string;
    businessName?: string;
    // Common fields
    photoUrl?: string; // Unified photo URL
    address?: string;
    phone?: string;
    // UMKM Specific fields
    serviceFeeTier1?: number;
    serviceFeeTier2?: number;
    serviceFeeTier3?: number;
    // Employee fields
    name?: string;
    employeeDocId?: string; // Storing employee's own document ID
    branchId?: string; // Assigned branch for employee
    warehouseId?: string; // Assigned warehouse for employee
    [key: string]: any;
};

type Locale = 'en' | 'id';
type Translations = typeof en; // Assuming 'en' has all keys

interface AppContextType {
  products: Product[];
  stockLots: StockLot[];
  cart: CartItem[];
  wishlist: Product[];
  transactions: Transaction[];
  customers: Customer[];
  heldCarts: HeldCart[];
  accounts: Account[];
  notifications: Notification[];
  branches: Branch[];
  warehouses: Warehouse[];
  productUnits: ProductUnit[];
  productCategories?: ProductCategory[];
  filteredWarehouses: Warehouse[];
  selectedBranchId?: string;
  setSelectedBranchId: (id: string) => void;
  selectedWarehouseId?: string;
  setSelectedWarehouseId: (id: string) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  addTransaction: (data: NewTransactionClientData) => Promise<{ success: boolean; transactionId: string }>;
  saveCartAsPendingTransaction: (data: PendingTransactionClientData) => Promise<{ success: boolean; transactionId: string }>;
  updateTransactionAndPay: (transaction: Transaction, discountAmount: number, accountInfo: UpdatedAccountInfo) => Promise<boolean>;
  updateTransactionOnly: (transaction: Transaction, discountAmount: number, settings: { isPkp?: boolean }) => Promise<boolean>;
  updateTransactionDiscount: (transactionId: string, discountAmount: number, accountInfo: UpdatedAccountInfo) => Promise<boolean>;
  deleteTransaction: (transactionId: string) => Promise<boolean>;
  clearCart: () => void;
  addCustomer: (customerData: { name: string; email?: string, phone?: string }) => Promise<Customer | null>;
  holdCart: (customerName: string, customerId?: string) => void;
  resumeCart: (cartId: number) => void;
  deleteHeldCart: (cartId: number) => void;
  markNotificationAsRead: (notificationId: string) => void;
  addShiftReportNotification: (summary: { totalTransactions: number; totalRevenue: number }) => void;
  updateUserData: (data: Partial<UserData>) => Promise<boolean>;
  isAuthenticated: boolean;
  user: UserData | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  // i18n
  locale: Locale;
  changeLocale: (locale: Locale) => void;
  t: (key: keyof Translations) => string;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const initialTransactions: Transaction[] = [];

const LOW_STOCK_THRESHOLD = 5;

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
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLots, setStockLots] = useState<StockLot[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [productUnits, setProductUnits] = useState<ProductUnit[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
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

  // Load cart & held carts from localStorage on initial render
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('activeCart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
      const savedHeldCarts = localStorage.getItem('heldCarts');
      if (savedHeldCarts) {
        // We need to parse dates correctly from string
        const parsedHeldCarts = JSON.parse(savedHeldCarts).map((c: any) => ({
            ...c,
            heldAt: new Date(c.heldAt)
        }));
        setHeldCarts(parsedHeldCarts);
      }
    } catch (error) {
      console.error("Failed to parse data from localStorage", error);
      localStorage.removeItem('activeCart');
      localStorage.removeItem('heldCarts');
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('activeCart', JSON.stringify(cart));
    } catch (error) {
      console.error("Failed to save cart to localStorage", error);
    }
  }, [cart]);

  // Save held carts to localStorage whenever it changes
  useEffect(() => {
      try {
          localStorage.setItem('heldCarts', JSON.stringify(heldCarts));
      } catch (error) {
          console.error("Failed to save held carts to localStorage", error);
      }
  }, [heldCarts]);


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBranchId = localStorage.getItem('selectedBranchId');
      if (storedBranchId) setSelectedBranchIdState(storedBranchId);
      const storedWarehouseId = localStorage.getItem('selectedWarehouseId');
      if (storedWarehouseId) setSelectedWarehouseIdState(storedWarehouseId);
    }
  }, []);

  const setSelectedBranchId = (id: string) => {
    if (user?.role === 'Employee') return; // Employees cannot change their assigned branch
    setSelectedBranchIdState(id);
    localStorage.setItem('selectedBranchId', id);
    // Reset warehouse selection if it's not valid for the new branch
    const newFilteredWarehouses = warehouses.filter(wh => wh.branchId === id);
    if (!newFilteredWarehouses.some(wh => wh.id === selectedWarehouseId)) {
        setSelectedWarehouseId(''); // Reset or set to the first available
    }
  };
  
  const setSelectedWarehouseId = (id: string) => {
    if (user?.role === 'Employee') return; // Employees cannot change their assigned warehouse
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

  // Real-time listener for user data
  useEffect(() => {
    if (!user?.uid) return;

    let userDocRef;
    if (user.role === 'UMKM') {
      userDocRef = doc(db, 'dataUMKM', user.uid);
    } else if (user.role === 'Employee') {
      userDocRef = doc(db, 'employees', user.employeeDocId!);
    } else {
      return; // No listener for SuperAdmin or other roles for now
    }

    const unsub = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const freshData = { ...user, ...docSnap.data() };
        setUser(freshData);
        localStorage.setItem('sagara-user-data', JSON.stringify(freshData));
      }
    });

    return () => unsub();
  }, [user?.uid, user?.role, user?.employeeDocId, db]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseAuthUser | null) => {
        if (firebaseUser) {
            const storedUser = localStorage.getItem('sagara-user-data');
            if(storedUser) {
                const parsedUser: UserData = JSON.parse(storedUser);
                setUser(parsedUser);
                setIsAuthenticated(true);
                // For employees, automatically set their assigned branch/warehouse
                if (parsedUser.role === 'Employee') {
                  if(parsedUser.branchId) setSelectedBranchIdState(parsedUser.branchId);
                  if(parsedUser.warehouseId) setSelectedWarehouseIdState(parsedUser.warehouseId);
                }
            }
        } else {
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('sagara-user-data');
        }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
        setCustomers([]);
        setProducts([]);
        setAccounts([]);
        setTransactions([]);
        setBranches([]);
        setWarehouses([]);
        setProductUnits([]);
        setProductCategories([]);
        setStockLots([]);
        return;
    };
    
    const idUMKM = user.idUMKM || (user.role === 'UMKM' ? user.uid : undefined);
    if (!idUMKM) return;

    const customersQuery = query(collection(db, "customers"), where("idUMKM", "==", idUMKM));
    const unsubCustomers = onSnapshot(customersQuery, (snapshot) => {
        const customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
        setCustomers(customersData);
    });

    const productsQuery = query(collection(db, "products"), where("idUMKM", "==", idUMKM));
    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
        const productsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                imageUrls: data.imageUrls || [],
                productType: data.productSubType === 'Jasa' ? 'Jasa' : 'Barang',
            } as Product;
        });
        setProducts(productsData);
    });

    const stockLotsQuery = query(collection(db, "stockLots"), where("idUMKM", "==", idUMKM));
    const unsubStockLots = onSnapshot(stockLotsQuery, (snapshot) => {
        const lotsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                purchaseDate: (data.purchaseDate as Timestamp)?.toDate() || (data.createdAt as Timestamp)?.toDate(),
                createdAt: (data.createdAt as Timestamp)?.toDate(),
                expirationDate: (data.expirationDate as Timestamp)?.toDate(),
            } as StockLot;
        });
        setStockLots(lotsData);
    });

    const accountsQuery = query(collection(db, "accounts"), where("idUMKM", "==", idUMKM));
    const unsubAccounts = onSnapshot(accountsQuery, (snapshot) => {
        const accountsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
        setAccounts(accountsData);
    });

    const transactionsQuery = query(collection(db, "transactions"), where("idUMKM", "==", idUMKM));
    const unsubTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      const transactionsData = snapshot.docs.map(doc => {
        const data = doc.data();
        const { date, ...rest } = data;
        const jsDate = (date instanceof Timestamp) ? date.toDate() : new Date();
        
        return {
            id: doc.id,
            ...rest,
            date: jsDate,
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
        // Initial warehouse selection logic is now handled by the branch selection effect
    });
    
    const unitsQuery = query(collection(db, "productUnits"), where("idUMKM", "==", idUMKM));
    const unsubUnits = onSnapshot(unitsQuery, (snapshot) => {
      const unitsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductUnit));
      setProductUnits(unitsData);
    });
    
    const categoriesQuery = query(collection(db, "productCategories"), where("idUMKM", "==", idUMKM));
    const unsubCategories = onSnapshot(categoriesQuery, (snapshot) => {
        const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductCategory));
        setProductCategories(categoriesData);
    });


    return () => {
        unsubCustomers();
        unsubProducts();
        unsubStockLots();
        unsubAccounts();
        unsubTransactions();
        unsubBranches();
        unsubWarehouses();
        unsubUnits();
        unsubCategories();
    };
  }, [user, db, selectedWarehouseId]); // Added selectedWarehouseId dependency

  // Low Stock Notification Logic
  useEffect(() => {
    const lowStockProducts = products.filter(p => p.productSubType !== 'Jasa' && typeof p.stock === 'number' && p.stock <= (p.lowStockThreshold || LOW_STOCK_THRESHOLD) && p.stock > 0);
    
    setNotifications(prevNotifs => {
        const newNotifs: Notification[] = [...prevNotifs.filter(n => n.type !== 'low_stock')];
        lowStockProducts.forEach(p => {
            const existingNotif = newNotifs.find(n => n.type === 'low_stock' && n.relatedId === p.id);
            if (!existingNotif) {
                newNotifs.push({
                    id: `low_stock_${p.id}`,
                    type: 'low_stock',
                    title: 'Peringatan Stok Rendah',
                    message: `Stok untuk ${p.name} tersisa ${p.stock}. Segera lakukan pemesanan ulang.`,
                    timestamp: new Date(),
                    isRead: false,
                    relatedId: p.id
                });
            }
        });
        return newNotifs;
    });

  }, [products]);


  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;

      let finalUserData: UserData | null = null;
      
      // 1. Check if user is a UMKM owner
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
        // 2. If not owner, check if user is an Employee
        const employeesQuery = query(collection(db, "employees"), where("uid", "==", firebaseUser.uid));
        const employeeSnapshot = await getDocs(employeesQuery);

        if (!employeeSnapshot.empty) {
            const employeeDoc = employeeSnapshot.docs[0];
            const employeeData = employeeDoc.data();

            if (employeeData.canLogin !== true) {
                await signOut(auth);
                throw new Error("Akun karyawan Anda tidak aktif. Silakan hubungi administrator.");
            }

            const divisionIds = employeeData.divisionIds || [];
            if (divisionIds.length > 0) {
                const divisionsQuery = query(collection(db, 'divisions'), where(documentId(), 'in', divisionIds));
                const divisionsSnapshot = await getDocs(divisionsQuery);
                const divisionNames = divisionsSnapshot.docs.map(d => d.data().name.toLowerCase());
                
                if (divisionNames.includes('waitress') || divisionNames.includes('pelayan')) {
                    finalUserData = {
                        uid: firebaseUser.uid,
                        ...employeeData,
                        employeeDocId: employeeDoc.id, // Store employee document ID
                        role: 'Employee',
                        email: firebaseUser.email || employeeData.email,
                    } as UserData;
                    // Automatically set branch and warehouse for the employee
                    if(employeeData.branchId) setSelectedBranchIdState(employeeData.branchId);
                    if(employeeData.warehouseId) setSelectedWarehouseIdState(employeeData.warehouseId);

                } else {
                    await signOut(auth);
                    throw new Error("Anda tidak memiliki divisi 'Waitress' atau 'Pelayan' untuk mengakses aplikasi ini.");
                }
            } else {
                await signOut(auth);
                throw new Error("Akun Anda tidak terdaftar dalam divisi manapun.");
            }
        }
      }

      if (finalUserData) {
        setUser(finalUserData);
        localStorage.setItem('sagara-user-data', JSON.stringify(finalUserData));
        setIsAuthenticated(true);
        return true;
      } else {
        await signOut(auth);
        throw new Error("Data pengguna tidak ditemukan. Pastikan Anda terdaftar sebagai pemilik UMKM atau karyawan yang sesuai.");
      }
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

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1, imageUrls: product.imageUrls || [] }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const addToWishlist = (product: Product) => {
    setWishlist((prev) => {
      if (prev.find(item => item.id === product.id)) {
        return prev;
      }
      return [...prev, product];
    });
  };
  
  const removeFromWishlist = (productId: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.id === productId);
  };

  const addTransaction = useCallback(async (data: NewTransactionClientData): Promise<{ success: boolean; transactionId: string }> => {
    if (!user) throw new Error("User not authenticated.");
    
    const idUMKM = user.role === 'UMKM' ? user.uid : user.idUMKM;
    const { warehouseId, branchId } = data;

    if (!idUMKM || !warehouseId || !branchId) {
        const msg = `Data tidak lengkap untuk transaksi. UMKM: ${!!idUMKM}, Gudang: ${!!warehouseId}, Cabang: ${!!branchId}`;
        console.error(msg);
        toast({ title: 'Gagal', description: "Informasi UMKM, gudang, atau cabang tidak lengkap.", variant: 'destructive' });
        throw new Error(msg);
    }

    let transactionId = "";

    try {
        await runTransaction(db, async (transaction) => {
            const physicalItems = data.items.filter(item => item.productType === 'Barang');
            
            let totalCogs = 0;
            const itemsForTransaction: SaleItem[] = [];

            for (const item of physicalItems) {
                if (!item.id) {
                    throw new Error(`Item "${item.name || 'Unknown'}" memiliki ID yang tidak valid.`);
                }
                
                // Use local state instead of getDocs for offline capability
                const availableLots = stockLots
                    .filter(lot => lot.productId === item.id && lot.warehouseId === warehouseId && lot.remainingQuantity > 0)
                    .sort((a, b) => a.purchaseDate.getTime() - b.purchaseDate.getTime());

                const totalStockForProduct = availableLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
                if (totalStockForProduct < item.quantity) {
                    throw new Error(`Stok tidak mencukupi untuk ${item.name}.`);
                }

                let quantityToDeduct = item.quantity;
                let itemCogs = 0;
                for (const lot of availableLots) {
                    if (quantityToDeduct <= 0) break;
                    
                    const lotRef = doc(db, 'stockLots', lot.id);
                    if (lot.remainingQuantity <= 0) continue;
                    if (!lot.purchasePrice || lot.purchasePrice <= 0) throw new Error(`Lot stok ${lot.id} untuk produk ${item.name} tidak memiliki harga beli yang valid.`);
                    
                    const quantityFromThisLot = Math.min(quantityToDeduct, lot.remainingQuantity);
                    itemCogs += quantityFromThisLot * lot.purchasePrice;
                    
                    transaction.update(lotRef, { remainingQuantity: lot.remainingQuantity - quantityFromThisLot });
                    quantityToDeduct -= quantityFromThisLot;
                }
                itemsForTransaction.push({
                    productId: item.id, productName: item.name, productType: 'Barang',
                    quantity: item.quantity, unitPrice: item.price, cogs: itemCogs,
                });
                totalCogs += itemCogs;
            }

            // Add service items
            data.items.filter(item => item.productType === 'Jasa').forEach(item => {
              itemsForTransaction.push({
                  productId: item.id, productName: item.name, productType: 'Jasa',
                  quantity: item.quantity, unitPrice: item.price, cogs: 0,
              });
            });

            // --- Construct Journal Lines ---
            const {
                total, subtotal, discountAmount, taxAmount, isPkp,
                paymentMethod, salesAccountId, cogsAccountId, inventoryAccountId,
                paymentAccountId, discountAccountId, taxAccountId,
                customerId, customerName, serviceFee
            } = data;
            
            const serviceFeeAccount = accounts.find(a => a.category === 'Liabilitas' && a.name.toLowerCase().includes('utang biaya layanan berez'));

            const requiredAccounts = [
                ['paymentAccountId', paymentAccountId],
                ['salesAccountId', salesAccountId],
                ['cogsAccountId', cogsAccountId],
                ['inventoryAccountId', inventoryAccountId],
            ].filter(([, v]) => !v).map(([k]) => k);
            if (requiredAccounts.length > 0) {
                throw new Error(`Akun wajib belum lengkap: ${requiredAccounts.join(', ')}`);
            }
            
            const newLines: any[] = [
                { accountId: paymentAccountId, debit: total, credit: 0, description: `Penerimaan Penjualan Kasir via ${paymentMethod}` },
                { accountId: salesAccountId, debit: 0, credit: subtotal, description: 'Pendapatan Penjualan dari Kasir' },
                { accountId: cogsAccountId, debit: totalCogs, credit: 0, description: 'HPP Penjualan dari Kasir' },
                { accountId: inventoryAccountId, debit: 0, credit: totalCogs, description: 'Pengurangan Persediaan dari Kasir' },
            ];
            
            if (discountAmount > 0 && discountAccountId) {
                newLines.push({ accountId: discountAccountId, debit: discountAmount, credit: 0, description: 'Potongan Penjualan Kasir' });
            }
            if (isPkp && taxAmount > 0 && taxAccountId) {
                newLines.push({ accountId: taxAccountId, debit: 0, credit: taxAmount, description: 'PPN Keluaran dari Penjualan Kasir' });
            }
            if (serviceFee && serviceFee > 0 && serviceFeeAccount) {
                newLines.push({ accountId: serviceFeeAccount.id, debit: 0, credit: serviceFee, description: 'Utang Biaya Layanan Aplikasi' });
            }
            
            const transactionTimestamp = new Date();
            const txDocRef = doc(collection(db, 'transactions'));
            const transactionData = {
                idUMKM, warehouseId, branchId, customerId, customerName,
                date: transactionTimestamp,
                description: `Penjualan Kasir - Atas Nama: ${data.customerName}`, type: 'Sale',
                status: 'Lunas', paymentStatus: 'Berhasil', transactionNumber: `KSR-${Date.now()}`,
                amount: total, paidAmount: total, total,
                subtotal, discountAmount, taxAmount, items: itemsForTransaction,
                paymentMethod, lines: newLines, paymentAccountId, salesAccountId, cogsAccountId,
                discountAccountId: discountAccountId || null,
                inventoryAccountId, taxAccountId: taxAccountId || null,
                isPkp, serviceFee: serviceFee || 0,
                tableNumber: data.tableNumber,
            };

            transaction.set(txDocRef, removeUndefinedDeep(transactionData));
            transactionId = txDocRef.id;
        });
        
        return { success: true, transactionId };

    } catch (error: any) {
        console.error("Payment processing error in AppProvider:", error);
        toast({ title: 'Gagal Memproses Pembayaran', description: error.message || 'Terjadi kesalahan saat menyimpan data.', variant: 'destructive'});
        throw error;
    }
  }, [user, db, accounts, toast, stockLots]);

  const saveCartAsPendingTransaction = useCallback(async (data: PendingTransactionClientData): Promise<{ success: boolean; transactionId: string }> => {
    if (!user) {
        toast({ title: "Anda harus login", variant: "destructive" });
        throw new Error("User not authenticated.");
    }
    const idUMKM = user.role === 'UMKM' ? user.uid : user.idUMKM;
    if (!idUMKM) throw new Error("UMKM ID is missing.");
    
    let transactionId = "";

    try {
        await runTransaction(db, async (transaction) => {
            const itemsForTransaction: SaleItem[] = [];
            for (const item of data.items) {
                 if (item.productType === 'Barang') {
                     // Use local state instead of getDocs for offline capability
                     const availableLots = stockLots
                        .filter(lot => lot.productId === item.id && lot.warehouseId === data.warehouseId && lot.remainingQuantity > 0)
                        .sort((a, b) => a.purchaseDate.getTime() - b.purchaseDate.getTime());

                    const totalStockForProduct = availableLots.reduce((sum, lot) => sum + lot.remainingQuantity, 0);
                    if (totalStockForProduct < item.quantity) {
                        throw new Error(`Stok tidak mencukupi untuk ${item.name}.`);
                    }

                    let quantityToDeduct = item.quantity;
                    for (const lot of availableLots) {
                        if (quantityToDeduct <= 0) break;
                        const lotRef = doc(db, 'stockLots', lot.id);
                        const quantityFromThisLot = Math.min(quantityToDeduct, lot.remainingQuantity);
                        transaction.update(lotRef, { remainingQuantity: lot.remainingQuantity - quantityFromThisLot });
                        quantityToDeduct -= quantityFromThisLot;
                    }
                 }
                
                itemsForTransaction.push({
                    productId: item.id, productName: item.name, productType: item.productType,
                    quantity: item.quantity, unitPrice: item.price, cogs: 0,
                    imageUrl: item.imageUrls?.[0] || item.imageUrl,
                });
            }

            const txDocRef = doc(collection(db, 'transactions'));
            const transactionData = {
                ...data,
                idUMKM,
                date: new Date(),
                description: `Pesanan Kasir (Tertunda) - Atas Nama: ${data.customerName}`,
                type: 'Sale',
                status: 'Diproses',
                paymentStatus: 'Pending',
                transactionNumber: `KSR-${Date.now()}`,
                items: itemsForTransaction,
                paymentMethod: 'Belum Dipilih',
                employeeId: user.role === 'Employee' ? user.employeeDocId : undefined,
                employeeName: user.role === 'Employee' ? user.name : undefined,
            };
            transaction.set(txDocRef, removeUndefinedDeep(transactionData));
            transactionId = txDocRef.id;
        });

        return { success: true, transactionId };
    } catch (error: any) {
        console.error("Error saving pending transaction:", error);
        toast({ title: 'Gagal Menyimpan', description: error.message || 'Terjadi kesalahan.', variant: 'destructive'});
        throw error;
    }
  }, [user, db, toast, stockLots]);


  const updateTransactionOnly = async (editedTransaction: Transaction, discountAmount: number, settings: { isPkp?: boolean }): Promise<boolean> => {
    if (!user) {
        toast({ title: "Anda harus login", variant: "destructive" });
        return false;
    }
    const idUMKM = user.role === 'UMKM' ? user.uid : user.idUMKM;
    if (!idUMKM) return false;

    const txDocRef = doc(db, 'transactions', editedTransaction.id);

    try {
        const txSnap = await getDoc(txDocRef);
        if (!txSnap.exists()) throw new Error("Transaksi tidak ditemukan.");
        
        const originalTx = txSnap.data() as Transaction;
        const warehouseId = originalTx.warehouseId;
        if (!warehouseId) throw new Error("Gudang asal transaksi tidak ditemukan.");
        
        const batch = writeBatch(db);
        
        const stockDeltas = new Map<string, number>();
        editedTransaction.items.filter(i => i.productType === 'Barang').forEach(i => stockDeltas.set(i.productId, (stockDeltas.get(i.productId) || 0) + i.quantity));
        originalTx.items.filter(i => i.productType === 'Barang').forEach(i => stockDeltas.set(i.productId, (stockDeltas.get(i.productId) || 0) - i.quantity));

        for (const [productId, delta] of stockDeltas.entries()) {
            if (delta === 0) continue;
            
            const availableLots = stockLots
                .filter(lot => lot.productId === productId && lot.warehouseId === warehouseId)
                .sort((a, b) => a.purchaseDate.getTime() - b.purchaseDate.getTime());

            let amountToChange = Math.abs(delta);
            
            if (delta > 0) { // Deduct stock
                const totalStockForProduct = availableLots.filter(l => l.remainingQuantity > 0).reduce((sum, lot) => sum + lot.remainingQuantity, 0);
                if (totalStockForProduct < delta) {
                    throw new Error(`Stok tidak cukup untuk ${editedTransaction.items.find(i=>i.productId === productId)?.productName}. Dibutuhkan tambahan: ${delta}, Tersedia: ${totalStockForProduct}`);
                }
                const lotsToDeductFrom = availableLots.filter(l => l.remainingQuantity > 0);
                for (const lot of lotsToDeductFrom) {
                    if (amountToChange <= 0) break;
                    const lotRef = doc(db, 'stockLots', lot.id);
                    const quantityFromThisLot = Math.min(amountToChange, lot.remainingQuantity);
                    batch.update(lotRef, { remainingQuantity: lot.remainingQuantity - quantityFromThisLot });
                    amountToChange -= quantityFromThisLot;
                }
            } else { // Return stock
                const lotsToReturnTo = availableLots.sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime()); // LIFO for returns
                for (const lot of lotsToReturnTo) {
                    if (amountToChange <= 0) break;
                    const lotRef = doc(db, 'stockLots', lot.id);
                    const canReturnToLot = lot.initialQuantity - lot.remainingQuantity;
                    const amountToReturn = Math.min(amountToChange, canReturnToLot);
                    if (amountToReturn > 0) {
                        batch.update(lotRef, { remainingQuantity: lot.remainingQuantity + amountToReturn });
                        amountToChange -= amountToReturn;
                    }
                }
            }
        }

        const subtotal = editedTransaction.items?.reduce((sum, item) => sum + asNumber(item.unitPrice) * asNumber(item.quantity), 0);
        const serviceFee = asNumber(editedTransaction.serviceFee);
        const subtotalAfterDiscount = subtotal - asNumber(discountAmount);
        const taxAmount = settings.isPkp ? subtotalAfterDiscount * 0.11 : 0;
        const total = subtotalAfterDiscount + taxAmount + serviceFee;
        
        const dataToUpdate = {
            items: editedTransaction.items.map(item => ({...item, imageUrl: item.imageUrls?.[0] || item.imageUrl})),
            subtotal, discountAmount, taxAmount, total,
            isPkp: settings.isPkp,
            amount: total,
            date: new Date(),
        };

        batch.update(txDocRef, removeUndefinedDeep(dataToUpdate));
        await batch.commit();

        toast({ title: 'Sukses', description: 'Perubahan transaksi berhasil disimpan.' });
        return true;
    } catch (error: any) {
        console.error("Error updating transaction:", error);
        toast({ title: 'Gagal', description: error.message || 'Gagal menyimpan perubahan transaksi.', variant: 'destructive' });
        return false;
    }
  };


  const asNumber = (n: any) => (typeof n === 'number' && !Number.isNaN(n)) ? n : 0;

  const updateTransactionAndPay = async (editedTransaction: Transaction, discountAmount: number, accountInfo: UpdatedAccountInfo): Promise<boolean> => {
    if (!user) {
        toast({ title: "Anda harus login", variant: "destructive" });
        return false;
    }
    const idUMKM = user.role === 'UMKM' ? user.uid : user.idUMKM;
    const txDocRef = doc(db, 'transactions', editedTransaction.id);

    try {
        await runTransaction(db, async (transaction) => {
            const txSnap = await transaction.get(txDocRef);
            if (!txSnap.exists()) throw new Error("Transaksi tidak ditemukan.");

            const originalTxData = txSnap.data() as Transaction;
            const warehouseId = originalTxData.warehouseId;
            if (!warehouseId) throw new Error("Gudang asal transaksi tidak ditemukan.");
            
            const originalItemQuantities = new Map<string, number>();
            originalTxData.items.filter(item => item.productType === 'Barang').forEach(item => {
                originalItemQuantities.set(item.productId, item.quantity);
            });

            // --- Recalculate COGS and Update Stock for the new item set (only for goods) ---
            let totalCogs = 0;
            const itemsForTransaction: SaleItem[] = [];

            // First, virtually return all stock from the original transaction to calculate availability correctly
            const stockAvailability = new Map<string, number>();
            const allProductIds = new Set([...originalItemQuantities.keys(), ...editedTransaction.items.map(i => i.productId)]);

            for (const productId of allProductIds) {
                if (!productId) continue;
                
                let currentStock = stockLots
                    .filter(lot => lot.productId === productId && lot.warehouseId === warehouseId)
                    .reduce((sum, lot) => sum + lot.remainingQuantity, 0);

                stockAvailability.set(productId, currentStock + (originalItemQuantities.get(productId) || 0));
            }


            for (const item of editedTransaction.items.filter(item => item.productType === 'Barang')) {
                const availableStock = stockAvailability.get(item.productId) || 0;
                if (availableStock < item.quantity) {
                    throw new Error(`Stok tidak mencukupi untuk ${item.productName}. Stok tersedia: ${availableStock}.`);
                }
                 const availableLots = stockLots
                    .filter(lot => lot.productId === item.productId && lot.warehouseId === warehouseId)
                    .sort((a, b) => a.purchaseDate.getTime() - b.purchaseDate.getTime());
                
                const tempLots = JSON.parse(JSON.stringify(availableLots));
                
                // Return original quantity to temp lots for correct FIFO calculation
                let tempReturned = originalItemQuantities.get(item.productId) || 0;
                for(let i = tempLots.length - 1; i >= 0; i--) {
                  if (tempReturned <= 0) break;
                  const lotInitialQty = tempLots[i].initialQuantity || 0;
                  const returnedHere = Math.min(tempReturned, lotInitialQty - tempLots[i].remainingQuantity);
                  tempLots[i].remainingQuantity += returnedHere;
                  tempReturned -= returnedHere;
                }

                // Now, deduct the new quantity from the temp lots to calculate COGS
                let quantityToDeduct = item.quantity;
                let itemCogs = 0;
                for (const lot of tempLots) {
                    if (quantityToDeduct <= 0) break;
                    const quantityFromThisLot = Math.min(quantityToDeduct, lot.remainingQuantity);
                    itemCogs += quantityFromThisLot * (lot.purchasePrice || 0);
                    quantityToDeduct -= quantityFromThisLot;
                }
                itemsForTransaction.push({ ...item, cogs: itemCogs });
                totalCogs += itemCogs;
            }
             
            // After calculating COGS, now we perform actual stock updates in the transaction
            const stockDeltas = new Map<string, number>();
            editedTransaction.items.filter(i => i.productType === 'Barang').forEach(i => stockDeltas.set(i.productId, (stockDeltas.get(i.productId) || 0) + i.quantity));
            originalTxData.items.filter(i => i.productType === 'Barang').forEach(i => stockDeltas.set(i.productId, (stockDeltas.get(i.productId) || 0) - i.quantity));

            for (const [productId, delta] of stockDeltas.entries()) {
                if (delta === 0) continue;
                let amountToChange = Math.abs(delta);
                const sortOrder = delta > 0 ? "asc" : "desc"; // Deduct from oldest, return to newest
                
                const lotsToUpdate = stockLots
                    .filter(lot => lot.productId === productId && lot.warehouseId === warehouseId)
                    .sort((a,b) => sortOrder === 'asc' ? a.purchaseDate.getTime() - b.purchaseDate.getTime() : b.purchaseDate.getTime() - a.purchaseDate.getTime());


                for (const lotData of lotsToUpdate) {
                    if (amountToChange <= 0) break;
                    const lotRef = doc(db, 'stockLots', lotData.id);

                    if (delta > 0) { // Deduct stock
                        const canTake = Math.min(amountToChange, lotData.remainingQuantity);
                        transaction.update(lotRef, { remainingQuantity: lotData.remainingQuantity - canTake });
                        amountToChange -= canTake;
                    } else { // Return stock
                        const canReturn = Math.min(amountToChange, lotData.initialQuantity - lotData.remainingQuantity);
                        transaction.update(lotRef, { remainingQuantity: lotData.remainingQuantity + canReturn });
                        amountToChange -= canReturn;
                    }
                }
            }


            editedTransaction.items.filter(item => item.productType === 'Jasa').forEach(item => {
                itemsForTransaction.push({ ...item, cogs: 0 });
            });


            // --- Rebuild the transaction document with updated values ---
            const findDefaultPaymentAccount = () => accounts.find(a => a.name.toLowerCase().includes('kas') || a.name.toLowerCase().includes('bank'))?.id;

            const finalAccountInfo = {
                isPkp: accountInfo.isPkp ?? originalTxData.isPkp,
                paymentAccountId: accountInfo.paymentAccountId ?? originalTxData.paymentAccountId ?? findDefaultPaymentAccount(),
                salesAccountId: accountInfo.salesAccountId ?? originalTxData.salesAccountId,
                discountAccountId: accountInfo.discountAccountId ?? originalTxData.discountAccountId,
                cogsAccountId: accountInfo.cogsAccountId ?? originalTxData.cogsAccountId,
                inventoryAccountId: accountInfo.inventoryAccountId ?? originalTxData.inventoryAccountId,
                taxAccountId: accountInfo.taxAccountId ?? originalTxData.taxAccountId,
            };
            
            const subtotal = editedTransaction.items?.reduce((sum, item) => sum + asNumber(item.unitPrice) * asNumber(item.quantity), 0);
            const serviceFee = asNumber(originalTxData.serviceFee);
            const subtotalAfterDiscount = subtotal - asNumber(discountAmount);
            const taxAmount = finalAccountInfo.isPkp ? subtotalAfterDiscount * 0.11 : 0;
            const total = subtotalAfterDiscount + taxAmount + serviceFee;
    
            const serviceFeeAccount = accounts.find(a => a.category === 'Liabilitas' && a.name.toLowerCase().includes('utang biaya layanan berez'));
            
            const lines = [
              { accountId: finalAccountInfo.paymentAccountId!,  debit: asNumber(total),     credit: 0,                description: `Penerimaan Penjualan Kasir via ${originalTxData.paymentMethod}` },
              { accountId: finalAccountInfo.salesAccountId!,    debit: 0,                   credit: asNumber(subtotal), description: 'Pendapatan Penjualan dari Kasir' },
              { accountId: finalAccountInfo.cogsAccountId!,     debit: asNumber(totalCogs), credit: 0,                description: 'HPP Penjualan dari Kasir' },
              { accountId: finalAccountInfo.inventoryAccountId!,debit: 0,                   credit: asNumber(totalCogs), description: 'Pengurangan Persediaan dari Kasir' },
            ];
            
            if (asNumber(discountAmount) > 0 && finalAccountInfo.discountAccountId) { lines.push({ accountId: finalAccountInfo.discountAccountId, debit: asNumber(discountAmount), credit: 0, description: 'Potongan Penjualan Kasir (Diperbarui)' }); }
            if (finalAccountInfo.isPkp && taxAmount > 0 && finalAccountInfo.taxAccountId) { lines.push({ accountId: finalAccountInfo.taxAccountId, debit: 0, credit: asNumber(taxAmount), description: 'PPN Keluaran dari Penjualan Kasir (Diperbarui)' }); }
            if (serviceFee > 0 && serviceFeeAccount) { lines.push({ accountId: serviceFeeAccount.id, debit: 0, credit: asNumber(serviceFee), description: 'Utang Biaya Layanan Aplikasi' }); }

            const dataToUpdateRaw = {
              ...finalAccountInfo,
              items: itemsForTransaction,
              subtotal, discountAmount, taxAmount, total,
              status: 'Lunas', paymentStatus: 'Berhasil', amount: total, paidAmount: total,
              lines,
              date: new Date(), // Update the date to reflect payment time
            };
            
            transaction.update(txDocRef, removeUndefinedDeep(dataToUpdateRaw));
        });

        toast({ title: 'Sukses', description: 'Transaksi berhasil dilunasi dan diperbarui.' });
        return true;
    } catch (error: any) {
        console.error("Error updating transaction:", error);
        toast({ title: 'Gagal', description: error.message || 'Gagal memperbarui transaksi.', variant: 'destructive' });
        return false;
    }
  };


  const updateTransactionDiscount = async (transactionId: string, discountAmount: number, accountInfo: UpdatedAccountInfo): Promise<boolean> => {
    if (!user) {
      toast({ title: "Anda harus login", variant: "destructive" });
      return false;
    }
    const txDocRef = doc(db, 'transactions', transactionId);
  
    try {
      await runTransaction(db, async (transaction) => {
        const txSnap = await transaction.get(txDocRef);
        if (!txSnap.exists()) {
          throw new Error("Transaksi tidak ditemukan.");
        }
  
        const txData = txSnap.data() as Transaction;
  
        const findDefaultPaymentAccount = () => {
            const cashAccount = accounts.find(a => a.name.toLowerCase().includes('kas'));
            if (cashAccount) return cashAccount.id;
            const bankAccount = accounts.find(a => a.name.toLowerCase().includes('bank'));
            return bankAccount?.id;
        }

        const finalAccountInfo = {
            isPkp: accountInfo.isPkp ?? txData.isPkp,
            paymentAccountId: accountInfo.paymentAccountId ?? txData.paymentAccountId ?? findDefaultPaymentAccount(),
            salesAccountId: accountInfo.salesAccountId ?? txData.salesAccountId,
            discountAccountId: accountInfo.discountAccountId ?? txData.discountAccountId,
            cogsAccountId: accountInfo.cogsAccountId ?? txData.cogsAccountId,
            inventoryAccountId: accountInfo.inventoryAccountId ?? txData.inventoryAccountId,
            taxAccountId: accountInfo.taxAccountId ?? txData.taxAccountId,
        };

        const requiredPairs: Array<[string, string | undefined]> = [
            ['paymentAccountId', finalAccountInfo.paymentAccountId],
            ['salesAccountId', finalAccountInfo.salesAccountId],
            ['cogsAccountId', finalAccountInfo.cogsAccountId],
            ['inventoryAccountId', finalAccountInfo.inventoryAccountId],
        ];

        const missing = requiredPairs.filter(([, v]) => !v).map(([k]) => k);
        if (missing.length) {
            throw new Error(`Akun wajib belum lengkap: ${missing.join(', ')}. Perbarui mapping akun terlebih dahulu.`);
        }
        
        const subtotal = asNumber(txData.subtotal);
        const totalCogs = asNumber(txData.items?.reduce((sum, item) => sum + asNumber(item.cogs), 0));
        const serviceFee = asNumber(txData.serviceFee);
        
        const subtotalAfterDiscount = subtotal - asNumber(discountAmount);
        const taxAmount = finalAccountInfo.isPkp ? subtotalAfterDiscount * 0.11 : 0;
        const total = subtotalAfterDiscount + taxAmount + serviceFee;
  
        const serviceFeeAccount = accounts.find(a => a.category === 'Liabilitas' && a.name.toLowerCase().includes('utang biaya layanan berez'));
        
        const coreLines = [
          { accountId: finalAccountInfo.paymentAccountId!,  debit: asNumber(total),     credit: 0,                description: `Penerimaan Penjualan Kasir via ${txData.paymentMethod}` },
          { accountId: finalAccountInfo.salesAccountId!,    debit: 0,                   credit: asNumber(subtotal), description: 'Pendapatan Penjualan dari Kasir' },
          { accountId: finalAccountInfo.cogsAccountId!,     debit: asNumber(totalCogs), credit: 0,                description: 'HPP Penjualan dari Kasir' },
          { accountId: finalAccountInfo.inventoryAccountId!,debit: 0,                   credit: asNumber(totalCogs), description: 'Pengurangan Persediaan dari Kasir' },
        ];
        
        const extraLines: any[] = [];
        if (asNumber(discountAmount) > 0 && finalAccountInfo.discountAccountId) {
            extraLines.push({ accountId: finalAccountInfo.discountAccountId, debit: asNumber(discountAmount), credit: 0, description: 'Potongan Penjualan Kasir (Diperbarui)' });
        }
        if (finalAccountInfo.isPkp && taxAmount > 0 && finalAccountInfo.taxAccountId) {
            extraLines.push({ accountId: finalAccountInfo.taxAccountId, debit: 0, credit: asNumber(taxAmount), description: 'PPN Keluaran dari Penjualan Kasir (Diperbarui)' });
        }
        if (serviceFee > 0 && serviceFeeAccount) {
            extraLines.push({ accountId: serviceFeeAccount.id, debit: 0, credit: asNumber(serviceFee), description: 'Utang Biaya Layanan Aplikasi' });
        }

        const lines = [...coreLines, ...extraLines];

        const dataToUpdateRaw = {
          discountAmount,
          taxAmount,
          total,
          status: 'Lunas',
          paymentStatus: 'Berhasil',
          amount: total,
          paidAmount: total,
          lines,
          isPkp: finalAccountInfo.isPkp,
          paymentAccountId: finalAccountInfo.paymentAccountId,
          salesAccountId: finalAccountInfo.salesAccountId,
          cogsAccountId: finalAccountInfo.cogsAccountId,
          inventoryAccountId: finalAccountInfo.inventoryAccountId,
          discountAccountId: finalAccountInfo.discountAccountId,
          taxAccountId: finalAccountInfo.taxAccountId,
          date: new Date(), // Update the date to reflect payment time
        };
        
        const dataToUpdate = removeUndefinedDeep(dataToUpdateRaw);
        transaction.update(txDocRef, dataToUpdate);
      });
  
      toast({ title: 'Sukses', description: 'Transaksi berhasil dilunasi dan diperbarui.' });
      return true;
  
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      toast({ title: 'Gagal', description: error.message || 'Gagal memperbarui transaksi.', variant: 'destructive' });
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
        await runTransaction(db, async (transaction) => {
            const txSnap = await transaction.get(txDocRef);
            if (!txSnap.exists()) throw new Error("Transaksi tidak ditemukan untuk dihapus.");
            
            const txData = txSnap.data() as Transaction;
            const warehouseId = txData.warehouseId;
            if (!warehouseId) throw new Error("Gudang asal transaksi tidak ditemukan.");
            
            // Return stock for all 'Barang' items
            for (const item of txData.items.filter(i => i.productType === 'Barang')) {
                let quantityToReturn = item.quantity;
                const lotsQuery = query(collection(db, "stockLots"), where("productId", "==", item.productId), where("warehouseId", "==", warehouseId), orderBy("purchaseDate", "desc"));
                const lotsSnap = await getDocs(lotsQuery);

                for (const lotDoc of lotsSnap.docs) {
                    if (quantityToReturn <= 0) break;
                    const lotData = lotDoc.data() as StockLot;
                    const lotRef = doc(db, 'stockLots', lotDoc.id);
                    const canReturnToLot = lotData.initialQuantity - lotData.remainingQuantity;
                    const amountToReturn = Math.min(quantityToReturn, canReturnToLot);
                    
                    if (amountToReturn > 0) {
                        transaction.update(lotRef, { remainingQuantity: lotData.remainingQuantity + amountToReturn });
                        quantityToReturn -= amountToReturn;
                    }
                }
                 if (quantityToReturn > 0) {
                    console.warn(`Tidak dapat mengembalikan seluruh stok (${quantityToReturn}) untuk produk ${item.productName}. Stok mungkin tidak akurat.`);
                }
            }

            // Delete the transaction document
            transaction.delete(txDocRef);
        });

        toast({ title: 'Sukses', description: 'Pesanan telah berhasil dihapus.' });
        return true;

    } catch (error: any) {
        console.error("Error deleting transaction:", error);
        toast({ title: 'Gagal', description: error.message || 'Gagal menghapus pesanan.', variant: 'destructive' });
        return false;
    }
};

  const clearCart = () => {
      setCart([]);
  };

  const addCustomer = async (customerData: { name: string; email?: string; phone?: string; }): Promise<Customer | null> => {
    if (!user) {
        toast({ title: "Anda harus login", variant: "destructive" });
        return null;
    }
    const idUMKM = user.role === 'UMKM' ? user.uid : user.idUMKM;
    if (!idUMKM) {
        toast({ title: "Data UMKM tidak ditemukan", variant: "destructive" });
        return null;
    }

    try {
        const docRef = await addDoc(collection(db, "customers"), {
            ...customerData,
            idUMKM: idUMKM,
            joinDate: new Date(),
        });
        const newCustomer: Customer = { id: docRef.id, ...customerData };
        // The onSnapshot listener will automatically update the local state.
        return newCustomer;
    } catch (error) {
        console.error("Error adding customer: ", error);
        toast({ title: "Gagal menambah pelanggan", variant: "destructive" });
        return null;
    }
  };


  const holdCart = (customerName: string, customerId?: string) => {
    if (cart.length === 0) return;
    const newHeldCart: HeldCart = {
      id: Date.now(),
      cart: [...cart],
      customerName: customerName || 'Pelanggan Umum',
      customerId: customerId,
      heldAt: new Date(),
    };
    setHeldCarts(prev => [...prev, newHeldCart]);
    toast({ title: 'Transaksi Ditahan', description: `Keranjang untuk ${newHeldCart.customerName} telah ditahan.` });
    clearCart();
  };

  const resumeCart = (cartId: number) => {
    const cartToResume = heldCarts.find(h => h.id === cartId);
    if (cartToResume) {
      setCart(cartToResume.cart);
      setHeldCarts(prev => prev.filter(h => h.id !== cartId));
    }
  };

  const deleteHeldCart = (cartId: number) => {
    setHeldCarts(prev => prev.filter(h => h.id !== cartId));
  };
  
  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prevNotifs => 
      prevNotifs.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
    );
  };

  const addShiftReportNotification = (summary: { totalTransactions: number; totalRevenue: number }) => {
    const newNotif: Notification = {
      id: `shift_report_${Date.now()}`,
      type: 'shift_report',
      title: 'Laporan Tutup Shift',
      message: `Shift selesai dengan ${summary.totalTransactions} transaksi dan total pendapatan ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(summary.totalRevenue)}.`,
      timestamp: new Date(),
      isRead: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };
  
  const updateUserData = async (data: Partial<UserData>): Promise<boolean> => {
    if (!user) {
        toast({ title: "Anda harus login", variant: "destructive" });
        return false;
    }
    const docRef = doc(db, user.role === 'UMKM' ? 'dataUMKM' : 'employees', user.employeeDocId!);
    try {
        await updateDoc(docRef, data);
        // Data will be updated automatically by the onSnapshot listener
        return true;
    } catch (error) {
        console.error("Error updating user data:", error);
        return false;
    }
  };

  return (
    <AppContext.Provider
      value={{ 
        products,
        stockLots,
        cart, 
        wishlist, 
        transactions,
        customers,
        heldCarts,
        accounts,
        notifications,
        branches,
        warehouses,
        productUnits,
        productCategories,
        filteredWarehouses,
        selectedBranchId,
        setSelectedBranchId,
        selectedWarehouseId,
        setSelectedWarehouseId,
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        addToWishlist, 
        removeFromWishlist, 
        isInWishlist,
        addTransaction,
        saveCartAsPendingTransaction,
        updateTransactionAndPay,
        updateTransactionOnly,
        updateTransactionDiscount,
        deleteTransaction,
        clearCart,
        addCustomer,
        holdCart,
        resumeCart,
        deleteHeldCart,
        markNotificationAsRead,
        addShiftReportNotification,
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
