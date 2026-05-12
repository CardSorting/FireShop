import { describe, it, expect, vi } from 'vitest';
import { AuditService } from '../core/AuditService';

/**
 * [LOAD TEST]
 * Audit Tail Contention Analysis
 */
describe('Audit Tail Load & Contention', () => {
  it('PROVE: Audit service handles concurrent writes without global bottlenecking', async () => {
    const service = new AuditService();
    const startTime = Date.now();
    const iterationCount = 50;
    
    // Simulate burst logging
    const writes = Array.from({ length: iterationCount }).map((_, i) => 
        service.record({
            userId: `u${i}`,
            userEmail: `u${i}@test.com`,
            action: 'order_status_changed',
            targetId: 'load_test',
            details: { iteration: i }
        })
    );
    
    const results = await Promise.allSettled(writes);
    const duration = Date.now() - startTime;
    
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`[Audit Load Test] ${succeeded} writes in ${duration}ms. Avg: ${(duration/iterationCount).toFixed(2)}ms/write`);
    
    expect(succeeded).toBe(iterationCount);
    expect(duration).toBeLessThan(5000); // Should handle 50 writes well within 5s
  });
});
