/**
 * [LAYER: INFRASTRUCTURE]
 * Server-side service initialization.
 */
import { getInitialServices } from '@core/container';

export async function getServerServices() {
    // Firestore doesn't require a manual local database initialization like SQLite
    return getInitialServices();
}
