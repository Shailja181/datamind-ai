import React, { useState } from 'react';
import { Bot, User, Copy, Check, Terminal, BarChart2 } from 'lucide-react';
import { ChatMessage } from '../../types';
import { DistributionBarChart } from '../charts/DistributionBarChart';
import { ScatterPlotChart } from '../charts/ScatterPlotChart';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 my-4 group ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-subtle ${
          isUser
            ? 'bg-brand-500'
            : 'bg-gradient-to-tr from-accent-500 to-indigo-600'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble Content */}
      <div className={`max-w-[85%] sm:max-w-[75%] space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
            isUser
              ? 'bg-brand-500 text-white rounded-tr-sm'
              : 'bg-card border border-border text-foreground shadow-subtle rounded-tl-sm'
          }`}
        >
          {/* Message Text with preserved lines and code blocks */}
          <div className="whitespace-pre-wrap">{message.content}</div>

          {/* Inline Structured Table if provided by backend analytics tool */}
          {message.tableData && message.tableData.rows.length > 0 && (
            <div className="mt-3 border border-border/80 rounded-xl overflow-hidden bg-background/50">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted border-b border-border text-muted-foreground">
                    {message.tableData.columns.map((col) => (
                      <th key={col} className="p-2 text-left font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {message.tableData.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-muted/30">
                      {message.tableData!.columns.map((col) => (
                        <td key={col} className="p-2 font-mono text-[11px]">
                          {String(row[col] ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Inline Chart if returned */}
          {message.chart && (
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5 text-xs font-semibold mb-2 text-foreground">
                <BarChart2 className="w-4 h-4 text-brand-500" />
                <span>{message.chart.title}</span>
              </div>
              <div className="h-56">
                <DistributionBarChart data={message.chart.data} />
              </div>
            </div>
          )}

          {/* Tool Execution Activity Pills */}
          {message.toolsUsed && message.toolsUsed.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-border/60 flex flex-wrap gap-1.5">
              {message.toolsUsed.map((tool, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-muted text-[10px] font-mono text-muted-foreground border border-border"
                  title={JSON.stringify(tool.params)}
                >
                  <Terminal className="w-3 h-3 text-brand-500" />
                  <span>{tool.name}</span>
                  {tool.duration_ms && <span>({tool.duration_ms}ms)</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action bar below message */}
        <div className={`flex items-center gap-2 text-[10px] text-muted-foreground px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span>{message.timestamp}</span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-foreground rounded"
              title="Copy answer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
