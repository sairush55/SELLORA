"use client";

import React, { useState, useEffect } from "react";
import { useShop } from "@/hooks/useShop";
import { salesService } from "@/services/salesService";
import { Sale } from "@/types/sales";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReceiptModal } from "@/components/sales/ReceiptModal";
import { formatINR } from "@/lib/utils";
import {
  Search,
  Download,
  Receipt,
  ArrowUpRight,
  Filter,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
} from "lucide-react";
import Link from "next/link";

export default function SalesHistoryPage() {
  const { shop } = useShop();
  const shopId = shop.id;

  const [sales, setSales] = useState<Sale[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Receipt Modal for viewing full invoice
  const [activeInvoice, setActiveInvoice] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const loadSales = () => {
    const data = salesService.getSales(shopId, {
      search,
      paymentMethod: selectedMethod,
      saleType: selectedType,
    });
    setSales(data);
  };

  useEffect(() => {
    loadSales();
  }, [shopId, search, selectedMethod, selectedType]);

  const openInvoice = (sale: Sale) => {
    setActiveInvoice(sale);
    setIsReceiptOpen(true);
  };

  const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Sales History
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            All your past sales and invoices in one place — {sales.length} transactions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/sales/pos">
            <Button variant="primary" size="sm" className="text-xs font-semibold gap-1.5 shadow-sm">
              <Receipt className="w-3.5 h-3.5" />
              New Sale
            </Button>
          </Link>
          <Link href="/sales/daily-summary">
            <Button variant="outline" size="sm" className="text-xs">
              Daily Summary
            </Button>
          </Link>
        </div>
      </div>

      {/* Control Strip */}
      <div className="p-4 rounded-xl bg-white border border-zinc-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by invoice #, customer name, or item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-200 text-xs bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2.5">
            {/* Tender Filter */}
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="h-9 px-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-700 bg-zinc-50 focus:outline-none"
            >
              <option value="all">All Payment Methods</option>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>

            {/* Sale Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-9 px-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-700 bg-zinc-50 focus:outline-none"
            >
              <option value="all">All Sale Types</option>
              <option value="TRANSACTION">POS Transactions</option>
              <option value="DAILY_SUMMARY">Daily Summaries</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales Invoices Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invoices Ledger</CardTitle>
            <CardDescription>
              Showing {sales.length} records • Total Volume: {formatINR(totalRevenue)}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-[11px] uppercase font-semibold text-zinc-500 font-mono">
                <tr>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-3 text-center">Items</th>
                  <th className="py-3 px-3 text-center">Tender</th>
                  <th className="py-3 px-3 text-center">Type</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-normal">
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        icon={<Receipt className="w-7 h-7" />}
                        title="No sales recorded yet"
                        description="Use the Billing Counter to complete your first sale — it will appear here immediately."
                        action={
                          <Link href="/sales/pos">
                            <Button variant="primary" size="sm">
                              <Receipt className="w-3.5 h-3.5 mr-1.5" />
                              Start a Sale
                            </Button>
                          </Link>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  sales.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => openInvoice(s)}
                      className="hover:bg-zinc-50/70 transition-colors cursor-pointer group"
                    >
                      {/* Invoice */}
                      <td className="py-3.5 px-4 font-mono font-bold text-zinc-900 group-hover:text-brand-700">
                        {s.invoiceNumber}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-zinc-500">
                        <div>{s.saleDate}</div>
                        <div className="text-[10px] text-zinc-400">
                          {new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 text-zinc-700 truncate max-w-[160px]">
                        {s.customerName || "Walk-in Customer"}
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-3 text-center font-mono text-zinc-600">
                        <span className="bg-zinc-100 px-2 py-0.5 rounded">
                          {s.items.length} SKUs
                        </span>
                      </td>

                      {/* Payment Method */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            s.paymentMethod === "upi"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : s.paymentMethod === "cash"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : s.paymentMethod === "card"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {s.paymentMethod}
                        </span>
                      </td>

                      {/* Sale Type */}
                      <td className="py-3.5 px-3 text-center">
                        {s.saleType === "TRANSACTION" ? (
                          <span className="text-[10px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded">
                            POS
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                            Summary
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-zinc-900">
                        {formatINR(s.totalAmount)}
                      </td>

                      {/* View Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            openInvoice(s);
                          }}
                          className="text-[11px] h-7 px-2 text-brand-700 hover:text-brand-800"
                        >
                          View Invoice
                          <ArrowUpRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setActiveInvoice(null);
        }}
        sale={activeInvoice}
      />
    </div>
  );
}
