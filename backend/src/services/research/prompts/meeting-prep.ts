/**
 * Meeting Prep Prompt Template
 *
 * Specialized prompt for B2B meeting research
 */

import type { UserProfile } from '@personal-research-os/shared/types';
import type { MeetingContext } from '../classifier.service';

export function buildMeetingPrepPrompt(
  meetingContext: MeetingContext,
  userProfile: UserProfile | null,
  searchResults: string
): string {
  // Build user context
  const myCompany = userProfile?.company || '[Your company]';
  const myProduct = userProfile?.companyDescription || '[Your product description]';
  const myRole = userProfile?.jobTitle || 'Sales professional';

  // Build prospect context
  const prospectName = meetingContext.prospectName || '[Prospect name]';
  const prospectTitle = meetingContext.prospectTitle || '[Title unknown]';
  const prospectCompany = meetingContext.prospectCompany || '[Company unknown]';
  const prospectEmail = meetingContext.prospectEmail || '[Email unknown]';

  return `You are my B2B meeting research agent.

I will provide limited information about a person I will meet soon, and search results from the web.

**MY CONTEXT:**
- My Role: ${myRole}
- My Company: ${myCompany}
- My Product: ${myProduct}

**PROSPECT INFORMATION:**
- Name: ${prospectName}
- Title: ${prospectTitle}
- Company: ${prospectCompany}
- Email: ${prospectEmail}

**SEARCH RESULTS:**
${searchResults}

---

Your job is to build a complete brief that prepares me for this meeting using ONLY the search results provided above.

Generate a JSON report with this EXACT structure:
{
  "report": {
    "overview": "2-3 paragraph executive summary: (1) who this person is, (2) what their company does, (3) why this meeting matters",

    "industry_trends": {
      "summary": "How has the prospect's industry changed recently? What are the major shifts?",
      "key_changes": [
        "Specific industry change 1 (based on search results)",
        "Specific industry change 2"
      ],
      "implications_for_meeting": "What these trends mean for our conversation and product fit"
    },

    "company_intelligence": {
      "recent_news": [
        "Recent announcement, product launch, or news (with date if available)"
      ],
      "product_launches": [
        "New products or features they've released"
      ],
      "strategic_direction": "Based on CEO messages, annual reports, or public statements - where is the company headed?",
      "growth_signals": "Are they hiring, expanding, raising funding, or showing other buying signals?"
    },

    "persona_analysis": {
      "persona_name": "${prospectName}",
      "persona_title": "${prospectTitle}",
      "persona_company": "${prospectCompany}",
      "role_description": "What does a ${prospectTitle} actually do day-to-day?",
      "key_responsibilities": [
        "Primary responsibility 1",
        "Primary responsibility 2"
      ],
      "kpis_and_metrics": [
        "Metric or KPI this role cares about (e.g., 'Pipeline conversion rate', 'Customer retention')"
      ],
      "decision_authority": "decision_maker | influencer | end_user (infer from title - VP/C-level = decision_maker, Director/Senior = influencer, Manager/IC = end_user)",
      "recent_activity": {
        "linkedin_posts": [
          {
            "summary": "Brief summary of the post content (1-2 sentences)",
            "url": "Full LinkedIn post URL (if available in search results)",
            "date": "Post date or relative time (e.g., '2 days ago', 'Dec 15, 2024')",
            "verification": "CRITICAL: Only include if you can verify this post is by ${prospectName} at ${prospectCompany} with title ${prospectTitle}. If uncertain, omit this post."
          }
        ],
        "topics_of_interest": [
          "Topic/theme they've been posting about (reveals priorities)"
        ],
        "personal_insights": "What their recent activity reveals about their current focus, challenges, or interests"
      },
      "likely_pain_points": [
        "Pain point 1 based on their role, company stage, and industry challenges",
        "Pain point 2"
      ]
    },

    "meeting_strategy": {
      "opening_approach": "Specific, neutral recommendation for opening the conversation. Reference factual recent news or their role responsibilities. DO NOT use flattery or generic praise.",
      "discovery_questions": [
        "Open-ended question 1 to understand their current situation and challenges",
        "Question 2 to uncover specific pain points or blockers they're facing",
        "Question 3 to understand their priorities and decision criteria"
      ],
      "value_propositions": [
        "Factual statement of how ${myProduct} addresses common challenges for this role/industry (no exaggeration)",
        "Specific capability that may be relevant to their situation"
      ],
      "potential_objections": [
        "Likely objection 1 based on their company stage, industry, or role + factual response",
        "Likely objection 2 + how to address it professionally"
      ],
      "potential_challenges": [
        "Challenge or concern they likely face in their role (e.g., 'Managing rapid scaling with limited resources', 'Balancing innovation with security compliance')",
        "Another realistic challenge based on their company situation"
      ],
      "closing_strategy": "Professional next step to propose (demo, pilot, technical review, etc.) - no pressure tactics"
    }
  },

  "recommended_pages": [
    {
      "title": "Page title from search results",
      "url": "actual URL from search results",
      "why_read": "Why this source is valuable for meeting prep",
      "highlights": ["Key point 1", "Key point 2", "Key point 3"]
    }
  ]
}

**CRITICAL REQUIREMENTS:**
1. Base ALL findings on the search results provided - do NOT invent information
2. If search results are limited or a section has no data, use "No information found in search results" or similar
3. For decision_authority: Infer from job title (${prospectTitle}):
   - C-level (CEO, CTO, CFO, etc.) or VP = "decision_maker"
   - Director, Senior Director, Head of = "influencer"
   - Manager, Lead, Specialist, Analyst = "end_user"
4. **LINKEDIN POST DETECTION AND VERIFICATION (CRITICAL)**:
   a. **Search for LinkedIn posts**: Look for LinkedIn activity URLs in search results (urls containing "linkedin.com/posts/" or "linkedin.com/feed/update/")
   b. **Strict identity verification**: ONLY include posts if you can confirm ALL THREE:
      - Author name matches: ${prospectName}
      - Author company matches: ${prospectCompany}
      - Author title matches or is similar to: ${prospectTitle}
   c. **URL extraction**: If LinkedIn post URLs are found in search results, include the FULL URL in the "url" field
   d. **Summarize content**: Provide a 1-2 sentence objective summary of what the post discusses (NO opinions, just facts)
   e. **Date extraction**: Include post date or relative time if available (e.g., "2 days ago", "Dec 15, 2024")
   f. **If uncertain about identity**: DO NOT include the post. Set linkedin_posts to empty array []
   g. **If no LinkedIn activity found**: Set linkedin_posts to empty array []

5. Use recent_activity insights in meeting_strategy.opening_approach - reference their posts to build rapport
6. Select 3-5 most valuable pages for recommended_pages from search results

**TONE AND STYLE REQUIREMENTS:**
- BE OBJECTIVE: State facts only. No flattery, no hype, no generic praise.
- BE REALISTIC: Focus on challenges, problems, and obstacles they likely face. Don't assume perfect fit.
- BE SPECIFIC: Use concrete examples from search results. Avoid vague statements like "perfect opportunity" or "great fit".
- For meeting_strategy:
  - opening_approach: Reference factual news or role context. NO flattery like "congratulations" unless directly relevant.
  - discovery_questions: Ask genuinely open questions to understand their situation, not leading questions.
  - value_propositions: State capabilities factually without exaggeration. Focus on what ${myProduct} does, not why it's "perfect".
  - potential_challenges: This is CRITICAL - identify realistic obstacles, concerns, or problems they face based on their role and company situation.
- For likely_pain_points: Base on role realities and industry challenges, not what ${myProduct} happens to solve.

Return ONLY valid JSON with no additional text.`;
}
