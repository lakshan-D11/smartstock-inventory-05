import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { uid, type Supplier } from "@/lib/data";
import { FormDialog, PageHeader, SearchBox, Table, td } from "@/components/kit";

export const Route = createFileRoute("/suppliers")({
  head: () => ({
    meta: [
      { title: "Suppliers — SmartStock" },
      { name: "description", content: "Manage supplier contacts and sourcing." },
      { property: "og:title", content: "Suppliers — SmartStock" },
      { property: "og:description", content: "Manage supplier contacts and sourcing." },
    ],
  }),
  component: Suppliers,
});

function Suppliers() {
  const { db, upsert, remove } = useStore();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [open, setOpen] = useState(false);
  const rows = db.suppliers.filter((s) => (s.name + s.contact + s.city).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title="Suppliers" subtitle={`${db.suppliers.length} active suppliers`} actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus /> Add supplier</Button>} />
      <div className="mb-4"><SearchBox value={q} onChange={setQ} placeholder="Search name, contact, city" /></div>
      <Table head={["Supplier", "Contact", "Email", "Phone", "City", "Products", ""]} empty={!rows.length}>
        {rows.map((s) => (
          <tr key={s.id} className="hover:bg-muted/50">
            <td className={`${td} font-medium`}>{s.name}</td>
            <td className={td}>{s.contact}</td>
            <td className={td}><a className="text-primary" href={`mailto:${s.email}`}>{s.email}</a></td>
            <td className={`${td} font-mono text-xs`}>{s.phone}</td>
            <td className={td}>{s.city}</td>
            <td className={`${td} font-mono`}>{db.products.filter((p) => p.supplierId === s.id).length}</td>
            <td className={`${td} text-right`}>
              <div className="flex justify-end gap-1">
                <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => { setEditing(s); setOpen(true); }}><Pencil /></Button>
                <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => { if (confirm(`Delete ${s.name}?`)) { remove("suppliers", s.id); toast.success("Supplier deleted"); } }}><Trash2 className="text-destructive" /></Button>
              </div>
            </td>
          </tr>
        ))}
      </Table>
      <FormDialog open={open} onOpenChange={setOpen} title={editing ? "Edit supplier" : "Add supplier"}
        fields={[{ name: "name", label: "Company" }, { name: "contact", label: "Contact person" }, { name: "email", label: "Email", type: "email" }, { name: "phone", label: "Phone" }, { name: "city", label: "City" }]}
        initial={editing ?? {}}
        onSubmit={(v) => { upsert("suppliers", { id: editing?.id ?? uid("s"), name: v.name, contact: v.contact, email: v.email, phone: v.phone, city: v.city }); toast.success("Supplier saved"); }} />
    </div>
  );
}
