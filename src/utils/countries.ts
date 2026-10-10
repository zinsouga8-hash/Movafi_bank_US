export interface CountryItem {
  code: string;
  name: string;
  dialCode: string;
  currency: string;
}

export const COUNTRIES: CountryItem[] = [
  { code: 'US', name: 'United States', dialCode: '+1', currency: 'USD' },
  { code: 'FR', name: 'France', dialCode: '+33', currency: 'EUR' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', currency: 'MXN' },
  { code: 'ES', name: 'Spain', dialCode: '+34', currency: 'EUR' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', currency: 'GBP' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', currency: 'CHF' },
  { code: 'CA', name: 'Canada', dialCode: '+1', currency: 'CAD' },
  { code: 'DE', name: 'Germany', dialCode: '+49', currency: 'EUR' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', currency: 'AED' },
  { code: 'BE', name: 'Belgium', dialCode: '+32', currency: 'EUR' },
  { code: 'IT', name: 'Italy', dialCode: '+39', currency: 'EUR' },
  { code: 'LU', name: 'Luxembourg', dialCode: '+352', currency: 'EUR' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', currency: 'EUR' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', currency: 'EUR' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', currency: 'USD' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', currency: 'USD' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', currency: 'USD' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', currency: 'USD' },
  { code: 'CL', name: 'Chile', dialCode: '+56', currency: 'USD' }
];
