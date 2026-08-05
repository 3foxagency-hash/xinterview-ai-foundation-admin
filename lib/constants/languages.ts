export type AvailableLanguage = {
  text: string;
  lang: string;
  countryCode: string;
};

export const availableLanguages: AvailableLanguage[] = [
  { text: 'English (UK)', lang: 'en-GB', countryCode: 'GB' },
  { text: 'English (US)', lang: 'en-US', countryCode: 'US' },
  { text: 'Spanish (Español)', lang: 'es', countryCode: 'ES' },
  { text: 'German (Deutsch)', lang: 'de', countryCode: 'DE' },
  { text: 'Dutch (Nederlands)', lang: 'nl', countryCode: 'NL' },
  { text: 'French (Français)', lang: 'fr', countryCode: 'FR' },
  { text: 'Arabic (العربية)', lang: 'ar', countryCode: 'SA' },
  { text: 'Finnish (Suomi)', lang: 'fi', countryCode: 'FI' },
  { text: 'Hindi (हिन्दी)', lang: 'hi', countryCode: 'IN' },
  { text: 'Japanese (日本語)', lang: 'ja', countryCode: 'JP' },
  { text: 'Korean (한국어)', lang: 'ko', countryCode: 'KR' },
  { text: 'Polish (Polski)', lang: 'pl', countryCode: 'PL' },
  { text: 'Portuguese (Brazil)', lang: 'pt-BR', countryCode: 'BR' },
  { text: 'Portuguese (Portugal)', lang: 'pt-PT', countryCode: 'PT' },
  { text: 'Swedish (Svenska)', lang: 'sv', countryCode: 'SE' },
  { text: 'Danish (Dansk)', lang: 'da', countryCode: 'DK' },
  { text: 'Italian (Italiano)', lang: 'it-IT', countryCode: 'IT' },
  { text: 'Turkish (Türkçe)', lang: 'tr-TR', countryCode: 'TR' },
  { text: 'Czech (Čeština)', lang: 'cs', countryCode: 'CZ' },
  { text: 'Russian (Русский)', lang: 'ru-RU', countryCode: 'RU' },
  { text: 'Chinese (Simplified) (简体中文)', lang: 'zh-CN', countryCode: 'CN' },
  { text: 'Thai (ภาษาไทย)', lang: 'th-TH', countryCode: 'TH' },
  { text: 'Malay (Bahasa Melayu)', lang: 'ms-MY', countryCode: 'MY' },
  { text: 'Yoruba', lang: 'yo-NG', countryCode: 'NG' },
  { text: 'Hausa', lang: 'ha-NG', countryCode: 'NG' },
  { text: 'Indonesian (Bahasa Indonesia)', lang: 'id-ID', countryCode: 'ID' },
  { text: 'Vietnamese (Tiếng Việt)', lang: 'vi-VN', countryCode: 'VN' },
  { text: 'Greek (Ελληνικά)', lang: 'el-GR', countryCode: 'GR' },
  { text: 'Hungarian (Magyar)', lang: 'hu-HU', countryCode: 'HU' },
  { text: 'Ukrainian (Українська)', lang: 'uk-UA', countryCode: 'UA' },
  { text: 'Norwegian (Norsk)', lang: 'no-NO', countryCode: 'NO' },
  { text: 'Chinese (Traditional) (繁體中文)', lang: 'zh-TW', countryCode: 'TW' },
  { text: 'Bengali (বাংলা)', lang: 'bn', countryCode: 'IN' },
  { text: 'Swahili (Kiswahili)', lang: 'sw', countryCode: 'KE' },
  { text: 'Afrikaans', lang: 'af', countryCode: 'ZA' },
];

export const DEFAULT_LANGUAGE = 'en-GB';
