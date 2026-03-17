export type CountryOption = {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
};

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
  { code: 'PK', name: 'Pakistan', dialCode: '+92', flag: '🇵🇰' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰' },
  { code: 'BT', name: 'Bhutan', dialCode: '+975', flag: '🇧🇹' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'QA', name: 'Qatar', dialCode: '+974', flag: '🇶🇦' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'OM', name: 'Oman', dialCode: '+968', flag: '🇴🇲' },
  { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬' },
  { code: 'TH', name: 'Thailand', dialCode: '+66', flag: '🇹🇭' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', flag: '🇰🇷' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
];

export function getCountryOption(countryCode: string) {
  return COUNTRY_OPTIONS.find((country) => country.code === countryCode) || COUNTRY_OPTIONS[0];
}

export function formatInternationalPhone(rawPhone: string, dialCode: string) {
  const digitsOnly = rawPhone.replace(/\D/g, '').replace(/^0+/, '');
  if (!digitsOnly) return '';
  return `${dialCode}${digitsOnly}`;
}

export async function detectUserCountryCode(): Promise<string | null> {
  // Fast hints first
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timezone === 'Asia/Kathmandu') {
    return 'NP';
  }

  const localeRegion = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[1]?.toUpperCase();
  if (localeRegion && COUNTRY_OPTIONS.some((country) => country.code === localeRegion)) {
    return localeRegion;
  }

  // Best effort IP lookup
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
      if (!response.ok) return null;
      const data = (await response.json()) as { country_code?: string };
      const code = data.country_code?.toUpperCase();
      if (code && COUNTRY_OPTIONS.some((country) => country.code === code)) {
        return code;
      }
      return null;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}
