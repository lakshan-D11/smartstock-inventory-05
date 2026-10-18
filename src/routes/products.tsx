import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { money, stockStatus, uid, type Product } from "@/lib/data";
import { FormDialog, NativeSelect, PageHeader, SearchBox, StatusBadge, Table, td, downloadCSV, type Field } from "@/components/kit";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products — SmartStock" },
      { name: "description", content: "Add, edit and manage your product catalogue." },
      { property: "og:title", content: "Products — SmartStock" },
      { property: "og:description", content: "Add, edit and manage your product catalogue." },
    ],
  }),
  component: Products,
});

function Products() {
  const { db, upsert, remove } = useStore();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  const catName = (id: string) => db.categories.find((c) => c.id === id)?.name ?? "—";
  const rows = useMemo(() => db.products.filter((p) =>
    (p.name + p.sku).toLowerCase().includes(q.toLowerCase()) &&
    (cat === "all" || p.categoryId === cat) &&
    (status === "all" || stockStatus(p) === status)), [db.products, q, cat, status]);

  const fields: Field[] = [
    { name: "name", label: "Product name" },
    { name: "sku", label: "SKU" },
    { name: "categoryId", label: "Category", type: "select", options: db.categories.map((c) => ({ value: c.id, label: c.name })) },
    { name: "supplierId", label: "Supplier", type: "select", options: db.suppliers.map((s) => ({ value: s.id, label: s.name })) },
    { name: "cost", label: "Cost price ($)", type: "number", min: 0 },
    { name: "price", label: "Selling price ($)", type: "number", min: 0 },
    { name: "stock", label: "Opening stock", type: "number", min: 0, step: "1" },
    { name: "reorderLevel", label: "Reorder level", type: "number", min: 0, step: "1" },
    { name: "unit", label: "Unit" },
  ];

  return (
    <div>
      <PageHeader title="Products" subtitle={`${db.products.length} products in catalogue`} actions={<>
        <Button variant="outline" onClick={() => downloadCSV("products.csv", [["SKU", "Name", "Category", "Cost", "Price", "Stock"], ...rows.map((p) => [p.sku, p.name, catName(p.categoryId), p.cost, p.price, p.stock])])}><Download /> Export</Button>
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus /> Add product</Button>
      </>} />
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <SearchBox value={q} onChange={setQ} placeholder="Search name or SKU" />
        <NativeSelect value={cat} onChange={setCat} options={[{ value: "all", label: "All categories" }, ...db.categories.map((c) => ({ value: c.id, label: c.name }))]} />
        <NativeSelect value={status} onChange={setStatus} options={["all", "In stock", "Low stock", "Out of stock"].map((s) => ({ value: s, label: s === "all" ? "All statuses" : s }))} />
      </div>
      <Table head={["SKU", "Product", "Category", "Cost", "Price", "Stock", "Status", ""]} empty={!rows.length}>
        {rows.map((p) => (
          <tr key={p.id} className="hover:bg-muted/50">
            <td className={`${td} font-mono text-xs`}>{p.sku}</td>
            <td className={`${td} font-medium`}>{p.name}</td>
            <td className={td}>{catName(p.categoryId)}</td>
            <td className={`${td} font-mono`}>{money(p.cost)}</td>
            <td className={`${td} font-mono`}>{money(p.price)}</td>
            <td className={`${td} font-mono`}>{p.stock} {p.unit}</td>
            <td className={td}><StatusBadge status={stockStatus(p)} /></td>
            <td className={`${td} text-right`}>
              <div className="flex justify-end gap-1">
                <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => { setEditing(p); setOpen(true); }}><Pencil /></Button>
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => { if (confirm(`Delete ${p.name}?`)) { remove("products", p.id); toast.success("Product deleted"); } }}><Trash2 className="text-destructive" /></Button>
              </div>
            </td>
          </tr>
        ))}
      </Table>
      <FormDialog open={open} onOpenChange={setOpen} title={editing ? "Edit product" : "Add product"} fields={fields}
        initial={editing ?? { unit: "pcs", stock: 0, reorderLevel: 10 }}
        onSubmit={(v) => {
          const price = +v.price, cost = +v.cost;
          if (price < cost) return "Selling price should not be below cost";
          if (db.products.some((p) => p.sku === v.sku && p.id !== editing?.id)) return "SKU already exists";
          upsert("products", { id: editing?.id ?? uid("p"), name: v.name, sku: v.sku, categoryId: v.categoryId, supplierId: v.supplierId, cost, price, stock: Math.max(0, Math.round(+v.stock)), reorderLevel: Math.round(+v.reorderLevel), unit: v.unit });
          toast.success(editing ? "Product updated" : "Product added");
        }} />
    </div>
  );
}
