import { useAppContext } from '../context/AppContext';

/**
 * useCentreSettingsCollection
 *
 * Encapsulates the repetitive "mergedX + CRUD" pattern used in Settings pages
 * that store collections inside `centre_settings` (e.g. film_sizes, shifts, contrast_types).
 *
 * @param key        The key in centreSettings (e.g. 'film_sizes')
 * @param defaults   Fallback array when centreSettings[key] is empty or undefined
 *
 * Returns:
 *   items   — merged list (settings overrides defaults)
 *   add     — adds a new item to centreSettings[key]
 *   remove  — removes an item by id from centreSettings[key]
 */
export function useCentreSettingsCollection<T extends { id: string }>(
    key: string,
    defaults: T[] = []
) {
    const { centreSettings, updateCentreSettings } = useAppContext();

    const raw = (centreSettings as any)?.[key] as Record<string, T> | undefined;

    const items: T[] =
        raw && Object.keys(raw).length > 0
            ? Object.values(raw)
            : defaults;

    async function add(item: T): Promise<void> {
        const base: Record<string, T> =
            raw && Object.keys(raw).length > 0
                ? { ...raw }
                : Object.fromEntries(defaults.map(d => [d.id, d]));

        const next = { ...base, [item.id]: item };
        await updateCentreSettings({ [key]: next });
    }

    async function remove(id: string): Promise<void> {
        const base: Record<string, T> =
            raw && Object.keys(raw).length > 0
                ? { ...raw }
                : Object.fromEntries(defaults.map(d => [d.id, d]));

        const next = { ...base };
        delete next[id];
        await updateCentreSettings({ [key]: next });
    }

    return { items, add, remove } as const;
}
