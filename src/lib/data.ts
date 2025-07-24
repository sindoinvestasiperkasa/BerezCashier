export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  imageUrls?: string[];
  description: string;
  productType?: 'Barang' | 'Jasa';
  netWeight?: string;
  ingredients?: string[];
  productionCode?: string;
  expirationDate?: string;
  permitNumber?: string;
  nutritionFacts?: { [key: string]: string };
  storageInstructions?: string;
};

export const products: Product[] = [
  {
    id: "1",
    name: "Beras Pandan Wangi",
    category: "Beras",
    price: 68000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Beras Pandan Wangi asli Cianjur, pulen dan wangi alami. Kualitas terjamin.",
    netWeight: "5 kg",
    productionCode: "PW-0123",
    expirationDate: "12/2025",
    permitNumber: "P-IRT 2153205010091-25",
    storageInstructions: "Simpan di tempat kering dan sejuk, hindari sinar matahari langsung.",
    nutritionFacts: {
        "Kalori": "360 kcal",
        "Karbohidrat": "80 g",
        "Protein": "7 g"
    }
  },
  {
    id: "2",
    name: "Minyak Goreng Sania",
    category: "Groceries",
    price: 35000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Minyak goreng kelapa sawit, bening dan tidak cepat hitam. Cocok untuk segala jenis masakan.",
    netWeight: "2 L",
    productionCode: "SN-456",
    expirationDate: "06/2026",
    permitNumber: "MD 208109001006",
    storageInstructions: "Simpan di suhu ruang."
  },
  {
    id: "3",
    name: "Wortel Berastagi",
    category: "Sayuran",
    price: 12000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Wortel segar dari dataran tinggi Berastagi, kaya akan vitamin A. Manis dan renyah.",
    netWeight: "500 g",
    storageInstructions: "Simpan di dalam kulkas untuk menjaga kesegaran."
  },
  {
    id: "4",
    name: "Apel Fuji",
    category: "Buah",
    price: 45000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Apel Fuji impor berkualitas, rasa manis dengan tekstur renyah dan juicy.",
    netWeight: "1 kg",
    storageInstructions: "Simpan di kulkas agar tetap segar dan renyah."
  },
  {
    id: "5",
    name: "Daging Sapi Has Dalam",
    category: "Daging",
    price: 135000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Daging sapi bagian has dalam (tenderloin), sangat empuk dan cocok untuk steak atau rendang.",
    netWeight: "1 kg",
    storageInstructions: "Simpan beku di freezer pada suhu -18°C."
  },
  {
    id: "6",
    name: "Telur Ayam Negeri",
    category: "Telur",
    price: 28000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Telur ayam negeri segar, cangkang bersih dan tebal. Sumber protein hewani yang baik.",
    netWeight: "1 kg (sekitar 16 butir)",
    storageInstructions: "Simpan di kulkas atau suhu ruang."
  },
  {
    id: "7",
    name: "Susu UHT Full Cream",
    category: "Susu",
    price: 18000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Susu UHT full cream, kaya kalsium dan vitamin. Rasa gurih dan creamy.",
    netWeight: "1 L",
    expirationDate: "01/2025",
    permitNumber: "MD 400109001006",
    storageInstructions: "Setelah dibuka, simpan di kulkas dan habiskan dalam 4 hari.",
    ingredients: ["Susu Sapi Segar", "Penstabil Fosfat"]
  },
  {
    id: "8",
    name: "Bawang Merah Brebes",
    category: "Bawang",
    price: 25000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Bawang merah asli Brebes, ukuran sedang, aroma kuat dan menyengat. Cocok untuk bumbu dasar masakan.",
    netWeight: "500 g",
    storageInstructions: "Simpan di tempat kering dan terbuka."
  },
  {
    id: "9",
    name: "Gula Pasir Gulaku",
    category: "Groceries",
    price: 16000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Gula pasir putih bersih dari tebu pilihan, manis alami.",
    netWeight: "1 kg",
    permitNumber: "MD 224209001007",
    storageInstructions: "Simpan di wadah tertutup dan kering."
  },
  {
    id: "10",
    name: "Bayam Segar",
    category: "Sayuran",
    price: 5000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Bayam hijau segar, petikan baru. Kaya akan zat besi.",
    netWeight: "250 g",
    storageInstructions: "Segera olah atau simpan di kulkas dalam wadah tertutup."
  }
];
