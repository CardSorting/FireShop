'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-hide" aria-label="Breadcrumb">
      <ol itemScope itemType="https://schema.org/BreadcrumbList" className="flex items-center gap-2">
        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" className="flex items-center gap-2">
          <Link 
            itemProp="item"
            href="/" 
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary-600 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span itemProp="name">Home</span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>
        
        {items.map((item, index) => (
          <li 
            key={index} 
            itemProp="itemListElement" 
            itemScope 
            itemType="https://schema.org/ListItem" 
            className="flex items-center gap-2 shrink-0"
          >
            <ChevronRight className="w-3.5 h-3.5 text-gray-200" />
            {item.href ? (
              <Link 
                itemProp="item"
                href={item.href} 
                className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary-600 transition-colors"
              >
                <span itemProp="name">{item.label}</span>
              </Link>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">
                <span itemProp="name">{item.label}</span>
              </span>
            )}
            <meta itemProp="position" content={(index + 2).toString()} />
          </li>
        ))}
      </ol>
    </nav>
  );
}
