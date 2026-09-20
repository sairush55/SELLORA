"use client";

import React from "react";
import { ReportDefinition } from "@/types/analytics";
import { reportExportService } from "@/services/reportExportService";
import { Button } from "@/components/ui/Button";
import {
  FileSpreadsheet,
  Printer,
  X,
  FileText,
  Calendar,
  Layers,
} from "lucide-react";

interface ReportModalProps {
  report: ReportDefinition | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportModal({ report, isOpen, onClose }: ReportModalProps) {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-charcoal-900 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-charcoal-950">
                {report.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                <span className="flex items-center gap-1 font-mono">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                  {report.periodLabel}
                </span>
                <span>•</span>
                <span>Generated: {report.generatedAt}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => reportExportService.exportToCSV(report)}
              className="text-xs font-semibold gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-brand-600" />
              Download CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => reportExportService.triggerPrintPDF()}
              className="text-xs font-semibold gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable & Scrollable Report Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5" id="printable-report-content">
          {/* Summary Strip */}
          {report.summaryMetrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(report.summaryMetrics).map(([key, val]) => (
                <div
                  key={key}
                  className="p-3 rounded-xl bg-zinc-50 border border-zinc-100"
                >
                  <span className="text-[11px] text-zinc-500 block font-medium">
                    {key}
                  </span>
                  <span className="text-base font-bold font-mono text-charcoal-950 block mt-1">
                    {val}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Tabular Dataset */}
          <div className="border border-zinc-200/80 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-50/80 border-b border-zinc-200/80">
                <tr>
                  {report.headers.map((h, i) => (
                    <th
                      key={i}
                      className="py-2.5 px-3 font-semibold text-zinc-600 uppercase text-[10px] tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {report.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-zinc-50/50">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`py-2 px-3 ${
                          typeof cell === "number"
                            ? "font-mono font-medium text-zinc-800"
                            : "text-zinc-700"
                        }`}
                      >
                        {typeof cell === "number" && cell > 1000
                          ? cell.toLocaleString("en-IN")
                          : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-3.5 px-5 border-t border-zinc-100 bg-zinc-50 text-[11px] text-zinc-400">
          <span>SELLORA Retail Intelligence Engine • Certified Database Ledger</span>
          <span>{report.rows.length} records in dataset</span>
        </div>
      </div>
    </div>
  );
}
