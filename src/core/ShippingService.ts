/**
 * [LAYER: CORE]
 */
import type { IShippingRepository } from '@domain/repositories';
import type { ShippingClass, ShippingZone, ShippingRate } from '@domain/models';
import { AuditService } from './AuditService';
import * as crypto from 'node:crypto';

export class ShippingService {
  constructor(
    private shippingRepo: IShippingRepository,
    private audit: AuditService
  ) {}

  // Classes
  async getAllClasses(): Promise<ShippingClass[]> {
    return this.shippingRepo.getAllClasses();
  }

  async saveClass(shippingClass: Omit<ShippingClass, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }, actor: { id: string, email: string }): Promise<ShippingClass> {
    const id = shippingClass.id || crypto.randomUUID();
    const fullClass: ShippingClass = {
      ...shippingClass,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const saved = await this.shippingRepo.saveClass(fullClass);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'shipping_class_saved',
      targetId: id,
      details: { name: shippingClass.name }
    });
    return saved;
  }

  async deleteClass(id: string, actor: { id: string, email: string }): Promise<void> {
    await this.shippingRepo.deleteClass(id);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'shipping_class_deleted',
      targetId: id
    });
  }

  // Zones
  async getAllZones(): Promise<ShippingZone[]> {
    return this.shippingRepo.getAllZones();
  }

  async saveZone(zone: Omit<ShippingZone, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }, actor: { id: string, email: string }): Promise<ShippingZone> {
    const id = zone.id || crypto.randomUUID();
    const fullZone: ShippingZone = {
      ...zone,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const saved = await this.shippingRepo.saveZone(fullZone);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'shipping_zone_saved',
      targetId: id,
      details: { name: zone.name }
    });
    return saved;
  }

  async deleteZone(id: string, actor: { id: string, email: string }): Promise<void> {
    await this.shippingRepo.deleteZone(id);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'shipping_zone_deleted',
      targetId: id
    });
  }

  // Rates
  async getAllRates(): Promise<ShippingRate[]> {
    return this.shippingRepo.getAllRates();
  }

  async saveRate(rate: Omit<ShippingRate, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }, actor: { id: string, email: string }): Promise<ShippingRate> {
    const id = rate.id || crypto.randomUUID();
    const fullRate: ShippingRate = {
      ...rate,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const saved = await this.shippingRepo.saveRate(fullRate);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'shipping_rate_saved',
      targetId: id,
      details: { name: rate.name, amount: rate.amount }
    });
    return saved;
  }

  async deleteRate(id: string, actor: { id: string, email: string }): Promise<void> {
    await this.shippingRepo.deleteRate(id);
    await this.audit.record({
      userId: actor.id,
      userEmail: actor.email,
      action: 'shipping_rate_deleted',
      targetId: id
    });
  }
}
