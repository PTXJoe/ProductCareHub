import type { Brand } from "@shared/schema";

/**
 * Get the support email for a brand in a specific country
 * Falls back to main supportEmail if country-specific email is not available
 */
export function getBrandEmailForCountry(brand: Brand, countryCode: string): string {
  if (!brand.countryEmails) {
    return brand.supportEmail;
  }

  try {
    const countryEmails = JSON.parse(brand.countryEmails) as Record<string, string>;
    return countryEmails[countryCode] || brand.supportEmail;
  } catch {
    return brand.supportEmail;
  }
}

/**
 * Get all available country emails for a brand
 */
export function getAllCountryEmails(brand: Brand): Record<string, string> {
  if (!brand.countryEmails) {
    return {};
  }

  try {
    return JSON.parse(brand.countryEmails) as Record<string, string>;
  } catch {
    return {};
  }
}

/**
 * Format brand contact info for a specific country
 */
export function formatBrandContactInfo(brand: Brand, countryCode: string): {
  email: string;
  phone?: string;
  website?: string;
} {
  return {
    email: getBrandEmailForCountry(brand, countryCode),
    phone: brand.supportPhone,
    website: brand.website,
  };
}
