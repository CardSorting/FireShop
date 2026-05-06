'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Search, Check, ChevronDown } from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   TAG INPUT — Stripe/Shopify-style tag manager
   ═══════════════════════════════════════════════════════ */

interface TagInputProps {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

export function TagInput({ label, tags, onChange, suggestions = [], placeholder = 'Add tag...' }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (blurTimerRef.current !== null) {
        window.clearTimeout(blurTimerRef.current);
      }
    };
  }, []);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const filteredSuggestions = suggestions.filter(
    s => s.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(s)
  );

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</label>
      <div 
        className={`
          relative flex flex-wrap gap-2 rounded-xl border bg-gray-50 p-2 transition-all
          ${isFocused ? 'ring-2 ring-primary-500 border-transparent bg-white shadow-sm' : 'hover:border-gray-300'}
        `}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map(tag => (
          <span 
            key={tag} 
            className="flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-xs font-bold text-gray-700 ring-1 ring-gray-200 transition hover:bg-gray-200"
          >
            {tag}
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="rounded-full p-0.5 hover:bg-gray-300 transition"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (blurTimerRef.current !== null) {
              window.clearTimeout(blurTimerRef.current);
              blurTimerRef.current = null;
            }
            setIsFocused(true);
            setShowSuggestions(true);
          }}
          onBlur={() => {
            blurTimerRef.current = window.setTimeout(() => {
              setIsFocused(false);
              setShowSuggestions(false);
              blurTimerRef.current = null;
            }, 200);
          }}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-gray-400"
        />

        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-gray-50 px-3 py-2 border-b">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Suggestions</p>
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {filteredSuggestions.map(suggestion => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addTag(suggestion)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition"
                >
                  {suggestion}
                  <Plus className="h-3.5 w-3.5 opacity-40" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CATEGORY SELECT — Select with "Add New" capability
   ═══════════════════════════════════════════════════════ */

interface CategorySelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  categories: string[];
}

export function CategorySelect({ label, value, onChange, categories }: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCategories = categories.filter(c => 
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (category: string) => {
    onChange(category);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleCreate = () => {
    if (searchTerm.trim()) {
      onChange(searchTerm.trim());
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const humanize = (cat: string) => cat.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex w-full items-center justify-between rounded-xl border bg-gray-50 px-4 py-2.5 text-sm font-bold transition-all
            ${isOpen ? 'ring-2 ring-primary-500 border-transparent bg-white' : 'hover:border-gray-300'}
          `}
        >
          <span className={value ? 'text-gray-900' : 'text-gray-400'}>
            {value ? humanize(value) : 'Select category'}
          </span>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b bg-gray-50 p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search or create..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto p-1">
              {filteredCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleSelect(cat)}
                  className={`
                    flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition
                    ${value === cat ? 'bg-primary-50 text-primary-700' : 'text-gray-700 hover:bg-gray-50'}
                  `}
                >
                  {humanize(cat)}
                  {value === cat && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
              
              {searchTerm && !categories.includes(searchTerm) && (
                <button
                  type="button"
                  onClick={handleCreate}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-primary-600 hover:bg-primary-50 transition border-t mt-1 pt-3"
                >
                  <Plus className="h-4 w-4" />
                  Create "{searchTerm}"
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
