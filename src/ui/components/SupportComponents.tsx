'use client';
import React, { useState } from 'react';
import { 
  ArrowLeft, ChevronRight, FileText, ThumbsUp, ThumbsDown, 
  MessageSquare, ExternalLink, Calendar, User, Search, CheckCircle2,
  Send, Clock, AlignLeft, Sparkles
} from 'lucide-react';
import type { KnowledgebaseArticle, KnowledgebaseCategory, SupportTicket } from '@domain/models';
import Link from 'next/link';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useRef } from 'react';

export function KnowledgebaseCategoryCard({ category, onClick }: { category: KnowledgebaseCategory, onClick: (c: KnowledgebaseCategory) => void }) {
  return (
    <button
      onClick={() => onClick(category)}
      className="group flex flex-col items-start p-6 rounded-3xl bg-white border border-gray-100 shadow-xs hover:shadow-xl hover:border-primary-100 transition-all text-left text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
        <FileText className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-black mb-2 group-hover:text-primary-600 transition-colors">{category.name}</h3>
      <p className="text-sm font-medium text-gray-500 line-clamp-2 leading-relaxed">{category.description}</p>
      <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-primary-500 transition-colors">
        <span>{category.articleCount} Articles</span>
        <ChevronRight className="h-3 w-3" />
      </div>
    </button>
  );
}

