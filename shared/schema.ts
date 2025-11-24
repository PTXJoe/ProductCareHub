import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Brands table - pre-populated database of manufacturers
export const brands = pgTable("brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  logoUrl: text("logo_url"),
  supportEmail: text("support_email").notNull(),
  supportPhone: text("support_phone"),
  website: text("website"),
  category: text("category").notNull(), // Electronics, Appliances, etc.
});

// Products table - user's registered products
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  brandId: varchar("brand_id").notNull().references(() => brands.id),
  name: text("name").notNull(),
  model: text("model").notNull(),
  serialNumber: text("serial_number"),
  category: text("category").notNull(),
  purchaseDate: timestamp("purchase_date").notNull(),
  warrantyExpiration: timestamp("warranty_expiration").notNull(),
  receiptUrl: text("receipt_url"),
  photoUrls: text("photo_urls").array().default(sql`'{}'::text[]`),
  notes: text("notes"),
  // Warranty extension fields
  hasExtension: boolean("has_extension").default(false),
  extendedExpirationDate: timestamp("extended_expiration_date"),
  insuranceProvider: text("insurance_provider"),
  agentName: text("agent_name"),
  policyNumber: text("policy_number"),
  extensionCost: integer("extension_cost"), // in cents
});

// Reviews table - product ratings and reviews
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"),
  content: text("content"),
  pros: text("pros").array().default(sql`'{}'::text[]`),
  cons: text("cons").array().default(sql`'{}'::text[]`),
  recommend: boolean("recommend").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Support requests table - warranty claims and support history
export const supportRequests = pgTable("support_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  issueDescription: text("issue_description").notNull(),
  category: text("category").notNull(), // malfunction, defect, damage, other
  severity: text("severity").notNull(), // low, medium, high
  status: text("status").notNull().default("pending"), // pending, sent, resolved
  emailSentAt: timestamp("email_sent_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Service providers table - companies offering repairs/assistance
export const serviceProviders = pgTable("service_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  website: text("website"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  district: text("district").notNull(), // User's residence zone filter
  supportedBrands: text("supported_brands").array().default(sql`'{}'::text[]`), // Brand IDs
  averageRating: integer("average_rating").default(0),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Service provider reviews table
export const serviceProviderReviews = pgTable("service_provider_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => serviceProviders.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Notifications table for warranty expiration reminders
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 90days, 60days, 30days, expired
  sent: boolean("sent").default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Favorites table - users can favorite products and service providers
export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // 'product' or 'provider'
  targetId: varchar("target_id").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Client profile table - user's personal information for support requests
export const clientProfile = pgTable("client_profile", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  taxNumber: text("tax_number"), // NIF/VAT number
  address: text("address").notNull(),
  city: text("city").notNull(),
  postalCode: text("postal_code"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Insert schemas with validation
export const insertBrandSchema = createInsertSchema(brands).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  warrantyExpiration: true, // Calculated on backend
}).extend({
  purchaseDate: z.string().or(z.date()), // Accept both formats
  receiptUrl: z.string().nullable().optional(),
  photoUrls: z.array(z.string()).optional(),
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
}).extend({
  rating: z.number().min(1).max(5),
});

export const insertSupportRequestSchema = createInsertSchema(supportRequests).omit({
  id: true,
  createdAt: true,
  emailSentAt: true,
  status: true,
});

export const insertServiceProviderSchema = createInsertSchema(serviceProviders).omit({
  id: true,
  createdAt: true,
  averageRating: true,
}).extend({
  supportedBrands: z.array(z.string()).optional(),
});

export const insertServiceProviderReviewSchema = createInsertSchema(serviceProviderReviews).omit({
  id: true,
  createdAt: true,
});

export const insertClientProfileSchema = createInsertSchema(clientProfile).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  fullName: z.string().min(2, "Nome completo obrigatório"),
  email: z.string().email("Email inválido"),
  phoneNumber: z.string().min(9, "Número de contacto inválido"),
  taxNumber: z.string().optional(),
  address: z.string().min(5, "Morada obrigatória"),
  city: z.string().min(2, "Cidade obrigatória"),
  postalCode: z.string().optional(),
});

// Types
export type Brand = typeof brands.$inferSelect;
export type InsertBrand = z.infer<typeof insertBrandSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type SupportRequest = typeof supportRequests.$inferSelect;
export type InsertSupportRequest = z.infer<typeof insertSupportRequestSchema>;

// Additional types
export type ServiceProvider = typeof serviceProviders.$inferSelect;
export type InsertServiceProvider = z.infer<typeof insertServiceProviderSchema>;

export type ServiceProviderReview = typeof serviceProviderReviews.$inferSelect;
export type InsertServiceProviderReview = z.infer<typeof insertServiceProviderReviewSchema>;

export type Notification = typeof notifications.$inferSelect;

export type Favorite = typeof favorites.$inferSelect;

export type ClientProfile = typeof clientProfile.$inferSelect;
export type InsertClientProfile = z.infer<typeof insertClientProfileSchema>;

// Extended types with relations
export type ProductWithBrand = Product & { brand: Brand };
export type ProductWithDetails = Product & {
  brand: Brand;
  reviews: Review[];
  supportRequests: SupportRequest[];
};
export type ServiceProviderWithBrands = ServiceProvider & { 
  brands?: Brand[];
  reviews?: ServiceProviderReview[];
  averageRatingValue?: number;
};
