import { initDatabase } from '@infrastructure/sqlite/database';
import { getInitialServices } from '@core/container';

let initPromise: Promise<void> | null = null;

export async function getServerServices() {
    if (!initPromise) initPromise = initDatabase();
    await initPromise;
    return getInitialServices();
}
