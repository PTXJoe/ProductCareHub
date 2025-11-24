import PDFDocument from "pdfkit";
import { Response } from "express";
import type { Product, Brand } from "@shared/schema";

export function generateWarrantyCertificatePDF(res: Response, product: Product & { brand: Brand }) {
  const doc = new PDFDocument();
  
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="warranty-certificate-${product.id}.pdf"`
  );

  doc.pipe(res);

  const warrantyExpiration = new Date(product.warrantyExpiration);
  const daysRemaining = Math.ceil(
    (warrantyExpiration.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const isExpired = daysRemaining < 0;

  // Title
  doc.fontSize(24).font("Helvetica-Bold").text("CERTIFICADO DE GARANTIA", { align: "center" });
  doc.fontSize(12).text("WARRANTY CERTIFICATE", { align: "center" });
  doc.moveDown();

  // Product Info
  doc.fontSize(11).font("Helvetica-Bold").text("INFORMAÇÃO DO PRODUTO / PRODUCT INFORMATION");
  doc.fontSize(10).font("Helvetica");
  doc.text(`Produto / Product: ${product.name}`);
  doc.text(`Marca / Brand: ${product.brand.name}`);
  doc.text(`Modelo / Model: ${product.model}`);
  doc.text(`Número de Série / Serial Number: ${product.serialNumber || "N/A"}`);
  doc.moveDown();

  // Warranty Info
  doc.fontSize(11).font("Helvetica-Bold").text("INFORMAÇÃO DE GARANTIA / WARRANTY INFORMATION");
  doc.fontSize(10).font("Helvetica");
  doc.text(
    `Data de Compra / Purchase Date: ${new Date(product.purchaseDate).toLocaleDateString("pt-PT")}`
  );
  doc.text(
    `Expiração da Garantia / Warranty Expiration: ${warrantyExpiration.toLocaleDateString("pt-PT")}`
  );
  doc.text(`Período de Garantia / Warranty Period: 3 Years EU Warranty`);
  doc.text(`Status: ${isExpired ? "EXPIRADA / EXPIRED" : "VÁLIDA / VALID"}`);
  if (!isExpired) {
    doc.text(`Dias Restantes / Days Remaining: ${Math.max(daysRemaining, 0)}`);
  }
  doc.moveDown();

  // Manufacturer Contact
  doc.fontSize(11).font("Helvetica-Bold").text("CONTACTO DO FABRICANTE / MANUFACTURER CONTACT");
  doc.fontSize(10).font("Helvetica");
  doc.text(`Email: ${product.brand.supportEmail}`);
  if (product.brand.supportPhone) {
    doc.text(`Phone: ${product.brand.supportPhone}`);
  }
  if (product.brand.website) {
    doc.text(`Website: ${product.brand.website}`);
  }
  doc.moveDown(2);

  // Footer
  doc.fontSize(9).font("Helvetica");
  doc.text(
    "Este certificado certifica que o produto acima está coberto pela garantia europeia de 3 anos.",
    { align: "center" }
  );
  doc.text(
    "This certificate certifies that the above product is covered under the European 3-year warranty period.",
    { align: "center" }
  );
  doc.moveDown();
  doc.text(`Gerado em / Generated on: ${new Date().toLocaleDateString("pt-PT")}`, { align: "center" });

  doc.end();
}
