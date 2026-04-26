import { initDatabase } from '@infrastructure/sqlite/database';
import { getInitialServices } from '@core/container';

let initialized = false;

export async function getServerServices() {
    if (!initialized) {
        await initDatabase();
        initialized = true;
    }
    return getInitialServices();
}
