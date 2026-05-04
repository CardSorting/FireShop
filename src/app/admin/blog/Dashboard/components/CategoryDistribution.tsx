import React from 'react';

export const CategoryDistribution: React.FC = () => {
  const categories = [
    { label: 'Educational', count: 12, color: 'bg-primary-600' },
    { label: 'Product News', count: 8, color: 'bg-blue-500' },
    { label: 'Collector Stories', count: 5, color: 'bg-amber-500' },
    { label: 'Interviews', count: 3, color: 'bg-emerald-500' }
  ];

  return (
    <div className="lg:col-span-4 bg-white p-8 rounded-4xl border border-gray-100 shadow-sm space-y-6">
       <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Content Distribution</h4>
       <div className="space-y-4">
          {categories.map((cat, i) => (
            <div key={i} className="space-y-2">
               <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-gray-900">{cat.label}</span>
                  <span className="text-gray-400">{cat.count}</span>
               </div>
               <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${(cat.count / 28) * 100}%` }} />
               </div>
            </div>
          ))}
       </div>
    </div>
  );
};
