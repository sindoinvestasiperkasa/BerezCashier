"use client";

import { useState, useMemo } from "react";
import { Warehouse, Plus, Search, Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { recordPurchase } from "@/ai/flows/record-purchase-flow";
import { Combobox } from "@/components/ui/combobox";


export default function InventoryPage() {
  const { products } = useApp();
  const { toast } = useToast();
  const [searchFinishedGoods, setSearchFinishedGoods] = useState("");
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isRawMaterialPurchaseDialogOpen, setIsRawMaterialPurchaseDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // State for the purchase form
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const [purchaseQuantity, setPurchaseQuantity] = useState<number | string>("");
  const [purchaseHpp, setPurchaseHpp] = useState<number | string>("");


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

  const productOptions = useMemo(() => {
    return finishedGoods.map(product => ({
        value: product.id,
        label: product.name,
    }))
  }, [finishedGoods]);

  const resetPurchaseForm = () => {
    setSelectedProductId(undefined);
    setPurchaseQuantity("");
    setPurchaseHpp("");
  }

  const handleRecordPurchase = async () => {
     if (!selectedProductId || !purchaseQuantity || !purchaseHpp) {
      toast({
        title: "Form Tidak Lengkap",
        description: "Silakan pilih produk, isi jumlah, dan harga beli.",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      const result = await recordPurchase({
        productId: selectedProductId,
        quantity: Number(purchaseQuantity),
        hpp: Number(purchaseHpp),
      });

      if(result.success) {
        toast({
          title: "Pembelian Dicatat!",
          description: `Stok produk telah diperbarui menjadi ${result.updatedStock}.`,
        });
        setIsPurchaseDialogOpen(false);
        resetPurchaseForm();
      } else {
         throw new Error("Gagal memperbarui stok dari flow.");
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Terjadi Kesalahan",
        description: "Gagal mencatat pembelian. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
        setIsProcessing(false);
    }
  }


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
              <Dialog open={isPurchaseDialogOpen} onOpenChange={(open) => {
                if (!open) resetPurchaseForm();
                setIsPurchaseDialogOpen(open);
              }}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Catat Pembelian Retail</Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Catat Pembelian Stok Retail</DialogTitle>
                          <DialogDescription>
                              Formulir ini untuk menambah stok produk yang dibeli dan langsung dijual kembali.
                          </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                           <div>
                              <Label htmlFor="product-select">Produk</Label>
                               <Combobox
                                options={productOptions}
                                value={selectedProductId}
                                onChange={setSelectedProductId}
                                placeholder="Pilih produk yang dibeli..."
                                searchPlaceholder="Cari produk..."
                                emptyText="Produk tidak ditemukan."
                               />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <Label htmlFor="quantity">Jumlah</Label>
                                  <Input 
                                    id="quantity" 
                                    type="number" 
                                    placeholder="0" 
                                    value={purchaseQuantity}
                                    onChange={(e) => setPurchaseQuantity(e.target.value)}
                                  />
                              </div>
                              <div>
                                  <Label htmlFor="hpp">Harga Beli (HPP) / item</Label>
                                  <Input 
                                    id="hpp" 
                                    type="number" 
                                    placeholder="0"
                                    value={purchaseHpp}
                                    onChange={(e) => setPurchaseHpp(e.target.value)}
                                  />
                              </div>
                          </div>
                      </div>
                      <DialogFooter>
                          <Button variant="outline" onClick={() => setIsPurchaseDialogOpen(false)}>Batal</Button>
                          <Button onClick={handleRecordPurchase} disabled={isProcessing}>
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Simpan & Tambah Stok
                          </Button>
                      </DialogFooter>
                  </DialogContent>
              </Dialog>
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
              <Dialog open={isRawMaterialPurchaseDialogOpen} onOpenChange={setIsRawMaterialPurchaseDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Catat Pembelian Bahan</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Catat Pembelian Bahan Baku</DialogTitle>
                    <DialogDescription>
                      Formulir ini untuk menambah stok bahan baku yang dibeli dari supplier.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-4">
                    <div>
                      <Label htmlFor="raw-material-name">Nama Bahan</Label>
                      <Input id="raw-material-name" placeholder="Contoh: Daging Ayam, Beras, Minyak Goreng" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="raw-material-quantity">Jumlah</Label>
                        <Input id="raw-material-quantity" type="number" placeholder="0" />
                      </div>
                      <div>
                        <Label htmlFor="raw-material-unit">Satuan</Label>
                        <Input id="raw-material-unit" placeholder="kg, liter, pcs" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="raw-material-price">Total Harga Beli</Label>
                      <Input id="raw-material-price" type="number" placeholder="Rp 0" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRawMaterialPurchaseDialogOpen(false)}>Batal</Button>
                    <Button>
                      Simpan Pembelian
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
