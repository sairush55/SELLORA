export type BusinessType =
  | 'grocery'
  | 'supermarket'
  | 'apparel'
  | 'electronics'
  | 'pharmacy'
  | 'general_retail'
  | 'hardware'
  | 'other';

export interface ShopProfile {
  id: string;
  name: string;
  ownerName: string;
  businessType: BusinessType;
  phone: string;
  email: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  address?: string;
  gstin?: string;
  createdAt: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
}

export interface ShopSetupInput {
  name: string;
  ownerName: string;
  businessType: BusinessType;
  phone: string;
  email: string;
  currency?: string;
  timezone?: string;
}
