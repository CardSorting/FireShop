export const SINGLE_STORE_ID = 'default';

export function assertMultiStoreNotEnabled(): void {
  if (process.env.MULTI_STORE_ENABLED === 'true' && process.env.TENANT_BOUNDARY_ENFORCED !== 'true') {
    throw new Error('MULTI_STORE_ENABLED is blocked until storeId tenant isolation is enforced in auth, repositories, rules, and indexes.');
  }
}