export function KnowledgebaseArticleList({ articles, categoryName, onBack, onArticleClick }: { 
  articles: KnowledgebaseArticle[], 
  categoryName: string,
  onBack: () => void,
  onArticleClick: (a: KnowledgebaseArticle) => void
}) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <Link href="/support" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary-600">Support</Link>
               <ChevronRight className="h-2 w-2 text-gray-300" />
               <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">{categoryName}</span>
            </div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{categoryName}</h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {articles.map(article => (
          <button 
            key={article.id}
            onClick={() => onArticleClick(article)}
            className="flex items-center justify-between p-6 rounded-3xl bg-white border border-gray-100 hover:border-primary-100 hover:shadow-lg transition-all group text-left"
          >
            <div className="flex items-center gap-5">
              <div className="p-3 rounded-2xl bg-gray-50 text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{article.title}</p>
                  {article.tags?.includes('popular') && (
                    <span className="text-[8px] font-black uppercase tracking-tighter bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Most Used</span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-500 line-clamp-1">{article.excerpt}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function KnowledgebaseArticleView({ article, relatedArticles, onBack, onArticleClick }: { 
  article: KnowledgebaseArticle, 
  relatedArticles: KnowledgebaseArticle[],
  onBack: () => void,
  onArticleClick: (a: KnowledgebaseArticle) => void
}) {
  const [feedbackStep, setFeedbackStep] = useState<'initial' | 'negative_reason' | 'thanks'>('initial');
  const [negativeReason, setNegativeReason] = useState('');
  const services = useServices();
  const { user } = useAuth();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const handleFeedback = async (isHelpful: boolean) => {
    if (isHelpful) {
      try {
        await services.knowledgebaseService.submitFeedback(article.id, true, user?.id);
        if (isMounted.current) {
          setFeedbackStep('thanks');
        }
      } catch (err) {
        console.error('Failed to submit feedback', err);
      }
    } else {
      setFeedbackStep('negative_reason');
    }
  };

  const submitNegativeFeedback = async () => {
    try {
      await services.knowledgebaseService.submitFeedback(article.id, false, user?.id, negativeReason);
      if (isMounted.current) {
        setFeedbackStep('thanks');
      }
    } catch (err) {
      console.error('Failed to submit feedback', err);
    }
  };

  // Table of Contents generation from headers
  const headers = article.content.split('\n').filter(line => line.startsWith('## ') || line.startsWith('### '));

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <Link href="/support" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary-600">Support</Link>
               <ChevronRight className="h-2 w-2 text-gray-300" />
               <button onClick={onBack} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-primary-600">{article.categoryName}</button>
               <ChevronRight className="h-2 w-2 text-gray-300" />
               <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 truncate max-w-[150px]">{article.title}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-tight">{article.title}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          {headers.length > 0 && (
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100/50">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                <AlignLeft className="h-3 w-3" /> In this article
              </h3>
              <nav className="space-y-3">
                {headers.map((h, i) => {
                  const level = h.startsWith('### ') ? 'ml-4' : '';
                  const text = h.replace(/^#+ /, '');
                  return (
                    <button key={i} className={`block text-sm font-bold text-gray-600 hover:text-primary-600 transition-colors ${level}`}>
                      {text}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          <article className="bg-white rounded-4xl p-8 md:p-14 border border-gray-100 shadow-xl max-w-none prose prose-slate prose-lg prose-headings:font-black prose-headings:tracking-tight prose-a:text-primary-600 prose-strong:text-gray-900">
            <div className="whitespace-pre-wrap font-medium text-gray-600 leading-relaxed text-base">
               {article.content}
            </div>
          </article>

          {/* Recommended Next Step */}
          <div className="bg-primary-50 rounded-4xl p-8 md:p-10 border border-primary-100 flex flex-col md:flex-row items-center gap-8 shadow-sm">
            <div className="h-16 w-16 rounded-2xl bg-white flex items-center justify-center shadow-sm text-primary-600 shrink-0">
               <MessageSquare className="h-8 w-8" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h4 className="text-xl font-black text-gray-900 tracking-tight">Still stuck? We're here.</h4>
              <p className="text-sm font-medium text-gray-500 mt-1">Our support team is available to help you personally with any issue.</p>
            </div>
            <Link href="/support?contact=true" className="px-8 py-4 rounded-2xl bg-gray-900 text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-lg">
              Open a Ticket
            </Link>
          </div>

          {/* Forensic Feedback Loop */}
          <div className="bg-gray-900 rounded-4xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden transition-all duration-500">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-600/10 blur-3xl" />
            
            <div className="relative z-10">
              {feedbackStep === 'initial' && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 animate-in fade-in zoom-in duration-300">
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl font-black tracking-tight">Was this article helpful?</h3>
                    <p className="text-white/50 text-sm font-medium mt-2">Your feedback helps us refine our support guides.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleFeedback(true)}
                      className="flex items-center gap-3 bg-white/10 hover:bg-white/20 px-8 py-5 rounded-2xl transition-all group border border-white/5"
                    >
                      <ThumbsUp className="h-5 w-5 text-primary-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-black uppercase tracking-widest">Yes, It helped</span>
                    </button>
                    <button 
                      onClick={() => handleFeedback(false)}
                      className="flex items-center gap-3 bg-white/10 hover:bg-white/20 px-8 py-5 rounded-2xl transition-all group border border-white/5"
                    >
                      <ThumbsDown className="h-5 w-5 text-red-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-black uppercase tracking-widest">Not really</span>
                    </button>
                  </div>
                </div>
              )}

              {feedbackStep === 'negative_reason' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                  <div className="text-center md:text-left">
                    <h3 className="text-2xl font-black tracking-tight text-red-400">How can we improve this?</h3>
                    <p className="text-white/50 text-sm font-medium mt-2">Help us understand why this wasn't helpful so we can fix it.</p>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        "Instructions were unclear",
                        "Content is outdated",
                        "Didn't solve my specific issue",
                        "Too technical/complex",
                        "Other"
                      ].map((reason) => (
                        <button 
                          key={reason}
                          onClick={() => setNegativeReason(reason)}
                          className={`p-4 rounded-xl text-xs font-bold text-left transition-all border ${
                            negativeReason === reason 
                              ? 'bg-primary-600 border-primary-500 text-white' 
                              : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
                          }`}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={submitNegativeFeedback}
                      disabled={!negativeReason}
                      className="w-full py-5 rounded-2xl bg-white text-gray-900 font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all disabled:opacity-50"
                    >
                      Submit Feedback
                    </button>
                  </div>
                </div>
              )}

              {feedbackStep === 'thanks' && (
                <div className="text-center py-4 animate-in zoom-in duration-500">
                  <div className="h-16 w-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-black tracking-tight">Feedback Received!</h3>
                  <p className="text-white/50 text-sm font-medium mt-2 max-w-sm mx-auto">
                    Thank you for helping us build a better experience for the DreamBees community.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-gray-50 rounded-4xl p-8 border border-gray-100/50">
             <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8">Discovery Details</h3>
             <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Written By</p>
                    <p className="text-sm font-bold text-gray-900">{article.authorName || 'Expert Collector'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Last Audited</p>
                    <p className="text-sm font-bold text-gray-900">{new Date(article.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-gray-400">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Complexity</p>
                    <p className="text-sm font-bold text-gray-900">{Math.ceil(article.content.split(' ').length / 200)} Min Read</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary-600">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Audience</p>
                    <p className="text-sm font-bold text-gray-900">{article.tags?.includes('beginner') ? 'Beginner' : 'All Collectors'}</p>
                  </div>
                </div>
             </div>
           </div>


           {relatedArticles.length > 0 && (
             <div className="bg-white rounded-4xl p-8 border border-gray-100 shadow-sm">
               <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Related Articles</h3>
               <div className="space-y-4">
                 {relatedArticles.map(rel => (
                   <button 
                    key={rel.id} 
                    onClick={() => onArticleClick(rel)}
                    className="w-full text-left group"
                   >
                     <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-2">{rel.title}</p>
                     <p className="text-[10px] font-medium text-gray-400 mt-1">{rel.categoryName}</p>
                   </button>
                 ))}
               </div>
             </div>
           )}

           <div className="bg-primary-600 rounded-4xl p-8 text-white shadow-xl shadow-primary-500/20 relative overflow-hidden group">
             <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
             <h3 className="text-lg font-black mb-3 relative z-10">Still need help?</h3>
             <p className="text-sm font-medium text-white/80 mb-8 leading-relaxed relative z-10">Can't find the answer you're looking for? Our team is available 24/7 to assist you.</p>
             <Link href="/support?contact=true" className="inline-flex items-center justify-center w-full px-6 py-4 rounded-2xl bg-white text-primary-700 text-sm font-black uppercase tracking-widest hover:shadow-lg transition-all relative z-10">
               Contact Support
             </Link>
           </div>
        </div>
      </div>
    </div>
  );
}

export function SupportSearchOverlay({ query, results, onClose, onResultClick }: { 
  query: string, 
  results: KnowledgebaseArticle[], 
  onClose: () => void,
  onResultClick: (article: KnowledgebaseArticle) => void
}) {
  if (!query) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-4 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Search Results for "{query}"</h4>
        <button onClick={onClose} className="text-[10px] font-bold text-primary-600 hover:underline uppercase tracking-widest">Clear</button>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        {results.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {results.map(article => (
              <button 
                key={article.id}
                onClick={() => onResultClick(article)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors group"
              >
                <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary-600 group-hover:bg-primary-50 transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors truncate">{article.title}</p>
                  <p className="text-[10px] font-medium text-gray-400 truncate">{article.categoryName}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </button>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center">
            <Search className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-sm font-bold text-gray-400">No articles found. Try a different keyword.</p>
          </div>
        )}
      </div>
      {results.length > 0 && (
        <div className="p-4 bg-gray-50 border-t text-center">
          <Link href="/support?contact=true" className="text-[10px] font-black uppercase tracking-widest text-primary-600 hover:underline">
            Still need help? Talk to an expert
          </Link>
        </div>
      )}
    </div>
  );
}

export function TicketList({ tickets, onTicketClick }: { 
  tickets: SupportTicket[], 
  onTicketClick: (t: SupportTicket) => void 
}) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-gray-900">My Support Tickets</h2>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tickets.length > 0 ? (
          tickets.map(ticket => (
            <button 
              key={ticket.id}
              onClick={() => onTicketClick(ticket)}
              className="flex items-center justify-between p-6 rounded-3xl bg-white border border-gray-100 hover:border-primary-100 hover:shadow-lg transition-all group text-left"
            >
              <div className="flex items-center gap-5">
                <div className={`p-3 rounded-2xl ${ticket.status === 'solved' ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-blue-500'} group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors`}>
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{ticket.subject}</p>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${
                      ticket.status === 'solved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-500 mt-1">Ticket #{ticket.id.slice(0, 8).toUpperCase()} • Last updated {new Date(ticket.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
            </button>
          ))
        ) : (
          <div className="p-12 text-center bg-gray-50 rounded-4xl border border-dashed border-gray-200">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-sm font-bold text-gray-400">You haven't submitted any tickets yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function TicketDetailView({ ticket, onBack, onReply }: { 
  ticket: SupportTicket, 
  onBack: () => void,
  onReply: (content: string) => Promise<void>
}) {
  const [reply, setReply] = useState('');
  const [isSending, setIsSending] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || isSending) return;
    setIsSending(true);
    try {
      await onReply(reply);
      if (isMounted.current) {
        setReply('');
      }
    } finally {
      if (isMounted.current) {
        setIsSending(false);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${
                ticket.status === 'solved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-bold text-gray-300">Ticket #{ticket.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{ticket.subject}</h1>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-4xl border border-gray-100 shadow-xl overflow-hidden flex flex-col h-[600px]">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          {ticket.messages.map((msg) => {
            const isAgent = msg.senderType === 'agent' || msg.senderType === 'system';
            return (
              <div key={msg.id} className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}>
                <div className="max-w-[85%] space-y-1">
                  <div className={`flex items-center gap-2 mb-1 ${!isAgent ? 'flex-row-reverse' : ''}`}>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {isAgent ? 'Support Team' : 'You'}
                    </span>
                    <span className="text-[9px] text-gray-300 font-medium">{new Date(msg.createdAt).toLocaleString()}</span>
                  </div>
                  <div className={`
                    px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${isAgent ? 'bg-white text-gray-800 border border-gray-100 rounded-tl-none' : 'bg-primary-600 text-white rounded-tr-none'}
                  `}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {ticket.status !== 'solved' && (
          <div className="p-4 bg-white border-t">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                className="w-full resize-none rounded-2xl border border-gray-100 bg-gray-50 p-4 pb-12 text-sm font-medium focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 outline-none transition"
              />
              <button
                type="submit"
                disabled={!reply.trim() || isSending}
                className="absolute right-3 bottom-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white shadow-lg hover:bg-black transition-all disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
