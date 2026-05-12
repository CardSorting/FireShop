'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { validateEmail } from '@utils/validators';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (countdown > 0) return;

    setError('');
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setError(emailValidation.message ?? 'Invalid email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to request password reset');
      }

      setSubmitted(true);
      setCountdown(60); // Prevent resending for 60 seconds
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-linear-to-b from-white to-gray-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-2xl shadow-gray-200/50 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary-50 rounded-full blur-3xl opacity-50" />
          
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center relative z-10"
              >
                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">Check your inbox</h1>
                <p className="text-gray-500 mb-8 leading-relaxed font-medium">
                  We've sent a secure reset link to <br/>
                  <span className="text-gray-900 font-bold">{email}</span>
                </p>
                
                <div className="space-y-4">
                  <button
                    onClick={() => handleSubmit()}
                    disabled={loading || countdown > 0}
                    className="w-full flex items-center justify-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Didn\'t receive it? Resend'}
                  </button>
                  
                  <div className="pt-8 border-t border-gray-50">
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-900 font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Back to sign in
                    </Link>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative z-10"
              >
                <div className="mb-8">
                  <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tighter">Lost access?</h1>
                  <p className="text-gray-500 font-medium">Enter your email and we'll help you get back in.</p>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 mb-8 border border-red-100"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Account Email</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="w-5 h-5 text-gray-300 group-focus-within:text-primary-500 transition-colors" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@dreambeesart.com"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black disabled:opacity-50 transition-all shadow-xl shadow-gray-200 active:scale-[0.98]"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      'Request Reset Link'
                    )}
                  </button>
                </form>

                <div className="mt-10 pt-10 border-t border-gray-50 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-900 font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Nevermind, I remember
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
