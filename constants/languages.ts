export interface Language {
  code: string;
  label: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ms', label: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'id', label: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'th', label: 'Thai', nativeName: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'vi', label: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'tl', label: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
  { code: 'my', label: 'Burmese', nativeName: 'မြန်မာဘာသာ', flag: '🇲🇲' },
  { code: 'km', label: 'Khmer', nativeName: 'ភាសាខ្មែរ', flag: '🇰🇭' },
  { code: 'zh', label: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', label: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

export function getLanguageByCode(code: string): Language {
  return (
    SUPPORTED_LANGUAGES.find((l) => l.code === code) ?? {
      code,
      label: code.toUpperCase(),
      nativeName: code,
      flag: '🌐',
    }
  );
}
