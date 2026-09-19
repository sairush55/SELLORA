"use client";

import React, { useRef } from "react";
import { Sale } from "@/types/sales";
import { useShop } from "@/hooks/useShop";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatINR } from "@/lib/utils";
import {
  X,
  Printer,
  Download,
  Receipt,
  PlusCircle,
  CheckCircle2,
  Store,
  Phone,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
} from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onNewBill?: () => void;
}

export function ReceiptModal({
  isOpen,
  onClose,
  sale,
  onNewBill,
}: ReceiptModalProps) {
  const { shop } = useShop();
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleDownloadTextInvoice = () => {
    const lines = [
      "==================================================",
      `           ${(shop.name || "SELLORA RETAIL").toUpperCase()}`,
      `         Retail Intelligence Terminal`,
      "==================================================",
      `Invoice #:   ${sale.invoiceNumber}`,
      `Date/Time:   ${new Date(sale.createdAt).toLocaleString("en-IN")}`,
      ...(sale.customerName && sale.customerName.trim() && sale.customerName !== "Walk-in Customer"
        ? [`Customer:    ${sale.customerName.trim()}`]
        : []),
      `Type:        ${sale.saleType}`,
      "--------------------------------------------------",
      "Item                      Qty    Rate     Amount",
      "--------------------------------------------------",
      ...sale.items.map((item) => {
        const nameCol = item.productName.slice(0, 22).padEnd(24);
        const qtyCol = String(item.quantity).padStart(3);
        const rateCol = String(item.unitPrice).padStart(7);
        const amtCol = String(item.subtotal).padStart(10);
        return `${nameCol} ${qtyCol}  ${rateCol}  ${amtCol}`;
      }),
      "--------------------------------------------------",
      `Subtotal:                               ₹${sale.subtotal.toFixed(2)}`,
      sale.discount > 0 ? `Discount:                              -₹${sale.discount.toFixed(2)}` : "",
      sale.tax > 0 ? `Tax (GST):                             +₹${sale.tax.toFixed(2)}` : "",
      "--------------------------------------------------",
      `GRAND TOTAL:                            ₹${sale.totalAmount.toFixed(2)}`,
      `Payment Method:                         ${sale.paymentMethod.toUpperCase()}`,
      "==================================================",
      "           Thank You! Visit Again.",
      `   ${shop.address || "Main Street, Market Yard"}`,
      `            Phone: ${shop.phone || "+91 98200 12345"}`,
      "==================================================",
    ].filter(Boolean);

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sale.invoiceNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="max-w-md w-full my-8 bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in duration-150">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between px-5 py-3.5 bg-zinc-900 text-white">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-brand-400" />
            <span className="text-xs font-bold font-mono tracking-tight">
              Receipt: {sale.invoiceNumber}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Body (Formatted for Screen & Thermal Print) */}
        <div ref={receiptRef} className="p-6 bg-white text-zinc-900 space-y-4 font-sans text-xs">
          {/* Shop Header */}
          <div className="text-center space-y-1 pb-4 border-b border-dashed border-zinc-300">
            <h2 className="text-base font-extrabold tracking-tight text-charcoal-950 uppercase">
              {shop.name || "Ravi Stores"}
            </h2>
            {shop.ownerName && (
              <p className="text-[11px] font-semibold text-zinc-700">
                Proprietor / Merchant: {shop.ownerName}
              </p>
            )}
            <p className="text-[11px] text-zinc-500">{shop.address || "Malleshwaram, Bengaluru, KA"}</p>
            <p className="text-[11px] text-zinc-500 font-mono">
              Phone: {shop.phone || "+91 98450 67890"} {shop.gstin ? `• GSTIN: ${shop.gstin}` : ""}
            </p>
          </div>

          {/* Invoice Metadata */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono py-1 border-b border-dashed border-zinc-200">
            <div>
              <span className="text-zinc-400 block text-[10px]">INVOICE NUMBER</span>
              <span className="font-bold text-zinc-900">{sale.invoiceNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-zinc-400 block text-[10px]">DATE & TIME</span>
              <span className="text-zinc-800">
                {new Date(sale.createdAt).toLocaleDateString("en-IN")}{" "}
                {new Date(sale.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            {sale.customerName && sale.customerName.trim() && sale.customerName !== "Walk-in Customer" ? (
              <>
                <div>
                  <span className="text-zinc-400 block text-[10px]">CUSTOMER</span>
                  <span className="font-semibold text-zinc-900">{sale.customerName}</span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-400 block text-[10px]">TENDER METHOD</span>
                  <span className="font-bold uppercase text-brand-700">{sale.paymentMethod}</span>
                </div>
              </>
            ) : (
              <div className="col-span-2 text-right">
                <span className="text-zinc-400 block text-[10px]">TENDER METHOD</span>
                <span className="font-bold uppercase text-brand-700">{sale.paymentMethod}</span>
              </div>
            )}
          </div>

          {/* Line Items Table */}
          <div>
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 text-[10px] uppercase font-mono text-zinc-400 font-bold">
                <tr>
                  <th className="py-1.5">Item</th>
                  <th className="py-1.5 text-center">Qty</th>
                  <th className="py-1.5 text-right">Price</th>
                  <th className="py-1.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-normal">
                {sale.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 pr-2">
                      <div className="font-semibold text-zinc-900 leading-snug">{item.productName}</div>
                      <div className="text-[10px] font-mono text-zinc-400">{item.sku}</div>
                    </td>
                    <td className="py-2 text-center font-mono font-medium">{item.quantity}</td>
                    <td className="py-2 text-right font-mono text-zinc-600">{formatINR(item.unitPrice)}</td>
                    <td className="py-2 text-right font-mono font-bold text-zinc-900">{formatINR(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="pt-3 border-t border-dashed border-zinc-300 space-y-1.5 text-xs">
            <div className="flex justify-between text-zinc-500">
              <span>Subtotal:</span>
              <span className="font-mono text-zinc-800">{formatINR(sale.subtotal)}</span>
            </div>

            {sale.discount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="font-mono font-semibold">-{formatINR(sale.discount)}</span>
              </div>
            )}

            {sale.tax > 0 && (
              <div className="flex justify-between text-zinc-500">
                <span>Tax (GST):</span>
                <span className="font-mono text-zinc-800">+{formatINR(sale.tax)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-extrabold text-charcoal-950 pt-2 border-t border-zinc-200">
              <span>TOTAL AMOUNT:</span>
              <span className="font-mono text-base text-brand-700">{formatINR(sale.totalAmount)}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 border-t border-dashed border-zinc-200 text-[10px] text-zinc-400 font-mono space-y-0.5">
            <p>Thank you for shopping with us!</p>
            <p>Goods once sold can be exchanged within 7 days with invoice.</p>
            <p className="text-[9px] text-zinc-300 pt-1">SELLORA Terminal • Live Inventory Synced</p>
          </div>
        </div>

        {/* Bottom Actions (Hidden in Print) */}
        <div className="print:hidden p-4 bg-zinc-50 border-t border-zinc-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="text-xs gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadTextInvoice} className="text-xs gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Download
            </Button>
          </div>

          {onNewBill && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onNewBill();
              }}
              className="text-xs font-semibold gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New Bill
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
