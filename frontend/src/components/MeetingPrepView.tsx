import { Building2, User, ExternalLink, Calendar, Linkedin, FileText, Target, AlertCircle } from 'lucide-react';
import type { ResearchResult } from '@personal-research-os/shared/types/research';
import { createGoogleSearchUrl } from '../utils/urlHelpers';
import { SectionHeader } from './ui/SectionHeader';

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
  const meetingStrategy = report.meeting_strategy;

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
                Daniel Park
              </h1>
              <div className="flex items-center gap-4 text-base text-gray-600 dark:text-[#C5C7CA] mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>CEO at Pickle AI</span>
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
                  <a
                    key={idx}
                    href={createGoogleSearchUrl(product)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors cursor-pointer"
                  >
                    {product}
                  </a>
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
            <div className="flex items-center justify-center py-8 text-gray-400 dark:text-[#888888]">
              <div className="text-center">
                <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">No company intelligence found</p>
              </div>
            </div>
          )}
        </div>

        {/* Persona Analysis - Recent Activity */}
        <div className="bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3A3A3C] rounded-lg p-6">
          <SectionHeader icon={User} title="Recent Activity" />

          {/* LinkedIn Posts */}
          {personaAnalysis?.recent_activity?.linkedin_posts && personaAnalysis.recent_activity.linkedin_posts.length > 0 ? (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-[#888888] mb-3 uppercase tracking-wide flex items-center gap-2">
                <Linkedin className="w-3.5 h-3.5" />
                LinkedIn Activity
              </h3>
              <div className="space-y-3">
                {personaAnalysis.recent_activity.linkedin_posts.slice(0, 3).map((post, idx) => {
                  // Handle both old string format and new object format
                  const isStringFormat = typeof post === 'string';
                  const summary = isStringFormat ? post : post.summary;
                  const url = isStringFormat ? undefined : post.url;
                  const date = isStringFormat ? `${idx + 2} days ago` : (post.date || `${idx + 2} days ago`);

                  return url ? (
                    // LinkedIn post with URL - show as embedded card
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#3A3A3C] rounded-lg hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm transition-all overflow-hidden"
                    >
                      {/* LinkedIn Header Bar */}
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border-b border-gray-200 dark:border-[#3A3A3C]">
                        <div className="w-5 h-5 rounded bg-[#0A66C2] flex items-center justify-center flex-shrink-0">
                          <Linkedin className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-600 dark:text-[#888888]">LinkedIn Post</span>
                        <span className="text-xs text-gray-400 dark:text-[#666666] ml-auto">{date}</span>
                      </div>

                      {/* Post Content */}
                      <div className="px-4 py-4">
                        <p className="text-sm text-gray-800 dark:text-[#ECECEC] leading-relaxed mb-3">
                          {summary}
                        </p>

                        {/* Link Preview Footer */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-[#888888] group-hover:text-[#0A66C2] dark:group-hover:text-[#0A66C2] transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="group-hover:underline">View on LinkedIn</span>
                        </div>
                      </div>
                    </a>
                  ) : (
                    // Regular post without URL
                    <div key={idx} className="bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#3A3A3C] rounded-lg overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-[#2A2A2A] border-b border-gray-200 dark:border-[#3A3A3C]">
                        <div className="w-5 h-5 rounded bg-[#0A66C2] flex items-center justify-center flex-shrink-0">
                          <Linkedin className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs font-medium text-gray-600 dark:text-[#888888]">LinkedIn Post</span>
                        <span className="text-xs text-gray-400 dark:text-[#666666] ml-auto">{date}</span>
                      </div>
                      <div className="px-4 py-4">
                        <p className="text-sm text-gray-800 dark:text-[#ECECEC] leading-relaxed">{summary}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Topics of Interest */}
          {personaAnalysis?.recent_activity?.topics_of_interest && personaAnalysis.recent_activity.topics_of_interest.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-[#888888] mb-3 uppercase tracking-wide">
                Topics of Interest
              </h3>
              <div className="flex flex-wrap gap-2">
                {personaAnalysis.recent_activity.topics_of_interest.map((topic, idx) => (
                  <div key={idx} className="px-3 py-1.5 bg-gray-100 dark:bg-[#252525] border border-gray-200 dark:border-[#3A3A3C] rounded-md text-sm text-gray-700 dark:text-[#C5C7CA]">
                    {topic}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Personal Insights */}
          {personaAnalysis?.recent_activity?.personal_insights && (
            <div className="p-3 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#3A3A3C] rounded-md">
              <p className="text-sm text-gray-600 dark:text-[#888888] italic">{personaAnalysis.recent_activity.personal_insights}</p>
            </div>
          )}

          {/* Empty State for Recent Activity */}
          {(!personaAnalysis?.recent_activity?.linkedin_posts || personaAnalysis.recent_activity.linkedin_posts.length === 0) &&
           (!personaAnalysis?.recent_activity?.topics_of_interest || personaAnalysis.recent_activity.topics_of_interest.length === 0) &&
           !personaAnalysis?.recent_activity?.personal_insights && (
            <div className="flex items-center justify-center py-8 text-gray-400 dark:text-[#888888]">
              <div className="text-center">
                <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">No recent activity found</p>
              </div>
            </div>
          )}
        </div>

        {/* Meeting Strategy */}
        <div className="bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3A3A3C] rounded-lg p-6">
          <SectionHeader icon={Target} title="Meeting Strategy" />

          {/* Opening Approach */}
          {meetingStrategy?.opening_approach && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#3A3A3C] rounded-md">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-[#888888] mb-2 uppercase tracking-wide">Opening</h3>
              <p className="text-sm text-gray-700 dark:text-[#C5C7CA] leading-relaxed">{meetingStrategy.opening_approach}</p>
            </div>
          )}

          {/* Value Props */}
          {meetingStrategy?.value_propositions && meetingStrategy.value_propositions.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-[#888888] mb-2 uppercase tracking-wide">Key Value Props</h3>
              <div className="space-y-2">
                {meetingStrategy.value_propositions.slice(0, 2).map((prop, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-[#C5C7CA]">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-900 dark:bg-gray-100 mt-2 flex-shrink-0" />
                    <span>{prop}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discovery Questions */}
          {meetingStrategy?.discovery_questions && meetingStrategy.discovery_questions.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-[#888888] mb-2 uppercase tracking-wide">Key Questions</h3>
              <div className="space-y-2">
                {meetingStrategy.discovery_questions.slice(0, 3).map((question, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-[#C5C7CA]">
                    <AlertCircle className="w-4 h-4 text-gray-400 dark:text-[#888888] mt-0.5 flex-shrink-0" />
                    <span>{question}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Potential Challenges */}
          {meetingStrategy?.potential_challenges && meetingStrategy.potential_challenges.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-[#888888] mb-2 uppercase tracking-wide">Likely Challenges</h3>
              <div className="space-y-2">
                {meetingStrategy.potential_challenges.map((challenge, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-[#C5C7CA]">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500 mt-2 flex-shrink-0" />
                    <span>{challenge}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State for Meeting Strategy */}
          {!meetingStrategy?.opening_approach &&
           (!meetingStrategy?.value_propositions || meetingStrategy.value_propositions.length === 0) &&
           (!meetingStrategy?.discovery_questions || meetingStrategy.discovery_questions.length === 0) &&
           (!meetingStrategy?.potential_challenges || meetingStrategy.potential_challenges.length === 0) && (
            <div className="flex items-center justify-center py-8 text-gray-400 dark:text-[#888888]">
              <div className="text-center">
                <AlertCircle className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">No meeting strategy found</p>
              </div>
            </div>
          )}
        </div>

        {/* Recommended Pages */}
        <div className="bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3A3A3C] rounded-lg p-6">
          <SectionHeader icon={ExternalLink} title="Key Resources" />

          <div className="space-y-3">
            {research.recommended_pages?.slice(0, 4).map((page, idx) => (
              <a
                key={idx}
                href={page.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group p-4 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#3A3A3C] rounded-md hover:border-gray-900 dark:hover:border-gray-100 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-md bg-gray-100 dark:bg-[#3A3A3C] flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-3.5 h-3.5 text-gray-600 dark:text-[#C5C7CA]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-[#ECECEC] mb-1 group-hover:underline line-clamp-1">
                      {page.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-[#888888] mb-2 line-clamp-2">{page.why_read}</p>
                    {page.highlights && page.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {page.highlights.slice(0, 2).map((highlight, hIdx) => (
                          <span key={hIdx} className="px-2 py-0.5 bg-gray-100 dark:bg-[#3A3A3C] border border-gray-200 dark:border-[#505050] rounded text-[10px] text-gray-600 dark:text-[#C5C7CA]">
                            {highlight}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Full Brief */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-[#2D2D2D] border border-gray-200 dark:border-[#3A3A3C] rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-[#ECECEC]">
            <FileText className="w-5 h-5 text-gray-500 dark:text-[#888888]" />
            Executive Brief
          </h2>
          <p className="text-gray-700 dark:text-[#C5C7CA] leading-relaxed whitespace-pre-line">
            {report.overview}
          </p>
        </div>
      </div>
    </div>
  );
}
