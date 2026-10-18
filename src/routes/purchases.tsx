import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, PackageCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { money } from "@/lib/data";
import { FormDialog, NativeSelect, PageHeader, SearchBox, StatusBadge, Table, td } from "@/components/kit";

export const Route = createFileRoute("/purchases")({
  head: () => ({
    meta: [
      { title: "Purchases — SmartStock" },
      { name: "description", content: "Create purchase orders and receive stock from suppliers." },
      { property: "og:title", content: "Purchases — SmartStock" },
      { property: "og:description", content: "Create purchase orders and receive stock from suppliers." },
    ],
  }),
  component: Purchases,
});

function Purchases() {
  const { db, addPurchase, receivePurchase, remove } = useStore();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const prod = (id: string) => db.products.find((p) => p.id === id);
  const sup = (id: string) => db.suppliers.find((s) => s.id === id)?.name ?? "—";
  const rows = db.purchases.filter((o) => (o.id + (prod(o.productId)?.name ?? "") + sup(o.supplierId)).toLowerCase().includes(q.toLowerCase()) && (status === "all" || o.status === status));
  const pending = db.purchases.filter((o) => o.status === "Pending");

  return (
    <div>
      <PageHeader title="Purchases" subtitle={`${pending.length} pending orders · ${money(pending.reduce((a, o) => a + o.qty * o.cost, 0))} on order`}
        actions={<Button onClick={() => setOpen(true)}><Plus /> New purchase order</Button>} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchBox value={q} onChange={setQ} placeholder="Search PO, product, supplier" />
        <NativeSelect value={status} onChange={setStatus} options={[{ value: "all", label: "All statuses" }, { value: "Pending", label: "Pending" }, { value: "Received", label: "Received" }]} />
      </div>
      <Table head={["PO #", "Date", "Supplier", "Product", "Qty", "Total", "Status", ""]} empty={!rows.length}>
        {rows.map((o) => (
          <tr key={o.id} className="hover:bg-muted/50">
            <td className={`${td} font-mono text-xs`}>{o.id}</td>
            <td className={td}>{o.date}</td>
            <td className={td}>{sup(o.supplierId)}</td>
            <td className={`${td} font-medium`}>{prod(o.productId)?.name ?? "Deleted product"}</td>
            <td className={`${td} font-mono`}>{o.qty}</td>
            <td className={`${td} font-mono`}>{money(o.qty * o.cost)}</td>
            <td className={td}><StatusBadge status={o.status} /></td>
            <td className={`${td} text-right`}>
              <div className="flex justify-end gap-1">
                {o.status === "Pending" && <Button size="sm" variant="outline" onClick={() => { receivePurchase(o.id); toast.success(`${o.qty} units added to stock`); }}><PackageCheck /> Receive</Button>}
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => { if (confirm(`Delete ${o.id}?`)) { remove("purchases", o.id); toast.success("Order deleted"); } }}><Trash2 className="text-destructive" /></Button>
              </div>
            </td>
          </tr>
        ))}
      </Table>
      <FormDialog open={open} onOpenChange={setOpen} title="New purchase order" submitLabel="Create order"
        fields={[
          { name: "productId", label: "Product", type: "select", options: db.products.map((p) => ({ value: p.id, label: p.name })) },
          { name: "supplierId", label: "Supplier", type: "select", options: db.suppliers.map((s) => ({ value: s.id, label: s.name })) },
          { name: "qty", label: "Quantity", type: "number", min: 1, step: "1" },
          { name: "cost", label: "Unit cost ($)", type: "number", min: 0 },
          { name: "date", label: "Order date", type: "date" },
          { name: "status", label: "Status", type: "select", options: [{ value: "Pending", label: "Pending" }, { value: "Received", label: "Received (add to stock)" }] },
        ]}
        initial={{ date: new Date().toISOString().slice(0, 10), qty: 10 }}
        onSubmit={(v) => {
          if (+v.qty < 1) return "Quantity must be at least 1";
          const p = prod(v.productId);
          addPurchase({ productId: v.productId, supplierId: v.supplierId, qty: Math.round(+v.qty), cost: +v.cost || p?.cost || 0, date: v.date, status: v.status as "Pending" | "Received" });
          toast.success("Purchase order created");
        }} />
    </div>
  );
}
