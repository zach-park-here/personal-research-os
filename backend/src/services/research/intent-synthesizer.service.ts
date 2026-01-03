/**
 * Intent Synthesizer Service
 *
 * Uses O1 to synthesize Perplexity search results (15 URLs + AI analyses) into
 * a single comprehensive answer (500-1000 words) for each research intent.
 */

import type { Intent } from './intent-analyzer.service';
import type { PerplexityResponse } from '../search/web-search.client';
import { LLM_MODELS } from '../../config/llm.config';
import { RESEARCH_LIMITS } from '../../config/research.config';
import { getOpenAIClient } from '../llm/openai-client.factory';

export interface IntentResult {
  intentId: string;
  description: string;
  synthesis: string; // 500-1000 word summary from O1
  urlCount: number;
  queryCount: number;
}

/**
 * Synthesize Perplexity search results for a single intent using O1
 *
 * Takes 3 Perplexity syntheses (~1500 chars each = ~4500 chars total)
 * and produces a comprehensive 1000-word summary
 */
export async function synthesizeIntentWithO1(
  intent: Intent,
  queryResults: PerplexityResponse[]
): Promise<IntentResult> {
  const openai = getOpenAIClient();

  console.log(`[IntentSynthesizer] Synthesizing intent: ${intent.id}`);
  console.log(`[IntentSynthesizer] Query results: ${queryResults.length}`);

  // Calculate total synthesis text length
  const totalSynthesisChars = queryResults.reduce((sum, r) => sum + r.synthesis.length, 0);
  console.log(`[IntentSynthesizer] Total Perplexity synthesis: ${totalSynthesisChars} chars`);

  // Format Perplexity analyses with citations
  const perplexitySyntheses = queryResults
    .map((result, idx) => {
      const query = intent.queries[idx] || `Query ${idx + 1}`;
      return `**Query ${idx + 1}**: "${query}"

**Perplexity AI Analysis** (${result.synthesis.length} chars):
${result.synthesis}

**Citations** (${result.citations.length} URLs):
${result.citations.map((url, i) => `[${i + 1}] ${url}`).join('\n')}`;
    })
    .join('\n\n---\n\n');

  // Collect all unique URLs
  const allCitations = [...new Set(queryResults.flatMap(r => r.citations))];

  const userPrompt = `You are a research analyst synthesizing web search results for B2B meeting preparation.

**Research Intent**: "${intent.description}"
**Original Question**: "${intent.original_question}"

I have ${queryResults.length} Perplexity search results (~${totalSynthesisChars} characters of AI-synthesized analysis).

---

## PERPLEXITY AI ANALYSES

These are AI-synthesized analyses from Perplexity based on web searches. Each analysis is already a comprehensive summary of multiple web sources.

${perplexitySyntheses}

---

## YOUR TASK

Synthesize the ${queryResults.length} Perplexity analyses above into a single, comprehensive answer (~1000 words) that directly answers the research intent.

**Requirements:**
1. Combine insights from all ${queryResults.length} analyses
2. Remove redundant information - if multiple analyses mention the same fact, mention it once
3. Preserve specific details, numbers, dates, and quotes when available
4. Be objective - no speculation beyond what sources say
5. Focus on factual, verifiable information
6. Structure the answer with clear sections if needed
7. If analyses conflict, mention both perspectives
8. If information is limited, be transparent about it

**Output Format:**
Write a well-structured synthesis in markdown format. Use headings (##, ###) to organize information clearly.
Target length: ~1000 words (approximately 5000-7000 characters).`;

  try {
    const response = await openai.chat.completions.create({
      model: LLM_MODELS.REASONING,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const synthesis = response.choices[0].message.content || '';

    console.log(`[IntentSynthesizer] O1 synthesis: ${synthesis.length} chars (~${Math.round(synthesis.length / 6)} words)`);
    console.log(`[IntentSynthesizer] Preview (first ${RESEARCH_LIMITS.LOG_PREVIEW_LENGTH} chars):`, synthesis.slice(0, RESEARCH_LIMITS.LOG_PREVIEW_LENGTH));

    return {
      intentId: intent.id,
      description: intent.description,
      synthesis,
      urlCount: allCitations.length,
      queryCount: queryResults.length,
    };

  } catch (error: any) {
    console.error(`[IntentSynthesizer] Failed to synthesize intent ${intent.id}:`, error);
    throw new Error(`Intent synthesis failed: ${error.message}`);
  }
}

