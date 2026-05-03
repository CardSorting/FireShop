'use client';

/**
 * [LAYER: UI]
 */
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  HelpCircle,
  Info,
  Lock,
  LockKeyhole,
  Mail,
  PackageCheck,
  RefreshCcw,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Tag,
  Truck,
} from 'lucide-react';
import type { Address, Order } from '@domain/models';
import { logger } from '@utils/logger';
import { isStripeConfigured } from '../checkout/stripeClient';
import { OrderConfirmation } from '../checkout/OrderConfirmation';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useServices } from '../hooks/useServices';
import { formatMoney } from '@utils/formatters';

const StripeCheckoutForm = lazy(() => import('../checkout/StripeCheckoutForm').then((module) => ({ default: module.StripeCheckoutForm })));

type CheckoutStep = 'information' | 'shipping' | 'payment';

type CheckoutFieldErrors = Partial<Record<'email' | 'street' | 'city' | 'state' | 'zip', string>>;

const CHECKOUT_STEPS: Array<{ id: CheckoutStep; label: string }> = [
  { id: 'information', label: 'Information' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'payment', label: 'Payment' },
];


function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function validateCheckoutDetails(email: string, address: Address, isPurelyDigital: boolean = false): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {};
  if (!validateEmail(email)) errors.email = 'Enter a valid email address for your receipt and delivery updates.';
  
  if (!isPurelyDigital) {
    if (!address.street.trim()) errors.street = 'Enter the street address where your order should ship.';
    if (!address.city.trim()) errors.city = 'Enter a city.';
    if (!address.state.trim()) errors.state = 'Enter a state or region.';
    if (!address.zip.trim()) errors.zip = 'Enter a ZIP or postal code.';
  }
  return errors;
}

import { Stepper } from '../components/Stepper';

