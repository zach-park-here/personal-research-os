import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { ResearchResult } from '../types';

interface ResearchResultsProps {
  result: ResearchResult;
}

function ResearchResults({ result }: ResearchResultsProps) {
  return (
    <div className="space-y-6">
      {/* Research Brief */}
      <Section title="Research Brief">
        <div className="bg-gray-50 rounded-lg p-4 border border-border">
          <p className="text-sm text-text-primary leading-relaxed">
            {result.report.overview}
          </p>
        </div>
      </Section>

      {/* Key Findings */}
      <Section title="Key Findings">
        <div className="space-y-2">
          {result.report.key_findings.map((finding, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-text-secondary mt-1.5">•</span>
              <p className="text-sm text-text-primary flex-1">{finding}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Recommended Pages */}
      <Section title="Recommended Pages">
        <div className="space-y-3">
          {result.recommended_pages.map((page, index) => (
            <PageCard key={index} page={page} />
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function PageCard({ page }: { page: ResearchResult['recommended_pages'][0] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden hover:border-gray-400 transition-colors">
      {/* Card Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 cursor-pointer bg-white hover:bg-bg-hover transition-colors"
      >
        <div className="flex items-start gap-3">
          <button className="flex-shrink-0 mt-0.5">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-text-secondary" />
            ) : (
              <ChevronRight className="w-4 h-4 text-text-secondary" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-text-primary mb-1 line-clamp-2">
              {page.title}
            </h4>
            <p className="text-xs text-text-secondary mb-2">
              {page.why_read}
            </p>
            <a
              href={page.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <span>View source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && page.highlights.length > 0 && (
        <div className="px-4 pb-4 border-t border-border bg-gray-50">
          <div className="pt-3 space-y-2">
            {page.highlights.map((highlight, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-text-secondary mt-1 text-xs">–</span>
                <p className="text-xs text-text-secondary flex-1">{highlight}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResearchResults;
