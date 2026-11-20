import React, { useState, useEffect, useRef } from 'react';
import { useDataset } from '../contexts/DatasetContext';
import { aiService } from '../services/aiService';
import { ChatMessage } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { SuggestedQueries } from '../components/chat/SuggestedQueries';
import { Bot, Sparkles, Trash2, Database, Terminal, ShieldAlert } from 'lucide-react';

export const AIAnalyst: React.FC = () => {
  const { selectedDataset } = useDataset();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message when dataset changes
  useEffect(() => {
    if (selectedDataset) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hello! I am your autonomous AI Data Analyst for **${selectedDataset.name}**.\n\nI have loaded **${selectedDataset.rows.toLocaleString()} rows** and **${selectedDataset.columns} features** into my execution context.\n\nYou can ask me complex analytical questions, request statistical summaries, or ask for trends and top performers. I compute numerical answers using deterministic Python engine tools to guarantee 100% mathematical accuracy.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } else {
      setMessages([]);
    }
  }, [selectedDataset?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (text: string) => {
    if (!selectedDataset || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await aiService.sendMessage(selectedDataset.id, text, messages);
      setMessages((prev) => [...prev, response]);
    } catch (err: any) {
      // Fallback response with informative guidance if backend AI endpoint is configuring
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I encountered an issue processing this request: ${err?.response?.data?.detail || err.message || 'Connection timeout'}.\n\nPlease ensure the backend is running with Gemini API or standard analytics engine enabled.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (selectedDataset) {
      setMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: `Context reset for **${selectedDataset.name}**. How can I help you analyze your data?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  if (!selectedDataset) {
    return (
      <EmptyState
        title="No Active Dataset"
        description="Select or upload a dataset to start an agentic analytical conversation with the AI Analyst."
        icon={<Bot className="w-10 h-10 text-muted-foreground stroke-[1.5]" />}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] min-h-[500px] space-y-3">
      {/* Top Header Card */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border shadow-subtle flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-subtle">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-foreground">AI Analyst Agent</h2>
              <Badge variant="brand" size="sm">Gemini + FastMCP</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              Context: <span className="font-semibold text-foreground">{selectedDataset.name}</span> ({selectedDataset.rows.toLocaleString()} rows)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            icon={<Trash2 className="w-3.5 h-3.5" />}
            className="text-xs h-8 px-2.5 text-muted-foreground hover:text-destructive"
          >
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-1 sm:px-2 py-3 rounded-2xl bg-card/40 border border-border/80 shadow-inner">
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}

        {loading && (
          <div className="flex gap-3 my-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-subtle animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-card border border-border shadow-subtle text-xs text-muted-foreground flex items-center gap-2">
              <Terminal className="w-4 h-4 text-brand-500 animate-spin" />
              <span>Analyzing dataset & executing Python engine calculation...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      <div className="flex-shrink-0 pt-1">
        <SuggestedQueries onSelect={handleSendMessage} disabled={loading} />
      </div>

      {/* Input Form */}
      <div className="flex-shrink-0">
        <ChatInput
          onSend={handleSendMessage}
          loading={loading}
          datasetName={selectedDataset.name}
        />
      </div>
    </div>
  );
};
