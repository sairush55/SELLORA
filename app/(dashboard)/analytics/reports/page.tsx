"use client";

import React, { useState } from "react";
import { useShop } from "@/hooks/useShop";
import { ReportType, ReportDefinition, DateRange } from "@/types/analytics";
import { analyticsService } from "@/services/analyticsService";
import { reportExportService } from "@/services/reportExportService";
import { ReportModal } from "@/components/analytics/ReportModal";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import {
  FileSpreadsheet,
  Printer,
  FileText,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Package,
  Boxes,
  Download,
  Eye,
} from "lucide-react";

interface ReportCardConfig {
  type: ReportType;
  title: string;
  description: string;
  defaultPreset: any;
  icon: React.ElementType;
  badge: string;
}

const REPORTS_CONFIG: ReportCardConfig[] = [
  {
    type: "daily_sales",
    title: "Daily Sales Report",
    description: "Hourly turnover profile, itemized unit counts, and average bill size for today.",
    defaultPreset: "today",
    icon: Calendar,
    badge: "Daily",
  },
  {
    type: "weekly_sales",
    title: "Weekly Sales Report",
    description: "Daily breakdown of revenues, bill volumes, and day-over-day pacing for the current week.",
    defaultPreset: "this_week",
    icon: TrendingUp,
    badge: "Weekly",
  },
  {
    type: "monthly_sales",
    title: "Monthly Sales Report",
    description: "Month-to-date sales ledger, category distribution, and margin analysis.",
    defaultPreset: "this_month",
    icon: Layers,
    badge: "Monthly",
  },
  {
    type: "yearly_sales",
    title: "Annual Sales Report",
    description: "12-month progression, seasonal peaks, annual turnover, and yearly growth.",
    defaultPreset: "this_year",
    icon: FileText,
    badge: "Annual",
  },
  {
    type: "custom_date",
    title: "Custom Period Report",
    description: "Consolidated financial audit and sales ledger for any user-defined date span.",
    defaultPreset: "last_30_days",
    icon: Calendar,
    badge: "Flexible",
  },
  {
    type: "inventory",
    title: "Inventory Valuation Report",
    description: "Warehouse stock levels, cost valuation, stockouts, and turnover velocity ratio.",
    defaultPreset: "last_30_days",
    icon: Boxes,
    badge: "Stock",
  },
  {
    type: "product_performance",
    title: "Product Performance Report",
    description: "SKU ranking matrix by units, gross revenue, margins, and sales trajectory (rising/declining).",
    defaultPreset: "last_30_days",
    icon: Package,
    badge: "SKU",
  },
];

export default function ReportsPage() {
  const { shop } = useShop();
  const shopId = shop?.id || "shop-1";

  const [activeReport, setActiveReport] = useState<ReportDefinition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const getReportData = (type: ReportType, preset: any): ReportDefinition => {
    const range = analyticsService.resolveDateRange(preset);
    return reportExportService.generateReport(shopId, type, range);
  };

  const handlePreview = (type: ReportType, preset: any) => {
    const rep = getReportData(type, preset);
    setActiveReport(rep);
    setIsModalOpen(true);
  };

  const handleExportCSV = (type: ReportType, preset: any) => {
    const rep = getReportData(type, preset);
    reportExportService.exportToCSV(rep);
  };

  const handlePrint = (type: ReportType, preset: any) => {
    const rep = getReportData(type, preset);
    setActiveReport(rep);
    setIsModalOpen(true);
    setTimeout(() => {
      reportExportService.triggerPrintPDF();
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/80">
        <div>
          <h1 className="text-xl font-extrabold text-charcoal-950 tracking-tight">
            Financial & Inventory Reports
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Export certified spreadsheets and printable summaries generated from raw database records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportCSV("monthly_sales", "this_month")}
            className="text-xs font-semibold gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export Monthly (CSV)
          </Button>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS_CONFIG.map((cfg) => {
          const Icon = cfg.icon;

          return (
            <div
              key={cfg.type}
              className="bg-white rounded-xl border border-zinc-200/80 p-4 sm:p-5 shadow-2xs hover:border-zinc-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-zinc-100 text-charcoal-900 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] uppercase font-mono font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                    {cfg.badge}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-charcoal-950 mt-3">
                  {cfg.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  {cfg.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(cfg.type, cfg.defaultPreset)}
                  className="text-xs font-medium gap-1 flex-1"
                >
                  <Eye className="w-3 h-3" />
                  Preview
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportCSV(cfg.type, cfg.defaultPreset)}
                  className="text-xs font-medium gap-1 text-emerald-700 hover:text-emerald-800"
                  title="Export CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  CSV
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePrint(cfg.type, cfg.defaultPreset)}
                  className="text-xs font-medium gap-1"
                  title="Print / Save PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  PDF
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Global Preview Modal */}
      <ReportModal
        report={activeReport}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
