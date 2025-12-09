/**
 * Pattern Suggestion System Prompt
 * 
 * PURPOSE: Generate exactly 5 pattern name suggestions as strict JSON.
 * This prompt is ISOLATED from all other context - do not combine with
 * other prompts or instructions.
 * 
 * OUTPUT SCHEMA:
 * {
 *   "patterns": ["pattern_name_1", "pattern_name_2", "pattern_name_3", "pattern_name_4", "pattern_name_5"]
 * }
 */

export const PATTERN_SUGGESTION_CATEGORIES = {
  summarize: ['summarize', 'create_summary', 'create_5_sentence_summary', 'create_micro_summary', 'summarize_micro', 'summarize_paper', 'summarize_lecture', 'youtube_summary'],
  extract: ['extract_wisdom', 'extract_ideas', 'extract_insights', 'extract_main_idea', 'extract_article_wisdom', 'extract_book_ideas', 'extract_recommendations', 'extract_questions'],
  analyze: ['analyze_claims', 'analyze_paper', 'analyze_presentation', 'analyze_debate', 'analyze_prose', 'analyze_personality', 'analyze_risk', 'analyze_tech_impact'],
  create: ['create_pattern', 'create_prd', 'create_design_document', 'create_user_story', 'create_keynote', 'create_mermaid_visualization', 'create_academic_paper'],
  code: ['explain_code', 'review_code', 'create_coding_project', 'create_coding_feature', 'summarize_git_diff', 'write_pull-request', 'generate_code_rules'],
  security: ['analyze_threat_report', 'create_stride_threat_model', 'analyze_malware', 'create_security_update', 'analyze_incident'],
  writing: ['improve_writing', 'write_essay', 'fix_typos', 'humanize', 'clean_text', 'convert_to_markdown', 'improve_academic_writing'],
  learning: ['explain_terms', 'explain_docs', 'create_flash_cards', 'create_reading_plan', 'to_flashcards', 'dialog_with_socrates'],
} as const;

/**
 * The system prompt for pattern suggestion.
 * This is a strict JSON-only prompt that MUST be used in isolation.
 * 
 * CRITICAL: The user input is passed to this prompt as a QUERY_STRING parameter,
 * NOT as a conversational request. The prompt explicitly marks this to prevent
 * the LLM from treating it as a help request.
 * 
 * @param availablePatterns - Array of valid pattern names from the system
 * @returns The complete system prompt string
 */
export function createPatternSuggestionPrompt(availablePatterns: string[]): string {
  const patternList = availablePatterns.slice(0, 150).join(', '); // Limit to prevent token overflow

  return `You are a JSON-only API endpoint. You do NOT have conversational abilities. You cannot greet, explain, or help. You can ONLY output valid JSON.

FUNCTION: pattern_matcher
INPUT: A query string describing what the user wants to do
OUTPUT: Exactly one JSON object

AVAILABLE_PATTERNS = [${patternList}]

RESPONSE FORMAT (you MUST output ONLY this, nothing else):
{"patterns":["name1","name2","name3","name4","name5"]}

RULES:
- Output ONLY the JSON object, no other text
- Select 5 patterns from AVAILABLE_PATTERNS that match the query intent
- If the query mentions "summarize" → include summarize-related patterns
- If the query mentions "code" or "review" → include code-related patterns
- If the query mentions "security" → include security-related patterns
- Pattern names must EXACTLY match entries in AVAILABLE_PATTERNS
- NO greetings, NO explanations, NO markdown, NO formatting
- First character must be "{", last character must be "}"

QUERY_STRING: `;
}

/**
 * Creates the full message to send to the LLM.
 * This wraps the user input in a clear data format.
 * 
 * @param userInput - What the user typed
 * @param availablePatterns - Array of valid pattern names
 * @returns Tuple of [systemPrompt, formattedUserInput]
 */
export function createPatternSuggestionMessages(
  userInput: string,
  availablePatterns: string[]
): { systemPrompt: string; userMessage: string } {
  const systemPrompt = createPatternSuggestionPrompt(availablePatterns);
  // End the user message with a clear instruction to output JSON
  const userMessage = `"${userInput}"

OUTPUT JSON NOW:`;
  
  return { systemPrompt, userMessage };
}

/**
 * Validates and parses the LLM response.
 * 
 * @param response - Raw LLM response string
 * @param validPatterns - Array of valid pattern names
 * @returns Array of valid pattern names or empty array on failure
 */
export function parsePatternSuggestionResponse(
  response: string,
  validPatterns: string[]
): string[] {
  try {
    // Strip any accidental markdown or whitespace
    const cleaned = response
      .replace(/^```json?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);

    // Handle error responses
    if (parsed.error) {
      console.warn('Pattern suggestion returned error:', parsed.error);
      return parsed.patterns?.filter((p: string) => validPatterns.includes(p)) || [];
    }

    // Validate patterns array
    if (!parsed.patterns || !Array.isArray(parsed.patterns)) {
      console.warn('Invalid response structure:', parsed);
      return [];
    }

    // Filter to only valid patterns and limit to 5
    const validated = parsed.patterns
      .filter((p: unknown): p is string => typeof p === 'string' && validPatterns.includes(p))
      .slice(0, 5);

    return validated;
  } catch (e) {
    console.error('Failed to parse pattern suggestion response:', e);
    return [];
  }
}

/**
 * Response schema for pattern suggestions.
 */
export interface PatternSuggestionResponse {
  patterns: string[];
  error?: string;
}
