export type Category = { id: string; name: string; description: string };
export type Supplier = { id: string; name: string; contact: string; email: string; phone: string; city: string };
export type Product = {
  id: string; sku: string; name: string; categoryId: string; supplierId: string;
  cost: number; price: number; stock: number; reorderLevel: number; unit: string;
};
export type Purchase = {
  id: string; date: string; supplierId: string; productId: string; qty: number; cost: number;
  status: "Pending" | "Received";
};
export type Sale = { id: string; date: string; customer: string; productId: string; qty: number; price: number };
export type Movement = { id: string; date: string; productId: string; change: number; reason: string };

export type DB = {
  categories: Category[]; suppliers: Supplier[]; products: Product[];
  purchases: Purchase[]; sales: Sale[]; movements: Movement[];
};

export const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

const categories: Category[] = [
  { id: "c1", name: "Electronics", description: "Devices, accessories and peripherals" },
  { id: "c2", name: "Office Supplies", description: "Stationery and desk essentials" },
  { id: "c3", name: "Furniture", description: "Chairs, desks and storage" },
  { id: "c4", name: "Networking", description: "Routers, cables and switches" },
  { id: "c5", name: "Cleaning", description: "Janitorial and hygiene products" },
];

const suppliers: Supplier[] = [
  { id: "s1", name: "Apex Distributors", contact: "Priya Nair", email: "priya@apexdist.com", phone: "+91 98450 12345", city: "Bengaluru" },
  { id: "s2", name: "BlueLine Traders", contact: "Marcus Lee", email: "marcus@bluelinetr.com", phone: "+1 415 555 0182", city: "San Francisco" },
  { id: "s3", name: "Northwind Supply Co.", contact: "Anna Schmidt", email: "anna@northwind.co", phone: "+49 30 5550 7721", city: "Berlin" },
  { id: "s4", name: "Coastal Office Hub", contact: "Rahul Mehta", email: "rahul@coastalhub.in", phone: "+91 99200 44110", city: "Mumbai" },
];

const p = (id: string, sku: string, name: string, categoryId: string, supplierId: string, cost: number, price: number, stock: number, reorderLevel: number, unit = "pcs"): Product =>
  ({ id, sku, name, categoryId, supplierId, cost, price, stock, reorderLevel, unit });

const products: Product[] = [
  p("p1", "EL-1001", "Wireless Mouse M220", "c1", "s2", 9.5, 19.99, 142, 30),
  p("p2", "EL-1002", "Mechanical Keyboard K8", "c1", "s2", 38, 74.99, 18, 20),
  p("p3", "EL-1003", "27\" IPS Monitor", "c1", "s1", 145, 229, 24, 10),
  p("p4", "EL-1004", "USB-C Hub 7-in-1", "c1", "s1", 14, 34.5, 6, 25),
  p("p5", "EL-1005", "Noise-Cancel Headset", "c1", "s3", 42, 89, 37, 15),
  p("p6", "OF-2001", "A4 Copy Paper (500)", "c2", "s4", 3.2, 6.5, 410, 100, "ream"),
  p("p7", "OF-2002", "Gel Pens Blue (12)", "c2", "s4", 2.1, 4.99, 85, 60, "box"),
  p("p8", "OF-2003", "Sticky Notes 3x3", "c2", "s4", 1.4, 3.25, 0, 50, "pack"),
  p("p9", "OF-2004", "Heavy Duty Stapler", "c2", "s3", 6.8, 14.99, 44, 15),
  p("p10", "FU-3001", "Ergonomic Office Chair", "c3", "s3", 118, 249, 12, 5),
  p("p11", "FU-3002", "Standing Desk 140cm", "c3", "s3", 210, 399, 3, 4),
  p("p12", "FU-3003", "Filing Cabinet 3-Drawer", "c3", "s1", 74, 139, 9, 4),
  p("p13", "NW-4001", "Cat6 Cable 10m", "c4", "s2", 3.9, 9.99, 230, 50),
  p("p14", "NW-4002", "Wi-Fi 6 Router AX3000", "c4", "s2", 68, 129, 21, 8),
  p("p15", "NW-4003", "8-Port Gigabit Switch", "c4", "s1", 22, 45, 7, 10),
  p("p16", "CL-5001", "Hand Sanitizer 500ml", "c5", "s4", 2.4, 5.5, 160, 40, "bottle"),
  p("p17", "CL-5002", "Microfiber Cloths (10)", "c5", "s4", 4.1, 8.99, 28, 30, "pack"),
  p("p18", "CL-5003", "Disinfectant Spray", "c5", "s3", 3.3, 7.25, 64, 25, "can"),
];

const customers = ["Acme Corp", "Globex Ltd", "Initech", "Umbrella Retail", "Stark Offices", "Wayne Enterprises", "Walk-in Customer", "Hooli"];

function seeded(n: number) { let s = n; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }

function genSales(): Sale[] {
  const r = seeded(42); const out: Sale[] = []; const now = new Date();
  for (let i = 0; i < 140; i++) {
    const d = new Date(now); d.setDate(d.getDate() - Math.floor(r() * 180));
    const prod = products[Math.floor(r() * products.length)];
    out.push({ id: `SO-${String(1000 + i)}`, date: d.toISOString().slice(0, 10), customer: customers[Math.floor(r() * customers.length)], productId: prod.id, qty: 1 + Math.floor(r() * 8), price: prod.price });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

function genPurchases(): Purchase[] {
  const r = seeded(7); const out: Purchase[] = []; const now = new Date();
  for (let i = 0; i < 26; i++) {
    const d = new Date(now); d.setDate(d.getDate() - Math.floor(r() * 150));
    const prod = products[Math.floor(r() * products.length)];
    out.push({ id: `PO-${String(500 + i)}`, date: d.toISOString().slice(0, 10), supplierId: prod.supplierId, productId: prod.id, qty: 10 + Math.floor(r() * 60), cost: prod.cost, status: i < 4 ? "Pending" : "Received" });
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

export function seedDB(): DB {
  const sales = genSales();
  const purchases = genPurchases();
  const movements: Movement[] = [
    ...sales.slice(0, 12).map((s) => ({ id: uid("mv"), date: s.date, productId: s.productId, change: -s.qty, reason: `Sale ${s.id}` })),
    ...purchases.filter((x) => x.status === "Received").slice(0, 8).map((x) => ({ id: uid("mv"), date: x.date, productId: x.productId, change: x.qty, reason: `Purchase ${x.id}` })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  return { categories, suppliers, products, purchases, sales, movements };
}

export const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export type StockStatus = "In stock" | "Low stock" | "Out of stock";
export const stockStatus = (p: Product): StockStatus => p.stock <= 0 ? "Out of stock" : p.stock <= p.reorderLevel ? "Low stock" : "In stock";
