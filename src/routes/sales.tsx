import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { money } from "@/lib/data";
import { FormDialog, NativeSelect, PageHeader, SearchBox, Table, td } from "@/components/kit";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales — SmartStock" },
      { name: "description", content: "Record sales orders and track revenue." },
      { property: "og:title", content: "Sales — SmartStock" },
      { property: "og:description", content: "Record sales orders and track revenue." },
    ],
  }),
  component: Sales,
});

function Sales() {
  const { db, addSale, remove } = useStore();
  const [q, setQ] = useState("");
  const [range, setRange] = useState("all");
  const [open, setOpen] = useState(false);
  const prod = (id: string) => db.products.find((p) => p.id === id);
  const cutoff = range === "all" ? "" : new Date(Date.now() - +range * 864e5).toISOString().slice(0, 10);
  const rows = db.sales.filter((s) => (s.id + s.customer + (prod(s.productId)?.name ?? "")).toLowerCase().includes(q.toLowerCase()) && s.date >= cutoff);
  const total = rows.reduce((a, s) => a + s.qty * s.price, 0);

  return (
    <div>
      <PageHeader title="Sales" subtitle={`${rows.length} orders · ${money(total)} revenue`} actions={<Button onClick={() => setOpen(true)}><Plus /> Record sale</Button>} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchBox value={q} onChange={setQ} placeholder="Search order, customer, product" />
        <NativeSelect value={range} onChange={setRange} options={[{ value: "all", label: "All time" }, { value: "7", label: "Last 7 days" }, { value: "30", label: "Last 30 days" }, { value: "90", label: "Last 90 days" }]} />
      </div>
      <Table head={["Order #", "Date", "Customer", "Product", "Qty", "Unit price", "Total", ""]} empty={!rows.length}>
        {rows.slice(0, 100).map((s) => (
          <tr key={s.id} className="hover:bg-muted/50">
            <td className={`${td} font-mono text-xs`}>{s.id}</td>
            <td className={td}>{s.date}</td>
            <td className={td}>{s.customer}</td>
            <td className={`${td} font-medium`}>{prod(s.productId)?.name ?? "Deleted product"}</td>
            <td className={`${td} font-mono`}>{s.qty}</td>
            <td className={`${td} font-mono`}>{money(s.price)}</td>
            <td className={`${td} font-mono font-semibold`}>{money(s.qty * s.price)}</td>
            <td className={`${td} text-right`}>
              <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => { if (confirm(`Delete ${s.id}?`)) { remove("sales", s.id); toast.success("Sale deleted"); } }}><Trash2 className="text-destructive" /></Button>
            </td>
          </tr>
        ))}
      </Table>
      <FormDialog open={open} onOpenChange={setOpen} title="Record sale" submitLabel="Record sale"
        fields={[
          { name: "customer", label: "Customer" },
          { name: "productId", label: "Product", type: "select", options: db.products.map((p) => ({ value: p.id, label: `${p.name} (${p.stock} left)` })) },
          { name: "qty", label: "Quantity", type: "number", min: 1, step: "1" },
          { name: "date", label: "Date", type: "date" },
        ]}
        initial={{ customer: "Walk-in Customer", qty: 1, date: new Date().toISOString().slice(0, 10) }}
        onSubmit={(v) => {
          const p = prod(v.productId); const qty = Math.round(+v.qty);
          if (qty < 1) return "Quantity must be at least 1";
          const err = addSale({ customer: v.customer, productId: v.productId, qty, price: p?.price ?? 0, date: v.date });
          if (err) return err;
          toast.success(`Sale recorded · ${money(qty * (p?.price ?? 0))}`);
        }} />
    </div>
  );
}
