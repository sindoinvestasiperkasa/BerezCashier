
// src/app/products/page.tsx
'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PlusCircle, Edit, Trash2, Search, Package, MoreHorizontal, FileSpreadsheet, FileUp, FileDown, Percent, Loader2, Eye, Save, Check, Coffee, Utensils, Bean, Leaf, CakeSlice, Milk, Beef, Fish, Sparkles, Snowflake, Apple } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useForm, SubmitHandler, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, where, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import imageCompression from 'browser-image-compression';
import { Skeleton } from '@/components/ui/skeleton';
import { format, isValid } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useApp } from '@/hooks/use-app';
import type { Product, ProductCategory, ProductUnit, Supplier } from '@/providers/app-provider';


const attributeValueSchema = z.object({
    attributeId: z.string(),
    attributeName: z.string(),
    type: z.enum(['Teks', 'Angka', 'Paragraf', 'Tanggal', 'Pilihan Tunggal', 'Checkbox']),
    options: z.array(z.string()).optional(),
    value: z.any().optional().nullable(),
});

const productSchema = z.object({
  productCode: z.string().optional(),
  name: z.string().min(1, 'Nama produk harus diisi'),
  productType: z.enum(['Produk Retail', 'Produk Produksi', 'Jasa (Layanan)', 'Bahan Baku'], { required_error: 'Tipe produk harus dipilih' }),
  price: z.coerce.number().min(0, 'Harga jual harus angka positif'),
  purchasePrice: z.coerce.number().optional(),
  description: z.string().optional(),
  lowStockThreshold: z.coerce.number().int().min(0, 'Ambang batas harus bilangan non-negatif').optional(),
  newImages: z.any().optional(),
  categoryId: z.string().optional(),
  unitId: z.string().optional(),
  supplierId: z.string().optional().nullable(),
  attributeValues: z.array(attributeValueSchema).optional(),
});


type ProductFormData = z.infer<typeof productSchema>;

const newCategorySchema = z.object({
  name: z.string().min(1, "Nama kategori harus diisi."),
  description: z.string().optional(),
});
type NewCategoryFormData = z.infer<typeof newCategorySchema>;

const newUnitSchema = z.object({
  name: z.string().min(1, "Nama unit harus diisi."),
  symbol: z.string().min(1, "Simbol harus diisi."),
  description: z.string().optional(),
});
type NewUnitFormData = z.infer<typeof newUnitSchema>;


const categoryIcons: { [key: string]: React.ElementType } = {
    'kopi': Coffee,
    'minuman': Coffee,
    'makanan': Utensils,
    'daging': Beef,
    'ikan': Fish,
    'buah': Apple,
    'sayur': Leaf,
    'beans': Bean,
    'teh': Leaf,
    'kue': CakeSlice,
    'pastry': CakeSlice,
    'roti': CakeSlice,
    'susu': Milk,
    'cleaner': Sparkles,
    'frozen': Snowflake,
    'apple': Apple,
    'default': Package,
};

const getIconForCategory = (categoryName?: string) => {
    if (!categoryName) return categoryIcons['default'];
    const lowerCaseName = categoryName.toLowerCase();
    for (const key in categoryIcons) {
        if (lowerCaseName.includes(key)) {
            return categoryIcons[key];
        }
    }
    return categoryIcons['default'];
};


