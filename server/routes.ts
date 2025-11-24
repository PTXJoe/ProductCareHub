import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import PDFDocument from "pdfkit";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertBrandSchema, insertProductSchema, insertReviewSchema, insertSupportRequestSchema, insertServiceProviderSchema, insertServiceProviderReviewSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and PDF files are allowed."));
    }
  },
});

// Helper function to generate warranty claim email content
async function generateWarrantyEmail(product: any, brand: any, issue: any) {
  const purchaseDate = new Date(product.purchaseDate).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const clientProfile = await storage.getClientProfile();

  return {
    to: brand.supportEmail,
    subject: `Pedido de Assistência - ${product.name} (${product.model})`,
    body: `
Exmo(a) Senhor(a),

Venho por este meio solicitar assistência técnica para o seguinte produto:

DADOS DO CLIENTE:
${clientProfile ? `- Nome: ${clientProfile.fullName}
- Email: ${clientProfile.email}
- Contacto: ${clientProfile.phoneNumber}
- NIF/Contribuinte: ${clientProfile.taxNumber || 'N/A'}
- Morada: ${clientProfile.address}, ${clientProfile.city} ${clientProfile.postalCode || ''}

` : ''}
INFORMAÇÃO DO PRODUTO:
- Produto: ${product.name}
- Marca: ${brand.name}
- Modelo: ${product.model}
${product.serialNumber ? `- Número de Série: ${product.serialNumber}` : ''}
- Data de Compra: ${purchaseDate}

DESCRIÇÃO DO PROBLEMA:
Categoria: ${issue.category}
Severidade: ${issue.severity}

${issue.issueDescription}

${product.receiptUrl ? '\nAnexo: Talão de compra em anexo' : ''}

Agradeço a vossa atenção e aguardo retorno.

Com os melhores cumprimentos,
${clientProfile ? clientProfile.fullName : '[Cliente Warranty Manager]'}
    `.trim(),
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user || null);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Create uploads directory if it doesn't exist
  const fs = await import("fs/promises");
  try {
    await fs.mkdir("uploads", { recursive: true });
  } catch (error) {
    // Directory already exists
  }

  // Serve uploaded files
  app.use("/uploads", (await import("express")).static("uploads"));

  // BRANDS ROUTES
  app.get("/api/brands", async (req, res) => {
    try {
      const brands = await storage.getAllBrands();
      res.json(brands);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch brands" });
    }
  });

  app.get("/api/brands/:id", async (req, res) => {
    try {
      const brand = await storage.getBrand(req.params.id);
      if (!brand) {
        return res.status(404).json({ error: "Brand not found" });
      }
      res.json(brand);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch brand" });
    }
  });

  app.post("/api/brands", async (req, res) => {
    try {
      const result = insertBrandSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      const brand = await storage.createBrand(result.data);
      res.status(201).json(brand);
    } catch (error) {
      res.status(500).json({ error: "Failed to create brand" });
    }
  });

  // PRODUCTS ROUTES
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProductWithDetails(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post(
    "/api/products",
    upload.fields([
      { name: "receipt", maxCount: 1 },
      { name: "photo_0", maxCount: 1 },
      { name: "photo_1", maxCount: 1 },
      { name: "photo_2", maxCount: 1 },
      { name: "photo_3", maxCount: 1 },
      { name: "photo_4", maxCount: 1 },
    ]),
    async (req, res) => {
      try {
        const files = (req.files as { [fieldname: string]: Express.Multer.File[] }) || {};
        
        console.log("=== POST /api/products DEBUG ===");
        console.log("Request body:", req.body);
        console.log("Request files:", files);
        
        // Handle receipt upload
        let receiptUrl = null;
        if (files && files.receipt && files.receipt[0]) {
          receiptUrl = `/uploads/${files.receipt[0].filename}`;
        }

        // Handle photo uploads
        const photoUrls: string[] = [];
        if (files) {
          for (let i = 0; i < 5; i++) {
            const fieldName = `photo_${i}`;
            if (files[fieldName] && files[fieldName][0]) {
              photoUrls.push(`/uploads/${files[fieldName][0].filename}`);
            }
          }
        }
        
        // Parse product data from form with file URLs
        const productData = {
          brandId: req.body.brandId,
          name: req.body.name,
          model: req.body.model,
          serialNumber: req.body.serialNumber || null,
          category: req.body.category,
          purchaseDate: new Date(req.body.purchaseDate),
          notes: req.body.notes || null,
          receiptUrl,
          photoUrls,
        };

        console.log("Product data before validation:", productData);

        // Validate product data
        const result = insertProductSchema.safeParse(productData);
        if (!result.success) {
          console.error("Validation error:", fromZodError(result.error).message);
          console.error("Validation details:", result.error.errors);
          return res.status(400).json({ error: fromZodError(result.error).message });
        }

        console.log("Validation successful, creating product...");

        // Create product
        const product = await storage.createProduct(result.data);

        console.log("Product created successfully:", product.id);
        console.log("================================");

        res.status(201).json(product);
      } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ error: "Failed to create product" });
      }
    }
  );

  app.patch("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // REVIEWS ROUTES
  app.get("/api/products/:productId/reviews", async (req, res) => {
    try {
      const reviews = await storage.getReviewsByProduct(req.params.productId);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const result = insertReviewSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      const review = await storage.createReview(result.data);
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // SUPPORT REQUESTS ROUTES
  app.get("/api/products/:productId/support-requests", async (req, res) => {
    try {
      const requests = await storage.getSupportRequestsByProduct(req.params.productId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch support requests" });
    }
  });

  app.post("/api/support-requests", async (req, res) => {
    try {
      const result = insertSupportRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }

      // Get product and brand details for email generation
      const product = await storage.getProductWithBrand(result.data.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Generate email content
      const emailContent = generateWarrantyEmail(product, product.brand, result.data);
      
      // In a real implementation, you would send the email here
      // For now, we'll just log it
      console.log("=== WARRANTY CLAIM EMAIL ===");
      console.log(`To: ${emailContent.to}`);
      console.log(`Subject: ${emailContent.subject}`);
      console.log(`Body:\n${emailContent.body}`);
      console.log("===========================");

      // Create support request record
      const supportRequest = await storage.createSupportRequest(result.data);
      
      res.status(201).json({
        supportRequest,
        emailSent: true,
        emailDetails: {
          to: emailContent.to,
          subject: emailContent.subject,
        },
      });
    } catch (error) {
      console.error("Error creating support request:", error);
      res.status(500).json({ error: "Failed to create support request" });
    }
  });

  app.patch("/api/support-requests/:id", async (req, res) => {
    try {
      const request = await storage.updateSupportRequest(req.params.id, req.body);
      if (!request) {
        return res.status(404).json({ error: "Support request not found" });
      }
      res.json(request);
    } catch (error) {
      res.status(500).json({ error: "Failed to update support request" });
    }
  });

  // PUBLIC COMMUNITY ROUTES
  app.get("/api/community/reviews", async (req, res) => {
    try {
      const reviews = await storage.getAllReviews();
      const productsWithBrands = await Promise.all(
        reviews.map(async (review) => {
          const product = await storage.getProductWithBrand(review.productId);
          return product ? { ...review, product } : null;
        })
      );
      res.json(productsWithBrands.filter(r => r !== null));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch community reviews" });
    }
  });

  // SUPPORT HISTORY ROUTES (all support requests with product info)
  app.get("/api/support-history", async (req, res) => {
    try {
      const requests = await storage.getAllSupportRequests();
      const requestsWithDetails = await Promise.all(
        requests.map(async (request) => {
          const product = await storage.getProductWithBrand(request.productId);
          return product ? { ...request, product } : null;
        })
      );
      res.json(requestsWithDetails.filter(r => r !== null));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch support history" });
    }
  });

  // SEARCH ROUTES
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json({ products: [], brands: [] });
      }

      const [products, brands] = await Promise.all([
        storage.searchProducts(query),
        storage.searchBrands(query),
      ]);

      res.json({ products, brands });
    } catch (error) {
      res.status(500).json({ error: "Failed to search" });
    }
  });

  // SERVICE PROVIDERS ROUTES
  app.get("/api/service-providers", async (req, res) => {
    try {
      const district = req.query.district as string;
      const providers = district 
        ? await storage.getServiceProvidersByDistrict(district)
        : await storage.getAllServiceProviders();
      res.json(providers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service providers" });
    }
  });

  app.get("/api/service-providers/:id", async (req, res) => {
    try {
      const provider = await storage.getServiceProvider(req.params.id);
      if (!provider) {
        return res.status(404).json({ error: "Service provider not found" });
      }
      const reviews = await storage.getServiceProviderReviews(req.params.id);
      res.json({ ...provider, reviews });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch service provider" });
    }
  });

  app.post("/api/service-providers", async (req, res) => {
    try {
      const result = insertServiceProviderSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      const provider = await storage.createServiceProvider(result.data);
      res.status(201).json(provider);
    } catch (error) {
      res.status(500).json({ error: "Failed to create service provider" });
    }
  });

  app.patch("/api/service-providers/:id", async (req, res) => {
    try {
      const provider = await storage.updateServiceProvider(req.params.id, req.body);
      if (!provider) {
        return res.status(404).json({ error: "Service provider not found" });
      }
      res.json(provider);
    } catch (error) {
      res.status(500).json({ error: "Failed to update service provider" });
    }
  });

  app.delete("/api/service-providers/:id", async (req, res) => {
    try {
      const success = await storage.deleteServiceProvider(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Service provider not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete service provider" });
    }
  });

  // SERVICE PROVIDER REVIEWS ROUTES
  app.post("/api/service-provider-reviews", async (req, res) => {
    try {
      const result = insertServiceProviderReviewSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: fromZodError(result.error).message });
      }
      const review = await storage.createServiceProviderReview(result.data);
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  // NOTIFICATIONS ROUTES
  app.get("/api/notifications/unsent", async (req, res) => {
    try {
      const notifications = await storage.getAllUnsentNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/:id/mark-sent", async (req, res) => {
    try {
      const success = await storage.markNotificationAsSent(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as sent" });
    }
  });

  // PDF EXPORT ROUTE
  app.get("/api/products/export/pdf", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      
      // Create PDF document
      const doc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="warranty-report.pdf"');
      
      doc.pipe(res);
      
      // Title
      doc.fontSize(24).font("Helvetica-Bold").text("Relatório de Garantias", { align: "center" });
      doc.fontSize(10).font("Helvetica").text(`Gerado em ${new Date().toLocaleDateString("pt-PT")}`, { align: "center" });
      doc.moveDown();
      
      // Products list
      products.forEach((product, index) => {
        const daysRemaining = Math.ceil(
          (new Date(product.warrantyExpiration).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        const warrantyStatus = daysRemaining < 0 ? "Expirada" : daysRemaining <= 90 ? "Expira em Breve" : "Válida";
        
        doc.fontSize(12).font("Helvetica-Bold").text(`${index + 1}. ${product.name}`, { underline: true });
        doc.fontSize(10).font("Helvetica");
        doc.text(`Marca: ${product.brand.name}`);
        doc.text(`Modelo: ${product.model}`);
        doc.text(`Data de Compra: ${new Date(product.purchaseDate).toLocaleDateString("pt-PT")}`);
        doc.text(`Expiração da Garantia: ${new Date(product.warrantyExpiration).toLocaleDateString("pt-PT")}`);
        doc.text(`Estado: ${warrantyStatus}`);
        doc.text(`Dias Restantes: ${Math.max(daysRemaining, 0)}`);
        doc.moveDown();
      });
      
      doc.end();
    } catch (error) {
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // ANALYTICS ROUTE
  app.get("/api/analytics", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const providers = await storage.getAllServiceProviders();
      const allReviews = await storage.getAllReviews();

      // Calculate top brands
      const brandCounts: { [key: string]: { name: string; count: number; id: string } } = {};
      products.forEach(p => {
        if (!brandCounts[p.brandId]) {
          brandCounts[p.brandId] = { name: p.brand.name, count: 0, id: p.brandId };
        }
        brandCounts[p.brandId].count++;
      });

      // Calculate top rated providers
      const providerRatings: { [key: string]: { name: string; ratings: number[]; id: string } } = {};
      providers.forEach(p => {
        providerRatings[p.id] = { name: p.name, ratings: [], id: p.id };
      });

      // Calculate stats
      const stats = {
        totalProducts: products.length,
        totalProviders: providers.length,
        avgWarrantyExpiration: Math.round(
          products.reduce((sum, p) => {
            const days = Math.ceil(
              (new Date(p.warrantyExpiration).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            return sum + Math.max(days, 0);
          }, 0) / (products.length || 1)
        ),
      };

      res.json({
        topBrands: Object.values(brandCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
        topRatedProviders: providers
          .map(p => ({
            id: p.id,
            name: p.name,
            rating: p.averageRating || 0,
            reviewCount: 0,
          }))
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 5),
        stats,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // FAVORITES ROUTES
  app.get("/api/favorites/:type", async (req, res) => {
    try {
      const type = req.params.type as 'product' | 'provider';
      const favorites = type === 'product' 
        ? await storage.getFavoriteProducts()
        : await storage.getFavoriteProviders();
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites/:type/:id/toggle", async (req, res) => {
    try {
      const type = req.params.type as 'product' | 'provider';
      const isFav = await storage.toggleFavorite(type, req.params.id);
      res.json({ favorite: isFav });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle favorite" });
    }
  });

  app.get("/api/favorites/check/:type/:id", async (req, res) => {
    try {
      const type = req.params.type as 'product' | 'provider';
      const isFav = await storage.isFavorite(type, req.params.id);
      res.json({ isFavorite: isFav });
    } catch (error) {
      res.status(500).json({ error: "Failed to check favorite" });
    }
  });

  // CLIENT PROFILE ROUTES
  app.get("/api/profile", async (req, res) => {
    try {
      const profile = await storage.getClientProfile();
      res.json(profile || {});
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.post("/api/profile", async (req, res) => {
    try {
      const profile = await storage.saveClientProfile(req.body);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to save profile" });
    }
  });

  // WARRANTY EXTENSION ROUTE
  app.post("/api/products/:id/extension", async (req, res) => {
    try {
      const { extendedExpirationDate, insuranceProvider, agentName, policyNumber, extensionCost } = req.body;
      
      if (!extendedExpirationDate || !insuranceProvider || !policyNumber) {
        return res.status(400).json({ error: "Campos obrigatórios em falta" });
      }

      const product = await storage.addWarrantyExtension(req.params.id, {
        extendedExpirationDate: new Date(extendedExpirationDate),
        insuranceProvider,
        agentName: agentName || "",
        policyNumber,
        extensionCost: extensionCost || 0,
      });

      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Falha ao adicionar extensão de garantia" });
    }
  });

  // WARRANTY CERTIFICATE PDF
  app.get("/api/products/:id/certificate/pdf", async (req, res) => {
    try {
      const product = await storage.getProductWithBrand(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      const warrantyExpiration = new Date(product.warrantyExpiration);
      const daysRemaining = Math.ceil(
        (warrantyExpiration.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      const isExpired = daysRemaining < 0;

      const doc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="warranty-${product.id}.pdf"`
      );

      doc.pipe(res);

      doc.fontSize(24).font("Helvetica-Bold").text("CERTIFICADO DE GARANTIA", { align: "center" });
      doc.fontSize(12).text("WARRANTY CERTIFICATE", { align: "center" });
      doc.moveDown();

      doc.fontSize(11).font("Helvetica-Bold").text("INFORMAÇÃO DO PRODUTO");
      doc.fontSize(10).font("Helvetica");
      doc.text(`Produto: ${product.name}`);
      doc.text(`Marca: ${product.brand.name}`);
      doc.text(`Modelo: ${product.model}`);
      doc.text(`Série: ${product.serialNumber || "N/A"}`);
      doc.moveDown();

      doc.fontSize(11).font("Helvetica-Bold").text("GARANTIA");
      doc.fontSize(10).font("Helvetica");
      doc.text(`Data de Compra: ${new Date(product.purchaseDate).toLocaleDateString("pt-PT")}`);
      doc.text(`Expiração: ${warrantyExpiration.toLocaleDateString("pt-PT")}`);
      doc.text(`Status: ${isExpired ? "EXPIRADA" : "VÁLIDA"}`);
      if (!isExpired) {
        doc.text(`Dias Restantes: ${Math.max(daysRemaining, 0)}`);
      }
      doc.moveDown();

      doc.fontSize(11).font("Helvetica-Bold").text("CONTACTO FABRICANTE");
      doc.fontSize(10).font("Helvetica");
      doc.text(`Email: ${product.brand.supportEmail}`);
      if (product.brand.supportPhone) doc.text(`Telefone: ${product.brand.supportPhone}`);

      doc.end();
    } catch (error) {
      res.status(500).json({ error: "Failed to generate certificate" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
