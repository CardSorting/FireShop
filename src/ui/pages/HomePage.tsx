'use client';

/**
 * [LAYER: UI]
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useServices } from '../hooks/useServices';
import type { Product } from '@domain/models';
import { ArrowRight, Sparkles, Shield, Truck } from 'lucide-react';

export function HomePage() {
  const services = useServices();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    services.productService.getProducts({ limit: 4 })
      .then((result) => {
        if (!mounted) return;
        setFeatured(result.products);
        setError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load featured products');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [services]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-primary-700 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Your TCG Destination</h1>
          <p className="text-primary-100 text-lg mb-8 max-w-2xl mx-auto">
            Discover booster boxes, rare singles, and accessories for Pokemon, MTG, and more.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-lg font-medium hover:bg-primary-50 transition"
          >
            Shop Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <Shield className="w-10 h-10 text-primary-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Authentic Products</h3>
            <p className="text-sm text-gray-500">Every card verified for authenticity</p>
          </div>
          <div className="text-center">
            <Sparkles className="w-10 h-10 text-primary-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Rare Finds</h3>
            <p className="text-sm text-gray-500">Holo, secret rares, and chase cards</p>
          </div>
          <div className="text-center">
            <Truck className="w-10 h-10 text-primary-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Fast Shipping</h3>
            <p className="text-sm text-gray-500">Ships within 24 hours</p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Products</h2>
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition group"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-primary-600 font-medium uppercase mb-1">
                      {p.category}
                    </p>
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
                      {p.name}
                    </h3>
                    <p className="text-lg font-bold text-gray-900">
                      ${(p.price / 100).toFixed(2)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}