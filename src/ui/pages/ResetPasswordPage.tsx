'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [validating, setValidating] = useState(true);

  const actionCode = searchParams.get('oobCode');

  useEffect(() => {
    if (!actionCode) {
      setError('Invalid or expired password reset link.');
      setValidating(false);
      return;
    }

    const auth = getAuth();
    verifyPasswordResetCode(auth, actionCode)
      .then((emailAddress) => {
        setEmail(emailAddress);
        setValidating(false);
      })
      .catch((err) => {
        console.error('Error verifying password reset code:', err);
        setError('Your password reset link is invalid or has expired.');
        setValidating(false);
      });
  }, [actionCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actionCode) return;
    
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters long for security.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      await confirmPasswordReset(auth, actionCode, password);
      
      // Notify server to send Brevo confirmation and audit
      await fetch('/api/auth/security-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'password_reset_finalized',
          email: email,
          details: { method: 'self_service_reset' }
        }),
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const passwordStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : 2;

  if (validating) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-6"
          />
          <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em]">Verifying Security Token...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-linear-to-b from-white to-gray-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-2xl shadow-gray-200/50 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">Security Updated</h1>
                <p className="text-gray-500 mb-10 leading-relaxed font-medium">
                  Your password has been successfully reset. <br/>
                  You can now sign in with your new credentials.
                </p>
                <Link
                  href="/login"
                  className="block w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition-all shadow-xl shadow-gray-200"
                >
                  Sign In to Account
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-8">
                  <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tighter">New Password</h1>
                  <p className="text-gray-500 font-medium">
                    Resetting access for <span className="text-gray-900 font-bold">{email}</span>
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-bold flex items-center gap-3 mb-8 border border-red-100">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Secure Password</label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-primary-500 transition-colors" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="Min. 8 characters"
                          className="w-full pl-12 pr-12 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {/* Strength Indicator */}
                      <div className="mt-3 flex gap-1 px-1">
                        <div className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength >= 1 ? (passwordStrength === 1 ? 'bg-orange-400' : 'bg-green-500') : 'bg-gray-100'}`} />
                        <div className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength >= 2 ? 'bg-green-500' : 'bg-gray-100'}`} />
                        <div className={`h-1 flex-1 rounded-full transition-colors ${passwordStrength >= 2 ? 'bg-green-500' : 'bg-gray-100'}`} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Confirm Identity</label>
                      <div className="relative group">
                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-primary-500 transition-colors" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          placeholder="Repeat password"
                          className="w-full pl-12 pr-12 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold placeholder:text-gray-300 focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-black disabled:opacity-50 transition-all shadow-xl shadow-gray-200"
                  >
                    {loading ? 'Securing Account...' : 'Update Password'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
