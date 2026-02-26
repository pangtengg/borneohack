export interface RegionEntry {
  name: string;
  // [minLon, minLat, maxLon, maxLat]
  bbox: [number, number, number, number];
  lang: string;
  label: string;
  flag: string;
}

const REGIONS: RegionEntry[] = [
  { name: 'Singapore', bbox: [103.6, 1.15, 104.1, 1.48], lang: 'en', label: 'English', flag: '🇸🇬' },
  { name: 'Peninsular Malaysia', bbox: [99.6, 1.2, 104.6, 6.7], lang: 'ms', label: 'Malay', flag: '🇲🇾' },
  { name: 'East Malaysia (Sabah/Sarawak)', bbox: [109.5, 0.8, 119.3, 7.4], lang: 'ms', label: 'Malay', flag: '🇲🇾' },
  { name: 'Brunei', bbox: [114.0, 4.0, 115.4, 5.1], lang: 'ms', label: 'Malay', flag: '🇧🇳' },
  { name: 'Indonesia (Sumatra)', bbox: [95.0, -5.9, 106.0, 5.9], lang: 'id', label: 'Indonesian', flag: '🇮🇩' },
  { name: 'Indonesia (Java)', bbox: [105.0, -8.8, 114.6, -5.9], lang: 'id', label: 'Indonesian', flag: '🇮🇩' },
  { name: 'Indonesia (Kalimantan)', bbox: [108.0, -4.0, 119.0, 4.2], lang: 'id', label: 'Indonesian', flag: '🇮🇩' },
  { name: 'Indonesia (Sulawesi)', bbox: [119.3, -5.7, 125.5, 2.0], lang: 'id', label: 'Indonesian', flag: '🇮🇩' },
  { name: 'Indonesia (Nusa Tenggara)', bbox: [114.6, -10.7, 125.2, -7.9], lang: 'id', label: 'Indonesian', flag: '🇮🇩' },
  { name: 'Thailand', bbox: [97.3, 5.6, 105.7, 20.5], lang: 'th', label: 'Thai', flag: '🇹🇭' },
  { name: 'Vietnam', bbox: [102.1, 8.4, 109.5, 23.4], lang: 'vi', label: 'Vietnamese', flag: '🇻🇳' },
  { name: 'Philippines', bbox: [116.9, 4.6, 126.6, 18.5], lang: 'tl', label: 'Filipino', flag: '🇵🇭' },
  { name: 'Myanmar', bbox: [92.2, 9.8, 101.2, 28.5], lang: 'my', label: 'Burmese', flag: '🇲🇲' },
  { name: 'Cambodia', bbox: [102.3, 10.4, 107.6, 14.7], lang: 'km', label: 'Khmer', flag: '🇰🇭' },
  { name: 'Laos', bbox: [100.1, 13.9, 107.7, 22.5], lang: 'lo', label: 'Lao', flag: '🇱🇦' },
  { name: 'Timor-Leste', bbox: [124.0, -9.5, 127.3, -8.1], lang: 'pt', label: 'Tetum/Portuguese', flag: '🇹🇱' },
];

export interface DetectedLanguage {
  lang: string;
  label: string;
  flag: string;
  region: string;
}

export function detectLanguageFromCoords(
  latitude: number,
  longitude: number,
): DetectedLanguage {
  for (const region of REGIONS) {
    const [minLon, minLat, maxLon, maxLat] = region.bbox;
    if (longitude >= minLon && longitude <= maxLon && latitude >= minLat && latitude <= maxLat) {
      return {
        lang: region.lang,
        label: region.label,
        flag: region.flag,
        region: region.name,
      };
    }
  }
  // Default to English if outside known regions
  return { lang: 'en', label: 'English', flag: '🌐', region: 'Unknown' };
}
