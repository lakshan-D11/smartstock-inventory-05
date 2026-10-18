import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { stockStatus } from "@/lib/data";
import { FormDialog, PageHeader, Panel, SearchBox, StatusBadge, Table, td } from "@/components/kit";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/inventory")({
  head: () => ({
    meta: [
      { title: "Inventory Tracking — SmartStock" },
      { name: "description", content: "Track stock levels, adjust quantities and review stock movements." },
      { property: "og:title", content: "Inventory Tracking — SmartStock" },
      { property: "og:description", content: "Track stock levels, adjust quantities and review stock movements." },
    ],
  }),
  component: Inventory,
});

function Inventory() {
  const { db, adjustStock } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const name = (id: string) => db.products.find((p) => p.id === id)?.name ?? "Deleted product";
  const rows = db.products.filter((p) => (p.name + p.sku).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title="Inventory tracking" subtitle="Live stock levels and every movement in and out."
        actions={<Button onClick={() => setOpen(true)}><SlidersHorizontal /> Adjust stock</Button>} />
      <div className="mb-4"><SearchBox value={q} onChange={setQ} placeholder="Search products" /></div>
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Table head={["Product", "On hand", "Level", "Status"]} empty={!rows.length}>
            {rows.map((p) => {
              const pct = Math.min(100, (p.stock / Math.max(1, p.reorderLevel * 3)) * 100);
              return (
                <tr key={p.id} className="hover:bg-muted/50">
                  <td className={td}><p className="font-medium">{p.name}</p><p className="font-mono text-xs text-muted-foreground">{p.sku}</p></td>
                  <td className={`${td} font-mono`}>{p.stock} {p.unit}</td>
                  <td className={`${td} w-40`}><Progress value={pct} /></td>
                  <td className={td}><StatusBadge status={stockStatus(p)} /></td>
                </tr>
              );
            })}
          </Table>
        </div>
        <Panel title="Recent movements">
          <ul className="max-h-[560px] divide-y overflow-y-auto">
            {db.movements.slice(0, 30).map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <div className="min-w-0"><p className="truncate font-medium">{name(m.productId)}</p><p className="text-xs text-muted-foreground">{m.reason} · {m.date}</p></div>
                <span className={`font-mono font-bold ${m.change > 0 ? "text-success" : "text-destructive"}`}>{m.change > 0 ? "+" : ""}{m.change}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <FormDialog open={open} onOpenChange={setOpen} title="Adjust stock" submitLabel="Apply adjustment"
        fields={[
          { name: "productId", label: "Product", type: "select", options: db.products.map((p) => ({ value: p.id, label: `${p.name} (${p.stock})` })) },
          { name: "change", label: "Change (+/-)", type: "number", step: "1" },
          { name: "reason", label: "Reason" },
        ]}
        initial={{ reason: "Stock count correction" }}
        onSubmit={(v) => {
          const c = Math.round(+v.change);
          if (!c) return "Enter a non-zero change";
          adjustStock(v.productId, c, v.reason);
          toast.success("Stock adjusted");
        }} />
    </div>
  );
}
