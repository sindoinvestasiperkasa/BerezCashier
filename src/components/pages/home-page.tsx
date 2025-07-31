
"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Bell,
  LayoutGrid,
  ShoppingBasket,
  Frown,
  ConciergeBell,
  Wrench,
  Scissors,
  Shirt,
  Car,
  MapPin,
} from "lucide-react";
import type { Product } from "@/providers/app-provider";
import ProductCard from "../product-card";
import { cn } from "@/lib/utils";
import ProductDetail from "../product-detail";
import { collection, getDocs, query, where, getFirestore, documentId } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "../ui/card";
import { useApp } from "@/hooks/use-app";
import { useToast } from "@/hooks/use-toast";
import type { View } from "../app-shell";

const iconMap: { [key: string]: React.ElementType } = {
  All: LayoutGrid,
  Layanan: ConciergeBell,
  Perbaikan: Wrench,
  "Potong Rambut": Scissors,
  Laundry: Shirt,
  Transportasi: Car,
  Default: ShoppingBasket,
};

type CategoryName = string | { id: string; en: string };

interface ProductCategory {
  id: string;
  name: CategoryName;
  icon?: string;
}

interface HomePageProps {
  setView: (view: View) => void;
}

export default function HomePage({ setView }: HomePageProps) {
  const { user, products, notifications, selectedBranchId, selectedWarehouseId, stockLots, productUnits, t, locale } = useApp();
  const { toast } = useToast();
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);

  const getCategoryDisplayName = (name: CategoryName) => {
    if (typeof name === 'object' && name !== null) {
      return locale === 'en' ? name.en : name.id;
    }
    return name;
  };

  useEffect(() => {
    const fetchLocation = async (latitude: number, longitude: number) => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        const city = data.address.city || data.address.town || data.address.village;
        const country = data.address.country;
        if (city && country) {
          setLocationName(`${city}, ${country}`);
        } else {
          setLocationName(user?.address || t('home.locationNotSet'));
        }
      } catch (error) {
        console.error("Error fetching location name:", error);
        setLocationName(user?.address || t('home.locationNotSet'));
      }
    };
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationName(user?.address || t('home.locationNotSet'));
        }
      );
    } else {
      setLocationName(user?.address || t('home.locationNotSet'));
    }
  }, [user?.address, t]);

  const availableProducts = useMemo(() => {
    const allProducts = products.filter(p => p.productSubType !== 'Bahan Baku');

    // Handle 'Barang' (Goods) based on warehouse stock
    const goodsProducts = allProducts
      .filter(p => p.productType === 'Barang')
      .map(product => {
        const stock = stockLots
          .filter(lot => lot.productId === product.id && lot.warehouseId === selectedWarehouseId)
          .reduce((sum, lot) => sum + lot.remainingQuantity, 0);
        
        return {
          ...product,
          stock: stock,
          unitName: productUnits.find(unit => unit.id === product.unitId)?.name || 'Unit'
        };
      })
      .filter(product => (product.stock || 0) > 0);

    // Handle 'Jasa' (Services) based on branch availability
    const serviceProducts = allProducts
      .filter(p => p.productType === 'Jasa' && p.availableBranchIds?.includes(selectedBranchId || ''))
      .map(product => ({
        ...product,
        stock: Infinity, // Services don't have stock
        unitName: 'Layanan'
      }));

    return [...goodsProducts, ...serviceProducts];
  }, [products, stockLots, selectedWarehouseId, selectedBranchId, productUnits]);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!user || availableProducts.length === 0) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      const db = getFirestore();

      try {
        const activeCategoryIds = [...new Set(availableProducts.map(p => p.categoryId))].filter(id => id);
        
        let categoriesData: ProductCategory[] = [];
        if (activeCategoryIds.length > 0) {
          const categoriesQuery = query(collection(db, "productCategories"), where(documentId(), "in", activeCategoryIds));
          const categoriesSnapshot = await getDocs(categoriesQuery);
          categoriesData = categoriesSnapshot.docs.map(doc => {
            const data = doc.data();
            const name: CategoryName = data.name;
            // For icon mapping, we use the Indonesian name or the base string.
            const iconName = typeof name === 'object' ? name.id : name;
            return {
              id: doc.id,
              name: name,
              icon: iconName
            };
          });
        }
        
        setProductCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategories();

  }, [availableProducts, user]);
  
  const productsWithCategoryNames = useMemo(() => {
    return availableProducts.map(product => {
      const category = productCategories.find(cat => cat.id === product.categoryId);
      return {
        ...product,
        categoryName: category ? getCategoryDisplayName(category.name) : "Uncategorized",
      };
    });
  }, [availableProducts, productCategories, locale]);

  const displayCategories = useMemo(() => {
    const allCategory: ProductCategory = { id: "All", name: t('home.category.all'), icon: "All" };
    return [allCategory, ...productCategories];
  }, [productCategories, t]);

  const filteredProducts = productsWithCategoryNames.filter((product) => {
    const matchesCategory =
      selectedCategoryId === "All" || product.categoryId === selectedCategoryId;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleCloseDetail = () => {
    setSelectedProduct(null);
  };
  
  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex flex-col">
      <header className="p-4 md:p-6 bg-gradient-to-b from-primary/20 to-background">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-muted-foreground text-sm flex items-center gap-1"><MapPin className="w-4 h-4"/> {t('home.yourLocation')}</p>
            <h1 className="font-bold text-lg text-foreground">
              {locationName || t('home.searchingLocation')}
            </h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setView('notifications')} className="relative">
            <Bell className="h-6 w-6" />
            {unreadNotifications > 0 && (
              <div className="absolute top-0 right-0 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs font-bold">
                {unreadNotifications}
              </div>
            )}
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder={t('home.searchPlaceholder')}
            className="pl-10 h-12 rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <section className="p-4 md:p-6">
        <h2 className="text-xl font-bold mb-3 text-foreground">{t('home.categories')}</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 md:-mx-6 px-4 md:px-6">
          {isLoading && productCategories.length === 0 ? (
             [...Array(5)].map((_, i) => <Skeleton key={i} className="w-20 h-20 rounded-lg flex-shrink-0" />)
          ) : (
            displayCategories.map((category) => {
              const displayName = getCategoryDisplayName(category.name);
              const Icon = iconMap[category.icon || "Default"] || iconMap["Default"];
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 w-20 h-20 rounded-lg border transition-colors flex-shrink-0 shadow-md text-center",
                    selectedCategoryId === category.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground hover:bg-secondary"
                  )}
                >
                  {Icon && <Icon className="w-6 h-6" />}
                  <span className="text-xs font-medium">{displayName}</span>
                </button>
              );
            })
          )}
        </div>
      </section>

      <section className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {searchQuery ? t('home.searchResults') : t('home.availableServices')}
          </h2>
          <Button variant="link" className="text-primary p-0 h-auto">
            {t('home.seeAll')}
          </Button>
        </div>
        {isLoading && products.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="shadow-md">
                <Skeleton className="w-full aspect-square" />
                <CardContent className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex justify-between items-center mt-3">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onProductClick={handleProductClick} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 flex flex-col items-center gap-4">
            <Frown className="w-16 h-16 text-muted-foreground" />
            <h3 className="text-lg font-semibold">{t('home.noServicesFound.title')}</h3>
            <p className="text-muted-foreground max-w-xs">
              {t('home.noServicesFound.description')}
            </p>
          </div>
        )}
      </section>
      
      <ProductDetail 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
