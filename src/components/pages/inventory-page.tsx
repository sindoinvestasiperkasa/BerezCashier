"use client";

import { useState, useMemo } from "react";
import { Warehouse, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useApp } from "@/hooks/use-app";
import Image from "next/image";

export default function InventoryPage() {
  const { products } = useApp();
  const [searchFinishedGoods, setSearchFinishedGoods] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const finishedGoods = useMemo(() => {
    return products
      .filter(p => p.productType === 'Barang')
      .filter(p => 
        p.name.toLowerCase().includes(searchFinishedGoods.toLowerCase())
      );
  }, [products, searchFinishedGoods]);


  return (
    <div className="p-4 md:p-6">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Warehouse className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Manajemen Inventaris</h1>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Tambah Item
        </Button>
      </header>

      <Tabs defaultValue="finished_goods" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="finished_goods">Produk Jadi</TabsTrigger>
          <TabsTrigger value="raw_materials">Bahan Baku</TabsTrigger>
        </TabsList>
        <TabsContent value="finished_goods">
          <Card>
            <CardHeader>
              <CardTitle>Stok Produk Siap Jual</CardTitle>
              <CardDescription>
                Daftar produk yang telah diproduksi (atau dibeli) dan siap untuk dijual di kasir.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder="Cari produk jadi..." 
                  className="pl-10" 
                  value={searchFinishedGoods}
                  onChange={(e) => setSearchFinishedGoods(e.target.value)}
                />
              </div>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                {finishedGoods.length > 0 ? (
                  finishedGoods.map(product => (
                    <div key={product.id} className="flex items-center gap-4 p-2 border rounded-lg">
                      <Image 
                        src={product.imageUrl}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="rounded-md object-cover w-12 h-12 bg-muted"
                      />
                      <div className="flex-grow">
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(product.price)}</p>
                      </div>
                      <div>
                        <p className="font-bold text-lg">{product.stock ?? 0}</p>
                        <p className="text-xs text-muted-foreground text-right">Stok</p>
                      </div>
                    </div>
                  ))
                ) : (
                   <div className="text-center py-10 text-muted-foreground">
                    <p>Tidak ada produk jadi yang ditemukan.</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline">Catat Pembelian Retail</Button>
                <Button>Lakukan Produksi</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="raw_materials">
          <Card>
            <CardHeader>
              <CardTitle>Stok Bahan Baku</CardTitle>
              <CardDescription>
                Daftar bahan baku yang digunakan untuk proses produksi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Cari bahan baku..." className="pl-10" />
              </div>
               <div className="text-center py-10 text-muted-foreground">
                <p>Fitur manajemen stok bahan baku akan segera hadir.</p>
              </div>
            </CardContent>
            <CardFooter>
                <Button variant="outline">Catat Pembelian Bahan</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
