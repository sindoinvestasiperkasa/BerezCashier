"use client";

import React, { createContext, useState, ReactNode } from 'react';
import type { Product } from '@/lib/data';
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  date: string;
  total: number;
  status: 'Selesai' | 'Dikirim' | 'Diproses' | 'Dibatalkan';
  items: CartItem[];
  paymentMethod: string;
  paymentStatus: 'Berhasil' | 'Pending' | 'Gagal';
}

export type NewTransactionData = {
    total: number;
    items: CartItem[];
    paymentMethod: string;
}

interface AppContextType {
  cart: CartItem[];
  wishlist: Product[];
  transactions: Transaction[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  addTransaction: (data: NewTransactionData) => void;
  clearCart: () => void;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const initialTransactions: Transaction[] = [];

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await auth.signOut();
        throw new Error("Silakan periksa kotak masuk email Anda dan klik tautan verifikasi sebelum login.");
      }

      let userData: any = null;
      let userRole: string = '';

      const umkmDocRef = doc(db, 'dataUMKM', user.uid);
      const umkmDocSnap = await getDoc(umkmDocRef);

      if (umkmDocSnap.exists()) {
        userData = { uid: user.uid, ...umkmDocSnap.data() };
        userRole = userData.role || 'UMKM';
      } else {
        const employeeQuery = query(collection(db, 'employees'), where('email', '==', email));
        const employeeQuerySnapshot = await getDocs(employeeQuery);

        if (!employeeQuerySnapshot.empty) {
          const employeeDoc = employeeQuerySnapshot.docs[0];
          const employeeData = employeeDoc.data();

          if (employeeData.canLogin !== true) {
              await auth.signOut();
              throw new Error("Akun karyawan Anda tidak aktif. Silakan hubungi administrator.");
          }

          if (employeeData.uid === user.uid) {
            userData = { id: employeeDoc.id, ...employeeData };
            userRole = 'Employee';
          }
        }
      }

      if (userData) {
        userData.role = userRole;
        localStorage.setItem('sagara-user-data', JSON.stringify(userData));
        setIsAuthenticated(true);
        return true;
      } else {
        await auth.signOut();
        throw new Error("Data pengguna tidak ditemukan di database. Silakan hubungi administrator.");
      }
    } catch (error: any) {
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            throw new Error("Kombinasi email dan password salah. Mohon periksa kembali.");
        }
        // Re-throw other errors to be caught by the calling component
        throw error;
    }
  };

  const logout = async () => {
    await auth.signOut();
    localStorage.removeItem('sagara-user-data');
    setIsAuthenticated(false);
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

  const addTransaction = (data: NewTransactionData) => {
    const transaction: Transaction = {
        ...data,
        id: `TRX${Math.floor(10000 + Math.random() * 90000)}`,
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        status: 'Diproses',
        paymentStatus: 'Berhasil'
    };
    setTransactions(prev => [transaction, ...prev]);
  };

  const clearCart = () => {
      setCart([]);
  };

  return (
    <AppContext.Provider
      value={{ 
        cart, 
        wishlist, 
        transactions,
        addToCart, 
        removeFromCart, 
        updateQuantity, 
        addToWishlist, 
        removeFromWishlist, 
        isInWishlist,
        addTransaction,
        clearCart,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
