'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Send, AlertCircle, ArrowLeft, HelpCircle, Package, Receipt,
  Truck, RotateCcw, CreditCard, User, MessageSquare, Search, ChevronRight, FileText,
  Loader2, Sparkles, Clock
} from 'lucide-react';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../hooks/useAuth';
import Link from 'next/link';
import type { 
  KnowledgebaseArticle, 
  KnowledgebaseCategory,
  SupportTicket,
  TicketMessage
} from '@domain/models';
import { 
  KnowledgebaseCategoryCard, 
  KnowledgebaseArticleList, 
  KnowledgebaseArticleView,
  SupportSearchOverlay,
  TicketList,
  TicketDetailView
} from '../components/SupportComponents';

type ViewMode = 'home' | 'contact' | 'category' | 'article' | 'tickets' | 'ticket_detail';

export function SupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId');
  const productId = searchParams?.get('productId');
  const productName = searchParams?.get('productName');
  const forceContact = searchParams?.get('contact') === 'true';

  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [categories, setCategories] = useState<KnowledgebaseCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<KnowledgebaseCategory | null>(null);
  const [articles, setArticles] = useState<KnowledgebaseArticle[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgebaseArticle | null>(null);
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgebaseArticle[]>([]);
  const [userTickets, setUserTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [reason, setReason] = useState('question');
  const initialLoadControllerRef = useRef<AbortController | null>(null);
  const searchControllerRef = useRef<AbortController | null>(null);
  const categoryControllerRef = useRef<AbortController | null>(null);
  const articleControllerRef = useRef<AbortController | null>(null);
  const ticketControllerRef = useRef<AbortController | null>(null);
  
  const services = useServices();
  const { user } = useAuth();

  const loadInitialData = useCallback(async () => {
    initialLoadControllerRef.current?.abort();
    const controller = new AbortController();
    initialLoadControllerRef.current = controller;

    try {
      const cats = await services.knowledgebaseService.getCategories(controller.signal);
      if (!controller.signal.aborted) {
        setCategories(cats);
      }
      
      const articleSlug = searchParams?.get('article');
      if (articleSlug && !controller.signal.aborted) {
        setLoading(true);
        const article = await services.knowledgebaseService.getArticle(articleSlug); // Assuming getArticle doesn't need signal yet but good to add
        if (!controller.signal.aborted && article) {
          setSelectedArticle(article);
          setViewMode('article');
          const rel = await services.knowledgebaseService.getArticles({ categoryId: article.categoryId, signal: controller.signal });
          if (!controller.signal.aborted) {
            setArticles(rel.articles.filter(a => a.id !== article.id).slice(0, 3));
          }
        }
      } else if ((orderId || productId || forceContact) && !controller.signal.aborted) {
        setViewMode('contact');
      } else if (searchParams?.get('tickets') === 'true' && user && !controller.signal.aborted) {
        setLoading(true);
        const tickets = await services.ticketService.getUserTickets(user.id, controller.signal);
        if (!controller.signal.aborted) {
          setUserTickets(tickets);
          setViewMode('tickets');
        }
      }

      // Load popular articles for home
      if (!controller.signal.aborted) {
        const popular = await services.knowledgebaseService.getArticles({ query: '', signal: controller.signal });
        if (!controller.signal.aborted) {
          setSearchResults(popular.articles.slice(0, 4));
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Failed to load help categories or article', err);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [services.knowledgebaseService, services.ticketService, searchParams, orderId, productId, forceContact, user]);

  useEffect(() => {
    void loadInitialData();
    return () => {
      initialLoadControllerRef.current?.abort();
      searchControllerRef.current?.abort();
      categoryControllerRef.current?.abort();
      articleControllerRef.current?.abort();
      ticketControllerRef.current?.abort();
    };
  }, [loadInitialData]);

  useEffect(() => {
    if (productName) {
      setSubject(`Issue with ${productName}`);
    } else if (orderId) {
      setSubject(`Issue with Order #${orderId.slice(0, 8)}`);
    }
  }, [productName, orderId]);

  const [activeSearch, setActiveSearch] = useState('');
  const [liveResults, setLiveResults] = useState<KnowledgebaseArticle[]>([]);

  useEffect(() => {
    searchControllerRef.current?.abort();
    if (activeSearch.length > 2) {
      const controller = new AbortController();
      searchControllerRef.current = controller;

      const timer = setTimeout(async () => {
        try {
          const results = await services.knowledgebaseService.getArticles({ query: activeSearch, signal: controller.signal });
          if (!controller.signal.aborted) {
            setLiveResults(results.articles);
          }
        } catch (err: any) {
          if (err.name === 'AbortError') return;
          console.error('Search failed', err);
        }
      }, 300);
      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    } else {
      setLiveResults([]);
    }
  }, [activeSearch, services.knowledgebaseService]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      await services.ticketService.createTicket({
        userId: user.id,
        customerEmail: user.email,
        customerName: user.displayName || undefined,
        orderId: orderId || undefined,
        productId: productId || undefined,
        subject,
        type: reason as any,
        tags: [reason],
        priority: (reason === 'order' || reason === 'technical') ? 'high' : 'medium',
        status: 'new',
        messages: [
          {
            id: crypto.randomUUID(),
            ticketId: '',
            senderId: user.id,
            senderType: 'customer',
            visibility: 'public',
            content: message,
            createdAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit support request');
      setIsSubmitting(false);
    }
  };

  const handleCategoryClick = async (category: KnowledgebaseCategory) => {
    categoryControllerRef.current?.abort();
    const controller = new AbortController();
    categoryControllerRef.current = controller;

    setLoading(true);
    try {
      const catArticles = await services.knowledgebaseService.getArticles({ categoryId: category.id, signal: controller.signal });
      if (!controller.signal.aborted) {
        setArticles(catArticles.articles);
        setSelectedCategory(category);
        setViewMode('category');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Failed to load category articles', err);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleArticleClick = async (article: KnowledgebaseArticle) => {
    articleControllerRef.current?.abort();
    const controller = new AbortController();
    articleControllerRef.current = controller;

    setLoading(true);
    try {
      const art = await services.knowledgebaseService.getArticle(article.slug); // Assuming no signal yet
      if (!controller.signal.aborted) {
        setSelectedArticle(art);
        setViewMode('article');
        const rel = await services.knowledgebaseService.getArticles({ categoryId: art.categoryId, signal: controller.signal });
        if (!controller.signal.aborted) {
          setArticles(rel.articles.filter(a => a.id !== art.id).slice(0, 3));
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Failed to load article', err);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleTicketClick = async (ticket: SupportTicket) => {
    if (!user) return;
    
    ticketControllerRef.current?.abort();
    const controller = new AbortController();
    ticketControllerRef.current = controller;

    setLoading(true);
    try {
      const t = await services.ticketService.getUserTicket(ticket.id, user.id, controller.signal);
      if (!controller.signal.aborted) {
        setSelectedTicket(t);
        setViewMode('ticket_detail');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Failed to load ticket', err);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleReplyToTicket = async (content: string) => {
    if (!selectedTicket || !user) return;
    try {
      await services.ticketService.addMessage(selectedTicket.id, content, user.id, 'customer');
      const t = await services.ticketService.getUserTicket(selectedTicket.id, user.id);
      setSelectedTicket(t);
    } catch (err) {
      console.error('Failed to send reply', err);
    }
  };

  const handleBack = () => {
    if (viewMode === 'article' && selectedCategory) {
      setViewMode('category');
    } else if (viewMode === 'ticket_detail') {
      setViewMode('tickets');
    } else if (viewMode === 'category' || viewMode === 'contact' || viewMode === 'tickets') {
      setViewMode('home');
      setSelectedCategory(null);
    } else {
      setViewMode('home');
    }
  };

  if (loading && viewMode === 'home') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="max-w-md w-full bg-white p-12 rounded-4xl border border-gray-100 shadow-xl text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-50 text-green-500 mb-8">
            <HelpCircle className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4">Request Received</h1>
          <p className="text-gray-500 font-medium mb-10 leading-relaxed">
            Your ticket has been created. Most order issues receive a reply within <span className="text-gray-900 font-bold">1 business day</span>.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => {
                setSuccess(false);
                void loadInitialData();
              }}
              className="w-full inline-flex items-center justify-center rounded-2xl bg-gray-900 px-6 py-4 text-sm font-black text-white hover:bg-black transition-colors"
            >
              View My Tickets
            </button>
            <Link 
              href="/" 
              className="w-full inline-flex items-center justify-center rounded-2xl bg-gray-50 border border-gray-200 px-6 py-4 text-sm font-black text-gray-900 hover:bg-gray-100 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const QUICK_ACTIONS = [
    { label: 'Track Order', icon: Truck, href: '/orders', color: 'bg-blue-50 text-blue-600' },
    { label: 'Start Return', icon: RotateCcw, href: '/support?contact=true&reason=return', color: 'bg-amber-50 text-amber-600' },
    { label: 'Missing Item', icon: Package, href: '/support?contact=true&reason=missing', color: 'bg-red-50 text-red-600' },
    { label: 'Payment Issue', icon: CreditCard, href: '/support?contact=true&reason=payment', color: 'bg-green-50 text-green-600' },
    { label: 'Cancel Order', icon: FileText, href: '/support?contact=true&reason=cancel', color: 'bg-gray-50 text-gray-600' },
    { label: 'My Account', icon: User, href: '/account', color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 animate-in fade-in duration-500">
      {viewMode !== 'home' ? (
        <button 
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-900 mb-8 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          {viewMode === 'article' ? `Back to ${selectedArticle?.categoryName || 'Category'}` : 'Back to Help Center'}
        </button>
      ) : (
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-900 mb-8 transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Store
        </Link>
      )}

      {viewMode === 'home' && (
        <div className="space-y-16">
          {/* Hero Section */}
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
                Support <span className="text-primary-600 italic">Hub</span>
              </h1>
              <p className="text-lg font-medium text-gray-500">Search articles or select a common task below to get started.</p>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
              <input 
                type="text"
                value={activeSearch}
                onChange={(e) => setActiveSearch(e.target.value)}
                placeholder="Search for answers (e.g. 'returns', 'tracking')..."
                className="w-full rounded-4xl border-2 border-gray-100 bg-white py-6 pl-16 pr-8 text-lg font-bold text-gray-900 shadow-xl shadow-gray-200/40 outline-none transition-all focus:border-primary-500 focus:ring-8 focus:ring-primary-500/5"
              />
              <SupportSearchOverlay 
                query={activeSearch}
                results={liveResults}
                onClose={() => setActiveSearch('')}
                onResultClick={handleArticleClick}
              />
            </div>
          </div>

          {/* Quick Tasks Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-center justify-center p-6 rounded-3xl bg-white border border-gray-100 hover:border-primary-100 hover:shadow-xl hover:-translate-y-1 transition-all group text-center"
              >
                <div className={`h-12 w-12 rounded-2xl ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{action.label}</span>
              </Link>
            ))}
          </div>

          {/* Contextual Recommendations (Example) */}
          {(orderId || user) && (
            <div className="bg-primary-50 rounded-[3rem] p-8 md:p-12 border border-primary-100/50 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <Sparkles className="h-6 w-6 text-primary-600" />
                <h3 className="text-2xl font-black text-gray-900">Recommended for you</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {orderId && (
                   <div className="bg-white p-6 rounded-3xl border border-primary-100 shadow-sm flex flex-col justify-between gap-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary-600 mb-2">Related to Order #{orderId.slice(0, 8)}</p>
                        <h4 className="text-lg font-bold text-gray-900">Need to track this shipment?</h4>
                        <p className="text-sm font-medium text-gray-500 mt-2">See real-time updates for your most recent purchase.</p>
                      </div>
                      <Link href={`/orders/${orderId}`} className="w-full py-3 rounded-xl bg-primary-600 text-white font-black text-[10px] uppercase tracking-widest text-center hover:bg-primary-700 transition-colors">
                        View Order Details
                      </Link>
                   </div>
                 )}
                 <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between gap-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Most Used</p>
                      <h4 className="text-lg font-bold text-gray-900">Our Return Policy</h4>
                      <p className="text-sm font-medium text-gray-500 mt-2">Learn about our 30-day window for prints and accessories.</p>
                    </div>
                    <button 
                      onClick={() => handleArticleClick({ slug: 'return-policy' } as any)}
                      className="w-full py-3 rounded-xl bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest text-center hover:bg-black transition-colors"
                    >
                      Read Article
                    </button>
                 </div>
                 {!user && (
                   <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between gap-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Get Faster Help</p>
                        <h4 className="text-lg font-bold text-gray-900">Sign in to your account</h4>
                        <p className="text-sm font-medium text-gray-500 mt-2">View your order history and open tickets faster.</p>
                      </div>
                      <Link href="/login?redirect=/support" className="w-full py-3 rounded-xl bg-amber-600 text-white font-black text-[10px] uppercase tracking-widest text-center hover:bg-amber-700 transition-colors">
                        Sign In
                      </Link>
                   </div>
                 )}
              </div>
            </div>
          )}

          {/* Topics Grid */}
          <div>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Browse by Category</h2>
                <p className="text-sm font-medium text-gray-500 mt-1">Detailed guides for every part of your journey</p>
              </div>
              {user && (
                <button 
                  onClick={async () => {
                    setLoading(true);
                    const tickets = await services.ticketService.getUserTickets(user.id);
                    setUserTickets(tickets);
                    setViewMode('tickets');
                    setLoading(false);
                  }}
                  className="text-xs font-black uppercase tracking-widest text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-xl transition-colors"
                >
                  My Tickets ({userTickets.length})
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <KnowledgebaseCategoryCard 
                  key={category.id} 
                  category={category} 
                  onClick={handleCategoryClick} 
                />
              ))}
            </div>
          </div>

          {/* Popular Articles Section */}
          <div className="bg-gray-50 rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-gray-900">Popular Articles</h3>
                <p className="text-sm font-medium text-gray-500 mt-1">Most frequently asked questions from collectors</p>
              </div>
              <Link href="/support?all=true" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 px-4 py-2">View All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {searchResults.slice(0, 4).map(article => (
                <button 
                  key={article.id}
                  onClick={() => handleArticleClick(article)}
                  className="flex items-center justify-between p-6 rounded-3xl bg-white border border-gray-100 hover:border-gray-200 transition-all group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-gray-50 text-gray-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{article.title}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">{article.categoryName}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Contact Support Section */}
          <div className="bg-gray-900 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden group shadow-2xl">
              <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary-600/20 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <span className="inline-block px-4 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest text-primary-400 border border-white/5">Still need help?</span>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Talk to an expert collector.</h2>
                  <p className="text-lg font-medium text-white/60 max-w-xl">Our team typically responds within 24 hours. Sign in to track existing tickets or open a new one.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 lg:justify-end">
                  <button 
                    onClick={() => setViewMode('contact')}
                    className="px-10 py-6 rounded-2xl bg-white text-gray-900 font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    Open a Ticket
                  </button>
                  {!user && (
                    <Link href="/login?redirect=/support" className="px-10 py-6 rounded-2xl bg-white/10 border border-white/20 text-white font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-colors text-center">
                      Sign In First
                    </Link>
                  )}
                </div>
              </div>
          </div>
        </div>
      )}

      {viewMode === 'category' && selectedCategory && (
        <KnowledgebaseArticleList 
          articles={articles}
          categoryName={selectedCategory.name}
          onBack={handleBack}
          onArticleClick={handleArticleClick}
        />
      )}

      {viewMode === 'article' && selectedArticle && (
        <KnowledgebaseArticleView 
          article={selectedArticle}
          relatedArticles={articles}
          onBack={handleBack}
          onArticleClick={handleArticleClick}
        />
      )}

      {viewMode === 'tickets' && (
        <TicketList 
          tickets={userTickets}
          onTicketClick={handleTicketClick}
        />
      )}

      {viewMode === 'ticket_detail' && selectedTicket && (
        <TicketDetailView 
          ticket={selectedTicket}
          onBack={handleBack}
          onReply={handleReplyToTicket}
        />
      )}

      {viewMode === 'contact' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          <div className="lg:col-span-5 space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
                Open a <span className="text-primary-600">Ticket</span>
              </h1>
              <p className="text-lg font-medium text-gray-500 leading-relaxed">
                Provide as much detail as possible so we can resolve your issue quickly.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex gap-4">
                <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100 text-primary-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Current Response Time</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">Most tickets receive a reply within 24 hours.</p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex gap-4">
                <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-100 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">Check KB First</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">Many common issues can be resolved instantly in our Help Center.</p>
                </div>
              </div>
            </div>

            {orderId && (
              <div className="bg-primary-50 border border-primary-100 rounded-3xl p-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-primary-600 mb-6">Linked Context</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-white p-2 rounded-xl shadow-sm border border-primary-100">
                      <Receipt className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Order #{orderId.slice(0, 8).toUpperCase()}</p>
                      <Link href={`/orders/${orderId}`} className="text-[10px] font-bold text-primary-600 hover:underline">View invoice details</Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-7">
            {!user ? (
              <div className="bg-white rounded-4xl border border-gray-100 shadow-2xl p-12 text-center space-y-8">
                <div className="h-20 w-20 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                  <User className="h-10 w-10" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-2xl font-black text-gray-900">Please Sign In</h2>
                  <p className="text-sm font-medium text-gray-500 max-w-xs mx-auto">We require users to be signed in to open a support ticket so we can track history and provide better service.</p>
                </div>
                <Link 
                  href="/login?redirect=/support?contact=true" 
                  className="inline-flex items-center justify-center w-full px-8 py-5 rounded-2xl bg-gray-900 text-white font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl"
                >
                  Sign In to Continue
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-4xl border border-gray-100 shadow-2xl p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-primary-500 to-primary-700" />
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  {error && (
                    <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-5 text-sm font-bold text-red-800">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      {error}
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">What can we help with?</label>
                      <select 
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        required
                        className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 px-5 py-4 text-sm font-bold text-gray-900 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 appearance-none cursor-pointer"
                      >
                        <option value="question">General Question</option>
                        <option value="order">Order Tracking/Issue</option>
                        <option value="return">Return or Exchange</option>
                        <option value="product">Product Information</option>
                        <option value="technical">Technical Problem</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Subject</label>
                      <input 
                        type="text" 
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        required
                        placeholder="Briefly describe the issue..."
                        className="w-full rounded-2xl border-2 border-gray-50 bg-gray-50 px-5 py-4 text-sm font-bold text-gray-900 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
                      />
                    </div>
                    
                    <div>
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Detailed Message</label>
                      <textarea 
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        required
                        rows={8}
                        placeholder="Please provide as much detail as possible..."
                        className="w-full resize-none rounded-2xl border-2 border-gray-50 bg-gray-50 px-5 py-4 text-sm font-medium text-gray-900 outline-none transition focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10 leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-50">
                    <button 
                      type="submit" 
                      disabled={isSubmitting || !message.trim()}
                      className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gray-900 px-8 py-5 text-sm font-black text-white shadow-xl transition-all hover:bg-black hover:-translate-y-1 focus:ring-4 focus:ring-gray-900/20 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {isSubmitting ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                      {isSubmitting ? 'Submitting Request...' : 'Submit Support Request'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
