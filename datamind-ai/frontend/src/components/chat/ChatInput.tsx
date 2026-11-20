import React, { useState } from 'react';
import { Send, Loader2, Sparkles, Database } from 'lucide-react';
import { Button } from '../common/Button';

interface ChatInputProps {
  onSend: (message: string) => void;
  loading: boolean;
  datasetName?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, loading, datasetName }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="border border-border rounded-2xl bg-card shadow-subtle p-2 focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-500 transition-all">
        {datasetName && (
          <div className="px-3 pt-1 pb-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground border-b border-border/50 mb-1">
            <Database className="w-3 h-3 text-brand-500" />
            <span>Analyzing:</span>
            <span className="font-semibold text-foreground truncate">{datasetName}</span>
          </div>
        )}

        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about this dataset (e.g., 'What are the top revenue drivers?')..."
          className="w-full bg-transparent px-3 py-1.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
          disabled={loading}
        />

        <div className="flex items-center justify-between pt-1 px-2 border-t border-border/40">
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            Press <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[9px] border">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[9px] border">Shift+Enter</kbd> for new line
          </span>

          <Button
            type="submit"
            size="sm"
            variant="primary"
            disabled={!text.trim() || loading}
            loading={loading}
            icon={!loading ? <Send className="w-3.5 h-3.5" /> : undefined}
            className="ml-auto text-xs"
          >
            {loading ? 'Analyzing...' : 'Ask AI'}
          </Button>
        </div>
      </div>
    </form>
  );
};
