import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";

interface ExtractedInvoiceItem {
  name: string;
  sku?: string;
  quantity: number;
  unit: string;
  costPrice: number;
  suggestedSellingPrice: number;
  hsn?: string;
}

interface ExtractedInvoiceResult {
  success: boolean;
  invoiceNumber?: string;
  supplierName?: string;
  date?: string;
  items: ExtractedInvoiceItem[];
  rawTextPreview?: string;
  error?: string;
}

// Unit normalizer
function normalizeUnit(unitStr: string): string {
  const u = (unitStr || "").toLowerCase().trim();
  if (u.includes("box")) return "Boxes";
  if (u.includes("pc") || u.includes("nos") || u.includes("piece")) return "Pcs";
  if (u.includes("kg") || u.includes("kilo")) return "Kg";
  if (u.includes("bag") || u.includes("pkt") || u.includes("pack")) return "Pks";
  if (u.includes("ltr") || u.includes("liter") || u.includes("litre")) return "Litres";
  return "Units";
}

// Clean number strings (e.g. "1,250.00", "₹720", "Rs. 45")
function parseNumeric(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
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

// Parse lines into structured items
function parseInvoiceText(rawText: string): {
  invoiceNumber?: string;
  supplierName?: string;
  date?: string;
  items: ExtractedInvoiceItem[];
} {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let invoiceNumber: string | undefined;
  let supplierName: string | undefined;
  let date: string | undefined;

  // 1. Detect header info in the first 20 lines
  const headerLines = lines.slice(0, 20);
  for (const line of headerLines) {
    // Invoice Number
    if (!invoiceNumber) {
      const invMatch = line.match(/(?:Invoice|Bill|Inv|Challan)\s*(?:No|#|\.?)\s*[:\-]?\s*([A-Za-z0-9\-_/]{3,20})/i);
      if (invMatch) invoiceNumber = invMatch[1].trim();
    }
    // Date
    if (!date) {
      const dateMatch = line.match(/(?:Date|Dated)\s*[:\-]?\s*(\d{1,2}[-/\.]\d{1,2}[-/\.]\d{2,4})/i);
      if (dateMatch) date = dateMatch[1].trim();
    }
    // Supplier Name heuristic (first bold/all-caps line that doesn't look like generic header)
    if (!supplierName && !line.match(/tax|invoice|bill|gstin|original|duplicate|gst|page|to:/i)) {
      if (line.length >= 3 && line.length <= 50 && /[a-zA-Z]/.test(line)) {
        supplierName = line.replace(/^[0-9\.\-\s]+/, "").trim();
      }
    }
  }

  const items: ExtractedInvoiceItem[] = [];
  const visitedNames = new Set<string>();

  // Filter out non-table lines (headers, footers, tax breakdowns, totals)
  const isExcludedLine = (line: string): boolean => {
    const l = line.toLowerCase();
    return (
      l.startsWith("subtotal") ||
      l.startsWith("grand total") ||
      l.startsWith("total amount") ||
      l.startsWith("cgst") ||
      l.startsWith("sgst") ||
      l.startsWith("igst") ||
      l.startsWith("gstin") ||
      l.startsWith("terms & conditions") ||
      l.startsWith("bank details") ||
      l.startsWith("for ") ||
      l.startsWith("authorised signatory") ||
      l.startsWith("amount in words") ||
      l.includes("description of goods") ||
      l.includes("tax invoice") ||
      l.includes("rate per")
    );
  };

  // Heuristic Line Pattern 1: Table row with S.No / Qty / Rate / Amount
  // e.g.: "1 Sun flower white soap 3401 50 Boxes 720.00 36000.00"
  // or: "Parle-G Gold Biscuits 24 Pcs 25.00 600.00"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isExcludedLine(line)) continue;

    // Pattern A: Line contains numbers at the end (Qty, Rate, Total)
    // Matches: [Name / SKU] ... [Qty] [Unit?] [Rate] [Total]
    const rowPattern =
      /(?:^\d+\s+)?([A-Za-z0-9\s\.\-_/'"&]+?)\s+(?:(\d{4,8})\s+)?(\d+(?:\.\d+)?)\s*(boxes|pcs|box|pc|nos|kg|pks|units|litres|ltr|bags)?\s+(?:₹|Rs\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s+(?:₹|Rs\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)$/i;

    const matchA = line.match(rowPattern);
    if (matchA) {
      const rawName = matchA[1].trim();
      const hsn = matchA[2];
      const qty = parseNumeric(matchA[3]);
      const unit = normalizeUnit(matchA[4] || "Units");
      const cost = parseNumeric(matchA[5]);

      if (rawName.length >= 3 && qty > 0 && cost > 0 && !visitedNames.has(rawName.toLowerCase())) {
        visitedNames.add(rawName.toLowerCase());
        const suggestedSellingPrice = Math.round(cost * 1.25); // 25% default recommended retail margin
        items.push({
          name: rawName,
          sku: hsn ? `SKU-${hsn}` : generateSkuFromName(rawName),
          quantity: qty,
          unit,
          costPrice: cost,
          suggestedSellingPrice: suggestedSellingPrice > cost ? suggestedSellingPrice : Math.round(cost * 1.1),
          hsn,
        });
        continue;
      }
    }

    // Pattern B: Keyword-based line (e.g. "Item: White Soap Qty: 20 Rate: 150")
    const keywordMatch = line.match(
      /(.+?)(?:qty|quantity)[:\s]+(\d+(?:\.\d+)?)\s*(?:rate|price|cost)[:\s]+(?:₹|rs\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)/i
    );
    if (keywordMatch) {
      const rawName = keywordMatch[1].replace(/^[0-9\.\-\s]+/, "").trim();
      const qty = parseNumeric(keywordMatch[2]);
      const cost = parseNumeric(keywordMatch[3]);
      if (rawName.length >= 3 && qty > 0 && cost > 0 && !visitedNames.has(rawName.toLowerCase())) {
        visitedNames.add(rawName.toLowerCase());
        const suggestedSellingPrice = Math.round(cost * 1.25);
        items.push({
          name: rawName,
          sku: generateSkuFromName(rawName),
          quantity: qty,
          unit: "Pcs",
          costPrice: cost,
          suggestedSellingPrice: suggestedSellingPrice > cost ? suggestedSellingPrice : Math.round(cost * 1.1),
        });
        continue;
      }
    }

    // Pattern C: Two-line layout (Name on line i, numbers on line i+1)
    if (i < lines.length - 1) {
      const nextLine = lines[i + 1];
      const numbersOnlyMatch = nextLine.match(
        /^(?:(\d{4,8})\s+)?(\d+(?:\.\d+)?)\s*(boxes|pcs|box|pc|nos|kg|pks|units)?\s+(?:₹|Rs\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?)(?:\s+(?:₹|Rs\.?)?\s*(\d+(?:,\d+)*(?:\.\d+)?))?$/i
      );
      if (numbersOnlyMatch && line.length >= 3 && line.length <= 60 && /[a-zA-Z]/.test(line)) {
        const rawName = line.replace(/^[0-9\.\-\s]+/, "").trim();
        const hsn = numbersOnlyMatch[1];
        const qty = parseNumeric(numbersOnlyMatch[2]);
        const unit = normalizeUnit(numbersOnlyMatch[3] || "Units");
        const cost = parseNumeric(numbersOnlyMatch[4]);

        if (qty > 0 && cost > 0 && !visitedNames.has(rawName.toLowerCase())) {
          visitedNames.add(rawName.toLowerCase());
          const suggestedSellingPrice = Math.round(cost * 1.25);
          items.push({
            name: rawName,
            sku: hsn ? `SKU-${hsn}` : generateSkuFromName(rawName),
            quantity: qty,
            unit,
            costPrice: cost,
            suggestedSellingPrice: suggestedSellingPrice > cost ? suggestedSellingPrice : Math.round(cost * 1.1),
            hsn,
          });
          i++; // advance past next line
        }
      }
    }
  }

  return {
    invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
    supplierName: supplierName || "Supplier Invoice",
    date: date || new Date().toISOString().split("T")[0],
    items,
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No PDF file provided." }, { status: 400 });
    }

    // Validate mime type
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      return NextResponse.json(
        { success: false, error: "Invalid file format. Please upload a PDF file (.pdf)." },
        { status: 400 }
      );
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 10MB limit. Please upload a smaller PDF." },
        { status: 400 }
      );
    }

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Extract text using unpdf
    const { text, totalPages } = await extractText(buffer);
    const fullText = Array.isArray(text) ? text.join("\n") : String(text || "");

    if (!fullText || fullText.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unable to read text from this PDF. It may be a scanned image or protected. Please upload a text-based digital PDF invoice.",
        },
        { status: 422 }
      );
    }

    // Parse extracted text into structured items
    const parsed = parseInvoiceText(fullText);

    return NextResponse.json({
      success: true,
      totalPages,
      invoiceNumber: parsed.invoiceNumber,
      supplierName: parsed.supplierName,
      date: parsed.date,
      items: parsed.items,
      rawTextPreview: fullText.slice(0, 500),
    });
  } catch (error: any) {
    console.error("PDF Extraction API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to process PDF invoice.",
      },
      { status: 500 }
    );
  }
}
