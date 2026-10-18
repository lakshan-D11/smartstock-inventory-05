import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard, Package, Boxes, Tags, Truck, ShoppingCart, Receipt, BellRing, BarChart3, Menu, X, RotateCcw,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Products", icon: Package },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/purchases", label: "Purchases", icon: ShoppingCart },
  { to: "/sales", label: "Sales", icon: Receipt },
  { to: "/alerts", label: "Low-Stock Alerts", icon: BellRing },
  { to: "/reports", label: "Reports", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { db, reset } = useStore();
  const alerts = db.products.filter((p) => p.stock <= p.reorderLevel).length;

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="grid size-9 place-items-center rounded-lg bg-brand-gradient text-primary-foreground">
          <Boxes className="size-5" />
        </div>
        <div>
          <div className="text-lg font-extrabold tracking-tight text-sidebar-accent-foreground">SmartStock</div>
          <div className="text-xs opacity-70">Inventory Suite</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {nav.map((n) => {
          const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
              className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
              <n.icon className="size-4" />
              <span className="flex-1">{n.label}</span>
              {n.to === "/alerts" && alerts > 0 && (
                <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">{alerts}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-4">
        <button onClick={() => { reset(); toast.success("Sample data restored"); }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-xs hover:bg-sidebar-accent">
          <RotateCcw className="size-3.5" /> Reset sample data
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72">{sidebar}
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-6 text-sidebar-foreground"><X /></button>
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
          <button aria-label="Open menu" onClick={() => setOpen(true)}><Menu /></button>
          <span className="font-extrabold text-primary">SmartStock</span>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
