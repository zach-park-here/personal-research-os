import { Building2, User, ExternalLink, Calendar, Linkedin, Target } from 'lucide-react';
import type { ResearchResult } from '@personal-research-os/shared/types/research';
import { SectionHeader } from './ui/SectionHeader';
import { EmptyState } from './ui/EmptyState';
import { ProductLaunchBadge } from './ProductLaunchBadge';

interface MeetingPrepViewProps {
  research: ResearchResult;
}

export default function MeetingPrepView({ research }: MeetingPrepViewProps) {
  const { report } = research;

  // Type guard to check if report has meeting prep structure
  const isMeetingPrep = 'persona_analysis' in report && 'company_intelligence' in report;

  if (!isMeetingPrep) {
    return <div className="p-6 text-center text-gray-500 dark:text-gray-400">This is not a meeting prep report.</div>;
  }

  const personaAnalysis = report.persona_analysis;
  const companyIntel = report.company_intelligence;

  // Hardcoded Recent Activity data (overrides backend data)
  const recentActivity = {
    currentFocus: "Document-first systems with AI as a collaboration layer. Currently scaling execution.",
    recentSignals: [
      "Geoffrey Litt joined → Malleable software reinforced",
      "Notion hiring → Execution team expansion",
      "Samsung x Notion AI → Platform-level distribution"
    ],
    profileType: "Product-first founder. Systems > features."
  };

  // Hardcoded Meeting Strategy data
  const meetingStrategyData = {
    openWith: "How Notion thinks about documents becoming systems with AI embedded.",
    ask: [
      "What breaks when documents turn into tools at scale?",
      "Where does AI help most without taking control away from users?"
    ],
    avoid: [
      "Pitching features or standalone AI agents",
      "Abstract AI future talk without product specifics"
    ]
  };

  // Hardcoded Key Resources data
  const keyResources = [
    {
      title: "The Verge: Decoder Podcast Interview with Ivan Zhao",
      url: "https://www.theverge.com/decoder-podcast-with-nilay-patel/756736/notion-ceo-ivan-zhao-productivity-software-design-ai-interview",
      description: "Deep dive on Notion's design philosophy, modular workflows, and AI as productivity collaborators.",
      source: "Notion CEO interview on product philosophy and AI (The Verge)"
    },
    {
      title: "Notion Blog — Behind the Scenes of Notion AI (By Ivan Zhao)",
      url: "https://www.notion.com/blog/behind-the-scenes-notion-ai",
      description: "Explains how Notion approached building and launching AI features, focusing on user-centric design and adoption.",
      source: "Notion official blog"
    },
    {
      title: "Ivan Zhao on X",
      url: "https://x.com/ivanhzhao?lang=en",
      description: "Direct micro-post signal from Zhao about Notion's AI agent usage and product experimentation.",
      source: "Ivan Zhao posts on AI and Notion product direction (X)"
    }
  ];

  return (
    <div className="text-gray-900 dark:text-[#ECECEC] p-8">
      {/* Hero Section - Prospect Profile */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-gray-50 dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3A3A3C] rounded-lg p-8">
          <div className="flex items-start gap-6">
            {/* Avatar Placeholder */}
            <div className="w-20 h-20 rounded-full bg-gray-900 dark:bg-gray-100 flex items-center justify-center text-3xl font-semibold text-white dark:text-gray-900">
              {personaAnalysis?.persona_name?.charAt(0) || 'D'}
            </div>

            {/* Prospect Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-[#ECECEC]">
                {personaAnalysis?.persona_name || 'Unknown'}
              </h1>
              <div className="flex items-center gap-4 text-base text-gray-600 dark:text-[#C5C7CA] mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>{personaAnalysis?.persona_title || 'Unknown Role'} at {personaAnalysis?.persona_company || 'Unknown Company'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Meeting: Tomorrow</span>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md text-sm font-medium">
                <Target className="w-3.5 h-3.5" />
                <span>Decision Maker</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Intelligence Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Company Intelligence */}
        <div className="bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3A3A3C] rounded-lg p-6">
          <SectionHeader icon={Building2} title="Company Intelligence" />

          {/* Product Launches */}
          {companyIntel?.product_launches && companyIntel.product_launches.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-[#888888] mb-3 uppercase tracking-wide">
                Recent Launches
              </h3>
              <div className="flex flex-wrap gap-2">
                {companyIntel.product_launches.map((product, idx) => (
                  <ProductLaunchBadge key={idx} product={product} />
                ))}
              </div>
            </div>
          )}

          {/* Recent News */}
          {companyIntel?.recent_news && companyIntel.recent_news.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-[#888888] mb-3 uppercase tracking-wide">
                Recent News
              </h3>
              <div className="space-y-2">
                {companyIntel.recent_news.slice(0, 3).map((news, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#3A3A3C] rounded-md">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-900 dark:bg-gray-100 mt-2 flex-shrink-0" />
                    <p className="text-sm text-gray-700 dark:text-[#C5C7CA] leading-relaxed">{news}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State for Company Intelligence */}
          {(!companyIntel?.recent_news || companyIntel.recent_news.length === 0) &&
           (!companyIntel?.product_launches || companyIntel.product_launches.length === 0) && (
            <EmptyState message="No company intelligence found" />
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3A3A3C] rounded-lg p-6">
          <SectionHeader icon={User} title="Recent Activity" />

          {/* Current Focus */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-[#888888] mb-2 uppercase tracking-wide">
              Current Focus
            </h3>
            <p className="text-sm text-gray-700 dark:text-[#C5C7CA] leading-relaxed">
              {recentActivity.currentFocus}
            </p>
          </div>

          {/* Recent Signals */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-[#888888] mb-2 uppercase tracking-wide">
              Recent Signals
            </h3>
            <ul className="space-y-2">
              {recentActivity.recentSignals.map((signal, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-[#C5C7CA]">
                  <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 mt-2 flex-shrink-0" />
                  <div className="flex-1">
                    <span>{signal}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-3.5 h-3.5 rounded bg-[#0A66C2] flex items-center justify-center flex-shrink-0">
                        <Linkedin className="w-2 h-2 text-white" />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-[#888888]">Source</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Profile Type */}
          <div className="p-3 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#3A3A3C] rounded-md">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-[#888888] mb-1 uppercase tracking-wide">
              Profile Type
            </h3>
            <p className="text-sm text-gray-800 dark:text-[#ECECEC] font-medium">
              {recentActivity.profileType}
            </p>
          </div>
        </div>

        {/* Meeting Strategy */}
        <div className="bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3A3A3C] rounded-lg p-6">
          <SectionHeader icon={Target} title="Meeting Strategy" />

          {/* Open With */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-[#888888] mb-2 uppercase tracking-wide flex items-center gap-1.5">
              <span>🎯</span>
              <span>Open With</span>
            </h3>
            <p className="text-sm text-gray-700 dark:text-[#C5C7CA] leading-relaxed">
              {meetingStrategyData.openWith}
            </p>
          </div>

          {/* Ask */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-[#888888] mb-2 uppercase tracking-wide flex items-center gap-1.5">
              <span>❓</span>
              <span>Ask</span>
            </h3>
            <ul className="space-y-2">
              {meetingStrategyData.ask.map((question, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-[#C5C7CA]">
                  <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 mt-2 flex-shrink-0" />
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Avoid */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-[#888888] mb-2 uppercase tracking-wide flex items-center gap-1.5">
              <span>⚠️</span>
              <span>Avoid</span>
            </h3>
            <ul className="space-y-2">
              {meetingStrategyData.avoid.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-[#C5C7CA]">
                  <div className="w-1 h-1 rounded-full bg-gray-400 dark:bg-gray-500 mt-2 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Key Resources */}
        <div className="bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3A3A3C] rounded-lg p-6">
          <SectionHeader icon={ExternalLink} title="Key Resources" />

          <div className="space-y-3">
            {keyResources.map((resource, idx) => (
              <a
                key={idx}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group p-4 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#3A3A3C] rounded-md hover:border-gray-900 dark:hover:border-gray-100 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-md bg-gray-100 dark:bg-[#3A3A3C] flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-3.5 h-3.5 text-gray-600 dark:text-[#C5C7CA]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-[#ECECEC] mb-1 group-hover:underline">
                      {resource.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-[#888888] mb-2">
                      {resource.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-[#888888] italic">
                      {resource.source}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
