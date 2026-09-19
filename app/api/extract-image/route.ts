import { NextRequest, NextResponse } from "next/server";

// SSRF prevention: validate host is a public domain/IP
function isSafeUrl(urlString: string): { safe: boolean; error?: string; url?: URL } {
  try {
    const parsed = new URL(urlString);

    // Only allow HTTP/HTTPS
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { safe: false, error: "Only http and https protocols are supported." };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost, loopbacks, internal network
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "0.0.0.0" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname === "169.254.169.254" // AWS/cloud metadata
    ) {
      return { safe: false, error: "Access to private or local resources is forbidden." };
    }

    // Check private IPv4 ranges
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const [, o1, o2] = ipMatch.map(Number);
      if (
        o1 === 10 || // 10.0.0.0/8
        o1 === 127 || // 127.0.0.0/8
        (o1 === 172 && o2 >= 16 && o2 <= 31) || // 172.16.0.0/12
        (o1 === 192 && o2 === 168) || // 192.168.0.0/16
        (o1 === 169 && o2 === 254) // 169.254.0.0/16
      ) {
        return { safe: false, error: "Access to internal IP ranges is forbidden." };
      }
    }

    return { safe: true, url: parsed };
  } catch {
    return { safe: false, error: "Invalid URL provided." };
  }
}

// Extract primary image from HTML
function extractImageFromHtml(html: string, baseUrl: string): string | null {
  // 1. Open Graph: <meta property="og:image" content="..."> or <meta property="og:image:url" content="...">
  const ogMatch =
    html.match(/<meta[^>]+property=["']og:image(?::url)?["'][^>]+content=["']([^"'>]+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"'>]+)["'][^>]+property=["']og:image(?::url)?["']/i);
  if (ogMatch && ogMatch[1]) {
    return resolveUrl(ogMatch[1].trim(), baseUrl);
  }

  // 2. Twitter: <meta name="twitter:image" content="..."> or <meta name="twitter:image:src" content="...">
  const twitterMatch =
    html.match(/<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"'>]+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"'>]+)["'][^>]+name=["']twitter:image(?::src)?["']/i);
  if (twitterMatch && twitterMatch[1]) {
    return resolveUrl(twitterMatch[1].trim(), baseUrl);
  }

  // 3. Schema.org JSON-LD: Product -> image
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        // If Product schema or has image
        if (item.image) {
          if (typeof item.image === "string") {
            return resolveUrl(item.image.trim(), baseUrl);
          }
          if (Array.isArray(item.image) && typeof item.image[0] === "string") {
            return resolveUrl(item.image[0].trim(), baseUrl);
          }
          if (typeof item.image === "object" && item.image.url) {
            return resolveUrl(String(item.image.url).trim(), baseUrl);
          }
        }
      }
    } catch {
      // Continue to next script tag
    }
  }

  // 4. Microdata / Schema image link: <link rel="image_src" href="...">
  const linkMatch = html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"'>]+)["']/i);
  if (linkMatch && linkMatch[1]) {
    return resolveUrl(linkMatch[1].trim(), baseUrl);
  }

  return null;
}

function resolveUrl(relativeOrAbsolute: string, baseUrl: string): string {
  try {
    return new URL(relativeOrAbsolute, baseUrl).toString();
  } catch {
    return relativeOrAbsolute;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawUrl = typeof body?.url === "string" ? body.url.trim() : "";

    if (!rawUrl) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid product URL." },
        { status: 400 }
      );
    }

    const validation = isSafeUrl(rawUrl);
    if (!validation.safe || !validation.url) {
      return NextResponse.json(
        { success: false, error: validation.error || "Invalid or restricted URL." },
        { status: 400 }
      );
    }

    // AbortController with 8-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let response: Response;
    try {
      response = await fetch(validation.url.toString(), {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
        redirect: "follow",
      });
    } catch (fetchErr: unknown) {
      clearTimeout(timeout);
      const isAbort = (fetchErr as Error)?.name === "AbortError";
      return NextResponse.json(
        {
          success: false,
          error: isAbort
            ? "Website took too long to respond (timeout)."
            : "Could not connect to the specified website.",
        },
        { status: 422 }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Website returned error status: ${response.status}`,
        },
        { status: 422 }
      );
    }

    // Limit read size to 2MB to prevent memory exhaustion
    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json(
        { success: false, error: "Unable to read page content." },
        { status: 422 }
      );
    }

    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;
    const maxBytes = 2 * 1024 * 1024; // 2MB

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        receivedBytes += value.length;
        if (receivedBytes > maxBytes) {
          reader.cancel();
          break;
        }
      }
    }

    const decoder = new TextDecoder("utf-8");
    const html = chunks.map((c) => decoder.decode(c, { stream: true })).join("");

    const extractedImageUrl = extractImageFromHtml(html, response.url || rawUrl);

    if (!extractedImageUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Couldn't extract a product image from this link. You can enter or upload an image manually.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: extractedImageUrl,
      sourceUrl: rawUrl,
    });
  } catch (err) {
    console.error("Image extraction error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while extracting the product image.",
      },
      { status: 500 }
    );
  }
}
