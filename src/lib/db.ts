export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
}

const initialProducts: Product[] = [
  {
    id: 1,
    title: "iPhone 15 Pro",
    description: "The latest iPhone with titanium frame and A17 Pro chip.",
    price: 999,
    discountPercentage: 10,
    rating: 4.8,
    stock: 100,
    brand: "Apple",
    category: "Electronics",
    thumbnail: "https://picsum.photos/seed/iphone/200/200",
    images: ["https://picsum.photos/seed/iphone/400/400"],
  },
    {
    id: 2,
    title: "Samsung Galaxy S24",
    description: "AI-powered smartphone with amazing camera capabilities.",
    price: 899,
    discountPercentage: 15,
    rating: 4.7,
    stock: 80,
    brand: "Samsung",
    category: "Electronics",
    thumbnail: "https://picsum.photos/seed/galaxy/200/200",
    images: ["https://picsum.photos/seed/galaxy/400/400"],
  },
  {
    id: 3,
    title: "Sony WH-1000XM5",
    description: "Industry-leading noise canceling headphones.",
    price: 399,
    discountPercentage: 20,
    rating: 4.9,
    stock: 150,
    brand: "Sony",
    category: "Audio",
    thumbnail: "https://picsum.photos/seed/sony/200/200",
    images: ["https://picsum.photos/seed/sony/400/400"],
  },
  {
    id: 4,
    title: "MacBook Pro 16",
    description: "Powerful laptop with M3 Pro chip for professionals.",
    price: 2499,
    discountPercentage: 5,
    rating: 4.9,
    stock: 45,
    brand: "Apple",
    category: "Computers",
    thumbnail: "https://picsum.photos/seed/macbook/200/200",
    images: ["https://picsum.photos/seed/macbook/400/400"],
  },
  {
    id: 5,
    title: "Nike Air Max 270",
    description: "Comfortable running shoes with Air cushioning.",
    price: 150,
    discountPercentage: 25,
    rating: 4.5,
    stock: 200,
    brand: "Nike",
    category: "Footwear",
    thumbnail: "https://picsum.photos/seed/nike/200/200",
    images: ["https://picsum.photos/seed/nike/400/400"],
  },
  {
    id: 6,
    title: "Dyson V15 Vacuum",
    description: "Powerful cordless vacuum with laser detection.",
    price: 699,
    discountPercentage: 10,
    rating: 4.6,
    stock: 60,
    brand: "Dyson",
    category: "Home",
    thumbnail: "https://picsum.photos/seed/dyson/200/200",
    images: ["https://picsum.photos/seed/dyson/400/400"],
  },
  {
    id: 7,
    title: "Instant Pot Pro",
    description: "Multi-functional pressure cooker with 10-in-1 features.",
    price: 199,
    discountPercentage: 30,
    rating: 4.7,
    stock: 120,
    brand: "Instant",
    category: "Kitchen",
    thumbnail: "https://picsum.photos/seed/instant/200/200",
    images: ["https://picsum.photos/seed/instant/400/400"],
  },
  {
    id: 8,
    title: "Canon EOS R6",
    description: "Professional mirrorless camera with 20MP sensor.",
    price: 2499,
    discountPercentage: 8,
    rating: 4.8,
    stock: 30,
    brand: "Canon",
    category: "Cameras",
    thumbnail: "https://picsum.photos/seed/canon/200/200",
    images: ["https://picsum.photos/seed/canon/400/400"],
  },
  {
    id: 9,
    title: "AirPods Pro 2",
    description: "Wireless earbuds with active noise cancellation.",
    price: 249,
    discountPercentage: 12,
    rating: 4.7,
    stock: 180,
    brand: "Apple",
    category: "Audio",
    thumbnail: "https://picsum.photos/seed/airpods/200/200",
    images: ["https://picsum.photos/seed/airpods/400/400"],
  },
  {
    id: 10,
    title: "The Art of Coding",
    description: "A comprehensive guide to software development principles.",
    price: 45,
    discountPercentage: 0,
    rating: 4.9,
    stock: 500,
    brand: "Tech Books",
    category: "Books",
    thumbnail: "https://picsum.photos/seed/book/200/200",
    images: ["https://picsum.photos/seed/book/400/400"],
  },
];

// Global singleton to persist data across hot reloads in development
const globalForDb = global as any;
if (!globalForDb.productsStore) {
  globalForDb.productsStore = {
    products: [...initialProducts],
    nextId: initialProducts.length + 1,
  };
}
const store = globalForDb.productsStore;

const delay = (ms: number = 10) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getAllProducts(): Promise<Product[]> {
  await delay();
  return [...store.products];
}

export async function getProductById(id: number): Promise<Product | null> {
  await delay();
  const product = store.products.find((p: Product) => p.id === id);
  return product || null;
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<Product> {
  await delay();
  const newProduct: Product = {
    ...data,
    id: store.nextId++,
  };
  store.products.push(newProduct);
  return newProduct;
}

export async function updateProduct(id: number, data: Partial<Omit<Product, 'id'>>): Promise<Product | null> {
  await delay();
  const index = store.products.findIndex((p: Product) => p.id === id);
  if (index === -1) return null;
  store.products[index] = { ...store.products[index], ...data };
  return store.products[index];
}

export async function deleteProduct(id: number): Promise<boolean> {
  await delay();
  const index = store.products.findIndex((p: Product) => p.id === id);
  if (index === -1) return false;
  store.products.splice(index, 1);
  return true;
}

export async function resetDatabase(): Promise<void> {
  await delay();
  store.products = [...initialProducts];
  store.nextId = initialProducts.length + 1;
}

export async function getProductCount(): Promise<number> {
  await delay(5);
  return store.products.length;
}