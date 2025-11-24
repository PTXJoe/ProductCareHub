import {
  type Brand,
  type InsertBrand,
  type Product,
  type InsertProduct,
  type Review,
  type InsertReview,
  type SupportRequest,
  type InsertSupportRequest,
  type ProductWithBrand,
  type ProductWithDetails,
  type ServiceProvider,
  type InsertServiceProvider,
  type ServiceProviderReview,
  type InsertServiceProviderReview,
  type Notification,
  type Favorite,
  type ClientProfile,
  type InsertClientProfile,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Brands
  getBrand(id: string): Promise<Brand | undefined>;
  getAllBrands(): Promise<Brand[]>;
  createBrand(brand: InsertBrand): Promise<Brand>;
  searchBrands(query: string): Promise<Brand[]>;

  // Products
  getProduct(id: string): Promise<Product | undefined>;
  getProductWithBrand(id: string): Promise<ProductWithBrand | undefined>;
  getProductWithDetails(id: string): Promise<ProductWithDetails | undefined>;
  getAllProducts(): Promise<ProductWithBrand[]>;
  getProductsByBrand(brandId: string): Promise<ProductWithBrand[]>;
  searchProducts(query: string): Promise<ProductWithBrand[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Reviews
  getReview(id: string): Promise<Review | undefined>;
  getReviewsByProduct(productId: string): Promise<Review[]>;
  getAllReviews(): Promise<Review[]>;
  createReview(review: InsertReview): Promise<Review>;

  // Support Requests
  getSupportRequest(id: string): Promise<SupportRequest | undefined>;
  getSupportRequestsByProduct(productId: string): Promise<SupportRequest[]>;
  getAllSupportRequests(): Promise<SupportRequest[]>;
  createSupportRequest(request: InsertSupportRequest): Promise<SupportRequest>;
  updateSupportRequest(id: string, request: Partial<SupportRequest>): Promise<SupportRequest | undefined>;

  // Service Providers
  getServiceProvider(id: string): Promise<ServiceProvider | undefined>;
  getAllServiceProviders(): Promise<ServiceProvider[]>;
  getServiceProvidersByDistrict(district: string): Promise<ServiceProvider[]>;
  createServiceProvider(provider: InsertServiceProvider): Promise<ServiceProvider>;
  updateServiceProvider(id: string, provider: Partial<ServiceProvider>): Promise<ServiceProvider | undefined>;
  deleteServiceProvider(id: string): Promise<boolean>;

  // Service Provider Reviews
  getServiceProviderReviews(providerId: string): Promise<ServiceProviderReview[]>;
  createServiceProviderReview(review: InsertServiceProviderReview): Promise<ServiceProviderReview>;
  getAverageRating(providerId: string): Promise<number>;

  // Notifications
  getNotificationsByProduct(productId: string): Promise<Notification[]>;
  createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
  getAllUnsentNotifications(): Promise<Notification[]>;
  markNotificationAsSent(id: string): Promise<boolean>;

  // Favorites
  getFavoriteProducts(): Promise<string[]>;
  getFavoriteProviders(): Promise<string[]>;
  toggleFavorite(type: 'product' | 'provider', targetId: string): Promise<boolean>;
  isFavorite(type: 'product' | 'provider', targetId: string): Promise<boolean>;

  // Warranty Extensions
  addWarrantyExtension(id: string, extension: {
    extendedExpirationDate: Date;
    insuranceProvider: string;
    agentName: string;
    policyNumber: string;
    extensionCost?: number;
  }): Promise<Product | undefined>;

  // Client Profile
  getClientProfile(): Promise<ClientProfile | undefined>;
  saveClientProfile(profile: InsertClientProfile): Promise<ClientProfile>;
  updateClientProfile(profile: Partial<ClientProfile>): Promise<ClientProfile | undefined>;
}

export class MemStorage implements IStorage {
  private brands: Map<string, Brand>;
  private products: Map<string, Product>;
  private reviews: Map<string, Review>;
  private supportRequests: Map<string, SupportRequest>;
  private serviceProviders: Map<string, ServiceProvider>;
  private serviceProviderReviews: Map<string, ServiceProviderReview>;
  private notifications: Map<string, Notification>;
  private favorites: Map<string, Favorite>;
  private clientProfile: ClientProfile | null;

  constructor() {
    this.brands = new Map();
    this.products = new Map();
    this.reviews = new Map();
    this.supportRequests = new Map();
    this.serviceProviders = new Map();
    this.serviceProviderReviews = new Map();
    this.notifications = new Map();
    this.favorites = new Map();
    this.clientProfile = null;

    // Seed with some popular brands
    this.seedBrands();
  }

  private seedBrands() {
    const brands: InsertBrand[] = [
      {
        name: "Apple",
        supportEmail: "support@apple.com",
        supportPhone: "+1-800-692-7753",
        website: "https://www.apple.com/support/",
        category: "Informática",
      },
      {
        name: "Samsung",
        supportEmail: "support@samsung.com",
        supportPhone: "+351-808-207-267",
        website: "https://www.samsung.com/pt/support/",
        category: "Eletrodomésticos",
      },
      {
        name: "LG",
        supportEmail: "apoio.cliente@lge.com",
        supportPhone: "+351-707-505-454",
        website: "https://www.lg.com/pt/support",
        category: "Eletrodomésticos",
      },
      {
        name: "Sony",
        supportEmail: "info@sony.pt",
        supportPhone: "+351-707-780-785",
        website: "https://www.sony.pt/support",
        category: "Televisão e Áudio",
      },
      {
        name: "Bosch",
        supportEmail: "bosch-pt@bshg.com",
        supportPhone: "+351-214-250-730",
        website: "https://www.bosch-home.pt/servico",
        category: "Eletrodomésticos",
      },
      {
        name: "Siemens",
        supportEmail: "siemens-pt@bshg.com",
        supportPhone: "+351-214-250-700",
        website: "https://www.siemens-home.bsh-group.com/pt/",
        category: "Eletrodomésticos",
      },
      {
        name: "Microsoft",
        supportEmail: "support@microsoft.com",
        supportPhone: "+351-21-366-5100",
        website: "https://support.microsoft.com/",
        category: "Informática",
      },
      {
        name: "Dell",
        supportEmail: "tech_support@dell.com",
        supportPhone: "+351-707-788-788",
        website: "https://www.dell.com/support/",
        category: "Informática",
      },
      {
        name: "HP",
        supportEmail: "support@hp.com",
        supportPhone: "+351-707-222-000",
        website: "https://support.hp.com/",
        category: "Informática",
      },
      {
        name: "Xiaomi",
        supportEmail: "service.pt@xiaomi.com",
        supportPhone: "+351-308-810-456",
        website: "https://www.mi.com/pt/service/",
        category: "Telefones",
      },
      {
        name: "Teka",
        supportEmail: "servico.cliente@teka.pt",
        supportPhone: "+351-256-200-100",
        website: "https://www.teka.pt/servico-tecnico/",
        category: "Eletrodomésticos",
      },
      {
        name: "Ariston",
        supportEmail: "info@ariston.pt",
        supportPhone: "+351-213-180-900",
        website: "https://www.ariston.com/pt-PT/",
        category: "Eletrodomésticos",
      },
      {
        name: "AEG",
        supportEmail: "rma.pt@eletrolux.com",
        supportPhone: "+351-210-304-261",
        website: "https://www.aeg.pt/",
        category: "Eletrodomésticos",
      },
    ];

    brands.forEach((brand) => {
      const id = randomUUID();
      this.brands.set(id, { ...brand, id });
    });
  }

  // Brands
  async getBrand(id: string): Promise<Brand | undefined> {
    return this.brands.get(id);
  }

  async getAllBrands(): Promise<Brand[]> {
    return Array.from(this.brands.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async createBrand(insertBrand: InsertBrand): Promise<Brand> {
    const id = randomUUID();
    const brand: Brand = { ...insertBrand, id };
    this.brands.set(id, brand);
    return brand;
  }

  async searchBrands(query: string): Promise<Brand[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.brands.values())
      .filter(brand => brand.name.toLowerCase().includes(lowerQuery) || 
                      brand.category.toLowerCase().includes(lowerQuery))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Products
  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductWithBrand(id: string): Promise<ProductWithBrand | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const brand = await this.getBrand(product.brandId);
    if (!brand) return undefined;

    return { ...product, brand };
  }

  async getProductWithDetails(id: string): Promise<ProductWithDetails | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const brand = await this.getBrand(product.brandId);
    if (!brand) return undefined;

    const reviews = await this.getReviewsByProduct(id);
    const supportRequests = await this.getSupportRequestsByProduct(id);

    return { ...product, brand, reviews, supportRequests };
  }

  async getAllProducts(): Promise<ProductWithBrand[]> {
    const products = Array.from(this.products.values());
    const productsWithBrands = await Promise.all(
      products.map(async (product) => {
        const brand = await this.getBrand(product.brandId);
        if (!brand) return null;
        return { ...product, brand };
      })
    );

    return productsWithBrands.filter((p): p is ProductWithBrand => p !== null)
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }

  async getProductsByBrand(brandId: string): Promise<ProductWithBrand[]> {
    const products = Array.from(this.products.values()).filter(p => p.brandId === brandId);
    const brand = await this.getBrand(brandId);
    if (!brand) return [];
    
    return products.map(p => ({ ...p, brand }))
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }

  async searchProducts(query: string): Promise<ProductWithBrand[]> {
    const lowerQuery = query.toLowerCase();
    const products = Array.from(this.products.values())
      .filter(p => p.name.toLowerCase().includes(lowerQuery) || 
                   p.model.toLowerCase().includes(lowerQuery));
    
    const productsWithBrands = await Promise.all(
      products.map(async (product) => {
        const brand = await this.getBrand(product.brandId);
        if (!brand) return null;
        return { ...product, brand };
      })
    );

    return productsWithBrands.filter((p): p is ProductWithBrand => p !== null)
      .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    
    // Calculate warranty expiration (3 years from purchase date in Europe)
    const purchaseDate = new Date(insertProduct.purchaseDate);
    const warrantyExpiration = new Date(purchaseDate);
    warrantyExpiration.setFullYear(warrantyExpiration.getFullYear() + 3);

    const product: Product = {
      ...insertProduct,
      id,
      purchaseDate,
      warrantyExpiration,
      photoUrls: insertProduct.photoUrls || [],
    };
    
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updated = { ...product, ...updates };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    // Delete associated reviews and support requests
    const reviews = await this.getReviewsByProduct(id);
    reviews.forEach(review => this.reviews.delete(review.id));

    const supportRequests = await this.getSupportRequestsByProduct(id);
    supportRequests.forEach(request => this.supportRequests.delete(request.id));

    return this.products.delete(id);
  }

  async addWarrantyExtension(
    id: string,
    extension: {
      extendedExpirationDate: Date;
      insuranceProvider: string;
      agentName: string;
      policyNumber: string;
      extensionCost?: number;
    }
  ): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;

    const updated: Product = {
      ...product,
      hasExtension: true,
      extendedExpirationDate: extension.extendedExpirationDate,
      insuranceProvider: extension.insuranceProvider,
      agentName: extension.agentName,
      policyNumber: extension.policyNumber,
      extensionCost: extension.extensionCost || 0,
      warrantyExpiration: extension.extendedExpirationDate,
    };
    this.products.set(id, updated);
    return updated;
  }

  // Reviews
  async getReview(id: string): Promise<Review | undefined> {
    return this.reviews.get(id);
  }

  async getReviewsByProduct(productId: string): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(review => review.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllReviews(): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createReview(insertReview: InsertReview): Promise<Review> {
    const id = randomUUID();
    const review: Review = {
      ...insertReview,
      id,
      createdAt: new Date(),
      pros: insertReview.pros || [],
      cons: insertReview.cons || [],
    };
    this.reviews.set(id, review);
    return review;
  }

  // Support Requests
  async getSupportRequest(id: string): Promise<SupportRequest | undefined> {
    return this.supportRequests.get(id);
  }

  async getSupportRequestsByProduct(productId: string): Promise<SupportRequest[]> {
    return Array.from(this.supportRequests.values())
      .filter(request => request.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllSupportRequests(): Promise<SupportRequest[]> {
    return Array.from(this.supportRequests.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createSupportRequest(insertRequest: InsertSupportRequest): Promise<SupportRequest> {
    const id = randomUUID();
    const supportRequest: SupportRequest = {
      ...insertRequest,
      id,
      status: "sent",
      emailSentAt: new Date(),
      createdAt: new Date(),
    };
    this.supportRequests.set(id, supportRequest);
    return supportRequest;
  }

  async updateSupportRequest(id: string, updates: Partial<SupportRequest>): Promise<SupportRequest | undefined> {
    const request = this.supportRequests.get(id);
    if (!request) return undefined;

    const updated = { ...request, ...updates };
    this.supportRequests.set(id, updated);
    return updated;
  }

  // Service Providers
  async getServiceProvider(id: string): Promise<ServiceProvider | undefined> {
    return this.serviceProviders.get(id);
  }

  async getAllServiceProviders(): Promise<ServiceProvider[]> {
    return Array.from(this.serviceProviders.values())
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
  }

  async getServiceProvidersByDistrict(district: string): Promise<ServiceProvider[]> {
    return Array.from(this.serviceProviders.values())
      .filter(p => p.district.toLowerCase() === district.toLowerCase())
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
  }

  async createServiceProvider(insertProvider: InsertServiceProvider): Promise<ServiceProvider> {
    const id = randomUUID();
    const provider: ServiceProvider = {
      ...insertProvider,
      id,
      supportedBrands: insertProvider.supportedBrands || [],
      averageRating: 0,
      createdAt: new Date(),
    };
    this.serviceProviders.set(id, provider);
    return provider;
  }

  async updateServiceProvider(id: string, updates: Partial<ServiceProvider>): Promise<ServiceProvider | undefined> {
    const provider = this.serviceProviders.get(id);
    if (!provider) return undefined;

    const updated = { ...provider, ...updates };
    this.serviceProviders.set(id, updated);
    return updated;
  }

  async deleteServiceProvider(id: string): Promise<boolean> {
    // Delete reviews
    const reviews = Array.from(this.serviceProviderReviews.values())
      .filter(r => r.providerId === id);
    reviews.forEach(r => this.serviceProviderReviews.delete(r.id));

    return this.serviceProviders.delete(id);
  }

  // Service Provider Reviews
  async getServiceProviderReviews(providerId: string): Promise<ServiceProviderReview[]> {
    return Array.from(this.serviceProviderReviews.values())
      .filter(r => r.providerId === providerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createServiceProviderReview(insertReview: InsertServiceProviderReview): Promise<ServiceProviderReview> {
    const id = randomUUID();
    const review: ServiceProviderReview = {
      ...insertReview,
      id,
      createdAt: new Date(),
    };
    this.serviceProviderReviews.set(id, review);

    // Update provider's average rating
    const avgRating = await this.getAverageRating(insertReview.providerId);
    await this.updateServiceProvider(insertReview.providerId, { averageRating: Math.round(avgRating) });

    return review;
  }

  async getAverageRating(providerId: string): Promise<number> {
    const reviews = await this.getServiceProviderReviews(providerId);
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / reviews.length;
  }

  // Notifications
  async getNotificationsByProduct(productId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => n.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const id = randomUUID();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async getAllUnsentNotifications(): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(n => !n.sent)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async markNotificationAsSent(id: string): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;

    notification.sent = true;
    notification.sentAt = new Date();
    this.notifications.set(id, notification);
    return true;
  }

  // Favorites
  async getFavoriteProducts(): Promise<string[]> {
    return Array.from(this.favorites.values())
      .filter(f => f.type === 'product')
      .map(f => f.targetId);
  }

  async getFavoriteProviders(): Promise<string[]> {
    return Array.from(this.favorites.values())
      .filter(f => f.type === 'provider')
      .map(f => f.targetId);
  }

  async toggleFavorite(type: 'product' | 'provider', targetId: string): Promise<boolean> {
    const key = `${type}-${targetId}`;
    const exists = Array.from(this.favorites.values()).some(
      f => f.type === type && f.targetId === targetId
    );

    if (exists) {
      // Remove favorite
      const toDelete = Array.from(this.favorites.entries()).find(
        ([_, f]) => f.type === type && f.targetId === targetId
      );
      if (toDelete) {
        this.favorites.delete(toDelete[0]);
      }
      return false;
    } else {
      // Add favorite
      const id = randomUUID();
      this.favorites.set(id, {
        id,
        type,
        targetId,
        createdAt: new Date(),
      });
      return true;
    }
  }

  async isFavorite(type: 'product' | 'provider', targetId: string): Promise<boolean> {
    return Array.from(this.favorites.values()).some(
      f => f.type === type && f.targetId === targetId
    );
  }

  // Client Profile
  async getClientProfile(): Promise<ClientProfile | undefined> {
    return this.clientProfile || undefined;
  }

  async saveClientProfile(profile: InsertClientProfile): Promise<ClientProfile> {
    const id = randomUUID();
    const now = new Date();
    const clientProf: ClientProfile = {
      ...profile,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.clientProfile = clientProf;
    return clientProf;
  }

  async updateClientProfile(profile: Partial<ClientProfile>): Promise<ClientProfile | undefined> {
    if (!this.clientProfile) return undefined;
    
    const updated: ClientProfile = {
      ...this.clientProfile,
      ...profile,
      updatedAt: new Date(),
    };
    this.clientProfile = updated;
    return updated;
  }
}

export const storage = new MemStorage();
