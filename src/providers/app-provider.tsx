"use client";

import React, { createContext, useState, ReactNode } from 'react';
import { products, type Product } from '@/lib/data';

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
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const initialTransactions: Transaction[] = [
  {
    id: "TRX001",
    date: "12 Mei 2024",
    total: 131000,
    status: "Selesai",
    items: [
      {...products.find(p => p.id === '1')!, quantity: 1},
      {...products.find(p => p.id === '5')!, quantity: 2},
    ],
    paymentMethod: "BCA Virtual Account",
    paymentStatus: "Berhasil",
  },
  {
    id: "TRX002",
    date: "10 Mei 2024",
    total: 60000,
    status: "Selesai",
    items: [
      {...products.find(p => p.id === '2')!, quantity: 1},
      {...products.find(p => p.id === '3')!, quantity: 1},
    ],
    paymentMethod: "Gopay",
    paymentStatus: "Berhasil",
  },
];

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);

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
        clearCart
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
