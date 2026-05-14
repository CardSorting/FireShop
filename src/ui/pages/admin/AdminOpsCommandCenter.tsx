'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Play,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import type { OperationalIntentCard, OperationalIntentType, OperationalPlan } from '@domain/ops/types';
import { AdminBadge, AdminMetricCard, AdminPageHeader, SkeletonPage, useAdminPageTitle, useToast } from '../../components/admin/AdminComponents';
import { formatCurrency } from '@utils/formatters';

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    cache: 'no-store',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error ?? `${init?.method ?? 'GET'} ${path} failed (${response.status})`);
  }
  return data as T;
}

const CATEGORY_BADGE: Record<OperationalIntentCard['category'], 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'purple'> = {
  overview: 'gray',
  revenue: 'green',
  risk: 'red',
  catalog: 'blue',
  fulfillment: 'purple',
};

const RISK_BADGE: Record<string, 'blue' | 'green' | 'amber' | 'red' | 'gray' | 'purple'> = {
  low: 'green',
  medium: 'amber',
  high: 'red',
  critical: 'red',
};

function titleize(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function approvalCopy(requiresApproval: boolean) {
  return requiresApproval
    ? 'Review and approve this suggestion before anything changes in the store.'
    : 'No approval is needed; use this as an ordering or cleanup task.';
}

function riskCopy(riskLevel: string) {
  if (riskLevel === 'critical') return 'High-impact change. Only proceed after confirming the details and business impact.';
  if (riskLevel === 'high') return 'Meaningful operational risk. Double-check affected products, orders, or settings first.';
  if (riskLevel === 'medium') return 'Moderate risk. The suggestion is useful, but the store operator should review quantities, margins, or customer-facing changes.';
  return 'Low risk. This is mainly a prioritization or cleanup recommendation.';
}

function sourcesForTarget(target: string) {
  const sources: Record<string, string> = {
    procurement: 'inventory levels, reorder points, product stock status',
    inventory: 'inventory levels, stock health, product setup data',
    discounts: 'inventory health, margin constraints, product setup health',
    storefront: 'inventory health, product readiness, promotion constraints',
    catalog: 'product setup health, missing SKU/cost/photo signals',
    fulfillment: 'active orders, fulfillment buckets, ready-to-ship queue',
    orders: 'active orders, fulfillment buckets, order status counts',
    settings: 'store setup checklist, payment/shipping/domain status',
    audit: 'store health snapshot and recent operational signals',
  };
  return sources[target] ?? 'store health snapshot';
}

function confidenceForRisk(riskLevel: string) {
  if (riskLevel === 'low') return 'High';
  if (riskLevel === 'medium') return 'Medium';
  return 'Low';
}

export function AdminOpsCommandCenter() {
  useAdminPageTitle('Planning');
  const { toast } = useToast();
  const [intents, setIntents] = useState<OperationalIntentCard[]>([]);
  const [selectedIntent, setSelectedIntent] = useState<OperationalIntentType>('prepare_for_weekend_sales');
  const [plan, setPlan] = useState<OperationalPlan | null>(null);
  const [loadingIntents, setLoadingIntents] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCard = useMemo(
    () => intents.find((intent) => intent.type === selectedIntent) ?? intents[0],
    [intents, selectedIntent]
  );

  const loadIntents = useCallback(async () => {
    setLoadingIntents(true);
    setError(null);
    try {
      const cards = await requestJson<OperationalIntentCard[]>('/api/admin/ops/intents');
      setIntents(cards);
      if (cards.length > 0 && !cards.some((card) => card.type === selectedIntent)) {
        setSelectedIntent(cards[0].type);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load operational intents');
    } finally {
      setLoadingIntents(false);
    }
  }, [selectedIntent]);

  const compilePlan = useCallback(async (intentType = selectedIntent) => {
    setCompiling(true);
    setError(null);
    try {
      const compiled = await requestJson<OperationalPlan>('/api/admin/ops/plans', {
        method: 'POST',
        body: JSON.stringify({ intentType }),
      });
      setPlan(compiled);
      toast('success', 'Suggested action plan ready');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to compile plan';
      setError(message);
      toast('error', message);
    } finally {
      setCompiling(false);
    }
  }, [selectedIntent, toast]);

  const executePlan = useCallback(async () => {
    if (!plan) return;
    setExecuting(true);
    setError(null);
    try {
      const result = await requestJson<OperationalPlan>('/api/admin/ops/plans/execute', {
        method: 'POST',
        body: JSON.stringify(plan),
      });
      setPlan(result);
      const executed = result.proposedOperations.filter(o => o.status === 'executed').length;
      const failed = result.proposedOperations.filter(o => o.status === 'failed').length;
      if (failed > 0) {
        toast('info', `Plan partially completed: ${executed} succeeded, ${failed} failed.`);
      } else {
        toast('success', `Plan executed successfully: ${executed} operations completed.`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute plan';
      setError(message);
      toast('error', message);
    } finally {
      setExecuting(false);
    }
  }, [plan, toast]);

  const approveOperation = useCallback((operationId: string) => {
    if (!plan) return;
    const updatedOperations = plan.proposedOperations.map(op => 
      op.id === operationId ? { ...op, status: 'approved' as const } : op
    );
    setPlan({ ...plan, proposedOperations: updatedOperations });
    toast('success', 'Operation approved for execution');
  }, [plan, toast]);

  useEffect(() => {
    void loadIntents();
  }, [loadIntents]);

  if (loadingIntents) return <SkeletonPage />;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <AdminPageHeader
        category="Store planning"
        title="Suggested Actions"
        subtitle="Start with the two highest-value store-operator flows: weekend sales readiness and low-stock prevention."
        actions={
          <button
            onClick={() => void compilePlan()}
            disabled={compiling || !selectedCard}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {compiling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Generate plan
          </button>
        }
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          {error}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        {intents.map((intent) => {
          const active = intent.type === selectedIntent;
          return (
            <button
              key={intent.type}
              onClick={() => setSelectedIntent(intent.type)}
              className={`group rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${active ? 'border-primary-500 bg-primary-50/60 ring-2 ring-primary-100' : 'bg-white hover:border-gray-300'}`}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className={`rounded-xl p-2 ${active ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-900 group-hover:text-white'}`}>
                  <Target className="h-4 w-4" />
                </div>
                <AdminBadge label={intent.category} type={CATEGORY_BADGE[intent.category]} />
              </div>
              <h3 className="text-sm font-black text-gray-900">{intent.title}</h3>
              <p className="mt-2 text-xs font-medium leading-relaxed text-gray-500">{intent.description}</p>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                {intent.targets.slice(0, 3).join(' • ')}
              </div>
            </button>
          );
        })}
      </section>

      {!plan ? (
        <section className="rounded-3xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-900 text-white shadow-lg">
            <BrainCircuit className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-xl font-black text-gray-900">Choose a goal to get next actions</h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
            This planning layer reads the same store data you would normally inspect across dashboards and turns it into a short, reviewable action list. Nothing is executed automatically.
          </p>
          <button
            onClick={() => void compilePlan()}
            disabled={compiling || !selectedCard}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-primary-700 disabled:opacity-50"
          >
            {compiling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate {selectedCard?.title ?? 'plan'}
          </button>
        </section>
      ) : (
        <div className="space-y-8">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminMetricCard label="Plan status" value={titleize(plan.status)} icon={ClipboardCheck} color={plan.status === 'awaiting_approval' ? 'warning' : 'success'} description="Review before action" />
            <AdminMetricCard label="Next actions" value={plan.proposedOperations.length} icon={ClipboardCheck} color="primary" description="Suggested steps" />
            <AdminMetricCard label="Needs review" value={plan.approvalsRequired.length} icon={ShieldCheck} color={plan.approvalsRequired.length > 0 ? 'warning' : 'success'} description="Store-changing suggestions" />
            <AdminMetricCard label="Inventory value" value={formatCurrency(plan.stateSnapshot.inventory.inventoryValue)} icon={Target} color="info" description={`${plan.stateSnapshot.inventory.totalUnits.toLocaleString()} units observed`} />
          </section>

          <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
            <div className="border-b bg-gray-950 px-6 py-5 text-white">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-300">Suggested Action Plan</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight">{plan.intent.desiredState.goal}</h2>
                  <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-gray-300">{plan.diagnosis.summary}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => void compilePlan(plan.intent.desiredState.intentType)}
                    disabled={compiling || executing}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-white ring-1 ring-white/15 transition hover:bg-white/15 disabled:opacity-50"
                  >
                    <RotateCcw className={`h-4 w-4 ${compiling ? 'animate-spin' : ''}`} />
                    Refresh plan
                  </button>
                  {plan.status !== 'executed' && (
                    <button
                      onClick={() => void executePlan()}
                      disabled={compiling || executing || !plan.proposedOperations.some(op => op.status === 'proposed' || op.status === 'approved')}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-6 py-2 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-primary-500/20 transition hover:bg-primary-600 active:scale-95 disabled:opacity-50"
                    >
                      {executing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      Execute Plan
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-12">
              <div className="border-b p-6 lg:col-span-7 lg:border-b-0 lg:border-r">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">What to do next</h3>
                  <AdminBadge label="review first" type="purple" />
                </div>
                <div className="space-y-4">
                  {plan.proposedOperations.map((operation) => (
                    <div key={operation.id} className="rounded-2xl border bg-gray-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-black text-gray-900">{operation.title}</h4>
                            <AdminBadge label={operation.riskLevel} type={RISK_BADGE[operation.riskLevel]} />
                            {operation.requiresApproval && operation.status === 'proposed' && <AdminBadge label="needs approval" type="amber" />}
                            {operation.status === 'approved' && <AdminBadge label="approved" type="green" />}
                            {operation.status === 'executed' && <AdminBadge label="executed" type="blue" />}
                            {operation.status === 'failed' && <AdminBadge label="failed" type="red" />}
                          </div>
                          <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">{operation.description}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest text-gray-400 ring-1 ring-gray-200">{operation.target}</span>
                          {operation.requiresApproval && operation.status === 'proposed' && (
                            <button 
                              onClick={() => approveOperation(operation.id)}
                              className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 transition-colors"
                            >
                              Approve Operation
                            </button>
                          )}
                        </div>
                      </div>
                      {operation.error && (
                        <div className="mt-3 rounded-xl bg-red-50 p-3 text-[10px] font-bold text-red-700 border border-red-100">
                          Error: {operation.error}
                        </div>
                      )}
                      <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-gray-950 p-4 text-xs font-semibold leading-relaxed text-green-300">{operation.diff}</pre>
                      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
                        <div className="rounded-xl bg-white p-3 ring-1 ring-gray-100">
                          <p className="font-black uppercase tracking-widest text-gray-400">What should I do?</p>
                          <p className="mt-1 font-semibold text-gray-700">{operation.title}</p>
                        </div>
                        <div className="rounded-xl bg-white p-3 ring-1 ring-gray-100">
                          <p className="font-black uppercase tracking-widest text-gray-400">Why?</p>
                          <p className="mt-1 font-semibold text-gray-700">{operation.beforeSummary}</p>
                        </div>
                        <div className="rounded-xl bg-white p-3 ring-1 ring-gray-100">
                          <p className="font-black uppercase tracking-widest text-gray-400">What happens if I approve it?</p>
                          <p className="mt-1 font-semibold text-gray-700">{operation.afterSummary}</p>
                        </div>
                        <div className="rounded-xl bg-white p-3 ring-1 ring-gray-100">
                          <p className="font-black uppercase tracking-widest text-gray-400">What risk am I accepting?</p>
                          <p className="mt-1 font-semibold text-gray-700">{riskCopy(operation.riskLevel)} {approvalCopy(operation.requiresApproval)}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-col gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400 sm:flex-row sm:items-center sm:justify-between">
                        <span>Based on: {sourcesForTarget(operation.target)}</span>
                        <span>Confidence: {confidenceForRisk(operation.riskLevel)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <aside className="space-y-6 p-6 lg:col-span-5">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Why this matters</h3>
                  <div className="mt-3 space-y-3">
                    {plan.diagnosis.observations.map((observation) => (
                      <div key={observation.id} className="rounded-2xl border bg-white p-4 shadow-xs">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <AdminBadge label={observation.target} type="gray" />
                          <AdminBadge label={observation.severity} type={RISK_BADGE[observation.severity] ?? 'gray'} />
                        </div>
                        <p className="text-sm font-black text-gray-900">{observation.message}</p>
                        <p className="mt-1 text-xs font-medium leading-relaxed text-gray-500">{observation.evidence}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">Projected impact</h3>
                  <div className="mt-3 space-y-3">
                    {plan.simulations.map((simulation) => (
                      <div key={simulation.id} className="rounded-2xl border bg-white p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-black text-gray-900">{simulation.label}</p>
                          <AdminBadge label={simulation.impact} type={simulation.impact === 'positive' ? 'green' : simulation.impact === 'negative' ? 'red' : 'amber'} />
                        </div>
                        <p className="mt-2 text-xs font-medium leading-relaxed text-gray-500">{simulation.summary}</p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {simulation.metrics.slice(0, 3).map((metric) => (
                            <div key={metric.label} className="rounded-xl bg-gray-50 p-2 text-center">
                              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{metric.label}</p>
                              <p className="mt-1 text-sm font-black text-gray-900">{metric.value}{metric.unit ?? ''}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-amber-500" />
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Needs review</h3>
              </div>
              <div className="mt-4 space-y-3">
                {plan.approvalsRequired.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4 text-sm font-bold text-green-800"><CheckCircle2 className="h-4 w-4" /> No store-changing suggestions need review.</div>
                ) : plan.approvalsRequired.map((approval) => (
                  <div key={approval.id} className="rounded-xl border bg-amber-50/50 p-4">
                    <div className="flex items-center justify-between gap-3"><AdminBadge label={approval.level} type="amber" /><ArrowRight className="h-4 w-4 text-amber-500" /></div>
                    <p className="mt-2 text-sm font-bold text-gray-900">{approval.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Risks to watch</h3>
              </div>
              <div className="mt-4 space-y-3">
                {plan.risks.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4 text-sm font-bold text-green-800"><CheckCircle2 className="h-4 w-4" /> No major risks detected.</div>
                ) : plan.risks.map((risk) => (
                  <div key={risk.id} className="rounded-xl border p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2"><AdminBadge label={risk.effect} type="purple" /><AdminBadge label={risk.severity} type={RISK_BADGE[risk.severity]} /></div>
                    <p className="text-sm font-bold text-gray-900">{risk.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}