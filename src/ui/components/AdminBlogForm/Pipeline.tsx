import React from 'react';
import { CheckCircle2, Save, Loader2 } from 'lucide-react';
import type { EditorState } from './types';

export const Pipeline: React.FC<EditorState & { onSave: (e: React.FormEvent) => void }> = ({ 
  formData, setFormData, isSubmitting, onSave 
}) => {
  return (
    <div className="bg-white border-b border-gray-100 px-8 py-4 sticky top-0 z-40 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {(['draft', 'review', 'scheduled', 'published'] as const).map((s, i) => {
          const isActive = formData.status === s;
          const isCompleted = ['draft', 'review', 'scheduled', 'published'].indexOf(formData.status!) > i;
          return (
            <React.Fragment key={s}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, status: s })}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  isActive ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 
                  isCompleted ? 'text-primary-600' : 'text-gray-300'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-4 w-4 rounded-full border border-current flex items-center justify-center text-[8px]">{i + 1}</span>}
                {s}
              </button>
              {i < 3 && <div className={`w-8 h-px ${isCompleted ? 'bg-primary-600' : 'bg-gray-100'}`} />}
            </React.Fragment>
          );
        })}
      </div>
      <div className="flex items-center gap-4">
         <span className="text-[10px] font-bold text-gray-400">Last saved: {new Date().toLocaleTimeString()}</span>
         <button 
           type="submit" 
           disabled={isSubmitting}
           onClick={onSave}
           className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all disabled:opacity-50"
         >
           {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
           Save Changes
         </button>
      </div>
    </div>
  );
};
