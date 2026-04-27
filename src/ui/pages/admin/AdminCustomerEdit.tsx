'use client';

/**
 * [LAYER: UI]
 * Dedicated admin customer edit page — full-page profile editing flow.
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, MapPin, Save, Shield, StickyNote, User } from 'lucide-react';
import type { Address, User as UserModel, UserRole } from '@domain/models';
import { useServices } from '../../hooks/useServices';
import { AdminPageHeader, useAdminPageTitle, useToast } from '../../components/admin/AdminComponents';

interface AdminCustomerEditProps {
    id: string;
}

function readAddressFromMetadata(metadata: UserModel['metadata']): Partial<Address> {
    const value = metadata?.address;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const address = value as Record<string, unknown>;
    return {
        street: typeof address.street === 'string' ? address.street : '',
        city: typeof address.city === 'string' ? address.city : '',
        state: typeof address.state === 'string' ? address.state : '',
        zip: typeof address.zip === 'string' ? address.zip : '',
        country: typeof address.country === 'string' ? address.country : '',
    };
}

export function AdminCustomerEdit({ id }: AdminCustomerEditProps) {
    useAdminPageTitle('Edit Customer');
    const services = useServices();
    const router = useRouter();
    const { toast } = useToast();

    const [customer, setCustomer] = useState<UserModel | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [role, setRole] = useState<UserRole>('customer');
    const [notes, setNotes] = useState('');
    const [address, setAddress] = useState<Partial<Address>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadCustomer = useCallback(async () => {
        setLoading(true);
        try {
            const users = await services.authService.getAllUsers();
            const found = users.find((user) => user.id === id);
            if (!found) {
                toast('error', 'Customer not found');
                router.push('/admin/customers');
                return;
            }
            setCustomer(found);
            setDisplayName(found.displayName);
            setRole(found.role);
            setNotes(found.notes ?? '');
            setAddress(readAddressFromMetadata(found.metadata));
        } catch (err) {
            services.logger.error('Failed to load customer for editing:', err);
            toast('error', err instanceof Error ? err.message : 'Failed to load customer');
        } finally {
            setLoading(false);
        }
    }, [id, router, services, toast]);

    useEffect(() => {
        void loadCustomer();
    }, [loadCustomer]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const trimmedName = displayName.trim();
        if (!trimmedName) {
            toast('error', 'Display name is required');
            return;
        }

        setSaving(true);
        try {
            if (!customer) throw new Error('Customer is not loaded');
            const nextAddress = {
                street: address.street?.trim() ?? '',
                city: address.city?.trim() ?? '',
                state: address.state?.trim() ?? '',
                zip: address.zip?.trim() ?? '',
                country: (address.country?.trim() || 'US').toUpperCase(),
            } satisfies Record<keyof Address, string>;
            await services.authService.updateUser(id, {
                displayName: trimmedName,
                role,
                notes,
                metadata: {
                    ...(customer.metadata ?? {}),
                    address: nextAddress,
                },
            });
            toast('success', 'Customer profile updated');
            router.push(`/admin/customers/${id}`);
        } catch (err) {
            toast('error', err instanceof Error ? err.message : 'Failed to update customer');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
        );
    }

    if (!customer) return null;

    return (
        <div className="mx-auto max-w-4xl space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push(`/admin/customers/${id}`)}
                    className="group flex h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm transition hover:bg-gray-50"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-500 transition-transform group-hover:-translate-x-0.5" />
                </button>
                <AdminPageHeader
                    title="Edit Customer"
                    subtitle={`Update profile details for ${customer.email}`}
                />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="rounded-2xl border bg-white p-8 shadow-sm">
                    <div className="mb-8 flex items-center gap-3 border-b pb-5">
                        <div className="rounded-xl bg-primary-50 p-3 text-primary-600">
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Profile Information</h2>
                            <p className="text-xs font-medium text-gray-500">Name and account details shown throughout admin.</p>
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    required
                                    value={displayName}
                                    onChange={(event) => setDisplayName(event.target.value)}
                                    className="w-full rounded-xl border bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    disabled
                                    value={customer.email}
                                    className="w-full cursor-not-allowed rounded-xl border bg-gray-100 py-3 pl-10 pr-4 text-sm text-gray-500 outline-none"
                                />
                            </div>
                            <p className="px-1 text-[10px] font-medium text-gray-400">Email changes are disabled to preserve account identity.</p>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-white p-8 shadow-sm">
                    <div className="mb-8 flex items-center gap-3 border-b pb-5">
                        <div className="rounded-xl bg-green-50 p-3 text-green-600">
                            <MapPin className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Customer Address</h2>
                            <p className="text-xs font-medium text-gray-500">Default customer address for admin reference and manual order support.</p>
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                            <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Street Address</label>
                            <input
                                value={address.street ?? ''}
                                onChange={(event) => setAddress((prev) => ({ ...prev, street: event.target.value }))}
                                placeholder="123 Main St"
                                className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">City</label>
                            <input
                                value={address.city ?? ''}
                                onChange={(event) => setAddress((prev) => ({ ...prev, city: event.target.value }))}
                                placeholder="Denver"
                                className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">State / Province</label>
                            <input
                                value={address.state ?? ''}
                                onChange={(event) => setAddress((prev) => ({ ...prev, state: event.target.value }))}
                                placeholder="CO"
                                className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">ZIP / Postal Code</label>
                            <input
                                value={address.zip ?? ''}
                                onChange={(event) => setAddress((prev) => ({ ...prev, zip: event.target.value }))}
                                placeholder="80202"
                                className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Country</label>
                            <input
                                value={address.country ?? ''}
                                onChange={(event) => setAddress((prev) => ({ ...prev, country: event.target.value }))}
                                placeholder="US"
                                className="w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border bg-white p-8 shadow-sm">
                    <div className="mb-8 flex items-center gap-3 border-b pb-5">
                        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Access Role</h2>
                            <p className="text-xs font-medium text-gray-500">Control whether this account has customer or admin permissions.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {(['customer', 'admin'] as UserRole[]).map((value) => (
                            <label
                                key={value}
                                className="relative flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition hover:bg-gray-50 has-checked:border-primary-500 has-checked:bg-primary-50/30"
                            >
                                <input
                                    type="radio"
                                    name="role"
                                    value={value}
                                    checked={role === value}
                                    onChange={() => setRole(value)}
                                    className="sr-only"
                                />
                                <span className="text-xs font-bold capitalize text-gray-900">{value}</span>
                                <span className="text-[10px] leading-tight text-gray-500">
                                    {value === 'admin'
                                        ? 'Full access to admin operations and settings.'
                                        : 'Standard storefront purchasing access.'}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border bg-white p-8 shadow-sm">
                    <div className="mb-8 flex items-center gap-3 border-b pb-5">
                        <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                            <StickyNote className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900">Admin Notes</h2>
                            <p className="text-xs font-medium text-gray-500">Internal notes visible only to admin users.</p>
                        </div>
                    </div>

                    <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        rows={6}
                        placeholder="Add internal notes about this customer..."
                        className="w-full rounded-xl border bg-gray-50 p-4 text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => router.push(`/admin/customers/${id}`)}
                        className="rounded-xl border bg-white px-6 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-8 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-95 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}