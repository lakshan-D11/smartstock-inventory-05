import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { money, uid, type Category } from "@/lib/data";
import { FormDialog, PageHeader, SearchBox } from "@/components/kit";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Categories — SmartStock" },
      { name: "description", content: "Organise products into categories." },
      { property: "og:title", content: "Categories — SmartStock" },
      { property: "og:description", content: "Organise products into categories." },
    ],
  }),
  component: Categories,
});

function Categories() {
  const { db, upsert, remove } = useStore();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const rows = db.categories.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title="Categories" subtitle={`${db.categories.length} categories`} actions={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus /> Add category</Button>} />
      <div className="mb-4"><SearchBox value={q} onChange={setQ} placeholder="Search categories" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((c) => {
          const items = db.products.filter((p) => p.categoryId === c.id);
          return (
            <div key={c.id} className="rounded-xl border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary"><Tags className="size-5" /></div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => { setEditing(c); setOpen(true); }}><Pencil /></Button>
                  <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => {
                    if (items.length) return toast.error("Move or delete this category's products first");
                    if (confirm(`Delete ${c.name}?`)) { remove("categories", c.id); toast.success("Category deleted"); }
                  }}><Trash2 className="text-destructive" /></Button>
                </div>
              </div>
              <h3 className="mt-3 text-lg font-bold">{c.name}</h3>
              <p className="text-sm text-muted-foreground">{c.description}</p>
              <div className="mt-4 flex justify-between border-t pt-3 text-sm">
                <span><b className="font-mono">{items.length}</b> products</span>
                <span className="font-mono">{money(items.reduce((a, p) => a + p.stock * p.cost, 0))}</span>
              </div>
            </div>
          );
        })}
      </div>
      <FormDialog open={open} onOpenChange={setOpen} title={editing ? "Edit category" : "Add category"}
        fields={[{ name: "name", label: "Name" }, { name: "description", label: "Description", required: false }]}
        initial={editing ?? {}}
        onSubmit={(v) => { upsert("categories", { id: editing?.id ?? uid("c"), name: v.name, description: v.description }); toast.success("Category saved"); }} />
    </div>
  );
}
