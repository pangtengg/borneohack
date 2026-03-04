import { GhostPack, GlossaryPack } from '../types/dialect';

export const demoKelantanGhost: GhostPack = {
    packId: 'kl-malay-1',
    dialect: 'Kelantan Malay',
    region: 'Kelantan, Malaysia',
    sourceNgo: 'Local Responders',
    languageMajor: 'ms',
    phrases: [
        {
            id: 'km-g-1',
            dialectText: 'tolong demo, kawe cedera',
            canonical: 'Help me, I am injured',
            canonicalLanguage: 'en',
            context: 'emergency',
            minLength: 1.5,
            maxLength: 4.0,
        },
        {
            id: 'km-g-2',
            dialectText: 'kawe tak leh napah',
            canonical: 'I cannot breathe',
            canonicalLanguage: 'en',
            context: 'medical',
            minLength: 1.2,
            maxLength: 3.5,
        },
        {
            id: 'km-g-3',
            dialectText: 'panggil ambulan demo',
            canonical: 'Call an ambulance',
            canonicalLanguage: 'en',
            context: 'emergency',
            minLength: 1.0,
            maxLength: 3.0,
        },
    ],
};

export const demoHokkienGhost: GhostPack = {
    packId: 'hk-1',
    dialect: 'Hokkien',
    region: 'Penang/Klang',
    sourceNgo: 'Community Volunteers',
    languageMajor: 'zh',
    phrases: [
        {
            id: 'hk-g-1',
            dialectText: 'ngai bo lu, cheng pang ngai',
            canonical: 'I am lost, please help',
            canonicalLanguage: 'en',
            context: 'emergency',
            minLength: 1.5,
            maxLength: 4.0,
        },
        {
            id: 'hk-g-2',
            dialectText: 'ngai ai khi khoann i seng',
            canonical: 'I need a doctor',
            canonicalLanguage: 'en',
            context: 'medical',
            minLength: 1.5,
            maxLength: 3.5,
        },
    ],
};

export const demoKelantanGlossary: GlossaryPack = {
    packId: 'kl-glos-1',
    dialect: 'Kelantan Malay',
    region: 'Kelantan',
    entries: [
        { dialectPhrase: 'kawe', canonical: 'saya' },
        { dialectPhrase: 'demo', canonical: 'awak' },
        { dialectPhrase: 'napah', canonical: 'nafas' },
        { dialectPhrase: 'leh', canonical: 'boleh' },
        { dialectPhrase: 'tok', canonical: 'tidak' },
        { dialectPhrase: 'ghope', canonical: 'rupa' },
        { dialectPhrase: 'sokmo', canonical: 'selalu' },
    ],
};

export const demoHokkienGlossary: GlossaryPack = {
    packId: 'hk-glos-1',
    dialect: 'Hokkien',
    region: 'Penang',
    entries: [
        { dialectPhrase: 'ngai', canonical: 'I' },
        { dialectPhrase: 'goh', canonical: 'hungry' },
        { dialectPhrase: 'bo lu', canonical: 'lost' },
        { dialectPhrase: 'ai', canonical: 'want' },
        { dialectPhrase: 'khi', canonical: 'go' },
        { dialectPhrase: 'khoann', canonical: 'see' },
        { dialectPhrase: 'i seng', canonical: 'doctor' },
        { dialectPhrase: 'cheng', canonical: 'please' },
        { dialectPhrase: 'pang', canonical: 'help' },
    ],
};
