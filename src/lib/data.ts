export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  description: string;
};

export const categories = [
  { name: "All", icon: "LayoutGrid" },
  { name: "Beras", icon: "Wheat" },
  { name: "Sayuran", icon: "Carrot" },
  { name: "Buah", icon: "Apple" },
  { name: "Daging", icon: "Beef" },
  { name: "Telur", icon: "Egg" },
  { name: "Susu", icon: "Milk" },
  { name: "Bawang", icon: "Salad" },
];

export const products: Product[] = [
  {
    id: "1",
    name: "Beras Putih Premium",
    category: "Beras",
    price: 65000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Beras pulen dan wangi kualitas terbaik, 5kg.",
  },
  {
    id: "2",
    name: "Minyak Goreng Sania",
    category: "Groceries",
    price: 32000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Minyak goreng jernih dan sehat, 2L.",
  },
  {
    id: "3",
    name: "Gula Pasir Gulaku",
    category: "Groceries",
    price: 18000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Gula pasir putih bersih, 1kg.",
  },
  {
    id: "4",
    name: "Daging Sapi Segar",
    category: "Daging",
    price: 120000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Daging sapi segar potongan rendang, 1kg.",
  },
  {
    id: "5",
    name: "Telur Ayam Negeri",
    category: "Telur",
    price: 28000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Telur ayam negeri segar, 1kg.",
  },
  {
    id: "6",
    name: "Susu UHT Full Cream",
    category: "Susu",
    price: 19000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Susu UHT full cream kaya nutrisi, 1L.",
  },
  {
    id: "7",
    name: "Bayam Segar",
    category: "Sayuran",
    price: 5000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Satu ikat bayam hijau segar.",
  },
  {
    id: "8",
    name: "Apel Fuji",
    category: "Buah",
    price: 45000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Apel fuji manis dan renyah, 1kg.",
  },
  {
    id: "9",
    name: "Bawang Merah",
    category: "Bawang",
    price: 35000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Bawang merah lokal, 1kg.",
  },
  {
    id: "10",
    name: "Indomie Goreng",
    category: "Groceries",
    price: 3500,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Indomie seleraku.",
  },
  {
    id: "11",
    name: "Wortel Import",
    category: "Sayuran",
    price: 15000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Wortel import segar dan manis, 500g.",
  },
  {
    id: "12",
    name: "Pisang Cavendish",
    category: "Buah",
    price: 22000,
    imageUrl: "https://placehold.co/300x300.png",
    description: "Satu sisir pisang cavendish matang.",
  },
];
