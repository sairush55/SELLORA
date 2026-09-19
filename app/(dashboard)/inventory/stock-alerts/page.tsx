"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, AlertOctagon, RotateCw, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useShop } from "@/hooks/useShop";
import { useDataRefresh } from "@/hooks/useDataRefresh";
import { stockIntelligenceService } from "@/services/stockIntelligenceService";

export default function StockAlertsPage() {
  const { shop } = useShop();
  const shopId = shop?.id || "shop-1";
  const { refreshTick } = useDataRefresh();

  const recommendations = useMemo(() => {
    return stockIntelligenceService.getRecommendations(shopId);
  }, [shopId, refreshTick]);

  const alerts = useMemo(() => {
    const list: Array<{
      id: string;
      product: string;
      sku: string;
      category: string;
      type: "critical" | "warning" | "deadstock";
      message: string;
      action: string;
      link: string;
    }> = [];

    recommendations.forEach((r) => {
      if (r.stockStatus === "OUT_OF_STOCK" || r.stockStatus === "CRITICAL") {
        list.push({
          id: `crit-${r.productId}`,
          product: r.productName,
          sku: r.sku,
          category: r.category,
          type: "critical",
          message:
            r.stockStatus === "OUT_OF_STOCK"
              ? `Immediate stockout: 0 ${r.unit} remain in inventory. Customer requests will be dropped.`
              : `Critical stockout risk: Only ${r.currentStock} ${r.unit} remain (${r.daysRemaining} days supply). Delivery requires ${r.supplierLeadTime} days.`,
          action: `Reorder ${r.recommendedQuantity} ${r.unit}`,
          link: "/inventory/reorders",
        });
      } else if (r.stockStatus === "LOW") {
        list.push({
          id: `low-${r.productId}`,
          product: r.productName,
          sku: r.sku,
          category: r.category,
          type: "warning",
          message: `Approaching threshold: ${r.currentStock} ${r.unit} remain (Reorder trigger: ${r.reorderPoint} ${r.unit}). Daily demand: ${r.demand.avgDailyDemand} ${r.unit}/day.`,
          action: `Queue ${r.recommendedQuantity} ${r.unit}`,
          link: "/inventory/reorders",
        });
      } else if (r.stockStatus === "OVERSTOCK") {
        list.push({
          id: `over-${r.productId}`,
          product: r.productName,
          sku: r.sku,
          category: r.category,
          type: "deadstock",
          message: `Overstock alert: ${r.currentStock} ${r.unit} held (${r.daysRemaining} days supply). Capital locked: ₹${Math.round(r.currentStock * (r.costPrice || 0)).toLocaleString("en-IN")}.`,
          action: "Review Stock",
          link: "/inventory/products",
        });
      }
    });

    return list;
  }, [recommendations]);

  const criticalCount = alerts.filter((a) => a.type === "critical").length;
  const warningCount = alerts.filter((a) => a.type === "warning").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/80">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Stock Alerts
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Products that need your attention — low stock, out of stock, or overstocked
          </p>
        </div>

        <Link href="/inventory/reorders">
          <Button variant="primary" size="sm" className="text-xs">
            <RotateCw className="w-3.5 h-3.5 mr-1.5" />
            View Reorder List
          </Button>
        </Link>
      </div>

      {alerts.length === 0 ? (
        <Card className="p-8 text-center bg-white border-zinc-200">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900">All stock levels look good!</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
            Every product has enough stock. You will see alerts here when items run low or need reordering.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className={`p-4 transition-colors ${
                alert.type === "critical"
                  ? "border-red-200/80 bg-red-50/20"
                  : alert.type === "warning"
                  ? "border-amber-200/80 bg-amber-50/20"
                  : "border-blue-200/80 bg-blue-50/20"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {alert.type === "critical" && (
                      <AlertOctagon className="w-5 h-5 text-red-600 shrink-0" />
                    )}
                    {alert.type === "warning" && (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    )}
                    {alert.type === "deadstock" && (
                      <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-zinc-900">{alert.product}</h3>
                      <span className="text-[10px] font-mono text-zinc-400">({alert.sku})</span>
                      <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
                        {alert.category}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600">{alert.message}</p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <Link href={alert.link}>
                    <Button
                      variant={alert.type === "critical" ? "danger" : "secondary"}
                      size="sm"
                      className="text-xs"
                    >
                      {alert.action}
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
