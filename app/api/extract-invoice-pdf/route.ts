import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";

interface ExtractedInvoiceItem {
  name: string;
  sku?: string;
  quantity: number;
  unit: string;
  baseCostPrice: number;
  costPrice: number; // PURCHASE COST INCLUDING GST
  taxAmount?: number; // GST amount per unit
  taxRate?: number; // Effective GST % applied
  suggestedSellingPrice: number;
  hsn?: string;
  requiresReview?: boolean;
  reviewReason?: string;
}

export interface InvoiceFinancialSummary {
  subtotal: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
  isTaxInclusive: boolean;
  effectiveTaxRate?: number;
}

// Comprehensive Indian & Global retail unit normalizer
function normalizeUnit(unitStr: string): string {
  const u = (unitStr || "").toLowerCase().trim();
  if (u.includes("box") || u.includes("ctn") || u.includes("carton")) return "Boxes";
  if (u.includes("pc") || u.includes("nos") || u.includes("piece") || u.includes("unit")) return "Pcs";
  if (u.includes("kg") || u.includes("kilo") || u.includes("gm") || u.includes("gram")) return "Kg";
  if (u.includes("bag") || u.includes("sack")) return "Bags";
  if (u.includes("pkt") || u.includes("pack") || u.includes("pac") || u.includes("pouch")) return "Pks";
  if (u.includes("ltr") || u.includes("liter") || u.includes("litre") || u.includes("ml")) return "Litres";
  if (u.includes("btl") || u.includes("bottle")) return "Bottles";
  if (u.includes("tin") || u.includes("can") || u.includes("jar")) return "Tins";
  if (u.includes("doz") || u.includes("dozen")) return "Dozen";
  return "Units";
}

