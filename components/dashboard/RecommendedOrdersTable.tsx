"use client";

import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { useShop } from "@/hooks/useShop";
import { stockIntelligenceService } from "@/services/stockIntelligenceService";
import { formatINR } from "@/lib/utils";
import { Button } from "../ui/Button";
import { RotateCw, AlertTriangle, ArrowRight, Check, ShoppingBag } from "lucide-react";
import Link from "next/link";

export function RecommendedOrdersTable() {
  const { shop } = useShop();
  const shopId = shop?.id || "shop-1";

  const recommendations = useMemo(() => {
    return stockIntelligenceService.getRecommendations(shopId);
  }, [shopId]);

  const [orderedIds, setOrderedIds] = useState<string[]>([]);

  const handleOrder = (id: string) => {
    setOrderedIds((prev) => [...prev, id]);
  };

  const actionableOrders = recommendations.filter(
    (o) => o.priority === "ORDER_NOW" || o.priority === "ORDER_SOON"
  );
  const displayOrders = actionableOrders.length > 0 ? actionableOrders.slice(0, 5) : recommendations.slice(0, 5);
  const totalReorderValue = actionableOrders.reduce((acc, o) => acc + o.estimatedCost, 0);
  const criticalCount = recommendations.filter((o) => o.stockStatus === "CRITICAL" || o.stockStatus === "OUT_OF_STOCK").length;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Recommended Orders (Stock Intelligence)</CardTitle>
            {criticalCount > 0 && (
              <span className="text-[10px] font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                {criticalCount} Critical
              </span>
            )}
          </div>
          <CardDescription>
            Algorithmic replenishment calculated from sales run-rate & supplier lead-times
          </CardDescription>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-zinc-400 block">Est. Procurement</span>
            <span className="text-xs font-mono font-bold text-zinc-900">
              {formatINR(totalReorderValue)}
            </span>
          </div>
          <Link href="/inventory/reorders">
            <Button variant="outline" size="sm" className="text-xs">
              View All Queue ({actionableOrders.length})
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200/80 text-[11px] uppercase font-semibold text-zinc-500 font-mono">
              <tr>
                <th className="py-2.5 px-4">Item & SKU</th>
                <th className="py-2.5 px-4">Supplier</th>
                <th className="py-2.5 px-3 text-center">Stock / ROP</th>
                <th className="py-2.5 px-3 text-center">Suggested Qty</th>
                <th className="py-2.5 px-4 text-right">Est. Cost</th>
                <th className="py-2.5 px-3 text-center">Priority</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {displayOrders.map((order) => {
                const isOrdered = orderedIds.includes(order.productId);

                return (
                  <tr key={order.productId} className="hover:bg-zinc-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-900 truncate max-w-[220px]">
                        {order.productName}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">
                        {order.sku} • {order.category}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-zinc-600 truncate max-w-[160px]">
                      {order.supplierName}
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      <span className={`font-bold ${order.currentStock <= order.reorderPoint ? "text-red-600" : "text-zinc-800"}`}>
                        {order.currentStock}
                      </span>
                      <span className="text-zinc-400"> / </span>
                      <span className="text-zinc-500">{order.reorderPoint}</span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono">
                      {order.recommendedQuantity > 0 ? (
                        <span className="font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/60">
                          +{order.recommendedQuantity} {order.unit}
                        </span>
                      ) : (
                        <span className="text-zinc-400">0 (Healthy)</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-medium text-zinc-800">
                      {formatINR(order.estimatedCost)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          order.priority === "ORDER_NOW"
                            ? "text-red-700 bg-red-50 border border-red-200"
                            : order.priority === "ORDER_SOON"
                            ? "text-amber-700 bg-amber-50 border border-amber-200"
                            : "text-zinc-600 bg-zinc-100"
                        }`}
                      >
                        {order.priority.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant={isOrdered ? "outline" : order.priority === "ORDER_NOW" ? "primary" : "outline"}
                        size="sm"
                        disabled={isOrdered || order.recommendedQuantity === 0}
                        onClick={() => handleOrder(order.productId)}
                        className={`text-xs h-7 px-2.5 font-medium ${
                          isOrdered ? "text-emerald-700 border-emerald-300 bg-emerald-50" : ""
                        }`}
                      >
                        {isOrdered ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Drafted
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3 h-3 mr-1" />
                            Order
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
