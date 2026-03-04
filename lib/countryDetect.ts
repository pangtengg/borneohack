import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CountryInfo {
    code: string;
    name: string;
    flag: string;
    langCode: string;
    langLabel: string;
    langFlag: string;
    status: 'online' | 'cached' | 'failed';
}

export const COUNTRY_MAP: Record<string, Omit<CountryInfo, 'status'>> = {
    MY: { code: 'MY', name: 'Malaysia', flag: '🇲🇾', langCode: 'ms', langLabel: 'Malay', langFlag: '🇲🇾' },
    TH: { code: 'TH', name: 'Thailand', flag: '🇹🇭', langCode: 'th', langLabel: 'Thai', langFlag: '🇹🇭' },
    ID: { code: 'ID', name: 'Indonesia', flag: '🇮🇩', langCode: 'id', langLabel: 'Indonesian', langFlag: '🇮🇩' },
    KH: { code: 'KH', name: 'Cambodia', flag: '🇰🇭', langCode: 'km', langLabel: 'Khmer', langFlag: '🇰🇭' },
    MM: { code: 'MM', name: 'Myanmar', flag: '🇲🇲', langCode: 'my', langLabel: 'Burmese', langFlag: '🇲🇲' },
    VN: { code: 'VN', name: 'Vietnam', flag: '🇻🇳', langCode: 'vi', langLabel: 'Vietnamese', langFlag: '🇻🇳' },
    PH: { code: 'PH', name: 'Philippines', flag: '🇵🇭', langCode: 'tl', langLabel: 'Filipino', langFlag: '🇵🇭' },
    CN: { code: 'CN', name: 'China', flag: '🇨🇳', langCode: 'zh', langLabel: 'Chinese', langFlag: '🇨🇳' },
    SG: { code: 'SG', name: 'Singapore', flag: '🇸🇬', langCode: 'en', langLabel: 'English', langFlag: '🇬🇧' },
};

const STORAGE_KEY = 'voicebridge_country_override';
const CACHE_KEY = 'voicebridge_country_cache';

export async function getOverrideCountry(): Promise<string | null> {
    try {
        return await AsyncStorage.getItem(STORAGE_KEY);
    } catch { return null; }
}

export async function saveOverrideCountry(code: string): Promise<void> {
    try {
        await AsyncStorage.setItem(STORAGE_KEY, code);
    } catch { }
}

export async function clearOverrideCountry(): Promise<void> {
    try {
        await AsyncStorage.removeItem(STORAGE_KEY);
    } catch { }
}

async function getCachedCountry(): Promise<string | null> {
    try {
        return await AsyncStorage.getItem(CACHE_KEY);
    } catch { return null; }
}

async function setCachedCountry(code: string): Promise<void> {
    try {
        await AsyncStorage.setItem(CACHE_KEY, code);
    } catch { }
}

async function fetchCountryFromIP(): Promise<string | null> {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return null;
        const data = await res.json();
        return data.country_code ?? null;
    } catch {
        return null;
    }
}

export async function detectCountry(): Promise<CountryInfo> {
    // 1. Check manual override
    const override = await getOverrideCountry();
    if (override && COUNTRY_MAP[override]) {
        return { ...COUNTRY_MAP[override], status: 'online' };
    }

    // 2. Try IP detection
    const ipCode = await fetchCountryFromIP();
    if (ipCode && COUNTRY_MAP[ipCode]) {
        await setCachedCountry(ipCode);
        return { ...COUNTRY_MAP[ipCode], status: 'online' };
    }

    // 3. Fall back to cached
    const cached = await getCachedCountry();
    if (cached && COUNTRY_MAP[cached]) {
        return { ...COUNTRY_MAP[cached], status: 'cached' };
    }

    // 4. Failed entirely
    return {
        code: 'XX',
        name: 'Unknown',
        flag: '🌐',
        langCode: 'en',
        langLabel: 'English',
        langFlag: '🌐',
        status: 'failed',
    };
}

export function getAllCountries() {
    return Object.values(COUNTRY_MAP);
}
