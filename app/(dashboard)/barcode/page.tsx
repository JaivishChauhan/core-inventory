"use client";

import { useState } from "react";
import { ScanLine, Search, PackageSearch, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function BarcodeScannerPage() {
  const [sku, setSku] = useState("");

  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku) return;
    console.log("Looking up SKU / Barcode: ", sku);
    // Future logical hook-in here
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen text-white bg-black/95">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scanner Hub</h1>
          <p className="text-muted-foreground mt-1 text-sm">Scan items for receipt, lookup, or quick transfer.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4 max-w-6xl mx-auto w-full">
        
        {/* Camera Preview Fake UI */}
        <div className="glass panel rounded-2xl flex flex-col items-center justify-center p-8 border border-white/10 relative overflow-hidden min-h-[400px]">
          {/* Overlay scanning effects */}
          <div className="absolute inset-x-0 top-1/2 h-[2px] bg-red-500/50 shadow-[0_0_15px_3px_rgba(239,68,68,0.5)] animate-pulse" />
          
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 pointer-events-none" />
          
          <div className="relative z-10 w-64 h-64 border-2 border-white/20 rounded-3xl flex items-center justify-center">
            {/* Corner brackets */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />
            
            <ScanLine className="h-16 w-16 text-white/40" />
          </div>

          <div className="mt-8 relative z-10 flex flex-col items-center">
            <h3 className="text-lg font-medium">Camera Inactive</h3>
            <p className="text-sm text-gray-400">Hardware scanning pipeline coming soon.</p>
          </div>
        </div>

        {/* Manual Input Layout */}
        <div className="flex flex-col justify-center gap-6">
          <div className="glass rounded-xl p-8 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <Keyboard className="h-6 w-6 text-indigo-400" />
              <h2 className="text-2xl font-semibold">Manual Lookup</h2>
            </div>

            <form onSubmit={handleManualScan} className="flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  placeholder="Enter Barcode, SKU, or RFID tag..." 
                  className="pl-10 h-14 bg-black/40 border-white/20 text-lg rounded-xl focus-visible:ring-indigo-500"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>
              <Button type="submit" size="lg" className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-lg rounded-xl transition-all">
                <PackageSearch className="mr-2 h-5 w-5" /> Execute Lookup
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10">
              <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Recent Scans</h4>
              <div className="flex flex-col gap-2">
                {/* Dummy Recents */}
                <div className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-lg text-sm">
                  <span className="font-mono text-gray-300">SKU-9901-X</span>
                  <span className="text-gray-500 text-xs">2 mins ago</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-lg text-sm">
                  <span className="font-mono text-gray-300">WH-LOC-A14</span>
                  <span className="text-gray-500 text-xs">15 mins ago</span>
                </div>
                <div className="flex justify-between items-center py-2 px-3 bg-white/5 rounded-lg text-sm">
                  <span className="font-mono text-gray-300">BAR-88210344</span>
                  <span className="text-gray-500 text-xs">1 hour ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
