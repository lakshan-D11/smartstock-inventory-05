import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { stockStatus } from "@/lib/data";
import { PageHeader, StatusBadge } from "@/components/kit";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Low-Stock Alerts — SmartStock" },
      { name: "description", content: "Products at or below their reorder level, with one-click reorder." },
      { property: "og:title", content: "Low-Stock Alerts — SmartStock" },
      { property: "og:description", content: "Products at or below their reorder level." },
    ],
  }),
  component: Alerts,
});

function Alerts() {
  const { db, addPurchase } = useStore();
  const low = db.products.filter((p) => p.stock <= p.reorderLevel).sort((a, b) => a.stock / Math.max(1, a.reorderLevel) - b.stock / Math.max(1, b.reorderLevel));
  const hasPending = (id: string) => db.purchases.some((o) => o.productId === id && o.status === "Pending");

  const reorder = (id: string) => {
    const p = db.products.find((x) => x.id === id)!;
    const qty = Math.max(p.reorderLevel * 3 - p.stock, 1);
    addPurchase({ productId: p.id, supplierId: p.supplierId, qty, cost: p.cost, date: new Date().toISOString().slice(0, 10), status: "Pending" });
    toast.success(`Purchase order for ${qty} × ${p.name} created`);
  };

  return (
    <div>
      <PageHeader title="Low-stock alerts" subtitle={`${low.length} products at or below reorder level`}
        actions={low.length > 0 && <Button onClick={() => { low.filter((p) => !hasPending(p.id)).forEach((p) => reorder(p.id)); }}><ShoppingCart /> Reorder all</Button>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {low.map((p) => (
          <div key={p.id} className="rounded-xl border bg-card p-5 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="grid size-10 place-items-center rounded-lg bg-danger-soft text-destructive"><AlertTriangle className="size-5" /></div>
              <StatusBadge status={stockStatus(p)} />
            </div>
            <h3 className="mt-3 font-bold">{p.name}</h3>
            <p className="font-mono text-xs text-muted-foreground">{p.sku} · {db.suppliers.find((s) => s.id === p.supplierId)?.name}</p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-muted p-2"><p className="text-xs text-muted-foreground">On hand</p><p className="font-mono font-bold">{p.stock}</p></div>
              <div className="rounded-lg bg-muted p-2"><p className="text-xs text-muted-foreground">Reorder at</p><p className="font-mono font-bold">{p.reorderLevel}</p></div>
            </div>
            <Button className="mt-4 w-full" variant={hasPending(p.id) ? "outline" : "default"} disabled={hasPending(p.id)} onClick={() => reorder(p.id)}>
              {hasPending(p.id) ? "Order pending" : "Create reorder"}
            </Button>
          </div>
        ))}
        {!low.length && <p className="text-muted-foreground">Everything is well stocked. 🎉</p>}
      </div>
    </div>
  );
}
