import { useAppContext } from '../context/AppContext';

/**
 * useCentre — simplified for the single-centre architecture.
 *
 * No longer returns a `centreId` parameter since it's irrelevant.
 * Provides a quick accessor for the global centreName.
 */
export function useCentre() {
    const { centreSettings } = useAppContext();

    const centreName = centreSettings?.name ?? 'Radiology Centre';

    return {
        centreName,
        centreSettings,
    } as const;
}
