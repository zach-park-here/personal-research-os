/**
 * Intent Analyzer Service
 *
 * Uses O1 to analyze user research intent and generate longtail search queries.
 * This is the first step in the multi-turn progressive research architecture.
 */

import OpenAI from 'openai';

export interface Intent {
  id: string;
  description: string;
  original_question: string;
  queries: string[]; // 3 longtail queries per intent
}

export interface IntentAnalysis {
  company: string;
  domain: string;
  intents: Intent[];
}

/**
 * Analyze user intent and generate longtail search queries using O1
 */
export async function analyzeIntentWithO1(params: {
  companyName: string;
  companyDomain: string;
  userResearchPrompt: string;
  meetingDate: string;
}): Promise<IntentAnalysis> {
  const { companyName, companyDomain, userResearchPrompt, meetingDate } = params;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log('[IntentAnalyzer] Analyzing intent with O1...');
  console.log(`[IntentAnalyzer] Company: ${companyName} (${companyDomain})`);
  console.log(`[IntentAnalyzer] Meeting Date: ${meetingDate}`);

  const systemPrompt = `You are a Long-Tail Web Search Query Generator for B2B meeting preparation research.

Your job is to:
1. Analyze the user's research needs
2. Break down multi-part questions into separate research intents
3. For each intent, generate 3 specific, longtail search queries

**QUERY GENERATION RULES:**
- Always include the company name in queries (e.g., "Pickle AI digital clones products")
- Use specific, detailed search terms (not generic questions)
- Include relevant industry terms and keywords
- Use site: operator when searching company websites (e.g., "site:pickle.com products")
- Focus on recent information (last 3-6 months)
- Each query should approach the intent from a different angle

**OUTPUT FORMAT:**
Return a JSON object with this exact structure:
{
  "company": "Company Name",
  "domain": "company-domain.com",
  "intents": [
    {
      "id": "intent_id_snake_case",
      "description": "Clear description of what we're researching",
      "original_question": "The original question from user prompt",
      "queries": [
        "Longtail search query 1 with company name",
        "Longtail search query 2 with specific keywords",
        "Longtail search query 3 using different angle"
      ]
    }
  ]
}

**EXAMPLE:**
User prompt: "Research Pickle AI for meeting preparation:
1. What does this company do?
2. Recent product launches
3. CEO strategic direction"

Your response:
{
  "company": "Pickle AI",
  "domain": "pickle.com",
  "intents": [
    {
      "id": "company_overview",
      "description": "Understand the company's core products and business model",
      "original_question": "What does this company do?",
      "queries": [
        "Pickle AI digital clones memory-based OS products",
        "site:pickle.com what we do AI avatars platform",
        "Pickle AI business model SaaS B2B AI agents"
      ]
    },
    {
      "id": "recent_products",
      "description": "Recent product launches or announcements",
      "original_question": "Recent product launches",
      "queries": [
        "Pickle AI product launch 2025 2026 new features",
        "site:pickle.com news announcements December January",
        "Pickle AI press release new product December 2025"
      ]
    },
    {
      "id": "ceo_strategic_direction",
      "description": "CEO messages and strategic direction",
      "original_question": "CEO strategic direction",
      "queries": [
        "Pickle AI CEO vision 2026 strategy",
        "site:pickle.com CEO message annual report",
        "Pickle AI founder interview future plans 2026"
      ]
    }
  ]
}`;

  const userPrompt = `Company: ${companyName}
Domain: ${companyDomain}
Meeting Date: ${meetingDate}

Research Prompt:
${userResearchPrompt}

Generate research intents and longtail search queries for this meeting preparation research.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'o1',
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\n---\n\n${userPrompt}`,
        },
      ],
    });

    const content = response.choices[0].message.content || '';

    console.log('[IntentAnalyzer] O1 Response (first 500 chars):', content.slice(0, 500));

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('O1 did not return valid JSON');
    }

    const intentAnalysis: IntentAnalysis = JSON.parse(jsonMatch[0]);

    console.log(`[IntentAnalyzer] Generated ${intentAnalysis.intents.length} intents`);
    intentAnalysis.intents.forEach((intent, idx) => {
      console.log(`[IntentAnalyzer] Intent ${idx + 1}: ${intent.id} - ${intent.description}`);
      console.log(`[IntentAnalyzer]   Queries: ${intent.queries.length}`);
    });

    return intentAnalysis;

  } catch (error: any) {
    console.error('[IntentAnalyzer] Failed to analyze intent:', error);
    throw new Error(`Intent analysis failed: ${error.message}`);
  }
}
