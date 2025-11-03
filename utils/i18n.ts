import { translations } from './translations';

export type Locale = 'el' | 'en';

let currentLocale: Locale = 'el'; // Default to Greek

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = translations[currentLocale];

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation missing: ${key} for locale ${currentLocale}`);
      return key; // Return key if translation not found
    }
  }

  if (typeof value !== 'string') {
    console.warn(`Translation not a string: ${key} for locale ${currentLocale}`);
    return key;
  }

  // Replace params in translation string
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }

  return value;
}

// Export translation function as default
export default t;

