import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Download } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { money } from "@/lib/data";
import { PageHeader, Panel, StatCard, Table, td, downloadCSV } from "@/components/kit";
import { monthlySales } from "./index";
import { DollarSign, TrendingUp, Percent, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — SmartStock" },
      { name: "description", content: "Revenue, profit, top products and category performance reports." },
      { property: "og:title", content: "Reports — SmartStock" },
      { property: "og:description", content: "Revenue, profit, top products and category performance." },
    ],
  }),
  component: Reports,
});

function Reports() {
  const { db } = useStore();
  const r = useMemo(() => {
    const prod = (id: string) => db.products.find((p) => p.id === id);
    const revenue = db.sales.reduce((a, s) => a + s.qty * s.price, 0);
    const cogs = db.sales.reduce((a, s) => a + s.qty * (prod(s.productId)?.cost ?? 0), 0);
    const spend = db.purchases.filter((o) => o.status === "Received").reduce((a, o) => a + o.qty * o.cost, 0);
    const top = db.products.map((p) => {
      const ss = db.sales.filter((s) => s.productId === p.id);
      return { name: p.name, sku: p.sku, units: ss.reduce((a, s) => a + s.qty, 0), revenue: ss.reduce((a, s) => a + s.qty * s.price, 0), profit: ss.reduce((a, s) => a + s.qty * (s.price - p.cost), 0) };
    }).sort((a, b) => b.revenue - a.revenue);
    const byCat = db.categories.map((c) => ({ name: c.name, revenue: Math.round(top.filter((t) => db.products.find((p) => p.sku === t.sku)?.categoryId === c.id).reduce((a, t) => a + t.revenue, 0)) }));
    return { revenue, profit: revenue - cogs, spend, top, byCat };
  }, [db]);

  return (
    <div>
      <PageHeader title="Reports" subtitle="Performance across sales, purchasing and inventory."
        actions={<Button variant="outline" onClick={() => downloadCSV("sales-report.csv", [["SKU", "Product", "Units", "Revenue", "Profit"], ...r.top.map((t) => [t.sku, t.name, t.units, t.revenue.toFixed(2), t.profit.toFixed(2)])])}><Download /> Export CSV</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" value={money(r.revenue)} icon={<DollarSign className="size-5" />} />
        <StatCard label="Gross profit" value={money(r.profit)} icon={<TrendingUp className="size-5" />} tone="success" />
        <StatCard label="Margin" value={`${r.revenue ? ((r.profit / r.revenue) * 100).toFixed(1) : 0}%`} icon={<Percent className="size-5" />} />
        <StatCard label="Purchase spend" value={money(r.spend)} icon={<ShoppingCart className="size-5" />} tone="warning" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Panel title="Monthly revenue">
          <div className="h-72"><ResponsiveContainer>
            <LineChart data={monthlySales(db.sales, 6)}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" fontSize={12} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <YAxis fontSize={12} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={50} />
              <Tooltip formatter={(v: number) => money(v)} />
              <Line type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer></div>
        </Panel>
        <Panel title="Revenue by category">
          <div className="h-72"><ResponsiveContainer>
            <BarChart data={r.byCat} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" fontSize={12} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" fontSize={12} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={100} />
              <Tooltip formatter={(v: number) => money(v)} />
              <Bar dataKey="revenue" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer></div>
        </Panel>
      </div>
      <h2 className="mb-3 mt-8 font-bold">Top products</h2>
      <Table head={["#", "Product", "Units sold", "Revenue", "Profit"]}>
        {r.top.slice(0, 10).map((t, i) => (
          <tr key={t.sku} className="hover:bg-muted/50">
            <td className={`${td} font-mono`}>{i + 1}</td>
            <td className={td}><p className="font-medium">{t.name}</p><p className="font-mono text-xs text-muted-foreground">{t.sku}</p></td>
            <td className={`${td} font-mono`}>{t.units}</td>
            <td className={`${td} font-mono`}>{money(t.revenue)}</td>
            <td className={`${td} font-mono text-success`}>{money(t.profit)}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
