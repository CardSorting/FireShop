/**
 * [LAYER: CORE]
 * Manages store-wide configuration and setup progress.
 */
import type { ISettingsRepository, IProductRepository, IDiscountRepository } from '@domain/repositories';
import type { JsonValue, NavigationMenu } from '@domain/models';
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

  async getSetupProgress(signal?: AbortSignal): Promise<SetupGuideProgress> {
    if (signal?.aborted) return {} as SetupGuideProgress;
    const [
      { products }, 
      storeName, 
      paymentConfig,
      shippingRates,
      customDomain
    ] = await Promise.all([
      this.productRepo.getAll({ limit: 1 }),
      this.settingsRepo.get<string>('store_name'),
      this.settingsRepo.get<boolean>('payment_configured'),
      this.settingsRepo.get<boolean>('shipping_configured'),
      this.settingsRepo.get<boolean>('domain_configured'),
    ]);
    
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

  async getSettings(signal?: AbortSignal): Promise<Record<string, JsonValue>> {
    if (signal?.aborted) return {};
    return this.settingsRepo.getAll();
  }

  async updateSetting(key: string, value: JsonValue, actor: { id: string, email: string }): Promise<void> {
    await this.settingsRepo.set(key, value);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'settings_updated',
      targetId: key,
      details: { value }
    });
  }

  async getNavigationMenu(menuId: string): Promise<NavigationMenu | null> {
    const raw = await this.settingsRepo.get<NavigationMenu>(`navigation_${menuId}`);
    return raw;
  }

  async updateNavigationMenu(menuId: string, menu: NavigationMenu, actor: { id: string, email: string }): Promise<void> {
    await this.updateSetting(`navigation_${menuId}`, menu as unknown as JsonValue, actor);
  }
}
