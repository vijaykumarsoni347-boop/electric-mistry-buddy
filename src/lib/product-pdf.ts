import { jsPDF } from "jspdf";

export interface PdfProduct {
  name: string;
  brand?: string | null;
  category?: string | null;
  sku?: string | null;
  image_url?: string | null;
  stock_quantity: number;
  wholesale_price: number;
  retail_price: number;
}

const money = (v: number) => `Rs ${Math.round(Number(v)).toLocaleString("en-IN")}`;

async function toDataUrl(url: string): Promise<{ data: string; format: string } | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    const type = blob.type || "";
    if (!type.startsWith("image/")) return null;
    const format = type.includes("png") ? "PNG" : type.includes("webp") ? "WEBP" : "JPEG";
    const data: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return { data, format };
  } catch {
    return null;
  }
}

export async function makeProductPdf(products: PdfProduct[], shopName = "Rate List"): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const pageH = 297;
  const margin = 12;
  let y = margin;

  doc.setFontSize(18);
  doc.text(shopName, margin, y + 6);
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(
    `Saman ki Rate List  •  ${new Date().toLocaleDateString("en-IN")}  •  ${products.length} saman`,
    margin,
    y + 12,
  );
  doc.setTextColor(0);
  y += 20;

  const rowH = 30;

  for (const p of products) {
    if (y + rowH > pageH - margin) {
      doc.addPage();
      y = margin;
    }

    doc.setDrawColor(220);
    doc.roundedRect(margin, y, pageW - margin * 2, rowH - 4, 2, 2);

    const imgBox = 22;
    const imgX = margin + 2;
    const imgY = y + 2;
    let img: { data: string; format: string } | null = null;
    if (p.image_url) img = await toDataUrl(p.image_url);
    if (img) {
      try {
        doc.addImage(img.data, img.format, imgX, imgY, imgBox, imgBox);
      } catch {
        /* image skip */
      }
    } else {
      doc.setDrawColor(230);
      doc.rect(imgX, imgY, imgBox, imgBox);
      doc.setFontSize(7);
      doc.setTextColor(160);
      doc.text("Photo nahi", imgX + 3, imgY + imgBox / 2);
      doc.setTextColor(0);
    }

    const tx = imgX + imgBox + 4;
    doc.setFontSize(12);
    doc.text(doc.splitTextToSize(p.name, 95)[0] ?? p.name, tx, y + 8);
    doc.setFontSize(9);
    doc.setTextColor(110);
    const sub = [p.brand, p.category, p.sku ? `Code: ${p.sku}` : null].filter(Boolean).join("  •  ");
    if (sub) doc.text(sub, tx, y + 13.5);
    doc.text(p.stock_quantity > 0 ? `Dukaan me hai: ${p.stock_quantity}` : "Abhi khatam", tx, y + 19);
    doc.setTextColor(0);

    const rx = pageW - margin - 4;
    doc.setFontSize(10);
    doc.text(`Grahak ka rate: ${money(p.retail_price)}`, rx, y + 10, { align: "right" });
    doc.setFontSize(11);
    doc.text(`Mistri ka rate: ${money(p.wholesale_price)}`, rx, y + 17, { align: "right" });
    doc.setFontSize(9);
    doc.setTextColor(0, 130, 60);
    doc.text(
      `Aapka fayda: ${money(Number(p.retail_price) - Number(p.wholesale_price))}`,
      rx,
      y + 22.5,
      { align: "right" },
    );
    doc.setTextColor(0);

    y += rowH;
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} / ${pages}`, pageW / 2, pageH - 6, { align: "center" });
  }

  return doc.output("blob");
}

export async function shareOrDownloadPdf(blob: Blob, fileName: string) {
  const file = new File([blob], fileName, { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "Saman ki Rate List" });
      return "shared";
    } catch {
      /* user cancelled -> fall through to download */
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
