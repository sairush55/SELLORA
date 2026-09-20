"use client";

import React, { useState, useRef } from "react";
import { Category } from "@/types/inventory";
import {
  invoiceParserService,
  MatchedInvoiceItem,
  InvoiceImportResult,
} from "@/services/invoiceParserService";
import { formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Boxes,
  X,
  Trash2,
  FileCheck,
  RefreshCw,
  Plus,
} from "lucide-react";

interface InvoiceUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  categories: Category[];
  onImportSuccess: (result: InvoiceImportResult) => void;
}

export function InvoiceUploadModal({
  isOpen,
  onClose,
  shopId,
  categories,
  onImportSuccess,
}: InvoiceUploadModalProps) {
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [tabMode, setTabMode] = useState<"pdf" | "text">("pdf");
  const [pastedText, setPastedText] = useState<string>("");
  const [rawTextPreview, setRawTextPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Extracted data state
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [supplierName, setSupplierName] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [invoiceSummary, setInvoiceSummary] = useState<{
    subtotal: number;
    taxableAmount: number;
    cgst: number;
    sgst: number;
    igst: number;
    totalTax: number;
    grandTotal: number;
    isTaxInclusive: boolean;
    effectiveTaxRate?: number;
  } | null>(null);
  const [items, setItems] = useState<MatchedInvoiceItem[]>([]);
  const [filterMode, setFilterMode] = useState<"all" | "updates" | "new">("all");

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep("upload");
    setTabMode("pdf");
    setPastedText("");
    setRawTextPreview(null);
    setIsProcessing(false);
    setErrorMessage(null);
    setItems([]);
    setInvoiceSummary(null);
    setInvoiceNumber("");
    setSupplierName("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Process uploaded file
  const processFile = async (file: File) => {
    setErrorMessage(null);
    setRawTextPreview(null);
    setIsProcessing(true);

    try {
      const res = await invoiceParserService.uploadAndParsePdf(file);

      if (res.rawTextPreview) {
        setRawTextPreview(res.rawTextPreview);
      }

      if (!res.success || !res.items || res.items.length === 0) {
        setErrorMessage(
          res.error ||
            "No product line items could be detected in this invoice PDF. You can switch to the 'Paste Bill Text' tab to inspect or paste your bill directly."
        );
        if (res.rawTextPreview) {
          setPastedText(res.rawTextPreview);
        }
        setIsProcessing(false);
        return;
      }

      setInvoiceNumber(res.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`);
      setSupplierName(res.supplierName || "Supplier Invoice");
      setInvoiceDate(res.date || new Date().toISOString().split("T")[0]);
      setInvoiceSummary(res.summary || null);

      // Match against existing products
      const matched = invoiceParserService.matchInvoiceItems(shopId, res.items);
      setItems(matched);
      setStep("review");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process PDF file.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Process pasted text
  const processPastedText = async () => {
    if (!pastedText.trim()) {
      setErrorMessage("Please paste some invoice text or table rows first.");
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const res = await invoiceParserService.parseRawInvoiceText(pastedText);

      if (!res.success || !res.items || res.items.length === 0) {
        setErrorMessage(
          res.error ||
            "Could not detect products in the pasted text. Make sure lines include product names, quantities, and prices."
        );
        setIsProcessing(false);
        return;
      }

      setInvoiceNumber(res.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`);
      setSupplierName(res.supplierName || "Supplier Invoice");
      setInvoiceDate(res.date || new Date().toISOString().split("T")[0]);
      setInvoiceSummary(res.summary || null);

      const matched = invoiceParserService.matchInvoiceItems(shopId, res.items);
      setItems(matched);
      setStep("review");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to parse pasted text.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Load sample invoice for immediate verification
  const handleLoadSample = () => {
    setErrorMessage(null);
    setIsProcessing(true);

    setTimeout(() => {
      const sample = invoiceParserService.getSampleInvoiceData();
      setInvoiceNumber(sample.invoiceNumber);
      setSupplierName(sample.supplierName);
      setInvoiceDate(sample.date);

      const matched = invoiceParserService.matchInvoiceItems(shopId, sample.items);
      setItems(matched);
      setStep("review");
      setIsProcessing(false);
    }, 400);
  };

  // Drag & drop handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // Item update handlers in review table
  const updateItem = (id: string, updates: Partial<MatchedInvoiceItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        if (updates.quantity !== undefined) {
          updated.newStock = updated.currentStock + (Number(updates.quantity) || 0);
        }
        return updated;
      })
    );
  };

  const toggleSelectAll = (select: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: select })));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Commit and apply
  const handleCommit = () => {
    const selectedItems = items.filter((i) => i.selected);
    if (selectedItems.length === 0) {
      setErrorMessage("Please select at least one product item to import.");
      return;
    }

    setIsProcessing(true);
    const res = invoiceParserService.commitInvoiceImport(
      shopId,
      selectedItems,
      invoiceNumber,
      supplierName
    );

    setIsProcessing(false);
    onImportSuccess(res);
    handleClose();
  };

  // Counts
  const updateCount = items.filter((i) => i.action === "UPDATE_STOCK").length;
  const newCount = items.filter((i) => i.action === "CREATE_PRODUCT").length;
  const selectedCount = items.filter((i) => i.selected).length;

  const filteredItems = items.filter((item) => {
    if (filterMode === "updates") return item.action === "UPDATE_STOCK";
    if (filterMode === "new") return item.action === "CREATE_PRODUCT";
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        className={`w-full bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col transition-all duration-200 my-8 ${
          step === "review" ? "max-w-5xl max-h-[90vh]" : "max-w-xl"
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-zinc-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600/30 text-brand-400 border border-brand-500/30 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {step === "upload" ? "Upload Billing & Invoice PDF" : "Review Invoice Line Items"}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {step === "upload"
                  ? "Auto-extract products, update existing stock, and review new SKUs"
                  : `${invoiceNumber || "Invoice"} • ${supplierName || "Supplier"}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="px-5 py-3 bg-red-50 border-b border-red-200 text-xs text-red-700 font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-800 font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Tab Selector (Upload step only) */}
        {step === "upload" && (
          <div className="flex items-center px-6 pt-3 border-b border-zinc-200 bg-zinc-50/50 gap-2">
            <button
              type="button"
              onClick={() => {
                setTabMode("pdf");
                setErrorMessage(null);
              }}
              className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                tabMode === "pdf"
                  ? "border-brand-600 text-brand-900 bg-white rounded-t-lg -mb-[1px] shadow-2xs"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-brand-600" />
              <span>Upload PDF File</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTabMode("text");
                setErrorMessage(null);
              }}
              className={`pb-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                tabMode === "text"
                  ? "border-brand-600 text-brand-900 bg-white rounded-t-lg -mb-[1px] shadow-2xs"
                  : "border-transparent text-zinc-500 hover:text-zinc-800"
              }`}
            >
              <span className="text-xs">📋</span>
              <span>Paste Bill Text / Table</span>
            </button>
          </div>
        )}

        {/* Body Step 1: Upload Dropzone & Paste Section */}
        {step === "upload" && (
          <div className="p-6 space-y-5">
            {tabMode === "pdf" ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all ${
                  dragOver
                    ? "border-brand-500 bg-brand-50/50"
                    : "border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 hover:border-zinc-300"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 border border-brand-200/60 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <UploadCloud className="w-6 h-6" />
                </div>

                <h3 className="text-sm font-bold text-zinc-900">
                  Drag and drop your Supplier Invoice PDF here
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Upload distributor delivery slips, wholesale bills, or GST tax invoices (PDF format
                  up to 15MB).
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) processFile(f);
                  }}
                />

                <div className="mt-5 flex items-center justify-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold gap-1.5 shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {isProcessing ? "Extracting Products..." : "Browse PDF File"}
                  </Button>
                </div>

                {/* Helpful fallback if PDF had text but failed parsing */}
                {rawTextPreview && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-left text-xs">
                    <p className="font-semibold text-amber-900">
                      📄 Text was extracted from your PDF ({rawTextPreview.length} characters)
                    </p>
                    <p className="text-[11px] text-amber-700 mt-0.5">
                      If line items weren&apos;t detected automatically, you can edit or review the text directly.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPastedText(rawTextPreview);
                        setTabMode("text");
                        setErrorMessage(null);
                      }}
                      className="mt-2 inline-flex items-center gap-1 font-bold text-brand-700 hover:text-brand-900 underline cursor-pointer"
                    >
                      <span>Open in Paste Text Editor →</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Paste Text Mode */
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-zinc-700">
                    Paste invoice table or text lines:
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setPastedText(
                        `1  Tata Salt 1kg  2501  50  PKT  22.00  1100.00\n2  Fortune Sunlite Refined Oil 1L  1512  30  LTR  135.50  4065.00\n3  Aashirvaad Atta 10kg  1101  15  BAG  420.00  6300.00\n4  Maggi Noodles 70g  1902  120  PCS  12.00  1440.00\n5  Dettol Soap 75g  3401  60  PCS  38.00  2280.00`
                      )
                    }
                    className="text-brand-700 hover:underline font-semibold"
                  >
                    Insert sample text
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste table rows from your PDF, WhatsApp bill, or invoice spreadsheet...&#10;Example:&#10;1  Tata Salt 1kg  50 PKT  22.00  1100.00&#10;2  Fortune Oil 1L  30 LTR  135.50  4065.00"
                  className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all leading-relaxed"
                />

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPastedText("")}
                    className="text-xs text-zinc-400 hover:text-zinc-600"
                  >
                    Clear text
                  </button>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isProcessing || !pastedText.trim()}
                    onClick={processPastedText}
                    className="text-xs font-semibold gap-1.5 shadow-2xs"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    {isProcessing ? "Extracting Items..." : "Extract Line Items"}
                  </Button>
                </div>
              </div>
            )}

            {/* Quick Demo Invoice Button */}
            <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  ⚡
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-800">
                    Try with Demo Wholesale Bill
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Instantly load a realistic 5-item invoice to test stock updates and new product
                    review.
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadSample}
                disabled={isProcessing}
                className="text-xs font-semibold shrink-0"
              >
                Load Sample
              </Button>
            </div>
          </div>
        )}

        {/* Body Step 2: Interactive Review Table */}
        {step === "review" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Review Summary Bar */}
            <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <Badge variant="healthy" dot>
                  {updateCount} Existing SKUs (Stock Update)
                </Badge>
                <Badge variant="warning" dot>
                  {newCount} New SKUs (Needs Review)
                </Badge>
              </div>

              {/* View Filters */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-zinc-200 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    filterMode === "all"
                      ? "bg-zinc-900 text-white font-semibold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  All Items ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("updates")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    filterMode === "updates"
                      ? "bg-zinc-900 text-white font-semibold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Stock Updates ({updateCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("new")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    filterMode === "new"
                      ? "bg-zinc-900 text-white font-semibold"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  New Products ({newCount})
                </button>
              </div>
            </div>

            {/* Invoice GST Summary Strip */}
            {invoiceSummary && invoiceSummary.totalTax > 0 && (
              <div className="mx-4 mt-3 mb-1 px-3.5 py-2 rounded-xl bg-amber-50/80 border border-amber-200/90 text-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded">
                    GST Allocated
                  </span>
                  <span className="text-zinc-700 text-xs">
                    Subtotal: <strong>{formatINR(invoiceSummary.subtotal)}</strong> • Invoice GST:{" "}
                    <strong className="text-amber-800">+{formatINR(invoiceSummary.totalTax)}</strong>
                    {invoiceSummary.effectiveTaxRate ? ` (~${invoiceSummary.effectiveTaxRate}%)` : ""} • Grand Total:{" "}
                    <strong className="text-zinc-900">{formatINR(invoiceSummary.grandTotal)}</strong>
                  </span>
                </div>
                <span className="text-[11px] font-medium text-amber-800">
                  ✓ Extracted Cost Prices below include applicable GST
                </span>
              </div>
            )}

            {/* Scrollable Table Area */}
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-[10px] uppercase font-mono text-zinc-500 font-bold sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={items.length > 0 && items.every((i) => i.selected)}
                        onChange={(e) => toggleSelectAll(e.target.checked)}
                        className="rounded border-zinc-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3">Product Name & SKU</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3 text-center">Invoiced Qty</th>
                    <th className="py-2.5 px-3 text-center">Stock Preview</th>
                    <th className="py-2.5 px-3 text-right">Cost Price (incl. GST)</th>
                    <th className="py-2.5 px-3 text-right">Selling Price</th>
                    <th className="py-2.5 px-2 w-8 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredItems.map((item) => {
                    const isUpdate = item.action === "UPDATE_STOCK";
                    const marginPct =
                      item.sellingPrice > 0
                        ? Math.round(
                            ((item.sellingPrice - item.costPrice) / item.sellingPrice) * 100
                          )
                        : 0;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-zinc-50/70 transition-colors ${
                          !item.selected ? "opacity-50 bg-zinc-50/30" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(e) => updateItem(item.id, { selected: e.target.checked })}
                            className="rounded border-zinc-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                          />
                        </td>

                        {/* Name & SKU */}
                        <td className="py-3 px-3 min-w-[200px]">
                          {isUpdate ? (
                            <div>
                              <div className="font-bold text-zinc-900">{item.name}</div>
                              <div className="text-[10px] font-mono text-zinc-400">
                                SKU: <span className="text-zinc-600 font-semibold">{item.sku}</span>{" "}
                                • {item.unit}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateItem(item.id, { name: e.target.value })}
                                className="w-full h-7 px-2 font-bold text-xs rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400"
                                placeholder="Product Name"
                              />
                              <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400">
                                <span>SKU:</span>
                                <input
                                  type="text"
                                  value={item.sku}
                                  onChange={(e) => updateItem(item.id, { sku: e.target.value })}
                                  className="h-5 px-1.5 font-mono text-[10px] rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 uppercase"
                                />
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Action Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {isUpdate ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Update Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              <Plus className="w-3 h-3 text-amber-600" />
                              New Product
                            </span>
                          )}
                        </td>


                        {/* Invoiced Quantity */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item.id, {
                                quantity: Math.max(1, parseInt(e.target.value) || 1),
                              })
                            }
                            className="w-16 h-7 px-1 text-center font-mono font-bold text-xs rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </td>

                        {/* Stock Preview */}
                        <td className="py-3 px-3 text-center font-mono whitespace-nowrap">
                          {isUpdate ? (
                            <div className="flex items-center justify-center gap-1 text-xs">
                              <span className="text-zinc-500 font-medium">{item.currentStock}</span>
                              <span className="text-zinc-400">+</span>
                              <span className="text-emerald-700 font-bold">{item.quantity}</span>
                              <ArrowRight className="w-3 h-3 text-zinc-400" />
                              <span className="font-extrabold text-zinc-900 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                                {item.newStock}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                              Initial: {item.quantity}
                            </span>
                          )}
                        </td>

                        {/* Cost Price (incl. GST) */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex flex-col items-end gap-0.5">
                            <div className="inline-flex items-center gap-0.5">
                              <span className="text-[11px] font-mono text-zinc-400">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={item.costPrice}
                                onChange={(e) =>
                                  updateItem(item.id, {
                                    costPrice: Math.max(0, parseFloat(e.target.value) || 0),
                                  })
                                }
                                className="w-20 h-7 px-1 text-right font-mono text-xs rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>
                            {item.taxAmount && item.taxAmount > 0 ? (
                              <span className="text-[9px] font-mono text-amber-700 leading-none">
                                incl. ₹{item.taxAmount} GST
                              </span>
                            ) : null}
                            {item.requiresReview && (
                              <span
                                title={item.reviewReason || "Ambiguous GST calculation, please verify"}
                                className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded cursor-help"
                              >
                                ⚠️ Review Tax
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Selling Price & Margin */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex flex-col items-end gap-0.5">
                            <div className="inline-flex items-center gap-0.5">
                              <span className="text-[11px] font-mono text-zinc-400">₹</span>
                              <input
                                type="number"
                                min="0"
                                value={item.sellingPrice}
                                onChange={(e) =>
                                  updateItem(item.id, {
                                    sellingPrice: Math.max(0, parseFloat(e.target.value) || 0),
                                  })
                                }
                                className="w-20 h-7 px-1 text-right font-mono font-bold text-xs rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                            </div>
                            <span
                              className={`text-[10px] font-mono font-bold px-1 rounded ${
                                marginPct >= 20
                                  ? "text-emerald-700 bg-emerald-50"
                                  : marginPct >= 0
                                  ? "text-blue-700 bg-blue-50"
                                  : "text-red-700 bg-red-50"
                              }`}
                            >
                              {marginPct >= 0 ? `+${marginPct}%` : `${marginPct}%`} margin
                            </span>
                          </div>
                        </td>

                        {/* Delete Row */}
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            title="Exclude this item from import"
                            className="p-1 text-zinc-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Action Bar */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-zinc-600 font-medium">
                Selected: <strong className="text-zinc-900">{selectedCount}</strong> of{" "}
                <strong>{items.length}</strong> items to import into store
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep("upload")}
                  className="text-xs font-semibold"
                >
                  Upload Another
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCommit}
                  disabled={isProcessing || selectedCount === 0}
                  className="text-xs font-bold gap-1.5 shadow-2xs"
                >
                  <FileCheck className="w-4 h-4" />
                  {isProcessing
                    ? "Applying Updates..."
                    : `Apply Import & Update Stock (${selectedCount})`}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
