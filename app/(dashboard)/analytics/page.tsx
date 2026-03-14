"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, TrendingUp, Package, Activity, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["kpis"],
    queryFn: async () => {
      const res = await fetch("/api/inventory/kpis");
      if (!res.ok) throw new Error("Failed to fetch KPIs");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-white min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-4" />
        <span className="text-xl">Loading Analytics...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 glass p-4 rounded-xl">Error loading analytics.</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen text-white bg-black/90">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Analytics & Trends</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="glass panel rounded-xl p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-semibold text-sm uppercase translate-y-1">Total Stock Value</span>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="kpi-number text-4xl font-black mt-2">
            ${data?.totalValue?.toLocaleString() || "0.00"}
          </div>
        </div>

        {/* Metric 2 */}
        <div className="glass panel rounded-xl p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-semibold text-sm uppercase translate-y-1">Active SKUs</span>
            <Package className="h-5 w-5 text-blue-400" />
          </div>
          <div className="kpi-number text-4xl font-black mt-2">
            {data?.totalProducts || 0}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="glass panel rounded-xl p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-semibold text-sm uppercase translate-y-1">Monthly Movements</span>
            <Activity className="h-5 w-5 text-purple-400" />
          </div>
          <div className="kpi-number text-4xl font-black mt-2">
            {data?.monthlyMovements || "N/A"}
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass panel rounded-xl p-6 flex flex-col gap-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-semibold text-sm uppercase translate-y-1">Avg. Turnover</span>
            <BarChart3 className="h-5 w-5 text-orange-400" />
          </div>
          <div className="kpi-number text-4xl font-black mt-2">
            {data?.turnoverRate || "N/A"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        <div className="glass panel rounded-xl p-6 min-h-[300px] flex flex-col">
          <h3 className="text-xl font-semibold mb-4 text-white/90">Category Mix</h3>
          <div className="flex-1 flex items-center justify-center border border-white/10 rounded-lg bg-black/20">
            <span className="text-muted-foreground">Chart Visualization Area</span>
          </div>
        </div>

        <div className="glass panel rounded-xl p-6 min-h-[300px] flex flex-col">
          <h3 className="text-xl font-semibold mb-4 text-white/90">Operational Velocity</h3>
          <div className="flex-1 flex items-center justify-center border border-white/10 rounded-lg bg-black/20">
            <span className="text-muted-foreground">Historical Trend Area</span>
          </div>
        </div>
      </div>
    </div>
  );
}
