import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Package, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { useStore } from "@/lib/store";
import { money, stockStatus } from "@/lib/data";
import { PageHeader, Panel, StatCard, StatusBadge } from "@/components/kit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — SmartStock" },
      { name: "description", content: "Stock summary, sales trends and low-stock alerts at a glance." },
      { property: "og:title", content: "Dashboard — SmartStock" },
      { property: "og:description", content: "Stock summary, sales trends and low-stock alerts at a glance." },
    ],
  }),
  component: Dashboard,
});

export const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function monthlySales(sales: { date: string; qty: number; price: number }[], months = 6) {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = d.toISOString().slice(0, 7);
    const revenue = sales.filter((s) => s.date.startsWith(key)).reduce((a, s) => a + s.qty * s.price, 0);
    return { month: d.toLocaleString("en-US", { month: "short" }), revenue: Math.round(revenue) };
  });
}

function Dashboard() {
  const { db } = useStore();
  const stats = useMemo(() => {
    const value = db.products.reduce((a, p) => a + p.stock * p.cost, 0);
    const low = db.products.filter((p) => stockStatus(p) !== "In stock");
    const monthKey = new Date().toISOString().slice(0, 7);
    const monthRev = db.sales.filter((s) => s.date.startsWith(monthKey)).reduce((a, s) => a + s.qty * s.price, 0);
    const byCat = db.categories.map((c) => ({ name: c.name, value: Math.round(db.products.filter((p) => p.categoryId === c.id).reduce((a, p) => a + p.stock * p.cost, 0)) }));
    const units = db.products.reduce((a, p) => a + p.stock, 0);
    return { value, low, monthRev, byCat, units };
  }, [db]);
  const trend = monthlySales(db.sales);

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Welcome back — here's how your inventory is doing today." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total products" value={String(db.products.length)} hint={`${stats.units.toLocaleString()} units on hand`} icon={<Package className="size-5" />} />
        <StatCard label="Inventory value" value={money(stats.value)} hint="At cost price" icon={<DollarSign className="size-5" />} tone="success" />
        <StatCard label="Sales this month" value={money(stats.monthRev)} hint={`${db.sales.length} orders all-time`} icon={<TrendingUp className="size-5" />} />
        <StatCard label="Low / out of stock" value={String(stats.low.length)} hint="Need reordering" icon={<AlertTriangle className="size-5" />} tone={stats.low.length ? "danger" : "success"} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Revenue — last 6 months" className="xl:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={trend}>
                <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} width={50} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Stock value by category">
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={stats.byCat} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                  {stats.byCat.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % 5]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => money(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 text-xs">
            {stats.byCat.map((c, i) => <span key={c.name} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: CHART_COLORS[i % 5] }} />{c.name}</span>)}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Stock levels" >
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={db.products.slice(0, 10).map((p) => ({ name: p.sku, stock: p.stock, reorder: p.reorderLevel }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" fontSize={11} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis fontSize={12} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={40} />
                <Tooltip />
                <Bar dataKey="stock" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reorder" fill="var(--chart-4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Needs attention" action={<Link to="/alerts" className="text-sm font-semibold text-primary">View all</Link>}>
          <ul className="divide-y">
            {stats.low.slice(0, 6).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{p.sku} · {p.stock} / reorder at {p.reorderLevel}</p>
                </div>
                <StatusBadge status={stockStatus(p)} />
              </li>
            ))}
            {!stats.low.length && <li className="py-6 text-center text-sm text-muted-foreground">All products are well stocked.</li>}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
