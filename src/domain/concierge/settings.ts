export interface ConciergeSettings {
  isBarteringEnabled: boolean;
  maxDiscountPercentage: number;
  negotiationTone: 'friendly' | 'firm' | 'playful';
  minOrderValueForBarter?: number; // cents
  responseRate?: string;
  studioHours?: string;
}

export const DEFAULT_CONCIERGE_SETTINGS: ConciergeSettings = {
  isBarteringEnabled: false,
  maxDiscountPercentage: 15,
  negotiationTone: 'friendly',
  minOrderValueForBarter: 5000, // $50.00
  responseRate: '100%',
  studioHours: '9-6 Studio',
};
