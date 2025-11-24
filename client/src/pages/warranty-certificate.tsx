import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import PDFDocument from "pdfkit";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { ProductWithDetails } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function WarrantyCertificate() {
  const { id } = useParams();
  
  const { data: product, isLoading } = useQuery<ProductWithDetails>({
    queryKey: [`/api/products/${id}`],
    enabled: !!id,
  });

  const handleExportPDF = () => {
    if (!product) return;

    const warrantyExpiration = new Date(product.warrantyExpiration);
    const daysRemaining = Math.ceil(
      (warrantyExpiration.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    // Create PDF download
    const content = `
WARRANTY CERTIFICATE / CERTIFICADO DE GARANTIA

Product / Produto: ${product.name}
Brand / Marca: ${product.brand.name}
Model / Modelo: ${product.model}
Serial Number / Número de Série: ${product.serialNumber || "N/A"}
Category / Categoria: ${product.category}

Purchase Date / Data de Compra: ${new Date(product.purchaseDate).toLocaleDateString("pt-PT")}
Warranty Expiration / Expiração da Garantia: ${warrantyExpiration.toLocaleDateString("pt-PT")}
Warranty Period / Período de Garantia: 3 Years EU Warranty

Status: ${daysRemaining < 0 ? "EXPIRED" : "VALID"}
Days Remaining / Dias Restantes: ${Math.max(daysRemaining, 0)}

Manufacturer Support / Suporte do Fabricante:
Email: ${product.brand.supportEmail}
Phone: ${product.brand.supportPhone || "N/A"}
Website: ${product.brand.website || "N/A"}

This certificate certifies that the above product is covered under the European 3-year warranty period.
Este certificado certifica que o produto acima está coberto pela garantia europeia de 3 anos.

Generated / Gerado em: ${new Date().toLocaleDateString("pt-PT")}
    `.trim();

    // Trigger download using blob
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(content));
    element.setAttribute("download", `warranty-certificate-${product.id}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Skeleton className="h-screen" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background p-8">
        <p>Produto não encontrado</p>
      </div>
    );
  }

  const warrantyExpiration = new Date(product.warrantyExpiration);
  const daysRemaining = Math.ceil(
    (warrantyExpiration.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const isExpired = daysRemaining < 0;

  return (
    <div className="min-h-screen bg-background p-8 space-y-8">
      <Link href={`/produto/${id}`}>
        <Button variant="ghost" data-testid="button-back">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </Link>

      <Card className="max-w-3xl mx-auto p-12 border-2 border-primary space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">CERTIFICADO DE GARANTIA</h1>
          <p className="text-muted-foreground">WARRANTY CERTIFICATE</p>
        </div>

        <div className="space-y-4 text-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Produto / Product</p>
              <p className="font-semibold">{product.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Marca / Brand</p>
              <p className="font-semibold">{product.brand.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Modelo / Model</p>
              <p className="font-semibold">{product.model}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Série / Serial</p>
              <p className="font-semibold">{product.serialNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data de Compra / Purchase Date</p>
              <p className="font-semibold">{new Date(product.purchaseDate).toLocaleDateString("pt-PT")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Expiração / Expiration</p>
              <p className="font-semibold">{warrantyExpiration.toLocaleDateString("pt-PT")}</p>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${isExpired ? "bg-red-50" : "bg-green-50"}`}>
            <p className="text-sm font-medium mb-2">Status de Garantia / Warranty Status</p>
            <p className={`text-2xl font-bold ${isExpired ? "text-red-700" : "text-green-700"}`}>
              {isExpired ? "EXPIRADA / EXPIRED" : "VÁLIDA / VALID"}
            </p>
            {!isExpired && (
              <p className="text-sm mt-2">
                Dias Restantes / Days Remaining: <strong>{Math.max(daysRemaining, 0)}</strong>
              </p>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-2">Contacto Fabricante / Manufacturer Support</p>
            <p className="font-semibold">Email: {product.brand.supportEmail}</p>
            <p className="font-semibold">Phone: {product.brand.supportPhone || "N/A"}</p>
            <p className="font-semibold">Website: {product.brand.website || "N/A"}</p>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground border-t pt-4">
          <p>Este certificado certifica que o produto acima está coberto pela garantia europeia de 3 anos.</p>
          <p>This certificate certifies that the above product is covered under the European 3-year warranty period.</p>
          <p className="mt-4">Gerado em / Generated on: {new Date().toLocaleDateString("pt-PT")}</p>
        </div>
      </Card>

      <div className="text-center">
        <Button size="lg" onClick={handleExportPDF} data-testid="button-download-certificate">
          <Download className="h-5 w-5 mr-2" />
          Descarregar Certificado
        </Button>
      </div>
    </div>
  );
}