export function CheckoutPage() {
  const { user } = useAuth();
  const { cart, loading: loadingCart, subtotal, totalItems } = useCart();
  const services = useServices();

  const [step, setStep] = useState<CheckoutStep>('information');
  const [isSuccess, setIsSuccess] = useState(false);
  const [finalOrder, setFinalOrder] = useState<Order | null>(null);
  const [address, setAddress] = useState<Address>({ street: '', city: '', state: '', zip: '', country: 'US' });
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [placing, setPlacing] = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'authorizing' | 'finalizing'>('idle');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [discountCode, setDiscountCode] = useState('');
  const [discountMessage, setDiscountMessage] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const checkoutAttemptKey = useRef("");

  useEffect(() => {
    if (!checkoutAttemptKey.current) {
        checkoutAttemptKey.current = `checkout-ui:${crypto.randomUUID()}`;
    }
    if (user) setEmail(user.email);
    const savedAddress = localStorage.getItem('checkout:address');
    if (savedAddress) {
      try {
        setAddress(JSON.parse(savedAddress));
      } catch (e) {
        logger.error('Failed to parse saved address', e);
      }
    }
  }, [user]);
  
  const cartItems = cart?.items ?? [];

  useEffect(() => {
    localStorage.setItem('checkout:address', JSON.stringify(address));
  }, [address]);

  const isPurelyDigital = useMemo(() => {
    return cartItems.length > 0 && cartItems.every(item => item.isDigital);
  }, [cartItems]);

  const shipping = isPurelyDigital || subtotal >= 10000 ? 0 : 599;
  const discountAmount = appliedDiscount?.amount ?? 0;
  const total = Math.max(0, subtotal + shipping - discountAmount);
  const freeShippingRemaining = Math.max(0, 10000 - subtotal);
  const currentStepIndex = CHECKOUT_STEPS.findIndex((item) => item.id === step);

  function goToStep(nextStep: CheckoutStep) {
    if (nextStep === 'shipping' && isPurelyDigital) {
      goToStep('payment');
      return;
    }

    if (nextStep === 'payment' || nextStep === 'shipping') {
      const errors = validateCheckoutDetails(email, address, isPurelyDigital);
      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        setStep('information');
        return;
      }
    }
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setIsApplying(true);
    setDiscountMessage(null);
    setTimeout(() => {
      const code = discountCode.trim().toUpperCase();
      if (code === 'WELCOME10') {
        setAppliedDiscount({ code, amount: Math.floor(subtotal * 0.1) });
        setDiscountMessage('WELCOME10 applied. Your discount is reflected below.');
      } else if (code === 'SAVE5') {
        setAppliedDiscount({ code, amount: 500 });
        setDiscountMessage('SAVE5 applied. Your discount is reflected below.');
      } else {
        setDiscountMessage('That code is not available. Check the spelling or try another code.');
      }
      setIsApplying(false);
      setDiscountCode('');
    }, 500);
  };

  async function handleSuccess(paymentMethodId: string) {
    if (!user) {
      setCheckoutError('Please sign in to complete your order. Your cart and checkout details have been saved.');
      return;
    }
    const errors = validateCheckoutDetails(email, address);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setCheckoutError('Review the highlighted checkout details before payment.');
      setStep('information');
      return;
    }
    setCheckoutError(null);
    setCheckoutStatus('finalizing');
    try {
      const normalizedAddress = { ...address, country: address.country.trim().toUpperCase() || 'US' };
      const order = await services.orderService.finalizeTrustedCheckout(
        user.id, 
        normalizedAddress, 
        paymentMethodId, 
        checkoutAttemptKey.current,
        appliedDiscount?.code
      );
      setFinalOrder(order);
      checkoutAttemptKey.current = `checkout-ui:${crypto.randomUUID()}`;
      setIsSuccess(true);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Checkout could not be finalized. Please try again.');
    } finally {
      setPlacing(false);
      setCheckoutStatus('idle');
    }
  }

  useEffect(() => {
    if (checkoutError) document.getElementById('checkout-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [checkoutError]);

  if (loadingCart) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center">
          <RefreshCcw className="mx-auto h-10 w-10 animate-spin text-primary-600" />
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Initializing Checkout...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && !isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl text-center border border-gray-100">
          <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gray-50 text-gray-200">
            <ShoppingBag className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-3">Your cart is empty</h1>
          <p className="text-gray-500 mb-10 font-medium leading-relaxed">It looks like you haven't added any art to your cart yet. Let's find something special.</p>
          <Link href="/products" className="inline-flex items-center justify-center w-full rounded-2xl bg-gray-900 px-8 py-5 text-sm font-black text-white shadow-xl transition-all hover:bg-black hover:-translate-y-1">
            Browse Collections
          </Link>
        </div>
      </div>
    );
  }

  if (isSuccess && finalOrder) return <OrderConfirmation order={finalOrder} userEmail={email} userName={user?.displayName} />;

  return (
    <div className="relative min-h-screen bg-white">
      {/* Background Decor */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-primary-100/20 blur-[120px]" />
        <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-blue-50/30 blur-[120px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-2xl font-black tracking-tighter text-gray-900">DreamBees<span className="text-primary-600">Art</span></Link>
          <div className="flex items-center gap-6">
            <div className="hidden items-center gap-2 rounded-full border border-green-100 bg-green-50 px-4 py-1.5 md:flex">
              <LockKeyhole className="h-3.5 w-3.5 text-green-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-green-700">AES-256 SSL Secure</span>
            </div>
            <Link href="/contact" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">Help</Link>
          </div>
        </div>
      </header>

      {/* Mobile Sticky Summary Trigger */}
      <div className="sticky top-[65px] z-40 border-b border-gray-100 bg-gray-50/95 px-4 py-4 backdrop-blur-sm lg:hidden">
        <button 
          onClick={() => setSummaryOpen(!summaryOpen)} 
          className="flex w-full items-center justify-between"
        >
          <span className="flex items-center gap-2 text-xs font-black text-gray-700">
            <ShoppingBag className="h-4 w-4" /> 
            {summaryOpen ? 'Hide' : 'Show'} summary 
            <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${summaryOpen ? 'rotate-180' : ''}`} />
          </span>
          <span className="text-sm font-black text-gray-900">{formatMoney(total)}</span>
        </button>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-12">
        <main className="px-4 py-10 sm:px-6 lg:col-span-7 lg:px-12 lg:py-16">
          <Stepper 
            steps={CHECKOUT_STEPS.filter(s => !(isPurelyDigital && s.id === 'shipping'))} 
            currentStepId={step} 
            onStepClick={goToStep} 
          />

          <div className="max-w-2xl mx-auto lg:mx-0">
            {checkoutError && (
              <div id="checkout-error" role="alert" className="mb-10 flex gap-4 rounded-4xl border-2 border-red-100 bg-red-50 p-6 text-sm text-red-700 shadow-sm animate-in zoom-in-95">
                <AlertCircle className="h-6 w-6 shrink-0" />
                <div>
                  <p className="font-black text-lg">Action required</p>
                  <p className="mt-1 font-medium opacity-80">{checkoutError}</p>
                </div>
              </div>
            )}

            {step === 'information' && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section>
                  <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-3xl font-black tracking-tight text-gray-900" data-testid="checkout-title">Customer Identity</h1>
                    {!user && <Link href="/login" className="text-xs font-black uppercase tracking-widest text-primary-600 hover:underline">Log in</Link>}
                  </div>
                  
                  <div className="space-y-4">
                    <FormField 
                      label="Email for receipt" 
                      id="checkout-email" 
                      type="email" 
                      autoComplete="email" 
                      error={fieldErrors.email} 
                      value={email} 
                      onChange={setEmail} 
                      placeholder="you@example.com"
                      readOnly={!!user}
                      icon={<Mail className="h-4 w-4" />}
                    />
                    <label className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 transition hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" className="h-5 w-5 rounded-lg border-gray-200 text-primary-600 focus:ring-primary-500" />
                      <span className="text-xs font-bold text-gray-600">Keep me updated on new drops and collector news.</span>
                    </label>
                  </div>
                </section>

                {!isPurelyDigital && (
                  <section>
                    <h2 className="mb-8 text-3xl font-black tracking-tight text-gray-900">Destination</h2>
                    <div className="grid grid-cols-1 gap-6">
                      <FormField 
                        label="Street Address" 
                        id="checkout-street"
                        autoComplete="shipping street-address" 
                        error={fieldErrors.street} 
                        value={address.street} 
                        onChange={(val) => setAddress({ ...address, street: val })} 
                        placeholder="Street address, suite, or apartment" 
                      />
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <FormField 
                          label="City" 
                          id="checkout-city"
                          autoComplete="shipping address-level2" 
                          error={fieldErrors.city}
                          value={address.city} 
                          onChange={(val) => setAddress({ ...address, city: val })} 
                        />
                        <div className="grid grid-cols-2 gap-6">
                          <FormField 
                            label="State" 
                            id="checkout-state"
                            autoComplete="shipping address-level1" 
                            error={fieldErrors.state}
                            value={address.state} 
                            onChange={(val) => setAddress({ ...address, state: val })} 
                          />
                          <FormField 
                            label="ZIP Code" 
                            id="checkout-zip"
                            autoComplete="shipping postal-code" 
                            error={fieldErrors.zip}
                            value={address.zip} 
                            onChange={(val) => setAddress({ ...address, zip: val })} 
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                <div className="flex flex-col-reverse gap-6 pt-8 sm:flex-row sm:items-center sm:justify-between border-t border-gray-100">
                  <Link href="/cart" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to cart
                  </Link>
                  <button 
                    onClick={() => goToStep(isPurelyDigital ? 'payment' : 'shipping')} 
                    data-testid="continue-to-shipping" 
                    className="group relative overflow-hidden rounded-2xl bg-gray-900 px-10 py-5 text-sm font-black text-white shadow-2xl transition-all hover:bg-black hover:-translate-y-1 active:translate-y-0"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isPurelyDigital ? 'Continue to Payment' : 'Continue to Shipping'} 
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 z-0 bg-linear-to-r from-primary-600 to-blue-600 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </div>
              </div>
            )}

            {step === 'shipping' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <ReviewCard email={email} address={address} shipping={shipping} onChange={setStep} />
                
                <section>
                  <h1 className="mb-8 text-3xl font-black tracking-tight text-gray-900">Delivery Speed</h1>
                  <div className="group relative overflow-hidden rounded-4xl border-2 border-primary-500 bg-primary-50/20 p-8 shadow-lg shadow-primary-100 transition-all hover:shadow-xl">
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary-500/10 blur-2xl" />
                    <div className="flex items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white shadow-lg">
                          <Truck className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-lg font-black text-gray-900">Standard Insured Shipping</p>
                          <p className="mt-1 text-sm font-medium text-gray-500">Tracked & packed in protective sleeves • 3–5 business days</p>
                        </div>
                      </div>
                      <span className="text-lg font-black text-primary-700">{shipping === 0 ? 'FREE' : formatMoney(shipping)}</span>
                    </div>
                  </div>
                </section>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 text-sm text-blue-800">
                  <div className="flex gap-4">
                    <Info className="h-5 w-5 shrink-0 text-blue-600" />
                    <p className="font-medium">Almost there. You'll be able to review all details and apply payment on the next step.</p>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-6 pt-8 sm:flex-row sm:items-center sm:justify-between border-t border-gray-100">
                  <button onClick={() => setStep('information')} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900">
                    <ArrowLeft className="h-4 w-4" /> Edit Address
                  </button>
                  <button 
                    onClick={() => goToStep('payment')} 
                    data-testid="continue-to-payment" 
                    className="group relative overflow-hidden rounded-2xl bg-gray-900 px-10 py-5 text-sm font-black text-white shadow-2xl transition-all hover:bg-black hover:-translate-y-1"
                  >
                    <span className="relative z-10 flex items-center gap-2">Continue to Payment <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
                    <div className="absolute inset-0 z-0 bg-linear-to-r from-primary-600 to-blue-600 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <ReviewCard email={email} address={address} shipping={shipping} onChange={setStep} />
                
                <section>
                  <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-3xl font-black tracking-tight text-gray-900" data-testid="payment-header">Secure Payment</h1>
                    <div className="flex items-center gap-2 grayscale opacity-50">
                      <CreditCard className="h-5 w-5" />
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-2xl shadow-gray-200/50">
                    <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Order Commitment</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-600">
                          {isPurelyDigital ? 'Instant digital fulfillment' : `${totalItems} Items ready for shipment`}
                        </span>
                        <span className="text-2xl font-black text-gray-900">{formatMoney(total)}</span>
                      </div>
                    </div>
                    
                    <div className="p-8">
                      {isStripeConfigured ? (
                        <Suspense fallback={<div className="flex flex-col items-center justify-center p-12 text-gray-400"><RefreshCcw className="h-8 w-8 animate-spin mb-4" /><p className="text-xs font-black uppercase tracking-widest">Securing Connection...</p></div>}>
                          <StripeCheckoutForm 
                            address={address} 
                            onSuccess={handleSuccess} 
                            onPlaceOrder={(isPlacing) => { setPlacing(isPlacing); setCheckoutStatus(isPlacing ? 'authorizing' : 'idle'); }} 
                            isPlacing={placing || checkoutStatus !== 'idle'} 
                          />
                        </Suspense>
                      ) : (
                        <div className="text-center py-8">
                          <AlertCircle className="mx-auto mb-6 h-12 w-12 text-amber-500" />
                          <p className="text-xl font-black text-gray-900">Sandbox Environment</p>
                          <p className="mt-2 text-sm font-medium text-gray-500 mb-8">This is a simulation. Click below to generate a test order.</p>
                          <button 
                            onClick={() => handleSuccess('mock_payment_method')}
                            data-testid="mock-checkout-button"
                            className="w-full rounded-2xl bg-gray-900 px-8 py-5 text-sm font-black text-white shadow-xl transition-all hover:bg-black hover:scale-[1.02]"
                          >
                            Complete Test Purchase
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <div className="flex justify-center border-t border-gray-100 pt-10 grayscale opacity-40">
                  <div className="flex gap-10">
                    <div className="flex items-center gap-2"><Lock className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-widest">PCI-DSS</span></div>
                    <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-widest">Secure Cloud</span></div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-widest">Verified Auth</span></div>
                  </div>
                </div>

                <button onClick={() => setStep('shipping')} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900">
                  <ArrowLeft className="h-4 w-4" /> Back to Shipping
                </button>
              </div>
            )}

            <footer className="mt-24 border-t border-gray-100 pt-12 pb-8 text-center sm:text-left">
              <div className="flex flex-wrap justify-center sm:justify-start gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <Link href="/refund-policy" className="hover:text-gray-900 transition-colors">Returns</Link>
                <Link href="/shipping-policy" className="hover:text-gray-900 transition-colors">Shipping</Link>
                <Link href="/privacy-policy" className="hover:text-gray-900 transition-colors">Privacy</Link>
                <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
              </div>
              <p className="mt-8 text-[10px] font-bold text-gray-300">© 2026 DreamBeesArt. Industrialized E-commerce Flow.</p>
            </footer>
          </div>
        </main>

        {/* Sidebar Summary - Enhanced Desktop */}
        <aside className={`
          fixed inset-0 z-50 transform bg-white transition-transform duration-500 lg:static lg:z-0 lg:translate-x-0
          ${summaryOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          lg:sticky lg:top-[65px] lg:col-span-5 lg:h-[calc(100vh-65px)] lg:overflow-y-auto lg:border-l lg:border-gray-100 lg:bg-gray-50/30 lg:px-12 lg:py-16
        `}>
          {/* Mobile Close Button */}
          <button 
            onClick={() => setSummaryOpen(false)}
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 lg:hidden"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="mx-auto max-w-md p-6 lg:p-0">
            <div className="relative overflow-hidden rounded-[2.5rem] border border-white bg-white/60 p-8 shadow-2xl shadow-gray-200/40 backdrop-blur-xl">
              <div className="mb-10 flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight text-gray-900">Order Summary</h2>
                <span className="rounded-full bg-gray-900 px-4 py-1.5 text-[10px] font-black text-white">{totalItems} {totalItems === 1 ? 'Item' : 'Items'}</span>
              </div>
              
              <div className="max-h-[30vh] lg:max-h-80 space-y-6 overflow-y-auto pr-4 scrollbar-hide">
                {cartItems.map((item) => (
                  <div key={item.productId} className="flex items-center gap-5">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md">
                      <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-[10px] font-black text-white ring-4 ring-white shadow-lg">{item.quantity}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-gray-900">{item.name}</p>
                      <p className="mt-1 text-[10px] font-bold text-gray-400">Collector Unit • {formatMoney(item.priceSnapshot)}</p>
                    </div>
                    <p className="text-sm font-black text-gray-900">{formatMoney(item.priceSnapshot * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-12 border-t border-gray-100 pt-10">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Tag className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input 
                      value={discountCode} 
                      onChange={(e) => setDiscountCode(e.target.value)} 
                      placeholder="Discount code" 
                      className="w-full rounded-2xl border-2 border-gray-100 bg-white/50 py-4 pl-12 pr-4 text-sm font-bold outline-none transition focus:border-primary-500 focus:bg-white" 
                    />
                  </div>
                  <button 
                    onClick={handleApplyDiscount} 
                    disabled={isApplying || !discountCode.trim()} 
                    className="rounded-2xl bg-gray-900 px-8 py-4 text-xs font-black text-white transition-all hover:bg-black disabled:opacity-50 active:scale-95"
                  >
                    {isApplying ? <RefreshCcw className="h-4 w-4 animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {discountMessage && (
                  <p className={`mt-4 rounded-xl px-4 py-2 text-xs font-bold animate-in slide-in-from-top-2 ${appliedDiscount ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                    {discountMessage}
                  </p>
                )}
                {appliedDiscount && (
                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-green-200 bg-green-50/50 px-5 py-3 text-xs font-black text-green-700">
                    <span className="flex items-center gap-2"><Tag className="h-4 w-4" /> {appliedDiscount.code}</span>
                    <button onClick={() => { setAppliedDiscount(null); setDiscountMessage(null); }} className="text-[10px] uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Remove</button>
                  </div>
                )}
              </div>

              <div className="mt-12 space-y-4 border-t border-gray-100 pt-10">
                <SummaryRow label="Subtotal" value={formatMoney(subtotal)} />
                {!isPurelyDigital && (
                  <SummaryRow label="Standard Shipping" value={shipping === 0 ? 'Free' : formatMoney(shipping)} />
                )}
                <SummaryRow label="Estimated Tax" value="Calculated at next step" />
                {appliedDiscount && <SummaryRow label="Promotional Discount" value={`-${formatMoney(appliedDiscount.amount)}`} isDiscount />}
                
                <div className="flex items-end justify-between border-t border-gray-900 pt-8 mt-4">
                  <span className="text-xl font-black text-gray-900 uppercase tracking-tight">Total Due</span>
                  <div className="text-right">
                    <span className="mr-2 text-[10px] font-black uppercase tracking-widest text-gray-400">USD</span>
                    <span className="text-5xl font-black tracking-tighter text-gray-900 leading-none">{formatMoney(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-4">
              {freeShippingRemaining > 0 ? (
                <div className="group flex items-center gap-4 rounded-3xl bg-white p-6 shadow-sm border border-gray-100 transition hover:shadow-md">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                    <Truck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">Unlock Free Shipping</p>
                    <p className="text-xs font-bold text-gray-400">Add {formatMoney(freeShippingRemaining)} more to your cart.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 rounded-3xl bg-green-500 p-6 shadow-xl text-white">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black">Free Shipping Unlocked</p>
                    <p className="text-xs font-bold opacity-80">You've reached the $100.00 collector threshold.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-12 grid gap-8 border-t border-gray-200/50 pt-12">
              <TrustItem icon={<ShieldCheck className="h-5 w-5" />} title="Artist Quality" text="All products directly support independent artists." />
              <TrustItem icon={<PackageCheck className="h-5 w-5" />} title="Collector-First Packing" text="Sleeved and bubble-wrapped for maximum protection." />
              <TrustItem icon={<HelpCircle className="h-5 w-5" />} title="Premium Support" text="Priority assistance for all orders over $50." />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, isDiscount }: { label: string; value: string; isDiscount?: boolean }) {
  return (
    <div className={`flex justify-between text-sm font-bold ${isDiscount ? 'text-green-600' : 'text-gray-500'}`}>
      <span>{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

function FormField({ label, id, value, onChange, placeholder, error, type = 'text', autoComplete, icon, readOnly }: { label: string; id: string; value: string; onChange: (v: string) => void; placeholder?: string; error?: string; type?: string; autoComplete?: string; icon?: React.ReactNode; readOnly?: boolean }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{label}</label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary-500">
            {icon}
          </div>
        )}
        <input 
          id={id}
          type={type}
          autoComplete={autoComplete} 
          aria-invalid={!!error} 
          aria-describedby={error ? `${id}-error` : undefined}
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          placeholder={placeholder} 
          readOnly={readOnly}
          className={`w-full rounded-2xl border-2 px-4 py-4 text-sm font-bold outline-none transition focus:ring-4 focus:ring-primary-50 ${icon ? 'pl-12' : ''} ${readOnly ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : 'bg-white'} ${error ? 'border-red-200 focus:border-red-500' : 'border-gray-100 focus:border-primary-500'}`} 
        />
      </div>
      {error && <p id={`${id}-error`} className="mt-1 text-[10px] font-black uppercase tracking-widest text-red-600">{error}</p>}
    </div>
  );
}

function ReviewCard({ email, address, shipping, onChange }: { email: string; address: Address; shipping: number; onChange: (step: CheckoutStep) => void }) {
  return (
    <div className="overflow-hidden rounded-4xl border border-gray-100 bg-white shadow-lg shadow-gray-100/50 divide-y divide-gray-50">
      <ReviewRow label="Identity" value={email} onChange={() => onChange('information')} />
      <ReviewRow label="Ship to" value={`${address.street}, ${address.city}, ${address.state} ${address.zip}`} onChange={() => onChange('information')} />
      <ReviewRow label="Method" value={`Standard Insured • ${shipping === 0 ? 'Free' : formatMoney(shipping)}`} onChange={() => onChange('shipping')} isLast />
    </div>
  );
}

function ReviewRow({ label, value, onChange, isLast }: { label: string; value: string; onChange: () => void; isLast?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-6 p-6 transition hover:bg-gray-50/50 group">
      <div className="flex-1 min-w-0">
        <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{label}</span>
        <span className="block truncate text-sm font-bold text-gray-900">{value}</span>
      </div>
      <button onClick={onChange} className="shrink-0 text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-800 transition-colors">Change</button>
    </div>
  );
}

function TrustItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-5 group">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-gray-100 bg-white text-primary-600 shadow-sm transition-transform group-hover:scale-110">
        {icon}
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-gray-900">{title}</p>
        <p className="mt-1 text-xs font-medium leading-relaxed text-gray-400">{text}</p>
      </div>
    </div>
  );
}
