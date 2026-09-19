"use client";

import React from "react";
import { InventoryMovement } from "@/types/inventory";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import { X, History, ArrowDownRight, ArrowUpRight, Sliders, PackageCheck } from "lucide-react";

interface MovementHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  movements: InventoryMovement[];
}

export function MovementHistoryModal({
  isOpen,
  onClose,
  movements,
}: MovementHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <Card className="max-w-3xl w-full my-8 bg-white shadow-2xl border-zinc-300">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-charcoal-900 text-brand-400 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-charcoal-950">
                Stock Movement Ledger & Audit History
              </h2>
              <p className="text-xs text-zinc-500">
                Chronological log of all restock receipts and manual stock adjustments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {movements.length === 0 ? (
            <div className="p-12 text-center text-xs text-zinc-400">
              No stock movements recorded yet. Receive stock or adjust inventory to generate audit logs.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-[11px] uppercase font-semibold text-zinc-500 font-mono sticky top-0">
                <tr>
                  <th className="py-2.5 px-4">Date / Time</th>
                  <th className="py-2.5 px-4">Item & SKU</th>
                  <th className="py-2.5 px-3 text-center">Type</th>
                  <th className="py-2.5 px-3 text-center">Before</th>
                  <th className="py-2.5 px-3 text-center">Change</th>
                  <th className="py-2.5 px-3 text-center">After</th>
                  <th className="py-2.5 px-4">Supplier / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-normal">
                {movements.map((m) => {
                  const isRestock = m.movementType === "RESTOCK";
                  const isPositive = m.quantityChange > 0;

                  return (
                    <tr key={m.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-zinc-500">
                        <div>{m.date}</div>
                        <div className="text-[10px] text-zinc-400">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-zinc-900 truncate max-w-[180px]">
                          {m.productName}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400">{m.sku}</div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {isRestock ? (
                          <Badge variant="healthy" dot>
                            RESTOCK
                          </Badge>
                        ) : (
                          <Badge variant="warning" dot>
                            ADJUST
                          </Badge>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-zinc-500">
                        {m.stockBefore}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold">
                        <span
                          className={isPositive ? "text-emerald-600" : "text-red-600"}
                        >
                          {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-zinc-900">
                        {m.stockAfter}
                      </td>

                      <td className="py-3 px-4 text-zinc-600 truncate max-w-[180px]">
                        {m.supplierName || m.notes || "Standard adjustment"}
                        {m.costPerUnit ? (
                          <span className="text-[10px] text-zinc-400 block font-mono">
                            @{formatINR(m.costPerUnit)}/unit
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <span>Total movements recorded: {movements.length}</span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
