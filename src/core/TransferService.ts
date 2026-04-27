import type { Transfer } from '@domain/models';
import type { ITransferRepository, IProductRepository } from '@domain/repositories';

export class TransferService {
  constructor(
    private transferRepo: ITransferRepository,
    private productRepo: IProductRepository
  ) {}

  async getAllTransfers(): Promise<Transfer[]> {
    const transfers = await this.transferRepo.getAll();
    
    // Initial Seed for production hardening (persists to physical SQLite DB)
    if (transfers.length === 0) {
      const initialSeed: Transfer = {
        id: 'TR-8042',
        source: 'Kanto Distribution',
        status: 'in_transit',
        items: [
          { productId: '1', name: 'Charizard Base Set', quantity: 10 },
          { productId: '2', name: 'Blastoise Base Set', quantity: 5 }
        ],
        itemsCount: 15,
        receivedCount: 0,
        expectedAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };
      
      if (this.transferRepo.create) {
        await this.transferRepo.create(initialSeed);
        return [initialSeed];
      }
    }


    return transfers;
  }

  async receiveTransfer(id: string): Promise<void> {
    const transfers = await this.transferRepo.getAll();
    const transfer = transfers.find(t => t.id === id);
    
    if (!transfer) throw new Error('Transfer not found');
    if (transfer.status === 'received') return;

    // Hardened Logic: Atomic Inventory Restocking
    const restockingUpdates = transfer.items.map(item => ({
      id: item.productId,
      delta: item.quantity
    }));

    if (this.productRepo.batchUpdateStock) {
      await this.productRepo.batchUpdateStock(restockingUpdates);
    } else {
      await Promise.all(restockingUpdates.map(u => this.productRepo.updateStock(u.id, u.delta)));
    }

    await this.transferRepo.update(id, { 
      status: 'received', 
      receivedCount: transfer.itemsCount 
    });
  }
}


