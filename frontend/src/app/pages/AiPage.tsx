import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import {
  Send, Bot, User, Plus, Trash2, MessageSquare,
  ChevronLeft, Loader2, Car, Zap, AlertCircle,
} from 'lucide-react';
import {
  streamChat, getConversations, getConversation, deleteConversation,
  type AiMessage, type AiConversation,
} from '../api/ai';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { useLanguage } from '../i18n/LanguageContext';

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  isToolCall?: boolean;
  toolName?: string;
}

function MessageBubble({ msg }: { msg: LocalMessage }) {
  const { T } = useLanguage();
  const isUser = msg.role === 'user';

  if (msg.isToolCall) {
    return (
      <div className="flex justify-center my-1">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>{T.ai.searching}{msg.toolName ? `: ${msg.toolName}` : ''}...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-primary text-primary-foreground' : 'bg-foreground text-background'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-tr-sm'
            : 'bg-card border border-border text-foreground rounded-tl-sm'
        }`}>
          {msg.content || (msg.isStreaming ? <span className="inline-block w-2 h-4 bg-current animate-pulse rounded-sm" /> : '...')}
          {msg.isStreaming && msg.content && (
            <span className="inline-block w-2 h-4 bg-current animate-pulse rounded-sm ml-0.5 align-middle" />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onSuggestion }: { onSuggestion: (s: string) => void }) {
  const { T } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
      <div className="w-16 h-16 bg-foreground rounded-2xl flex items-center justify-center mb-6 rotate-3">
        <Car className="w-8 h-8 text-background" />
      </div>
      <h2 className="text-2xl font-semibold text-foreground mb-2">{T.ai.title}</h2>
      <p className="text-muted-foreground mb-8 max-w-sm">{T.ai.subtitle}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {T.ai.suggestions.map((s: string) => (
          <button key={s} onClick={() => onSuggestion(s)}
            className="text-left px-4 py-3 bg-card border border-border rounded-xl text-sm hover:border-foreground hover:shadow-sm transition-all duration-200 group">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-muted-foreground group-hover:text-foreground mt-0.5 flex-shrink-0 transition-colors" />
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">{s}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Sidebar({
  conversations, activeId, onSelect, onNew, onDelete, collapsed,
}: {
  conversations: AiConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { T } = useLanguage();
  return (
    <aside className={`flex flex-col bg-card border-r border-border transition-all duration-300 ${
      collapsed ? 'w-0 overflow-hidden' : 'w-64'
    }`}>
      <div className="p-4 border-b border-border flex-shrink-0">
        <button onClick={onNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          {T.ai.newChat}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8 px-4">{T.ai.noChats}</p>
        )}
        {conversations.map(conv => (
          <div key={conv.id}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
              activeId === conv.id ? 'bg-foreground text-background' : 'hover:bg-secondary text-foreground'
            }`}
            onClick={() => onSelect(conv.id)}>
            <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-60" />
            <span className="text-sm truncate flex-1">{conv.title ?? T.ai.newDialog}</span>
            <button
              onClick={e => { e.stopPropagation(); onDelete(conv.id); }}
              className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${
                activeId === conv.id ? 'hover:bg-white/20' : 'hover:bg-destructive/10 hover:text-destructive'
              }`}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function AiPage() {
  const { user, loading: authLoading } = useAuth();
  const { T } = useLanguage();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<boolean>(false);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (user) {
      getConversations().then(data => setConversations(data.data)).catch(() => {});
    }
  }, [user]);

  const loadConversation = useCallback(async (id: string) => {
    setLoadingConversation(true);
    try {
      const conv = await getConversation(id);
      setMessages(conv.messages.map((m: AiMessage) => ({ id: m.id, role: m.role, content: m.content })));
      setActiveConversationId(id);
    } catch {
      toast.error(T.ai.loadError);
    } finally {
      setLoadingConversation(false);
    }
  }, [T.ai.loadError]);

  const startNewConversation = useCallback(() => {
    setMessages([]); setActiveConversationId(null); setInput('');
  }, []);

  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      await deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) startNewConversation();
      toast.success(T.ai.deleteSuccess);
    } catch {
      toast.error(T.ai.deleteError);
    }
  }, [activeConversationId, startNewConversation, T.ai.deleteSuccess, T.ai.deleteError]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: LocalMessage = { id: `user-${Date.now()}`, role: 'user', content: text.trim() };
    const assistantId = `assistant-${Date.now()}`;
    const assistantMsg: LocalMessage = { id: assistantId, role: 'assistant', content: '', isStreaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsStreaming(true);
    abortRef.current = false;

    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    await streamChat(
      text.trim(), activeConversationId,
      (chunk) => {
        if (abortRef.current) return;
        if (chunk.type === 'tool_call') {
          setMessages(prev => {
            const withoutOldTool = prev.filter(m => !m.isToolCall);
            return [...withoutOldTool, { id: `tool-${Date.now()}`, role: 'assistant', content: '', isToolCall: true, toolName: chunk.name }];
          });
        } else if (chunk.type === 'token' && chunk.content) {
          setMessages(prev => prev.filter(m => !m.isToolCall).map(m =>
            m.id === assistantId ? { ...m, content: m.content + chunk.content } : m
          ));
        }
      },
      (convId) => {
        setIsStreaming(false);
        setMessages(prev => prev.filter(m => !m.isToolCall).map(m =>
          m.id === assistantId ? { ...m, isStreaming: false } : m
        ));
        if (convId && !activeConversationId) {
          setActiveConversationId(convId);
          getConversations().then(data => setConversations(data.data)).catch(() => {});
        }
      },
      (error) => {
        setIsStreaming(false);
        setMessages(prev => prev.filter(m => !m.isToolCall).map(m =>
          m.id === assistantId ? { ...m, content: error, isStreaming: false } : m
        ));
      },
    );
  }, [isStreaming, activeConversationId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-foreground rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Bot className="w-8 h-8 text-background" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-3">{T.ai.title}</h1>
          <p className="text-muted-foreground mb-6">{T.ai.authDesc}</p>
          <div className="flex gap-3 justify-center">
            <Link to="/profile" className="px-6 py-3 bg-foreground text-background rounded-xl hover:opacity-90 transition-opacity font-medium">{T.ai.signIn}</Link>
            <Link to="/catalog" className="px-6 py-3 bg-secondary text-foreground rounded-xl hover:bg-secondary/80 transition-colors border border-border">{T.ai.toCatalog}</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        onSelect={loadConversation}
        onNew={startNewConversation}
        onDelete={handleDeleteConversation}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(p => !p)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border flex-shrink-0">
          <button onClick={() => setSidebarCollapsed(p => !p)}
            className="p-2 hover:bg-secondary rounded-lg transition-colors text-foreground">
            <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-background" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{T.ai.title}</p>
              <p className="text-xs text-muted-foreground">{T.ai.carSelection}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">{T.ai.online}</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {loadingConversation ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState onSuggestion={s => { setInput(s); sendMessage(s); }} />
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Notice */}
        <div className="px-4 pb-1 max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            <span>{T.ai.disclaimer}</span>
          </div>
        </div>

        {/* Input */}
        <div className="px-4 pb-4 pt-2">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-sm focus-within:border-foreground transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={T.ai.placeholder}
                rows={1}
                disabled={isStreaming}
                className="flex-1 resize-none bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground max-h-40 leading-relaxed"
                style={{ height: 'auto' }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                className="flex-shrink-0 w-9 h-9 bg-foreground text-background rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {T.ai.enterSend}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
