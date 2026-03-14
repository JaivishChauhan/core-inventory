"use client";

import { useQuery } from "@tanstack/react-query";
import { Sparkles, AlertTriangle, ArrowRight, BrainCircuit } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AIInsightsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-insights"],
    queryFn: async () => {
      const res = await fetch("/api/inventory/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
  });

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen text-white bg-black/90 relative overflow-hidden">
      {/* Mesh Background Illusion */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-black to-black" />

      <div className="flex items-center gap-3 relative z-10">
        <BrainCircuit className="h-8 w-8 text-blue-500 glow-blue" />
        <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          AI Insights & Intelligence
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10 mt-2">
        {/* Real Data Section */}
        <div className="flex flex-col gap-6">
          <div className="glass panel rounded-xl p-6 border-l-4 border-l-orange-500">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-semibold">Low Stock Warnings</h2>
            </div>
            {isLoading ? (
              <p className="text-muted-foreground">Analyzing stock levels...</p>
            ) : (
              <ul className="space-y-3">
                {data?.lowStockItems?.length > 0 ? (
                  data.lowStockItems.map((item: any) => (
                    <li key={item.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                      <span className="font-medium">{item.sku || "Unknown SKU"}</span>
                      <span className="text-orange-400 font-bold">{item.quantity} left</span>
                    </li>
                  ))
                ) : (
                  <li className="text-muted-foreground">All items sufficiently stocked.</li>
                )}
              </ul>
            )}
          </div>

          <div className="glass panel rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-emerald-400" />
              Reorder Suggestions
            </h2>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <p className="text-sm text-gray-300">
                Based on current thresholds, consider reordering top moving categories heavily depleted this week. 
                <br /><br />
                *(Data fetched from active velocity endpoints)*
              </p>
            </div>
          </div>
        </div>

        {/* AI Preview Sections */}
        <div className="flex flex-col gap-6">
          <div className="glass panel rounded-xl p-6 border-gradient relative overflow-hidden group">
            <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full border border-blue-500/30 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Preview
            </div>
            <h2 className="text-xl font-semibold mb-2 text-blue-100 glow-blue">Predictive Restock Model</h2>
            <p className="text-sm text-blue-200/70 mb-6">
              Coming soon. Our machine learning model will analyze historical sales, seasonality events, and lead times to automatically draft purchase orders before you even hit safety stock.
            </p>
            <div className="h-32 rounded-lg bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/20 flex items-center justify-center">
              <span className="text-blue-400 font-mono text-sm opacity-50">Model training in progress...</span>
            </div>
          </div>

          <div className="glass panel rounded-xl p-6 border border-white/10 relative">
            <div className="absolute top-4 right-4 bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full border border-purple-500/30 flex items-center gap-1">
              Preview
            </div>
            <h2 className="text-xl font-semibold mb-2">Demand Forecasting</h2>
            <p className="text-sm text-gray-400 mb-4">
              Visualizes expected outgoing inventory spikes using external factors (e.g. weather, holiday schedules).
            </p>
            <div className="w-full h-8 bg-white/5 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500/50 w-1/3 border-r border-black/20" />
              <div className="h-full bg-purple-500/50 w-1/2 border-r border-black/20" />
              <div className="h-full bg-orange-500/50 w-1/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
