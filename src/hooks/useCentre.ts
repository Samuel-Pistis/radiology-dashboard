import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';

/**
 * useCentre — single source of truth for centre identity.
 *
 * Priority order for centreId:
 *   1. user.centre_id  (from profiles table — real Supabase auth)
 *   2. centreSettings.centre_id  (from centre_settings row — fallback when RLS returns it)
 *   3. 'unknown'  (final fallback — signals misconfiguration; never used for writes in prod)
 *
 * centreName falls back to 'Radiology Centre' when no settings are loaded yet.
 */
export function useCentre() {
    const { user } = useAuth();
    const { centreSettings } = useAppContext();

    const centreId =
        user?.centre_id ??
        centreSettings?.centre_id ??
        'unknown';

    const centreName =
        (centreSettings as any)?.name ??
        (centreSettings as any)?.centre_name ??
        'Radiology Centre';

    return {
        centreId,
        centreName,
        centreSettings,
    } as const;
}
