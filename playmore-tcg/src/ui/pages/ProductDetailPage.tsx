/**
 * [LAYER: UI]
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../hooks/useAuth';
import type { Product } from '@domain/models';
import { ShoppingCart, ArrowLeft, Check } from 'lucide-react';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const services = useServices();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) return;
    services.productService.getProduct(id).then(setProduct);
  }, [id]);

  async function handleAddToCart() {
    if (!user || !product) return;
    setAdding(true);
    await services.cartService.addToCart(user.id, product.id, quantity);
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (!product) return <div className="max-w-7xl mx-auto p-8 text-center text-gray-400">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/products" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square rounded-lg overflow-hidden bg-white border">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        </div>

        <div>
          <p className="text-sm text-primary-600 font-medium uppercase mb-2">{product.category}</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          {product.set && <p className="text-sm text-gray-500 mb-4">{product.set}</p>}
          {product.rarity && (
            <span className="inline-block bg-primary-100 text-primary-700 text-xs font-medium px-2 py-1 rounded-full mb-4">
              {product.rarity}
            </span>
          )}

          <p className="text-3xl font-bold text-gray-900 mb-6">${(product.price / 100).toFixed(2)}</p>

          <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>

          <div className="flex items-center gap-2 mb-2">
            <span className={`text-sm ${product.stock < 5 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              {product.stock} in stock
            </span>
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-50"
                >
                  -
                </button>
                <span className="px-3 py-2 text-sm font-medium w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-2 text-gray-600 hover:bg-gray-50"
                >
                  +
                </button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={adding || product.stock === 0}
                className="flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {added ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                {adding ? 'Adding...' : added ? 'Added!' : 'Add to Cart'}
              </button>
            </div>
          ) : (
            <Link to="/login" className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-md font-medium hover:bg-primary-700">
              Sign in to Add to Cart
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}