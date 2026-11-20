import React from 'react';
import { Sparkles } from 'lucide-react';

interface SuggestedQueriesProps {
  onSelect: (query: string) => void;
  disabled?: boolean;
}

const DEFAULT_SUGGESTIONS = [
  'Analyze this dataset and give me the top 5 insights',
  'Which columns have missing values or anomalies?',
  'Find the top 5 products by revenue',
  'Show the correlation between numerical columns',
  'What is the distribution of key metrics?',
  'Explain the overall data quality and recommend next steps',
];

export const SuggestedQueries: React.FC<SuggestedQueriesProps> = ({ onSelect, disabled }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Sparkles className="w-3.5 h-3.5 text-brand-500" />
        <span>Suggested Questions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {DEFAULT_SUGGESTIONS.map((q, idx) => (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(q)}
            className="text-left text-xs px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-card-hover hover:border-brand-500/40 text-foreground transition-all shadow-subtle disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};
