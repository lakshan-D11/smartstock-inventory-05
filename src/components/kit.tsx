import { useEffect, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { StockStatus } from "@/lib/data";

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ children, className, title, action }: { children: ReactNode; className?: string; title?: string; action?: ReactNode }) {
  return (
    <section className={cn("rounded-xl border bg-card p-5 shadow-card", className)}>
      {title && <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">{title}</h2>{action}</div>}
      {children}
    </section>
  );
}

export function StatCard({ label, value, hint, icon, tone = "primary" }: { label: string; value: string; hint?: string; icon: ReactNode; tone?: "primary" | "success" | "warning" | "danger" }) {
  const tones = { primary: "bg-primary-soft text-primary", success: "bg-success-soft text-success", warning: "bg-warning-soft text-warning", danger: "bg-danger-soft text-destructive" };
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-mono text-2xl font-bold">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div className={cn("grid size-10 place-items-center rounded-lg", tones[tone])}>{icon}</div>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: StockStatus | "Pending" | "Received" }) {
  const map: Record<string, string> = {
    "In stock": "bg-success-soft text-success", Received: "bg-success-soft text-success",
    "Low stock": "bg-warning-soft text-warning", Pending: "bg-primary-soft text-primary",
    "Out of stock": "bg-danger-soft text-destructive",
  };
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", map[status])}>{status}</span>;
}

export function SearchBox({ value, onChange, placeholder = "Search..." }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="bg-card pl-9" />
    </div>
  );
}

export function NativeSelect({ value, onChange, options, className }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; className?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className={cn("h-9 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring", className)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export type Field = { name: string; label: string; type?: "text" | "number" | "email" | "date" | "select"; options?: { value: string; label: string }[]; required?: boolean; min?: number; step?: string };

export function FormDialog({ open, onOpenChange, title, fields, initial, onSubmit, submitLabel = "Save" }: {
  open: boolean; onOpenChange: (o: boolean) => void; title: string; fields: Field[];
  initial: Record<string, string | number>; onSubmit: (v: Record<string, string>) => string | void; submitLabel?: string;
}) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [err, setErr] = useState("");
  useEffect(() => {
    if (open) { setVals(Object.fromEntries(fields.map((f) => [f.name, String(initial[f.name] ?? f.options?.[0]?.value ?? "")]))); setErr(""); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => {
          e.preventDefault();
          const missing = fields.find((f) => f.required !== false && !vals[f.name]?.trim());
          if (missing) return setErr(`${missing.label} is required`);
          const r = onSubmit(vals); if (r) setErr(r); else onOpenChange(false);
        }}>
          {fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={f.name}>{f.label}</Label>
              {f.type === "select" ? (
                <NativeSelect className="w-full" value={vals[f.name] ?? ""} onChange={(v) => setVals({ ...vals, [f.name]: v })} options={f.options ?? []} />
              ) : (
                <Input id={f.name} type={f.type ?? "text"} min={f.min} step={f.step ?? (f.type === "number" ? "any" : undefined)}
                  value={vals[f.name] ?? ""} onChange={(e) => setVals({ ...vals, [f.name]: e.target.value })} />
              )}
            </div>
          ))}
          {err && <p className="text-sm font-medium text-destructive sm:col-span-2">{err}</p>}
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>{head.map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
      {empty && <p className="p-8 text-center text-sm text-muted-foreground">No records match your filters.</p>}
    </div>
  );
}

export const td = "px-4 py-3";

export function downloadCSV(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = name; a.click();
}
