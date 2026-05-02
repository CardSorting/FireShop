import React, { useState } from 'react';
import { 
  ArrowLeft, ChevronRight, FileText, ThumbsUp, ThumbsDown, 
  MessageSquare, ExternalLink, Calendar, User, Search, CheckCircle2,
  Send
} from 'lucide-react';
import type { KnowledgebaseArticle, KnowledgebaseCategory, SupportTicket } from '@domain/models';
import Link from 'next/link';
import { useServices } from '../hooks/useServices';
import { useAuth } from '../hooks/useAuth';

export function KnowledgebaseCategoryCard({ category, onClick }: { category: KnowledgebaseCategory, onClick: (c: KnowledgebaseCategory) => void }) {
  return (
    <button
      onClick={() => onClick(category)}
      className="group flex flex-col items-start p-6 rounded-3xl bg-white border border-gray-100 shadow-xs hover:shadow-xl hover:border-primary-100 transition-all text-left text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
        <FileText className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold mb-2 group-hover:text-primary-600 transition-colors">{category.name}</h3>
      <p className="text-sm font-medium text-gray-500 line-clamp-2">{category.description}</p>
      <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-primary-500 transition-colors">
        <span>View {category.articleCount} articles</span>
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
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">{categoryName}</h2>
            <p className="text-sm font-medium text-gray-500">{articles.length} helpful articles</p>
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
                <p className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{article.title}</p>
                <p className="text-sm font-medium text-gray-500 mt-1 line-clamp-1">{article.excerpt}</p>
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
  const [voted, setVoted] = useState(false);
  const services = useServices();
  const { user } = useAuth();

  const handleFeedback = async (isHelpful: boolean) => {
    if (voted) return;
    try {
      await services.knowledgebaseService.submitFeedback(article.id, isHelpful, user?.id);
      setVoted(true);
    } catch (err) {
      console.error('Failed to submit feedback', err);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:text-gray-900 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-600 bg-primary-50 px-2 py-0.5 rounded-lg">{article.categoryName}</span>
              <span className="text-[10px] font-bold text-gray-300">•</span>
              <span className="text-[10px] font-bold text-gray-400">{Math.ceil(article.content.split(' ').length / 200)} min read</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">{article.title}</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-8 space-y-12">
          <article className="bg-white rounded-4xl p-8 md:p-12 border border-gray-100 shadow-xl max-w-none">
            <div className="whitespace-pre-wrap font-medium text-gray-600 leading-relaxed text-base">
               {article.content}
            </div>
          </article>

          {/* Helpful Section */}
          <div className="bg-gray-900 rounded-[2.5rem] p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl relative overflow-hidden">
            <div className="relative z-10 text-center md:text-left">
              <h3 className="text-xl font-black tracking-tight">Was this article helpful?</h3>
              <p className="text-white/50 text-sm font-medium mt-1">Your feedback helps us improve our support.</p>
            </div>
            
            <div className="flex items-center gap-4 relative z-10">
              {voted ? (
                <div className="bg-white/10 px-6 py-3 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <span className="text-sm font-black uppercase tracking-widest">Thank you!</span>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => handleFeedback(true)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-4 rounded-2xl transition-all group"
                  >
                    <ThumbsUp className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Yes</span>
                  </button>
                  <button 
                    onClick={() => handleFeedback(false)}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-4 rounded-2xl transition-all group"
                  >
                    <ThumbsDown className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">No</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-gray-50 rounded-4xl p-8 border border-gray-100/50">
             <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Article Details</h3>
             <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Author</p>
                    <p className="text-xs font-bold text-gray-900">{article.authorName || 'Support Team'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Last Updated</p>
                    <p className="text-xs font-bold text-gray-900">{article.updatedAt.toLocaleDateString()}</p>
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
                <div className={`p-3 rounded-2xl ${ticket.status === 'resolved' ? 'bg-green-50 text-green-500' : 'bg-blue-50 text-blue-500'} group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors`}>
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{ticket.subject}</p>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || isSending) return;
    setIsSending(true);
    try {
      await onReply(reply);
      setReply('');
    } finally {
      setIsSending(false);
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
                ticket.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
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

        {ticket.status !== 'resolved' && (
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
