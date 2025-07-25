
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Warehouse, Plus, Search, Loader2, Upload } from "lucide-react";
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
import { createItem } from "@/ai/flows/create-item-flow-entry";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";
import { ScrollArea } from "../ui/scroll-area";
import { collection, getDocs, getFirestore, query, where, addDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from '@/lib/firebase';
import imageCompression from 'browser-image-compression';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


interface IProductCategory {
    id: string;
    name: string;
    description?: string;
}
interface IProductUnit {
    id: string;
    name: string;
    symbol: string;
}

const newCategorySchema = z.object({
  name: z.string().min(1, "Nama kategori harus diisi."),
  description: z.string().optional(),
});
type NewCategoryFormData = z.infer<typeof newCategorySchema>;

const newUnitSchema = z.object({
  name: z.string().min(1, "Nama unit harus diisi."),
  symbol: z.string().min(1, "Simbol harus diisi."),
});
type NewUnitFormData = z.infer<typeof newUnitSchema>;


export default function InventoryPage() {
  const { products, user } = useApp();
  const { toast } = useToast();
  const db = getFirestore();
  const [searchFinishedGoods, setSearchFinishedGoods] = useState("");
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isRawMaterialPurchaseDialogOpen, setIsRawMaterialPurchaseDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [productCategories, setProductCategories] = useState<IProductCategory[]>([]);
  const [productUnits, setProductUnits] = useState<IProductUnit[]>([]);
  const [imageFiles, setImageFiles] = useState<FileList | null>(null);

  // Dialog states
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isAddUnitDialogOpen, setIsAddUnitDialogOpen] = useState(false);
  
  const newCategoryForm = useForm<NewCategoryFormData>({
    resolver: zodResolver(newCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const newUnitForm = useForm<NewUnitFormData>({
    resolver: zodResolver(newUnitSchema),
    defaultValues: {
      name: "",
      symbol: "",
    },
  });


  // State for the purchase form
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const [purchaseQuantity, setPurchaseQuantity] = useState<number | string>("");
  const [purchaseHpp, setPurchaseHpp] = useState<number | string>("");
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>();
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>();

  // State for Add Item form
  const [itemCategory, setItemCategory] = useState<"retail_good" | "manufactured_good" | "service" | "raw_material">("retail_good");
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemCategoryId, setItemCategoryId] = useState<string | undefined>();
  const [itemPrice, setItemPrice] = useState<number | string>("");
  const [itemHpp, setItemHpp] = useState<number | string>("");
  const [itemInitialStock, setItemInitialStock] = useState<number | string>("");
  const [itemLowStockThreshold, setItemLowStockThreshold] = useState<number | string>("");
  const [itemUnit, setItemUnit] = useState<string | undefined>();


  // Placeholder data
  const branches = [{ id: 'jkt-01', name: 'Jakarta Pusat' }, { id: 'bdg-01', name: 'Bandung Kota' }];
  const warehouses = [{ id: 'wh-jkt-a', name: 'Gudang A (JKT)' }, { id: 'wh-bdg-a', name: 'Gudang A (BDG)' }];

  const fetchCategoriesAndUnits = useCallback(async () => {
    if (!user) return;
    const idUMKM = user.role === 'UMKM' ? user.uid : user.idUMKM;
    if (!idUMKM) return;

    // Fetch Product Categories
    const categoriesQuery = query(collection(db, "productCategories"), where("idUMKM", "==", idUMKM));
    const categoriesSnapshot = await getDocs(categoriesQuery);
    const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as IProductCategory));
    setProductCategories(categoriesData);
    
    // Fetch Product Units
    const unitsQuery = query(collection(db, "productUnits"), where("idUMKM", "==", idUMKM));
    const unitsSnapshot = await getDocs(unitsQuery);
    const unitsData = unitsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as IProductUnit));
    setProductUnits(unitsData);
  }, [user, db]);


  useEffect(() => {
    if (isAddItemDialogOpen && user) {
        fetchCategoriesAndUnits();
    }
  }, [isAddItemDialogOpen, user, fetchCategoriesAndUnits]);


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

  const productOptionsForPurchase = useMemo(() => {
    return finishedGoods.map(product => ({
        value: product.id,
        label: product.name,
    }))
  }, [finishedGoods]);

  const productCategoryOptions: ComboboxOption[] = useMemo(() => {
    return productCategories.map(cat => ({
        value: cat.id,
        label: cat.name,
    }))
  }, [productCategories]);

  const productUnitOptions: ComboboxOption[] = useMemo(() => {
    return productUnits.map(unit => ({
        value: unit.symbol,
        label: `${unit.name} (${unit.symbol})`,
    }))
  }, [productUnits]);

  const resetPurchaseForm = () => {
    setSelectedProductId(undefined);
    setPurchaseQuantity("");
    setPurchaseHpp("");
    setSelectedBranchId(undefined);
    setSelectedWarehouseId(undefined);
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
        branchId: selectedBranchId,
        warehouseId: selectedWarehouseId
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

  const resetAddItemForm = () => {
    setItemName("");
    setItemDescription("");
    setItemCategoryId(undefined);
    setItemPrice("");
    setItemHpp("");
    setItemInitialStock("");
    setItemLowStockThreshold("");
    setItemUnit(undefined);
    setItemCategory("retail_good");
    setImageFiles(null);
  }

  const handleSaveItem = async () => {
    if (!itemName) {
        toast({ title: "Nama item tidak boleh kosong", variant: "destructive" });
        return;
    }
    if (!user) {
        toast({ title: "Pengguna tidak ditemukan", variant: "destructive" });
        return;
    }
    const idUMKM = user.role === 'UMKM' ? user.uid : user.idUMKM;
    
    setIsProcessing(true);
    try {
        let uploadedImageUrl = 'https://placehold.co/300x300.png';

        if (imageFiles && imageFiles.length > 0) {
            const file = imageFiles[0];
            let fileToUpload = file;
            if (file.size > 512 * 1024) { // Compress if > 0.5MB
                try {
                    fileToUpload = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true });
                } catch (compressionError) {
                    console.warn('Kompresi gambar gagal, mengunggah file asli.', compressionError);
                }
            }
            const docId = doc(collection(db, 'products')).id;
            const filePath = `products/${idUMKM}/${docId}/${Date.now()}_${fileToUpload.name}`;
            const storageRef = ref(storage, filePath);
            await uploadBytes(storageRef, fileToUpload);
            uploadedImageUrl = await getDownloadURL(storageRef);
        }

        const result = await createItem({
            name: itemName,
            description: itemDescription,
            itemCategory: itemCategory,
            productType: itemCategory === 'service' ? 'Jasa' : 'Barang',
            categoryId: itemCategoryId,
            price: itemCategory !== 'raw_material' ? Number(itemPrice) || undefined : undefined,
            hpp: itemCategory === 'retail_good' ? Number(itemHpp) || undefined : undefined,
            initialStock: ['retail_good', 'manufactured_good', 'raw_material'].includes(itemCategory) ? Number(itemInitialStock) || 0 : undefined,
            lowStockThreshold: ['retail_good', 'manufactured_good', 'raw_material'].includes(itemCategory) ? Number(itemLowStockThreshold) || undefined : undefined,
            unit: itemUnit || undefined,
            imageUrl: uploadedImageUrl,
        });

        if (result.success) {
            toast({
                title: "Item Berhasil Dibuat!",
                description: `${itemName} telah ditambahkan ke database.`,
            });
            setIsAddItemDialogOpen(false);
            resetAddItemForm();
        } else {
            throw new Error(result.message || "Gagal membuat item.");
        }

    } catch (error: any) {
        console.error(error);
        toast({
            title: "Terjadi Kesalahan",
            description: error.message || "Gagal menyimpan item baru. Silakan coba lagi.",
            variant: "destructive",
        });
    } finally {
        setIsProcessing(false);
    }
  }

  const handleSaveNewCategory = async (data: NewCategoryFormData) => {
    const idUMKM = user?.role === 'UMKM' ? user.uid : user?.idUMKM;
    if (!idUMKM) {
      toast({ title: "Error", description: "Tidak dapat menemukan ID UMKM.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const docRef = await addDoc(collection(db, "productCategories"), { ...data, idUMKM });
      toast({ title: "Kategori Ditambahkan", description: `Kategori "${data.name}" berhasil dibuat.` });
      
      await fetchCategoriesAndUnits();
      setItemCategoryId(docRef.id);
      
      setIsAddCategoryDialogOpen(false);
      newCategoryForm.reset();
    } catch (error) {
      console.error("Error adding category:", error);
      toast({ title: "Gagal", description: "Tidak dapat menambahkan kategori baru.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };


  const handleSaveNewUnit = async (data: NewUnitFormData) => {
    const idUMKM = user?.role === 'UMKM' ? user.uid : user?.idUMKM;
    if (!idUMKM) {
      toast({ title: "Error", description: "Tidak dapat menemukan ID UMKM.", variant: "destructive" });
      return;
    }
    
    setIsProcessing(true);
    try {
        const docRef = await addDoc(collection(db, "productUnits"), { ...data, idUMKM });
        toast({ title: "Unit Baru Ditambahkan!", description: `Unit ${data.name} berhasil dibuat.` });
        
        await fetchCategoriesAndUnits();
        setItemUnit(data.symbol);
        
        setIsAddUnitDialogOpen(false);
        newUnitForm.reset();
    } catch(error: any) {
        toast({ title: "Gagal Menyimpan", description: error.message, variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  }

  const renderItemDetailsForm = () => {
    const showCategory = itemCategory !== 'raw_material';
    const showPrice = itemCategory !== 'raw_material';
    const showHpp = itemCategory === 'retail_good';
    const showStockFields = ['retail_good', 'manufactured_good', 'raw_material'].includes(itemCategory);
    
    return (
       <div className="space-y-4 p-4 border rounded-md bg-background">
          <h3 className="font-medium text-center text-lg">2. Detail Item</h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="item-name">Nama Item</Label>
              <Input id="item-name" placeholder="Contoh: Kemeja Polos, Tepung Terigu" value={itemName} onChange={(e) => setItemName(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label htmlFor="item-description">Deskripsi</Label>
              <Textarea id="item-description" placeholder="Jelaskan tentang item ini..." value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} />
            </div>

            {showCategory && (
                <div className="space-y-1">
                    <Label htmlFor="item-category">Kategori Produk</Label>
                    <Combobox
                        options={productCategoryOptions}
                        value={itemCategoryId}
                        onChange={setItemCategoryId}
                        placeholder="Pilih kategori..."
                        searchPlaceholder="Cari kategori..."
                        emptyText="Kategori tidak ditemukan."
                        onAddNew={() => setIsAddCategoryDialogOpen(true)}
                        addNewLabel="Tambah Kategori Baru"
                    />
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {showPrice && (
                <div className="space-y-1">
                  <Label htmlFor="item-price">Harga Jual</Label>
                  <Input id="item-price" type="number" placeholder="Rp 0" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} />
                </div>
              )}
              {itemCategory === 'retail_good' && (
                <div className="space-y-1">
                  <Label htmlFor="item-hpp">Harga Beli (HPP)</Label>
                  <Input id="item-hpp" type="number" placeholder="Rp 0" value={itemHpp} onChange={(e) => setItemHpp(e.target.value)} />
                   <p className="text-xs text-muted-foreground">Untuk produk retail (beli-jual).</p>
                </div>
              )}
            </div>

             {showStockFields && <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="item-stock">Stok Awal</Label>
                  <Input id="item-stock" type="number" placeholder="0" value={itemInitialStock} onChange={(e) => setItemInitialStock(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="item-unit">Unit</Label>
                     <Combobox
                        options={productUnitOptions}
                        value={itemUnit}
                        onChange={setItemUnit}
                        placeholder="Pilih unit..."
                        searchPlaceholder="Cari unit..."
                        emptyText="Unit tidak ditemukan."
                        onAddNew={() => setIsAddUnitDialogOpen(true)}
                        addNewLabel="Tambah Unit Baru"
                    />
                </div>
                <div className="space-y-1 col-span-2">
                    <Label htmlFor="item-low-stock">Ambang Batas Stok Rendah</Label>
                    <Input id="item-low-stock" type="number" placeholder="Contoh: 5" value={itemLowStockThreshold} onChange={(e) => setItemLowStockThreshold(e.target.value)} />
                </div>
            </div>}
            
            <div className="space-y-1">
                <Label>Foto Produk</Label>
                 <Input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFiles(e.target.files)}
                />
            </div>

          </div>
        </div>
    );
  }


  return (
    <>
    <div className="p-4 md:p-6">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Warehouse className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Manajemen Inventaris</h1>
        </div>
        <Dialog open={isAddItemDialogOpen} onOpenChange={(open) => {
          if(!open) resetAddItemForm();
          setIsAddItemDialogOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Tambah Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Tambah Item Baru</DialogTitle>
              <DialogDescription>
                Daftarkan item baru ke sistem. Pilih tipe yang sesuai untuk menampilkan form yang relevan.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] p-1">
                <div className="py-4 space-y-6 pr-6">
                <div>
                    <Label className="mb-2 block font-medium">1. Tipe Item</Label>
                    <RadioGroup value={itemCategory} onValueChange={(val: any) => setItemCategory(val)} className="grid grid-cols-2 gap-4">
                    <div>
                        <RadioGroupItem value="retail_good" id="type-retail" className="peer sr-only" />
                        <Label htmlFor="type-retail" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Produk Retail
                            <span className="text-xs text-muted-foreground mt-1 text-center">Barang yang dibeli untuk dijual kembali.</span>
                        </Label>
                        </div>
                        <div>
                        <RadioGroupItem value="manufactured_good" id="type-manufactured" className="peer sr-only" />
                        <Label htmlFor="type-manufactured" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Produk Produksi
                            <span className="text-xs text-muted-foreground mt-1 text-center">Barang hasil produksi dari bahan baku.</span>
                        </Label>
                        </div>
                        <div>
                        <RadioGroupItem value="service" id="type-service" className="peer sr-only" />
                        <Label htmlFor="type-service" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                            Jasa / Layanan
                            <span className="text-xs text-muted-foreground mt-1 text-center">Layanan yang tidak memiliki stok fisik.</span>
                        </Label>
                        </div>
                    <div>
                        <RadioGroupItem value="raw_material" id="type-raw-material" className="peer sr-only" />
                        <Label htmlFor="type-raw-material" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        Bahan Baku
                        <span className="text-xs text-muted-foreground mt-1 text-center">Untuk digunakan dalam proses produksi.</span>
                        </Label>
                    </div>
                    </RadioGroup>
                </div>

                {renderItemDetailsForm()}
                </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddItemDialogOpen(false)}>Batal</Button>
              <Button onClick={handleSaveItem} disabled={isProcessing}>
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
                Daftar produk yang telah diproduksi atau dibeli dan siap untuk dijual di kasir.
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
                            Gunakan form ini untuk menambah stok (restock) produk yang Anda beli untuk dijual kembali. Produk harus sudah terdaftar di sistem.
                          </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                           <div>
                              <Label htmlFor="product-select">Produk</Label>
                               <Combobox
                                options={productOptionsForPurchase}
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
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Cabang</Label>
                                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                                    <SelectTrigger><SelectValue placeholder="Pilih cabang..." /></SelectTrigger>
                                    <SelectContent>
                                        {branches.map(branch => (
                                            <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Gudang</Label>
                                <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                                    <SelectTrigger><SelectValue placeholder="Pilih gudang..." /></SelectTrigger>
                                    <SelectContent>
                                        {warehouses.map(wh => (
                                            <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                Daftar bahan baku yang Anda miliki untuk digunakan dalam proses produksi.
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
                      Gunakan form ini untuk menambah stok bahan baku yang sudah terdaftar di sistem.
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

    {/* Add Category Dialog */}
    <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Kategori Baru</DialogTitle>
          <DialogDescription>Buat kategori produk baru untuk UMKM Anda.</DialogDescription>
        </DialogHeader>
        <Form {...newCategoryForm}>
          <form onSubmit={newCategoryForm.handleSubmit(handleSaveNewCategory)} className="space-y-4 py-4">
            <FormField
              control={newCategoryForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Kategori</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Contoh: Makanan Berat" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={newCategoryForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Jelaskan kategori ini" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isProcessing}>
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Kategori
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    
    {/* Add Unit Dialog */}
    <Dialog open={isAddUnitDialogOpen} onOpenChange={setIsAddUnitDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Unit Baru</DialogTitle>
          <DialogDescription>Buat satuan unit baru untuk produk Anda.</DialogDescription>
        </DialogHeader>
        <Form {...newUnitForm}>
          <form onSubmit={newUnitForm.handleSubmit(handleSaveNewUnit)} className="space-y-4 py-4">
            <FormField
              control={newUnitForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Unit</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Contoh: Kilogram" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={newUnitForm.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Simbol</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Contoh: kg" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddUnitDialogOpen(false)}>Batal</Button>
                <Button type="submit" disabled={isProcessing}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Simpan Unit
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}