export default function InventoryPage() {
  const { user } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>('all');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDatePickers, setActiveDatePickers] = useState<Record<string, boolean>>({});

  // States for new inline forms
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productCode: '', name: '', productType: 'Produk Retail', price: 0, purchasePrice: 0, description: '', lowStockThreshold: 5, newImages: undefined,
      categoryId: '', unitId: '', supplierId: '', attributeValues: [],
    },
  });
  
  const newCategoryForm = useForm<NewCategoryFormData>({
    resolver: zodResolver(newCategorySchema),
    defaultValues: { name: '', description: '' },
  });

  const newUnitForm = useForm<NewUnitFormData>({
    resolver: zodResolver(newUnitSchema),
    defaultValues: { name: '', symbol: '', description: '' },
  });
  
  const { control, watch, setValue, setError, reset } = form;
  const { isSubmitting } = form.formState;
  const productTypeWatcher = watch("productType");
  const categoryIdWatcher = watch("categoryId");
  
  const selectedCategoryAttributes = useMemo(() => {
    return categories.find(c => c.id === categoryIdWatcher)?.attributes || [];
  }, [categoryIdWatcher, categories]);

  const umkmId = useMemo(() => user?.role === 'UMKM' ? user.uid : user?.idUMKM, [user]);

  // Fetch products, categories, units, and suppliers from Firestore
  useEffect(() => {
    if (!umkmId) {
        setIsLoading(false);
        return;
    };

    setIsLoading(true);
    const qProducts = query(collection(db, 'products'), where('idUMKM', '==', umkmId));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(items.sort((a, b) => a.name.localeCompare(b.name)));
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching products:", error);
        setIsLoading(false);
    });

    const qCategories = query(collection(db, 'productCategories'), where('idUMKM', '==', umkmId));
    const unsubCategories = onSnapshot(qCategories, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductCategory));
      setCategories(items);
    });

    const qUnits = query(collection(db, 'productUnits'), where('idUMKM', '==', umkmId));
    const unsubUnits = onSnapshot(qUnits, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProductUnit));
      setUnits(items);
    });
    
    const qSuppliers = query(collection(db, 'suppliers'), where('idUMKM', '==', umkmId));
    const unsubSuppliers = onSnapshot(qSuppliers, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
      setSuppliers(items);
    });

    return () => {
      unsubProducts();
      unsubCategories();
      unsubUnits();
      unsubSuppliers();
    };
  }, [umkmId]);

  useEffect(() => {
    if (isFormDialogOpen) {
        if (editingProduct) {
            const productCategory = categories.find(c => c.id === editingProduct.categoryId);
            const productAttributes = productCategory?.attributes || [];
            
            const filledAttributeValues = productAttributes.map(attrDef => {
                const existingValue = editingProduct.attributeValues?.find(v => v.attributeId === attrDef.id);
                return {
                    attributeId: attrDef.id,
                    attributeName: attrDef.name,
                    type: attrDef.type,
                    options: attrDef.options || [],
                    value: existingValue?.value ?? (attrDef.type === 'Checkbox' ? [] : ''),
                };
            });
            
            reset({
                ...editingProduct,
                purchasePrice: editingProduct.purchasePrice || 0,
                description: editingProduct.description || '',
                lowStockThreshold: editingProduct.lowStockThreshold || 0,
                attributeValues: filledAttributeValues,
                newImages: undefined,
            });
        } else {
            reset({
                productCode: '', name: '', productType: 'Produk Retail', price: 0, purchasePrice: 0, description: '', lowStockThreshold: 5, newImages: undefined,
                categoryId: '', unitId: '', supplierId: '', attributeValues: [],
            });
        }
    }
  }, [editingProduct, isFormDialogOpen, reset, categories]);
  
  useEffect(() => {
    if (!isFormDialogOpen) return;

    const subscription = watch((value, { name, type }) => {
        if (name === 'categoryId') {
            const newCategory = categories.find(c => c.id === value.categoryId);
            const newAttributes = newCategory?.attributes || [];
            
            const defaultAttributeValues = newAttributes.map(attr => ({
                attributeId: attr.id,
                attributeName: attr.name,
                type: attr.type,
                options: attr.options || [],
                value: attr.type === 'Checkbox' ? [] : '',
            }));
            setValue('attributeValues', defaultAttributeValues);
        }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue, categories, isFormDialogOpen]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      if (p.categoryId) {
        counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
      }
    });

    const allCategories = categories
      .map(cat => ({
        ...cat,
        count: counts[cat.id] || 0,
      }))
      .filter(cat => cat.count > 0) // Only show categories with products
      .sort((a,b) => a.name.localeCompare(b.name));

    return [{ id: 'all', name: 'Semua Produk', count: products.length }, ...allCategories];
  }, [products, categories]);

  const filteredProducts = useMemo(() => {
    return products.map(p => ({
      ...p,
      stock: p.stock || 0,
      categoryName: categories.find(c => c.id === p.categoryId)?.name,
      unitName: units.find(u => u.id === p.unitId)?.name,
      supplierName: suppliers.find(s => s.id === p.supplierId)?.name,
    })).filter((product) => {
      const term = searchTerm.toLowerCase();
      
      const searchMatch = (
        product.name.toLowerCase().includes(term) ||
        (product.productCode || '').toLowerCase().includes(term) ||
        (product.categoryName || '').toLowerCase().includes(term) ||
        (product.supplierName || '').toLowerCase().includes(term) ||
        product.price.toString().toLowerCase().includes(term) ||
        String(product.stock).toLowerCase().includes(term)
      );
      
      const categoryMatch = selectedCategoryId === 'all' || product.categoryId === selectedCategoryId;

      return searchMatch && categoryMatch;
    });
  }, [products, searchTerm, categories, units, suppliers, selectedCategoryId]);

  const onSubmit: SubmitHandler<ProductFormData> = async (data) => {
    if (!umkmId) {
        toast({ title: 'Error', description: 'ID UMKM tidak ditemukan.', variant: 'destructive' });
        return;
    }
    const submissionToast = toast({ title: 'Menyimpan...', description: 'Mohon tunggu...' });

    try {
        const { newImages, ...productData } = data;
        let uploadedImageUrls: string[] = [];
        
        const docId = editingProduct?.id || doc(collection(db, 'products')).id;
        const docRef = doc(db, 'products', docId);

        if (!editingProduct && data.productCode && data.productCode.trim() !== '') {
            const isDuplicate = products.some(p => p.id !== docId && p.productCode?.trim().toLowerCase() === data.productCode?.trim().toLowerCase());
            if (isDuplicate) {
                setError('productCode', { type: 'manual', message: 'Kode produk ini sudah digunakan.' });
                submissionToast.update({ id: submissionToast.id, title: 'Gagal', description: 'Kode produk sudah ada.', variant: 'destructive' });
                return;
            }
        }
        
        if (newImages && newImages.length > 0) {
            submissionToast.update({ id: submissionToast.id, description: `Mengompres & mengunggah ${newImages.length} gambar...` });
            const uploadPromises = Array.from(newImages as FileList).map(async (file) => {
                let fileToUpload = file;
                if (file.size > 512 * 1024) {
                    try {
                        fileToUpload = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true });
                    } catch (compressionError) {
                        console.warn('Kompresi gambar gagal, mengunggah file asli.', compressionError);
                    }
                }
                const filePath = `products/${umkmId}/${docId}/${Date.now()}_${fileToUpload.name}`;
                const storageRef = ref(storage, filePath);
                await uploadBytes(storageRef, fileToUpload);
                return getDownloadURL(storageRef);
            });
            uploadedImageUrls = await Promise.all(uploadPromises);
        }
        
        const existingImageUrls = editingProduct?.imageUrls || [];

        const dataToSave: any = {
            productCode: (productData.productCode || '').trim(),
            name: productData.name,
            productType: productData.productType,
            price: productData.price || 0,
            description: productData.description || '',
            idUMKM: umkmId,
            categoryId: productData.categoryId || null,
            unitId: productData.unitId || null,
            attributeValues: productData.attributeValues,
            imageUrls: [...existingImageUrls, ...uploadedImageUrls],
            updatedAt: new Date(),
        };

        if (productData.productType === 'Barang') {
            dataToSave.purchasePrice = productData.purchasePrice || 0;
            dataToSave.lowStockThreshold = productData.lowStockThreshold || 0;
            dataToSave.supplierId = productData.supplierId || null;
        } else {
            dataToSave.purchasePrice = null;
            dataToSave.lowStockThreshold = null;
            dataToSave.supplierId = null;
            dataToSave.stock = null;
        }
        
        if (editingProduct) {
            await updateDoc(docRef, dataToSave);
            submissionToast.update({ id: submissionToast.id, title: 'Produk Diperbarui', description: `${data.name} berhasil diperbarui.` });
        } else {
            dataToSave.createdAt = new Date();
            dataToSave.stock = 0; // Initial stock
            await setDoc(docRef, dataToSave);
            submissionToast.update({ id: submissionToast.id, title: 'Produk Ditambahkan', description: `${data.name} berhasil ditambahkan.` });
        }

        setEditingProduct(null);
        setIsFormDialogOpen(false);
        form.reset();
    } catch (error: any) {
        toast({ title: 'Error', description: error.message || 'Terjadi kesalahan saat menyimpan produk.', variant: 'destructive' });
        console.error("Error saving product: ", error);
        submissionToast.update({ id: submissionToast.id, title: 'Gagal', description: 'Gagal menyimpan data produk.', variant: 'destructive' });
    }
  };


  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsFormDialogOpen(true);
  };
  
  const handleOpenDeleteDialog = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
        await deleteDoc(doc(db, 'products', productToDelete.id));
        toast({ title: 'Produk Dihapus', description: `${productToDelete.name} telah dihapus.`, variant: 'destructive' });
    } catch (error) {
        toast({ title: 'Error', description: `Gagal menghapus ${productToDelete.name}.`, variant: 'destructive' });
        console.error("Error deleting product: ", error);
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };
  
  const openAddDialog = () => {
    setEditingProduct(null);
    form.reset();
    setIsFormDialogOpen(true);
  };

  const handleAddNewCategory = async (data: NewCategoryFormData) => {
      if (!umkmId) return;
      try {
          const docRef = await addDoc(collection(db, 'productCategories'), { ...data, idUMKM: umkmId });
          toast({ title: 'Kategori Ditambahkan', description: `Kategori "${data.name}" berhasil ditambahkan.` });
          setValue('categoryId', docRef.id);
          setIsCategoryDialogOpen(false);
          newCategoryForm.reset();
      } catch (error) {
          toast({ variant: 'destructive', title: 'Gagal', description: 'Tidak dapat menambahkan kategori baru.' });
      }
  };

  const handleAddNewUnit = async (data: NewUnitFormData) => {
      if (!umkmId) return;
      try {
          const docRef = await addDoc(collection(db, 'productUnits'), { ...data, idUMKM: umkmId });
          toast({ title: 'Unit Ditambahkan', description: `Unit "${data.name}" berhasil ditambahkan.` });
          setValue('unitId', docRef.id);
          setIsUnitDialogOpen(false);
          newUnitForm.reset();
      } catch (error) {
          toast({ variant: 'destructive', title: 'Gagal', description: 'Tidak dapat menambahkan unit baru.' });
      }
  };


  return (
    <>
      <div className="py-2 p-4 md:p-6">
        <Card className="shadow-lg mb-6">
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                  <Package className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-2xl font-headline">Data Produk</CardTitle>
                    <CardDescription>Kelola semua data produk dan jasa Anda.</CardDescription>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={openAddDialog}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Tambah Produk
                </Button>
              </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6 flex items-center gap-4">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari (nama, kode, kategori)..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {categoryCounts.map(cat => {
                    const Icon = getIconForCategory(cat.name);
                    return (
                        <Card 
                            key={cat.id} 
                            onClick={() => setSelectedCategoryId(cat.id)}
                            className={cn(
                                "p-3 text-center cursor-pointer transition-all duration-200 shadow-sm hover:shadow-lg hover:-translate-y-1",
                                selectedCategoryId === cat.id ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2" : "bg-card hover:bg-muted/50"
                            )}
                        >
                            <Icon className={cn("h-6 w-6 mx-auto mb-1.5", selectedCategoryId === cat.id ? "text-primary-foreground" : "text-primary")} />
                            <p className="font-semibold truncate text-xs">{cat.name}</p>
                            <p className={cn("text-xs", selectedCategoryId === cat.id ? "text-primary-foreground/80" : "text-muted-foreground")}>{cat.count}</p>
                        </Card>
                    );
                })}
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
             {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-32 w-full rounded-lg" />
                ))
            ) : filteredProducts.length > 0 ? (
                filteredProducts.map(product => (
                    <Card key={product.id} className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                        <CardContent className="p-3 flex gap-3">
                            <Image
                                src={product.imageUrls?.[0] || 'https://placehold.co/100x100.png'}
                                alt={product.name}
                                width={80}
                                height={80}
                                className="rounded-md object-cover aspect-square bg-muted"
                                data-ai-hint="product image"
                            />
                            <div className="flex-1 space-y-1">
                                <h3 className="font-semibold text-base leading-tight">{product.name}</h3>
                                <p className="text-xs text-muted-foreground">{product.categoryName || '-'}</p>
                                <p className="font-bold text-sm">Rp {product.price.toLocaleString('id-ID')}</p>
                                {product.productType === 'Barang' && (
                                    <p className="text-xs">Stok: <span className="font-medium">{product.stock} {product.unitName}</span></p>
                                )}
                            </div>
                            <div className="absolute top-1 right-1">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(product)}>Edit</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleOpenDeleteDialog(product)} className="text-destructive">Hapus</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <div className="text-center py-10">
                   <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                   <p className="font-semibold">Tidak ada produk ditemukan.</p>
                   <p className="text-muted-foreground mt-2">Coba ubah filter pencarian atau kategori.</p>
                </div>
            )}
        </div>
      </div>
      
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-headline">{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                <FormField control={control} name="name" render={({ field }) => (<FormItem><FormLabel>Nama Produk</FormLabel><FormControl><Input placeholder="e.g., Kopi Americano" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="productCode" render={({ field }) => (<FormItem><FormLabel>Kode Produk (SKU)</FormLabel><FormControl><Input placeholder="e.g., KOPI-001 (Opsional)" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField
                  control={control}
                  name="productType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipe Produk</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Produk Retail">Produk Retail</SelectItem>
                          <SelectItem value="Produk Produksi">Produk Produksi</SelectItem>
                          <SelectItem value="Jasa (Layanan)">Jasa (Layanan)</SelectItem>
                          <SelectItem value="Bahan Baku">Bahan Baku</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {productTypeWatcher === 'Barang' && (
                  <FormField control={control} name="purchasePrice" render={({ field }) => ( <FormItem><FormLabel>Harga Beli (Rp)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage/></FormItem> )}/>
                )}
                <FormField control={control} name="price" render={({ field }) => ( <FormItem><FormLabel>Harga Jual (Rp)</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl><FormMessage/></FormItem> )}/>
                <FormField control={control} name="categoryId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Kategori</FormLabel>
                        <div className="flex gap-2">
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Pilih kategori..."/></SelectTrigger></FormControl>
                            <SelectContent>{categories.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                        </Select>
                        <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(true)}><PlusCircle className="h-4 w-4"/></Button>
                        </div>
                        <FormMessage />
                    </FormItem>
                )} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={control} name="unitId" render={({ field }) => (
                      <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <div className="flex gap-2">
                          <Select onValueChange={field.onChange} value={field.value || ''}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Pilih unit..."/></SelectTrigger></FormControl>
                              <SelectContent>{units.map(u=><SelectItem key={u.id} value={u.id}>{u.name} ({u.symbol})</SelectItem>)}</SelectContent>
                          </Select>
                          <Button type="button" variant="outline" onClick={() => setIsUnitDialogOpen(true)}><PlusCircle className="h-4 w-4"/></Button>
                          </div>
                          <FormMessage />
                      </FormItem>
                    )} />
                    {productTypeWatcher === 'Barang' && <FormField control={control} name="supplierId" render={({ field }) => (<FormItem><FormLabel>Pemasok</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder="Pilih pemasok..."/></SelectTrigger></FormControl><SelectContent>{suppliers.map(s=><SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />}
                </div>
                {productTypeWatcher === 'Barang' && <FormField control={control} name="lowStockThreshold" render={({ field }) => ( <FormItem><FormLabel>Ambang Batas Stok Rendah</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))}/></FormControl><FormMessage/></FormItem> )}/>}
                
                {selectedCategoryAttributes.length > 0 && ( <>
                    <Separator/>
                    <h3 className="font-semibold">Rincian Tambahan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {watch('attributeValues')?.map((attr, index) => {
                            const fieldName = `attributeValues.${index}.value` as const;
                            return <div key={attr.attributeId}>{(() => { switch (attr.type) {
                                case 'Teks': return <FormField control={control} name={fieldName} render={({ field }) => (<FormItem><FormLabel>{attr.attributeName}</FormLabel><FormControl><Input {...field} value={field.value || ''}/></FormControl><FormMessage/></FormItem>)}/>;
                                case 'Angka': return <FormField control={control} name={fieldName} render={({ field }) => (<FormItem><FormLabel>{attr.attributeName}</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''}/></FormControl><FormMessage/></FormItem>)}/>;
                                case 'Paragraf': return <FormField control={control} name={fieldName} render={({ field }) => (<FormItem><FormLabel>{attr.attributeName}</FormLabel><FormControl><Textarea {...field} value={field.value || ''}/></FormControl><FormMessage/></FormItem>)}/>;
                                case 'Tanggal': return <FormField control={control} name={fieldName} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>{attr.attributeName}</FormLabel><Popover open={activeDatePickers[attr.attributeId]} onOpenChange={(isOpen) => setActiveDatePickers(p=>({...p, [attr.attributeId]:isOpen}))}><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal",!field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{field.value && isValid(new Date(field.value)) ? format(new Date(field.value),'PPP'):<span>Pilih tanggal</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value ? new Date(field.value) : undefined} onSelect={(d)=>{field.onChange(d?.toISOString());setActiveDatePickers(p=>({...p,[attr.attributeId]:false}))}} initialFocus/></PopoverContent></Popover><FormMessage/></FormItem>)}/>;
                                case 'Pilihan Tunggal': return <FormField control={control} name={fieldName} render={({ field }) => (<FormItem><FormLabel>{attr.attributeName}</FormLabel><Select onValueChange={field.onChange} value={field.value || ''}><FormControl><SelectTrigger><SelectValue placeholder={`Pilih ${attr.attributeName}`}/></SelectTrigger></FormControl><SelectContent>{attr.options?.map(opt=><SelectItem key={opt} value={opt}>{opt}</SelectItem>)}</SelectContent></Select><FormMessage/></FormItem>)}/>;
                                case 'Checkbox': return <FormField control={control} name={fieldName} render={() => (<FormItem><FormLabel>{attr.attributeName}</FormLabel><div className="space-y-2 rounded-md border p-4">{attr.options?.map(option=>(<FormField key={option} control={control} name={fieldName} render={({ field }) => (<FormItem className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(option)} onCheckedChange={(checked) => { const newValue = Array.isArray(field.value) ? field.value : []; return checked ? field.onChange([...newValue,option]) : field.onChange(newValue.filter(v=>v!==option))}}/></FormControl><FormLabel className="font-normal">{option}</FormLabel></FormItem>)}/>))}</div><FormMessage/></FormItem>)}/>
                                default: return null;
                            }})()}</div>
                        })}
                    </div>
                </>)}
                
                <FormField control={control} name="description" render={({ field }) => (<FormItem><FormLabel>Deskripsi</FormLabel><FormControl><Textarea value={field.value || ''} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={control} name="newImages" render={({ field: { onChange, value, ...rest } }) => (<FormItem><FormLabel>Unggah Foto Baru</FormLabel><FormControl><Input type="file" multiple {...rest} onChange={e => onChange(e.target.files)}/></FormControl><FormMessage/></FormItem>)} />
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Batal</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{editingProduct ? 'Simpan' : 'Tambah'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add New Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Tambah Kategori Baru</DialogTitle>
              </DialogHeader>
              <Form {...newCategoryForm}>
                  <form onSubmit={newCategoryForm.handleSubmit(handleAddNewCategory)} className="space-y-4 py-4">
                      <FormField control={newCategoryForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nama Kategori</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={newCategoryForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Deskripsi (Opsional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Batal</Button>
                          <Button type="submit">Simpan Kategori</Button>
                      </DialogFooter>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>

      {/* Add New Unit Dialog */}
      <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Tambah Unit Baru</DialogTitle>
              </DialogHeader>
              <Form {...newUnitForm}>
                  <form onSubmit={newUnitForm.handleSubmit(handleAddNewUnit)} className="space-y-4 py-4">
                      <FormField control={newUnitForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nama Unit</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={newUnitForm.control} name="symbol" render={({ field }) => (<FormItem><FormLabel>Simbol</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <FormField control={newUnitForm.control} name="description" render={({ field }) => (<FormItem><FormLabel>Deskripsi (Opsional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
                      <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsUnitDialogOpen(false)}>Batal</Button>
                          <Button type="submit">Simpan Unit</Button>
                      </DialogFooter>
                  </form>
              </Form>
          </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus Produk?</AlertDialogTitle><AlertDialogDescription>Tindakan ini tidak dapat diurungkan.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Hapus</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={()=>{}}
        accept=".xlsx, .xls"
        className="hidden"
      />
    </>
  );
}
