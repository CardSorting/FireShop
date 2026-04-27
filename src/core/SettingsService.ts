/**
 * [LAYER: CORE]
 * Manages store-wide configuration and setup progress.
 */
import type { ISettingsRepository, IProductRepository, IDiscountRepository } from '@domain/repositories';
import { AuditService } from './AuditService';

export interface SetupGuideProgress {
  hasProducts: boolean;
  hasStoreName: boolean;
  hasPaymentConfigured: boolean;
  hasShippingRates: boolean;
  hasCustomDomain: boolean;
  completedCount: number;
  totalCount: number;
}

export class SettingsService {
  constructor(
    private settingsRepo: ISettingsRepository,
    private productRepo: IProductRepository,
    private discountRepo: IDiscountRepository,
    private audit: AuditService
  ) {}

  async getSetupProgress(): Promise<SetupGuideProgress> {
    const [{ products }, storeName, paymentConfig] = await Promise.all([
      this.productRepo.getAll({ limit: 1 }),
      this.settingsRepo.get<string>('store_name'),
      this.settingsRepo.get<boolean>('payment_configured'),
    ]);

    // Mocking some advanced ones for now until we have infrastructure for them
    const shippingRates = await this.settingsRepo.get<boolean>('shipping_configured');
    const customDomain = await this.settingsRepo.get<boolean>('domain_configured');

    const tasks = [
      { id: 'products', completed: products.length > 0 },
      { id: 'name', completed: !!storeName },
      { id: 'payments', completed: !!paymentConfig },
      { id: 'shipping', completed: !!shippingRates },
      { id: 'domain', completed: !!customDomain },
    ];

    const completedCount = tasks.filter(t => t.completed).length;

    return {
      hasProducts: tasks[0].completed,
      hasStoreName: tasks[1].completed,
      hasPaymentConfigured: tasks[2].completed,
      hasShippingRates: tasks[3].completed,
      hasCustomDomain: tasks[4].completed,
      completedCount,
      totalCount: tasks.length
    };
  }

  async getSettings(): Promise<Record<string, any>> {
    return this.settingsRepo.getAll();
  }

  async updateSetting(key: string, value: any, actor: { id: string, email: string }): Promise<void> {
    await this.settingsRepo.set(key, value);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'settings_updated',
      targetId: key,
      details: { value }
    });
  }
}
