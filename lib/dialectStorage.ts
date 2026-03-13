import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from './store';
import { GhostPack, GlossaryPack } from './types/dialect';
import { demoKelantanGhost, demoHokkienGhost, demoKelantanGlossary, demoHokkienGlossary } from './data/demoPacks';

const STORAGE_KEYS = {
    GHOST_ENABLED: 'ghost_enabled',
    DIALECT_ENABLED: 'dialect_enabled',
    ENABLED_DIALECT_NAMES: 'enabled_dialect_names',
    GHOST_PACKS: 'ghost_packs',
    GLOSSARY_PACKS: 'glossary_packs',
};

export const initializeDialectStore = async () => {
    try {
        const store = useAppStore.getState();

        // 1. Ghost Enabled
        const ghostEnabledStr = await AsyncStorage.getItem(STORAGE_KEYS.GHOST_ENABLED);
        if (ghostEnabledStr !== null) {
            store.setGhostEnabled(ghostEnabledStr === 'true');
        }

        // 2. Dialect Enabled
        const dialectEnabledStr = await AsyncStorage.getItem(STORAGE_KEYS.DIALECT_ENABLED);
        if (dialectEnabledStr !== null) {
            store.setDialectEnabled(dialectEnabledStr === 'true');
        }

        // 3. Ghost Packs
        const packsStr = await AsyncStorage.getItem(STORAGE_KEYS.GHOST_PACKS);
        if (packsStr) {
            const packs: GhostPack[] = JSON.parse(packsStr);
            packs.forEach(store.addGhostPack);
        } else {
            // First boot: load demo packs
            store.addGhostPack(demoKelantanGhost);
            store.addGhostPack(demoHokkienGhost);
            await saveGhostPacks([demoKelantanGhost, demoHokkienGhost]);
        }

        // 4. Glossaries
        const glossariesStr = await AsyncStorage.getItem(STORAGE_KEYS.GLOSSARY_PACKS);
        if (glossariesStr) {
            const glossaries: GlossaryPack[] = JSON.parse(glossariesStr);
            glossaries.forEach(store.addGlossaryPack);
        } else {
            // First boot: load demo glossaries
            store.addGlossaryPack(demoKelantanGlossary);
            store.addGlossaryPack(demoHokkienGlossary);
            await saveGlossaryPacks([demoKelantanGlossary, demoHokkienGlossary]);
        }

        // 5. Enabled dialect names (Dialect Bank)
        const enabledStr = await AsyncStorage.getItem(STORAGE_KEYS.ENABLED_DIALECT_NAMES);
        if (enabledStr) {
            const names: string[] = JSON.parse(enabledStr);
            store.setEnabledDialectNames(names);
        }

    } catch (error) {
        console.error('Failed to initialize dialect store', error);
    }
};

export const saveGhostEnabled = async (enabled: boolean) => {
    await AsyncStorage.setItem(STORAGE_KEYS.GHOST_ENABLED, String(enabled));
    useAppStore.getState().setGhostEnabled(enabled);
};

export const saveDialectEnabled = async (enabled: boolean) => {
    await AsyncStorage.setItem(STORAGE_KEYS.DIALECT_ENABLED, String(enabled));
    useAppStore.getState().setDialectEnabled(enabled);
};

export const saveGhostPacks = async (packs: GhostPack[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.GHOST_PACKS, JSON.stringify(packs));
};

export const saveGlossaryPacks = async (packs: GlossaryPack[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.GLOSSARY_PACKS, JSON.stringify(packs));
};

export const saveEnabledDialectNames = async (names: string[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.ENABLED_DIALECT_NAMES, JSON.stringify(names));
    useAppStore.getState().setEnabledDialectNames(names);
};
