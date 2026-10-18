import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { seedDB, uid, type DB, type Purchase, type Sale } from "./data";

const KEY = "smartstock-db-v1";
type Coll = keyof DB;

type Store = {
  db: DB;
  upsert: <K extends Coll>(k: K, item: DB[K][number]) => void;
  remove: (k: Coll, id: string) => void;
  adjustStock: (productId: string, change: number, reason: string) => void;
  addSale: (s: Omit<Sale, "id">) => string | null;
  addPurchase: (p: Omit<Purchase, "id">) => void;
  receivePurchase: (id: string) => void;
  reset: () => void;
};

const Ctx = createContext<Store | null>(null);
const today = () => new Date().toISOString().slice(0, 10);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(seedDB);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setDb(JSON.parse(raw)); } catch { /* ignore */ }
    setReady(true);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(db)); }, [db, ready]);

  const applyStock = (d: DB, productId: string, change: number, reason: string): DB => ({
    ...d,
    products: d.products.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, p.stock + change) } : p)),
    movements: [{ id: uid("mv"), date: today(), productId, change, reason }, ...d.movements],
  });

  const store: Store = {
    db,
    upsert: (k, item) => setDb((d) => {
      const list = d[k] as { id: string }[];
      const exists = list.some((x) => x.id === (item as { id: string }).id);
      return { ...d, [k]: exists ? list.map((x) => (x.id === (item as { id: string }).id ? item : x)) : [item, ...list] };
    }),
    remove: (k, id) => setDb((d) => ({ ...d, [k]: (d[k] as { id: string }[]).filter((x) => x.id !== id) })),
    adjustStock: (pid, change, reason) => setDb((d) => applyStock(d, pid, change, reason)),
    addSale: (s) => {
      const prod = db.products.find((p) => p.id === s.productId);
      if (!prod) return "Product not found";
      if (prod.stock < s.qty) return `Only ${prod.stock} in stock`;
      const id = `SO-${Date.now().toString().slice(-6)}`;
      setDb((d) => { const n = applyStock(d, s.productId, -s.qty, `Sale ${id}`); return { ...n, sales: [{ ...s, id }, ...n.sales] }; });
      return null;
    },
    addPurchase: (p) => {
      const id = `PO-${Date.now().toString().slice(-6)}`;
      setDb((d) => {
        const withPo = { ...d, purchases: [{ ...p, id }, ...d.purchases] };
        return p.status === "Received" ? applyStock(withPo, p.productId, p.qty, `Purchase ${id}`) : withPo;
      });
    },
    receivePurchase: (id) => setDb((d) => {
      const po = d.purchases.find((x) => x.id === id);
      if (!po || po.status === "Received") return d;
      const n = applyStock(d, po.productId, po.qty, `Purchase ${id}`);
      return { ...n, purchases: n.purchases.map((x) => (x.id === id ? { ...x, status: "Received" } : x)) };
    }),
    reset: () => setDb(seedDB()),
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}
