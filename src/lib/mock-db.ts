interface Product {
  id: number;
  name: string;
  price: number;
  createdAt: string;
}

let products: Product[] = [];
let nextId = 1;


const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const db = {
  getAll: async (): Promise<Product[]> => {
    await delay(200);
    return [...products];
  },

  getById: async (id: number): Promise<Product | undefined> => {
    await delay(200);
    return products.find(p => p.id === id);
  },

  create: async (data: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
    await delay(150);
    const newProduct = {
      id: nextId++,
      ...data,
      createdAt: new Date().toISOString(),
    };
    products.push(newProduct);
    return newProduct;
  },

  update: async (id: number, data: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product | null> => {
    await delay(150);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;
    products[index] = { ...products[index], ...data };
    return products[index];
  },

  delete: async (id: number): Promise<boolean> => {
    await delay(150);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;
    products.splice(index, 1);
    return true;
  },

  reset: () => {
    products = [];
    nextId = 1;
  },

  count: () => products.length,
};