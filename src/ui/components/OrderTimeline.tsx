'use client';

import React from 'react';
import { CheckCircle2, Circle, Clock, Package, Truck, CheckCircle, CalendarDays } from 'lucide-react';
import { Order, OrderStatus } from '@domain/models';
import { formatDate, formatShortDate } from '@utils/formatters';

interface OrderTimelineProps {
  order: Order;
  variant?: 'compact' | 'full';
}

const STEPS: { status: OrderStatus; label: string; icon: any; helper: string }[] = [
  { status: 'pending', label: 'Placed', icon: Clock, helper: 'Order received' },
  { status: 'confirmed', label: 'Processing', icon: Package, helper: 'Picking & packing' },
  { status: 'shipped', label: 'Shipped', icon: Truck, helper: 'Tracking active' },
  { status: 'delivered', label: 'Delivered', icon: CheckCircle, helper: 'Arrived safely' },
];

export function OrderTimeline({ order, variant = 'full' }: OrderTimelineProps) {
  const currentStepIndex = STEPS.findIndex(s => s.status === order.status);
  const isCancelled = order.status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700">
        <Circle className="h-4 w-4 fill-red-500 text-red-500" />
        Order Cancelled
      </div>
    );
  }

  // Use real fulfillment event dates from the order data
  const getStepDate = (index: number): Date | null => {
    const stepStatus = STEPS[index]?.status;
    if (!stepStatus) return null;

    // Map step status to fulfillment event type
    const statusToEventType: Record<string, string[]> = {
      'pending': ['order_placed'],
      'confirmed': ['payment_confirmed', 'processing'],
      'shipped': ['in_transit', 'label_created'],
      'delivered': ['delivered'],
    };

    const eventTypes = statusToEventType[stepStatus] || [];
    const matchingEvent = order.fulfillmentEvents?.find(e => eventTypes.includes(e.type));
    
    if (matchingEvent) return new Date(matchingEvent.at);
    
    // For completed steps without events, use order.createdAt as base
    if (index <= currentStepIndex) return new Date(order.createdAt);
    return null;
  };

  const estimatedDelivery = order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate) : getStepDate(3);

  if (variant === 'compact') {
    const activeStep = STEPS[currentStepIndex] || STEPS[0];
    const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

    return (
      <div className="w-full">
        <div className="mb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Status</p>
            <p className="text-sm font-black text-gray-900">{activeStep.label}</p>
          </div>
          <div className="text-left sm:text-right">
             <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Est. Delivery</p>
             <p className="text-sm font-bold text-primary-600 flex items-center gap-1 sm:justify-end">
                <CalendarDays className="w-3.5 h-3.5" /> {estimatedDelivery ? formatShortDate(estimatedDelivery.toISOString()) : 'TBD'}
             </p>
          </div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 shadow-inner">
          <div 
            className="h-full bg-primary-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(37,99,235,0.4)]" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative pt-8 pb-4 px-4 sm:px-0">
      <div className="mb-12 flex items-center justify-between bg-gray-50 rounded-2xl p-6 border border-gray-100">
         <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Estimated Delivery</p>
            <p className="text-2xl font-black text-gray-900">{estimatedDelivery ? formatDate(estimatedDelivery.toISOString()) : 'To be determined'}</p>
         </div>
         <div className="hidden sm:block text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Order Date</p>
            <p className="text-sm font-bold text-gray-900">{formatDate(order.createdAt.toString())}</p>
         </div>
      </div>

      <div className="relative">
        {/* Progress Bar Track */}
        <div className="absolute left-[19px] sm:left-0 sm:top-5 h-full sm:h-1 w-1 sm:w-full bg-gray-100 rounded-full" />
        
        {/* Active Progress Bar */}
        <div 
          className="absolute left-[19px] sm:left-0 top-0 sm:top-5 w-1 sm:h-1 sm:w-full bg-primary-600 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(37,99,235,0.3)]" 
          style={{ 
            height: 'auto', // For mobile it's handled by flex items, but we use desktop primary
            width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` 
          }} 
        />
        
        <div className="relative flex flex-col sm:flex-row justify-between gap-8 sm:gap-0">
          {STEPS.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isActive = index === currentStepIndex;
            const Icon = step.icon;
            const stepDate = getStepDate(index);

            return (
              <div key={step.status} className="flex sm:flex-col items-start sm:items-center gap-4 sm:gap-0 relative z-10 w-full sm:w-auto">
                <div 
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 transition-all duration-500 ${
                    isCompleted 
                      ? 'border-white bg-primary-600 text-white shadow-lg sm:scale-110' 
                      : 'border-white bg-gray-100 text-gray-300'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                </div>
                
                <div className="sm:mt-4 sm:text-center flex-1">
                  <p className={`text-sm font-black tracking-tight ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  <p className={`text-[10px] font-bold mt-0.5 ${isCompleted ? 'text-gray-500' : 'text-gray-300'}`}>
                    {isCompleted && stepDate ? formatShortDate(stepDate.toISOString()) : 'Pending'}
                  </p>
                  {isActive && (
                    <p className="mt-2 text-xs font-medium text-primary-600 bg-primary-50 px-3 py-1 rounded-full inline-block">
                       {step.helper}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