// Clean number strings (e.g. "1,250.00", "₹720", "Rs. 45")
function parseNumeric(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Extract bill-level summary (Subtotal, CGST, SGST, IGST, Grand Total)
function extractInvoiceFinancialSummary(rawText: string): InvoiceFinancialSummary {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  let subtotal = 0;
  let taxableAmount = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  let totalTax = 0;
  let grandTotal = 0;

  for (const line of lines) {
    const l = line.toLowerCase();

    // 1. Subtotal / Taxable amount
    if (
      l.includes("subtotal") ||
      l.includes("sub total") ||
      l.includes("taxable value") ||
      l.includes("taxable amount") ||
      l.includes("total taxable")
    ) {
      const nums = line.match(/(?:₹|rs\.?)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi);
      if (nums && nums.length > 0) {
        const lastNum = parseNumeric(nums[nums.length - 1]);
        if (lastNum > 0 && subtotal === 0) {
          subtotal = lastNum;
          taxableAmount = lastNum;
        }
      }
    }

    // 2. CGST
    if (l.includes("cgst")) {
      const nums = line.match(/(?:₹|rs\.?)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi);
      if (nums && nums.length > 0) {
        const lastNum = parseNumeric(nums[nums.length - 1]);
        if (lastNum > 0) cgst = Math.max(cgst, lastNum);
      }
    }

    // 3. SGST / UTGST
    if (l.includes("sgst") || l.includes("utgst")) {
      const nums = line.match(/(?:₹|rs\.?)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi);
      if (nums && nums.length > 0) {
        const lastNum = parseNumeric(nums[nums.length - 1]);
        if (lastNum > 0) sgst = Math.max(sgst, lastNum);
      }
    }

    // 4. IGST
    if (l.includes("igst")) {
      const nums = line.match(/(?:₹|rs\.?)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi);
      if (nums && nums.length > 0) {
        const lastNum = parseNumeric(nums[nums.length - 1]);
        if (lastNum > 0) igst = Math.max(igst, lastNum);
      }
    }

    // 5. Total GST / Total Tax
    if (
      l.includes("total gst") ||
      l.includes("total tax") ||
      l.includes("tax amount") ||
      l.includes("gst total") ||
      (l.startsWith("gst") && l.includes("total"))
    ) {
      const nums = line.match(/(?:₹|rs\.?)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi);
      if (nums && nums.length > 0) {
        const lastNum = parseNumeric(nums[nums.length - 1]);
        if (lastNum > 0) totalTax = Math.max(totalTax, lastNum);
      }
    }

    // 6. Grand Total / Invoice Total / Net Amount
    if (
      l.includes("grand total") ||
      l.includes("invoice total") ||
      l.includes("net total") ||
      l.includes("net amount") ||
      l.includes("total amount") ||
      l.includes("total payable") ||
      l.includes("total invoice amount")
    ) {
      const nums = line.match(/(?:₹|rs\.?)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi);
      if (nums && nums.length > 0) {
        const lastNum = parseNumeric(nums[nums.length - 1]);
        if (lastNum > 0) grandTotal = Math.max(grandTotal, lastNum);
      }
    }
  }

  // Derive total tax if not explicitly found
  if (totalTax === 0) {
    totalTax = Math.round((cgst + sgst + igst) * 100) / 100;
  }

  // Derive grand total if missing
  if (grandTotal === 0 && subtotal > 0 && totalTax > 0) {
    grandTotal = Math.round((subtotal + totalTax) * 100) / 100;
  }

  // Derive subtotal if missing
  if (subtotal === 0 && grandTotal > 0 && totalTax > 0 && grandTotal > totalTax) {
    subtotal = Math.round((grandTotal - totalTax) * 100) / 100;
  }

  const isTaxInclusive = totalTax > 0 || (grandTotal > subtotal && subtotal > 0);
  const effectiveTaxRate =
    subtotal > 0 && totalTax > 0 ? Math.round((totalTax / subtotal) * 1000) / 10 : undefined;

  return {
    subtotal: subtotal || 0,
    taxableAmount: taxableAmount || subtotal || 0,
    cgst,
    sgst,
    igst,
    totalTax,
    grandTotal: grandTotal || subtotal || 0,
    isTaxInclusive,
    effectiveTaxRate,
  };
}

// Generate a clean SKU from product name if none detected
function generateSkuFromName(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    return `${words[0].slice(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
  }
  const initials = words.slice(0, 3).map((w) => w[0].toUpperCase()).join("");
  return `${initials}-${Math.floor(100 + Math.random() * 900)}`;
}

// Filter out non-item lines (tax summaries, headers, bank details, footers)
function isExcludedLine(line: string): boolean {
  const l = line.toLowerCase().trim();
  if (l.length < 2) return true;
  return (
    l.startsWith("subtotal") ||
    l.startsWith("grand total") ||
    l.startsWith("total amount") ||
    l.startsWith("total taxable") ||
    l.startsWith("total qty") ||
    l.startsWith("round off") ||
    l.startsWith("buyer") ||
    l.startsWith("consignee") ||
    l.startsWith("customer") ||
    l.startsWith("billed to") ||
    l.startsWith("shipped to") ||
    l.startsWith("supplier") ||
    l.startsWith("seller") ||
    l.startsWith("vendor") ||
    l.startsWith("place of supply") ||
    l.startsWith("state code") ||
    l.startsWith("vehicle no") ||
    l.startsWith("e-way") ||
    l.startsWith("cgst") ||
    l.startsWith("sgst") ||
    l.startsWith("igst") ||
    l.startsWith("gstin") ||
    l.startsWith("pan no") ||
    l.startsWith("cin no") ||
    l.startsWith("terms") ||
    l.startsWith("bank name") ||
    l.startsWith("account no") ||
    l.startsWith("ifsc") ||
    l.startsWith("for ") ||
    l.startsWith("authorised signatory") ||
    l.startsWith("authorized signatory") ||
    l.startsWith("amount in words") ||
    l.startsWith("e. & o.e") ||
    l.includes("tax invoice") ||
    l.includes("bill of supply") ||
    l.includes("delivery challan") ||
    l.includes("original for recipient") ||
    l.includes("duplicate for transporter") ||
    (l.includes("description") && (l.includes("qty") || l.includes("rate") || l.includes("hsn"))) ||
    (l.includes("sl no") && (l.includes("particulars") || l.includes("description")))
  );
}

// Universal Multi-Strategy Invoice Parser
function parseInvoiceText(rawText: string): {
  invoiceNumber?: string;
  supplierName?: string;
  date?: string;
  items: ExtractedInvoiceItem[];
  summary: InvoiceFinancialSummary;
} {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let invoiceNumber: string | undefined;
  let supplierName: string | undefined;
  let date: string | undefined;

  // 1. Detect header metadata in the first 25 lines
  const headerLines = lines.slice(0, 25);
  for (const line of headerLines) {
    // Invoice / Bill Number
    if (!invoiceNumber) {
      const invMatch = line.match(
        /\b(?:Invoice|Bill|Inv|Challan|Receipt)\s*(?:No|Num|Number|#|\.)\s*[:\-#]?\s*([A-Za-z0-9\-_/]{2,25})\b/i
      );
      if (invMatch && !invMatch[1].toLowerCase().includes("invoice")) {
        invoiceNumber = invMatch[1].trim();
      }
    }
    // Date
    if (!date) {
      const dateMatch = line.match(
        /(?:Date|Dated|Bill Date|Inv Date)\s*[:\-]?\s*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4}|\d{4}[-/\.]\d{1,2}[-/\.]\d{1,2})/i
      );
      if (dateMatch) date = dateMatch[1].trim();
    }
    // Supplier Name heuristic
    if (!supplierName) {
      const supMatch = line.match(
        /(?:Supplier|Vendor|Seller|From|M\/s|M\/S)\s*[:\-]?\s*([A-Za-z0-9\s\.\-_&]{3,50})/i
      );
      if (supMatch) {
        supplierName = supMatch[1].trim();
      } else if (
        !line.match(
          /tax|invoice|bill|gstin|pan|original|duplicate|gst|page|to:|buyer:|consignee:|customer:|sl\s*no|date/i
        )
      ) {
        if (line.length >= 3 && line.length <= 50 && /[a-zA-Z]/.test(line)) {
          supplierName = line.replace(/^[0-9\.\-\s]+/, "").trim();
        }
      }
    }
  }

  const items: ExtractedInvoiceItem[] = [];
  const visitedNames = new Set<string>();

  // Helper to add item safely
  const addItem = (
    rawName: string,
    qty: number,
    rate: number,
    unitStr?: string,
    hsnCode?: string
  ) => {
    let cleanName = rawName
      .replace(/^[\d\.\-\)\#\s]+/, "") // Remove leading "1.", "1)", "#1"
      .replace(/[\s\t]+/g, " ") // Normalize spaces
      .trim();

    // If cleanName ends with a 4-8 digit number, extract it as HSN
    const trailingHsn = cleanName.match(/\s+(\d{4,8})$/);
    if (trailingHsn) {
      if (!hsnCode) hsnCode = trailingHsn[1];
      cleanName = cleanName.slice(0, trailingHsn.index).trim();
    }

    if (cleanName.length < 2 || qty <= 0 || rate <= 0) return false;

    // Check if name is just numbers or gibberish
    if (!/[a-zA-Z]/.test(cleanName)) return false;

    const lowerKey = cleanName.toLowerCase();
    if (visitedNames.has(lowerKey)) return false;
    visitedNames.add(lowerKey);

    const unit = normalizeUnit(unitStr || "Units");
    const suggestedSellingPrice =
      rate > 0 ? Math.max(Math.round(rate * 1.25), Math.round(rate + 1)) : 0;

    items.push({
      name: cleanName,
      sku: hsnCode ? `SKU-${hsnCode}` : generateSkuFromName(cleanName),
      quantity: qty,
      unit,
      baseCostPrice: Math.round(rate * 100) / 100,
      costPrice: Math.round(rate * 100) / 100,
      suggestedSellingPrice,
      hsn: hsnCode,
    });
    return true;
  };

  // 2. Iterate through lines with multi-strategy parsing
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isExcludedLine(line)) continue;

    // -------------------------------------------------------------
    // STRATEGY 1: Column-based delimiter parsing (tabs, pipes, 2+ spaces, or commas)
    // -------------------------------------------------------------
    let delimiter: "pipe" | "tab" | "multispace" | "comma" | null = null;
    if (line.includes("|")) delimiter = "pipe";
    else if (line.includes("\t")) delimiter = "tab";
    else if (/\s{2,}/.test(line)) delimiter = "multispace";
    else if (line.includes(",") && (line.match(/,/g) || []).length >= 3) delimiter = "comma";

    if (delimiter) {
      let cols: string[] = [];
      if (delimiter === "pipe") cols = line.split("|");
      else if (delimiter === "tab") cols = line.split("\t");
      else if (delimiter === "multispace") cols = line.split(/\s{2,}/);
      else if (delimiter === "comma") cols = line.split(",");

      cols = cols.map((c) => c.trim()).filter(Boolean);

      if (cols.length >= 3) {
        // Find where product description is
        let startIdx = 0;
        // Skip serial number column (e.g. "1", "2.", "01", "[1]")
        if (/^\d{1,4}[\.\)]?$/.test(cols[0])) {
          startIdx = 1;
        }

        if (startIdx < cols.length) {
          const rawName = cols[startIdx];
          if (rawName && rawName.length >= 2 && /[a-zA-Z]/.test(rawName)) {
            const rest = cols.slice(startIdx + 1);
            let hsn: string | undefined;
            let qty = 0;
            let unit = "Units";
            let rate = 0;

            let r = 0;
            // Check if rest[0] is HSN code (4 to 8 digit number)
            if (r < rest.length && /^\d{4,8}$/.test(rest[r])) {
              hsn = rest[r];
              r++;
            }

            // Look for Quantity
            if (r < rest.length) {
              const qNum = parseNumeric(rest[r]);
              if (qNum > 0) {
                qty = qNum;
                r++;
              }
            }

            // Look for Unit (e.g. "PCS", "PKT", "KG", "BOX", "NOS", "BAG")
            if (r < rest.length && /^[a-zA-Z]{2,8}$/.test(rest[r])) {
              unit = rest[r];
              r++;
            }

            // Look for Rate / Cost
            if (r < rest.length) {
              const rNum = parseNumeric(rest[r]);
              if (rNum > 0) {
                rate = rNum;
                r++;
              }
            }

            // If rate was not found yet, inspect remaining columns for numbers
            if (rate === 0 && r < rest.length) {
              for (let colIdx = r; colIdx < rest.length; colIdx++) {
                const val = parseNumeric(rest[colIdx]);
                if (val > 0) {
                  rate = val;
                  break;
                }
              }
            }

            if (qty > 0 && rate > 0) {
              if (addItem(rawName, qty, rate, unit, hsn)) {
                continue;
              }
            }
          }
        }
      }
    }

    // -------------------------------------------------------------
    // STRATEGY 2: Multi-line description continuation
    // Description is on line i, and numeric data (HSN, Qty, Unit, Rate) is on line i + 1
    // -------------------------------------------------------------
    if (i < lines.length - 1) {
      const nextLine = lines[i + 1];
      if (!isExcludedLine(nextLine)) {
        // Check if nextLine has numeric table columns
        const nextTokens = nextLine.split(/\s{2,}|\t+|\|/).map((t) => t.trim()).filter(Boolean);
        const hasTextDescription = nextTokens.some(
          (t) =>
            t.length > 6 &&
            /[a-zA-Z]{3,}/.test(t) &&
            !/^(boxes|pcs|box|pc|nos|kg|kilo|bag|bags|pks|pack|pkt|units|ltr|litre|btl)$/i.test(t)
        );

        if (nextTokens.length >= 2 && !hasTextDescription) {
          let hsn: string | undefined;
          let qty = 0;
          let unit = "Units";
          let rate = 0;

          let r = 0;
          if (/^\d{4,8}$/.test(nextTokens[0])) {
            hsn = nextTokens[0];
            r++;
          }
          if (r < nextTokens.length) {
            const q = parseNumeric(nextTokens[r]);
            if (q > 0) {
              qty = q;
              r++;
            }
          }
          if (r < nextTokens.length && /^[a-zA-Z]{2,8}$/.test(nextTokens[r])) {
            unit = nextTokens[r];
            r++;
          }
          if (r < nextTokens.length) {
            const rt = parseNumeric(nextTokens[r]);
            if (rt > 0) {
              rate = rt;
              r++;
            }
          }

          if (qty > 0 && rate > 0 && line.length >= 2 && /[a-zA-Z]/.test(line)) {
            if (addItem(line, qty, rate, unit, hsn)) {
              i++; // Advance past nextLine
              continue;
            }
          }
        }
      }
    }

    // -------------------------------------------------------------
    // STRATEGY 3: Key-Value / Tagged Line (e.g. "Item: White Soap Qty: 20 Rate: 150")
    // -------------------------------------------------------------
    const kwMatch = line.match(
      /(?:item|product|desc)?[:\s]*([A-Za-z0-9\s\.\-_/'"&]+?)(?:qty|quantity|count)[:\s]+(\d+(?:\.\d+)?)\s*([a-zA-Z]{2,6})?\s*(?:rate|price|cost|mrp)?[:\s]+(?:₹|rs\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i
    );
    if (kwMatch) {
      const rawName = kwMatch[1].trim();
      const qty = parseNumeric(kwMatch[2]);
      const unit = kwMatch[3] || "Pcs";
      const rate = parseNumeric(kwMatch[4]);
      if (addItem(rawName, qty, rate, unit)) {
        continue;
      }
    }

    // -------------------------------------------------------------
    // STRATEGY 4: Flexible Single-Line Pattern (Spaces + trailing Qty + Rate)
    // Matches: [Product Name] [Qty] [Unit?] [Rate] [Total?]
    // -------------------------------------------------------------
    const flexibleMatch = line.match(
      /^(?:(\d{1,4})[\.\)\s]+)?([A-Za-z][A-Za-z0-9\s\.\-_/'"&]{2,50}?)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]{2,6})?\s+(?:₹|Rs\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)(?:\s+(?:₹|Rs\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?))?$/i
    );
    if (flexibleMatch) {
      const rawName = flexibleMatch[2].trim();
      const qty = parseNumeric(flexibleMatch[3]);
      const unit = flexibleMatch[4] || "Units";
      const rate = parseNumeric(flexibleMatch[5]);
      if (addItem(rawName, qty, rate, unit)) {
        continue;
      }
    }
  }

  // 3. Extract Bill-Level Financial & Tax Summary
  const summary = extractInvoiceFinancialSummary(rawText);

  // 4. Calculate Proportional GST-Inclusive Cost Price for Each Item
  const totalItemsBaseAmount = items.reduce(
    (sum, it) => sum + it.quantity * it.baseCostPrice,
    0
  );

  let effectiveTaxToAllocate = 0;
  if (summary.totalTax > 0) {
    effectiveTaxToAllocate = summary.totalTax;
  } else if (
    summary.grandTotal > 0 &&
    summary.subtotal > 0 &&
    summary.grandTotal > summary.subtotal
  ) {
    effectiveTaxToAllocate = Math.round((summary.grandTotal - summary.subtotal) * 100) / 100;
  } else if (
    summary.grandTotal > 0 &&
    totalItemsBaseAmount > 0 &&
    summary.grandTotal > totalItemsBaseAmount + 1
  ) {
    effectiveTaxToAllocate = Math.round((summary.grandTotal - totalItemsBaseAmount) * 100) / 100;
  }

  // Ambiguity checks
  let isAmbiguous = false;
  let ambiguityReason = "";

  if (summary.grandTotal > 0 && summary.subtotal > 0 && summary.totalTax > 0) {
    const expectedTotal = summary.subtotal + summary.totalTax;
    if (Math.abs(summary.grandTotal - expectedTotal) > 5) {
      isAmbiguous = true;
      ambiguityReason = `Invoice summary mismatch: Grand Total (₹${summary.grandTotal}) ≠ Subtotal + Tax (₹${expectedTotal}). Please verify item costs.`;
    }
  }

  if (
    totalItemsBaseAmount > 0 &&
    summary.subtotal > 0 &&
    Math.abs(totalItemsBaseAmount - summary.subtotal) > summary.subtotal * 0.25
  ) {
    isAmbiguous = true;
    ambiguityReason = `Extracted items base total (₹${totalItemsBaseAmount}) differs significantly from invoice subtotal (₹${summary.subtotal}). Please verify item costs.`;
  }

  // Allocate tax to each item
  for (const it of items) {
    if (effectiveTaxToAllocate > 0 && totalItemsBaseAmount > 0) {
      const itemBaseTotal = it.quantity * it.baseCostPrice;
      const allocatedTax = (itemBaseTotal / totalItemsBaseAmount) * effectiveTaxToAllocate;
      const taxPerUnit = Math.round((allocatedTax / it.quantity) * 100) / 100;
      const inclusiveCost = Math.round((it.baseCostPrice + taxPerUnit) * 100) / 100;
      const effectiveRate =
        it.baseCostPrice > 0 ? Math.round((taxPerUnit / it.baseCostPrice) * 1000) / 10 : 0;

      it.costPrice = inclusiveCost;
      it.taxAmount = taxPerUnit;
      it.taxRate = effectiveRate;
      it.suggestedSellingPrice = Math.max(
        Math.round(inclusiveCost * 1.25),
        Math.round(inclusiveCost + 1)
      );
    } else {
      it.costPrice = it.baseCostPrice;
      it.taxAmount = 0;
      it.taxRate = 0;
    }

    if (isAmbiguous) {
      it.requiresReview = true;
      it.reviewReason = ambiguityReason;
    }
  }

  return {
    invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
    supplierName: supplierName || "Supplier Invoice",
    date: date || new Date().toISOString().split("T")[0],
    items,
    summary,
  };
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let fullText = "";
    let totalPages = 1;

    // Handle Option A: JSON payload with direct text / table paste
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      fullText = typeof body?.text === "string" ? body.text.trim() : "";

      if (!fullText) {
        return NextResponse.json(
          { success: false, error: "No invoice text provided in request body." },
          { status: 400 }
        );
      }
    } else {
      // Handle Option B: Multipart FormData file or text upload
      const formData = await req.formData();
      const directText = formData.get("text");

      if (typeof directText === "string" && directText.trim().length > 0) {
        fullText = directText.trim();
      } else {
        const file = formData.get("file") as File | null;

        if (!file) {
          return NextResponse.json(
            { success: false, error: "No PDF file or invoice text provided." },
            { status: 400 }
          );
        }

        // Validate file size
        if (file.size === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "The uploaded PDF file is empty (0 bytes). Please upload a valid invoice PDF.",
            },
            { status: 400 }
          );
        }

        // Max 15MB
        if (file.size > 15 * 1024 * 1024) {
          return NextResponse.json(
            {
              success: false,
              error: "File size exceeds 15MB limit. Please upload a smaller PDF.",
            },
            { status: 400 }
          );
        }

        // Convert file to ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "Could not read data from this PDF file (empty buffer).",
            },
            { status: 400 }
          );
        }

        const buffer = new Uint8Array(arrayBuffer);

        // Extract digital text streams using unpdf
        try {
          const pdfResult = await extractText(buffer);
          totalPages = pdfResult.totalPages || 1;
          fullText = Array.isArray(pdfResult.text)
            ? pdfResult.text.join("\n")
            : String(pdfResult.text || "");
        } catch (unpdfErr: any) {
          console.error("unpdf extraction failure:", unpdfErr);
          return NextResponse.json(
            {
              success: false,
              error:
                "Failed to parse PDF format. If this is a scanned image or protected bill, please use the 'Paste Bill Text' tab to paste invoice items.",
            },
            { status: 422 }
          );
        }
      }
    }

    if (!fullText || fullText.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No readable text was found in this PDF. It may be a scanned paper photo or password protected. Please use the 'Paste Bill Text' tab or upload a digital PDF.",
        },
        { status: 422 }
      );
    }

    // Parse extracted text into structured items using universal multi-strategy parser
    const parsed = parseInvoiceText(fullText);

    if (parsed.items.length === 0) {
      return NextResponse.json({
        success: false,
        error:
          "No product line items could be automatically recognized from this layout. You can paste the text directly in the 'Paste Bill Text' tab or review the sample bill.",
        rawTextPreview: fullText.slice(0, 1000),
      });
    }

    return NextResponse.json({
      success: true,
      totalPages,
      invoiceNumber: parsed.invoiceNumber,
      supplierName: parsed.supplierName,
      date: parsed.date,
      items: parsed.items,
      summary: parsed.summary,
      rawTextPreview: fullText.slice(0, 600),
    });
  } catch (error: any) {
    console.error("PDF Extraction API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred while processing the invoice.",
      },
      { status: 500 }
    );
  }
}
