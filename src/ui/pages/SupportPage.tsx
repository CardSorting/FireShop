import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Send, AlertCircle, ArrowLeft, HelpCircle, Package, Receipt,
  Truck, RotateCcw, CreditCard, User, MessageSquare, Search, ChevronRight, FileText,
  Loader2
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
  
  const services = useServices();
  const { user } = useAuth();

  const loadInitialData = useCallback(async () => {
    try {
      const cats = await services.knowledgebaseService.getCategories();
      setCategories(cats);
      
      const articleSlug = searchParams?.get('article');
      if (articleSlug) {
        setLoading(true);
        const article = await services.knowledgebaseService.getArticle(articleSlug);
        if (article) {
          setSelectedArticle(article);
          setViewMode('article');
          // Fetch related
          const rel = await services.knowledgebaseService.getArticles({ categoryId: article.categoryId });
          setArticles(rel.filter(a => a.id !== article.id).slice(0, 3));
        }
      } else if (orderId || productId || forceContact) {
        setViewMode('contact');
      } else if (searchParams?.get('tickets') === 'true' && user) {
        setLoading(true);
        const tickets = await services.ticketService.getUserTickets(user.id);
        setUserTickets(tickets);
        setViewMode('tickets');
      }
    } catch (err) {
      console.error('Failed to load help categories or article', err);
    } finally {
      setLoading(false);
    }
  }, [services.knowledgebaseService, services.ticketService, searchParams, orderId, productId, forceContact, user]);

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (productName) {
      setSubject(`Issue with ${productName}`);
    } else if (orderId) {
      setSubject(`Issue with Order #${orderId.slice(0, 8)}`);
    }
  }, [productName, orderId]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(async () => {
        const results = await services.knowledgebaseService.getArticles({ query: searchQuery });
        setSearchResults(results);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, services.knowledgebaseService]);

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
        priority: 'medium',
        status: 'open',
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
    router.push(`/support/categories/${category.slug || category.id}`);
  };

  const handleArticleClick = async (article: KnowledgebaseArticle) => {
    router.push(`/support/articles/${article.slug}`);
  };

  const handleTicketClick = async (ticket: SupportTicket) => {
    if (!user) return;
    setLoading(true);
    try {
      const t = await services.ticketService.getUserTicket(ticket.id, user.id);
      setSelectedTicket(t);
      setViewMode('ticket_detail');
    } catch (err) {
      console.error('Failed to load ticket', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReplyToTicket = async (content: string) => {
    if (!selectedTicket || !user) return;
    try {
      await services.ticketService.addMessage(selectedTicket.id, content, user.id, 'customer');
      // Refresh ticket
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
          <h1 className="text-3xl font-black text-gray-900 mb-4">Message Sent</h1>
          <p className="text-gray-500 font-medium mb-10 leading-relaxed">
            Your support ticket has been successfully created. Our customer service team will review your request and get back to you shortly.
          </p>
          <div className="flex flex-col gap-3">
            <Link 
              href="/orders" 
              className="w-full inline-flex items-center justify-center rounded-2xl bg-gray-900 px-6 py-4 text-sm font-black text-white hover:bg-black transition-colors"
            >
              Return to Orders
            </Link>
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
        <div className="space-y-20">
          {/* Hero Section */}
          <div className="text-center space-y-8 max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
              How can we <span className="text-primary-600 italic">help?</span>
            </h1>
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for answers (e.g. 'returns', 'tracking')..."
                className="w-full rounded-4xl border-2 border-gray-100 bg-white py-6 pl-16 pr-8 text-lg font-bold text-gray-900 shadow-xl shadow-gray-200/40 outline-none transition-all focus:border-primary-500 focus:ring-8 focus:ring-primary-500/5"
              />
              <SupportSearchOverlay 
                query={searchQuery}
                results={searchResults}
                onClose={() => setSearchQuery('')}
                onResultClick={handleArticleClick}
              />
            </div>
          </div>

          {/* Topics Grid */}
          <div>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900">Knowledge Base</h2>
                <p className="text-sm font-medium text-gray-500 mt-1">Browse topics by category</p>
              </div>
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
                <p className="text-sm font-medium text-gray-500 mt-1">Most frequently asked questions</p>
              </div>
              <div className="flex items-center gap-4">
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
                    My Tickets
                  </button>
                )}
                <Link href="/support?all=true" className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 px-4 py-2">View All</Link>
              </div>
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
              {/* If no search results (initial state), show some hardcoded looking placeholders or just skip */}
              {searchResults.length === 0 && categories.length > 0 && (
                <p className="text-sm font-medium text-gray-400 italic">Select a category above to browse popular topics.</p>
              )}
            </div>
          </div>

          {/* Featured Support Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-gray-900 rounded-[3rem] p-10 md:p-16 text-white relative overflow-hidden group shadow-2xl">
               <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary-600/20 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
               <div className="relative z-10 flex flex-col h-full justify-between gap-12">
                  <div className="space-y-6">
                    <span className="inline-block px-4 py-1 rounded-full bg-white/10 text-[10px] font-black uppercase tracking-widest text-primary-400 border border-white/5">Instant Assistance</span>
                    <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Need to track your package or start a return?</h2>
                    <p className="text-lg font-medium text-white/60 max-w-xl">Our automated support portal can handle your most common requests instantly without needing to wait for an agent.</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <Link href="/orders" className="px-8 py-5 rounded-2xl bg-white text-gray-900 font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-colors shadow-lg">Track Order</Link>
                    <Link href="/support?contact=true" className="px-8 py-5 rounded-2xl bg-white/10 border border-white/20 text-white font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-colors">Start a Return</Link>
                  </div>
               </div>
            </div>
            <div className="lg:col-span-4 bg-primary-50 rounded-[3rem] p-10 flex flex-col justify-between border border-primary-100/50 shadow-xl shadow-primary-500/5">
               <div className="space-y-6">
                 <div className="h-16 w-16 rounded-3xl bg-primary-600 flex items-center justify-center text-white shadow-xl shadow-primary-500/30">
                    <MessageSquare className="h-8 w-8" />
                 </div>
                 <h3 className="text-2xl font-black text-gray-900">Direct Support</h3>
                 <p className="text-sm font-medium text-gray-500 leading-relaxed">If you can't find what you're looking for, our collectors support team is just a message away.</p>
               </div>
               <button 
                onClick={() => setViewMode('contact')}
                className="w-full py-5 rounded-2xl bg-gray-900 text-white font-black text-sm uppercase tracking-widest hover:bg-black transition-colors shadow-xl"
               >
                 Contact Expert
               </button>
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
          {/* Context Sidebar */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight mb-4">
                How can we <span className="text-primary-600">help?</span>
              </h1>
              <p className="text-lg font-medium text-gray-500 leading-relaxed">
                Whether you need to return an item, report a missing package, or ask a question about a product, we're here for you.
              </p>
            </div>

            {orderId && (
              <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Linked Order Details</h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                      <Receipt className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Order #{orderId.slice(0, 8)}</p>
                      <Link href={`/orders/${orderId}`} className="text-[10px] font-bold text-primary-600 hover:underline">View invoice details</Link>
                    </div>
                  </div>
                  {productName && (
                    <div className="flex items-start gap-4">
                      <div className="mt-1 bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Issue with specific item</p>
                        <p className="text-xs font-medium text-gray-500 mt-1">{productName}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Form Area */}
          <div className="lg:col-span-7">
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
                      placeholder="Please provide as much detail as possible so we can help you quickly..."
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
                  <p className="text-center text-[10px] font-medium text-gray-400 mt-6">
                    Our team typically responds within 24 hours.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
