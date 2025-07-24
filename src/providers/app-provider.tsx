
"use client";

import React, { createContext, useState, ReactNode, useEffect, useMemo } from 'react';
import type { Product } from '@/lib/data';
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, User as FirebaseAuthUser } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs, getFirestore, onSnapshot, addDoc, Timestamp } from "firebase/firestore";
import { useToast } from '@/hooks/use-toast';
import { createTransaction, CreateTransactionInput, CreateTransactionOutput } from '@/ai/flows/create-transaction-flow';


export interface CartItem extends Product {
  quantity: number;
}

export interface SaleItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    cogs: number;
    imageUrl?: string;
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
  transactionNumber?: string;
  lines?: { accountId: string; debit: number; credit: number; description: string }[];
}

export type NewTransactionClientData = {
    items: any[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    paymentMethod: string;
    customerId: string;
    customerName: string;
    salesAccountId: string;
    cogsAccountId: string;
    inventoryAccountId: string;
    paymentAccountId: string;
    discountAccountId?: string;
    taxAccountId?: string;
    isPkp?: boolean;
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
  [key: string]: any;
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
    umkm_photo?: string;
    address?: string;
    phone?: string;
    // Employee fields
    name?: string;
    photo_url?: string;
    [key: string]: any;
};


interface AppContextType {
  products: Product[];
  cart: CartItem[];
  wishlist: Product[];
  transactions: Transaction[];
  customers: Customer[];
  heldCarts: HeldCart[];
  accounts: Account[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  addTransaction: (data: NewTransactionClientData) => Promise<CreateTransactionOutput>;
  clearCart: () => void;
  addCustomer: (customerData: { name: string; email?: string, phone?: string }) => Promise<Customer | null>;
  holdCart: (customerName: string, customerId?: string) => void;
  resumeCart: (cartId: number) => void;
  deleteHeldCart: (cartId: number) => void;
  isAuthenticated: boolean;
  user: UserData | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const initialTransactions: Transaction[] = [];

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [localUser, setLocalUser] = useState<UserData | null>(null);
  const { toast } = useToast();
  const db = getFirestore();

  const user = useMemo(() => {
    if (localUser) return localUser;
    if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('sagara-user-data');
        if (storedUser) {
            try {
              return JSON.parse(storedUser);
            } catch (e) {
              console.error("Failed to parse user data from localStorage", e);
              return null;
            }
        }
    }
    return null;
  }, [localUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseAuthUser | null) => {
        if (firebaseUser) {
            const storedUser = localStorage.getItem('sagara-user-data');
            if(storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setLocalUser(parsedUser);
                setIsAuthenticated(true);
            }
        } else {
            setLocalUser(null);
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
        return;
    };
    
    const idUMKM = user.role === 'UMKM' ? user.uid : user.idUMKM;
    if (!idUMKM) return;

    const customersQuery = query(collection(db, "customers"), where("idUMKM", "==", idUMKM));
    const unsubCustomers = onSnapshot(customersQuery, (snapshot) => {
        const customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer));
        setCustomers(customersData);
    });

    const productsQuery = query(collection(db, "products"), where("idUMKM", "==", idUMKM));
    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
        const productsData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          imageUrl: doc.data().imageUrls?.[0] || "https://placehold.co/300x300.png",
        } as Product));
        setProducts(productsData);
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


    return () => {
        unsubCustomers();
        unsubProducts();
        unsubAccounts();
        unsubTransactions();
    };
  }, [user, db]);


  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const firebaseUser = userCredential.user;

      if (!firebaseUser.emailVerified) {
        await signOut(auth);
        throw new Error("Silakan periksa kotak masuk email Anda dan klik tautan verifikasi sebelum login.");
      }

      let userData: UserData | null = null;
      let userRole: 'UMKM' | 'Employee' | 'SuperAdmin' = 'Employee';

      const umkmDocRef = doc(db, 'dataUMKM', firebaseUser.uid);
      const umkmDocSnap = await getDoc(umkmDocRef);

      if (umkmDocSnap.exists()) {
        const data = umkmDocSnap.data();
        userRole = data.role || 'UMKM';
        userData = { uid: firebaseUser.uid, ...data, role: userRole } as UserData;

      } else {
        const employeeQuery = query(collection(db, 'employees'), where('email', '==', email));
        const employeeQuerySnapshot = await getDocs(employeeQuery);

        if (!employeeQuerySnapshot.empty) {
          const employeeDoc = employeeQuerySnapshot.docs[0];
          const employeeData = employeeDoc.data();

          if (employeeData.canLogin !== true) {
              await signOut(auth);
              throw new Error("Akun karyawan Anda tidak aktif. Silakan hubungi administrator.");
          }

          if (employeeData.uid === firebaseUser.uid) {
            userRole = 'Employee';
            userData = { id: employeeDoc.id, ...employeeData, role: userRole } as UserData;
          }
        }
      }

      if (userData) {
        setLocalUser(userData);
        localStorage.setItem('sagara-user-data', JSON.stringify(userData));
        setIsAuthenticated(true);
        return true;
      } else {
        await signOut(auth);
        throw new Error("Data pengguna tidak ditemukan di database. Silakan hubungi administrator.");
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
      return [...prevCart, { ...product, quantity: 1 }];
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

  const addTransaction = async (data: NewTransactionClientData): Promise<CreateTransactionOutput> => {
    if (!user) throw new Error("User not authenticated");
    const idUMKM = user.role === 'UMKM' ? user.uid : user.idUMKM;
    if (!idUMKM) throw new Error("UMKM ID not found");

    const transactionData: CreateTransactionInput = {
      ...data,
      idUMKM,
    };
    
    // onSnapshot akan memperbarui state transaksi secara otomatis
    return await createTransaction(transactionData);
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


  return (
    <AppContext.Provider
      value={{ 
        products,
        cart, 
        wishlist, 
        transactions,
        customers,
        heldCarts,
        accounts,
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        addToWishlist, 
        removeFromWishlist, 
        isInWishlist,
        addTransaction,
        clearCart,
        addCustomer,
        holdCart,
        resumeCart,
        deleteHeldCart,
        isAuthenticated,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
