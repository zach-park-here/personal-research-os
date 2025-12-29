import { ResearchResult } from '../types';

/**
 * Mock research result for demo
 * Based on the example task: "Research use cases of AI agents in content marketing..."
 */
export const MOCK_RESEARCH_RESULT: ResearchResult = {
  task_id: 'mock',
  intent: 'general_summary',
  report: {
    overview:
      'AI agents are transforming content marketing through automation, personalization, and data-driven insights. Key use cases include automated content generation, SEO optimization, social media management, and customer engagement. The technology enables marketers to scale content production while maintaining quality and relevance.',
    key_findings: [
      'AI content generators can produce blog posts, social media copy, and email campaigns 10x faster than manual writing',
      'Personalization engines using AI improve email open rates by 26% and click-through rates by 14%',
      'AI-powered SEO tools identify high-value keywords and optimize content structure for better rankings',
      'Chatbots and conversational AI handle 80% of routine customer queries, freeing teams for strategic work',
      'Predictive analytics help identify trending topics before they peak, enabling proactive content creation',
    ],
    risks_or_unknowns: [
      'Content authenticity and brand voice consistency require human oversight',
      'AI-generated content may lack emotional depth and cultural nuance',
      'Dependence on AI tools could reduce team creativity and strategic thinking',
    ],
    recommendations: [
      'Start with AI-assisted writing rather than fully automated content',
      'Implement human review workflow for all AI-generated content',
      'Use AI for data analysis and ideation, keep creative decisions human-led',
      'Test AI tools on low-risk content channels before scaling',
    ],
  },
  recommended_pages: [
    {
      title: 'How to Use AI Agents for Content Marketing in 2025',
      url: 'https://www.hubspot.com/ai-content-marketing',
      why_read: 'Comprehensive guide from HubSpot on practical AI implementation strategies',
      highlights: [
        'Step-by-step framework for integrating AI into existing workflows',
        'Case studies from 20+ companies showing ROI metrics',
      ],
    },
    {
      title: 'AI Content Marketing: Complete Strategy Guide',
      url: 'https://www.semrush.com/blog/ai-content-marketing/',
      why_read: 'SEMrush data-driven analysis of AI marketing tools and effectiveness',
      highlights: [
        'Comparison of top 10 AI content tools with pricing and features',
        'Best practices for maintaining brand voice with AI assistance',
      ],
    },
    {
      title: 'The State of AI in Marketing 2025 Report',
      url: 'https://www.salesforce.com/resources/articles/ai-marketing/',
      why_read: 'Industry benchmark data on AI adoption and performance metrics',
      highlights: [
        '67% of marketing teams now use AI for content creation',
        'Average time savings of 5 hours per week per marketer',
      ],
    },
  ],
};
