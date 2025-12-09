/**
 * Pattern Suggestion Prompt - Test Suite & RCA Documentation
 * 
 * This file tests the pattern suggestion flow:
 * User Input → Wand Click → System Prompt → LLM API → Parse Response → Display
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  createPatternSuggestionPrompt, 
  parsePatternSuggestionResponse,
  type PatternSuggestionResponse 
} from './pattern-suggestion-prompt';

// =============================================================================
// MOCK DATA - Simulates real patterns from the system
// =============================================================================

const MOCK_AVAILABLE_PATTERNS = [
  'summarize',
  'create_summary',
  'extract_wisdom',
  'extract_main_idea',
  'extract_article_wisdom',
  'create_5_sentence_summary',
  'analyze_claims',
  'analyze_paper',
  'analyze_threat_report',
  'analyze_risk',
  'analyze_incident',
  'create_stride_threat_model',
  'review_code',
  'explain_code',
  'improve_writing',
  'humanize',
  'create_pattern',
  'extract_ideas',
  'create_prd',
  'generate_code_rules',
];

// =============================================================================
// MOCK USER INPUTS - What users type before clicking the wand
// =============================================================================

const MOCK_USER_INPUTS = {
  summarization: "I need to summarize this long article about AI safety",
  security: "analyze the security vulnerabilities in my API",
  coding: "help me understand and improve this Python code",
  vague: "do something with this",
  empty: "",
};

// =============================================================================
// TEST: SYSTEM PROMPT GENERATION
// =============================================================================

describe('Pattern Suggestion System Prompt', () => {
  
  describe('createPatternSuggestionPrompt()', () => {
    
    it('should generate a prompt with available patterns', () => {
      const prompt = createPatternSuggestionPrompt(MOCK_AVAILABLE_PATTERNS);
      
      console.log('\n========== SYSTEM PROMPT (What goes to LLM) ==========\n');
      console.log(prompt);
      console.log('\n======================================================\n');
      
      // Verify structure
      expect(prompt).toContain('AVAILABLE PATTERNS:');
      expect(prompt).toContain('summarize');
      expect(prompt).toContain('{"patterns":');
      expect(prompt).toContain('BEGIN. Output JSON only.');
    });

    it('should limit patterns to prevent token overflow', () => {
      const manyPatterns = Array.from({ length: 300 }, (_, i) => `pattern_${i}`);
      const prompt = createPatternSuggestionPrompt(manyPatterns);
      
      // Should only include first 200
      expect(prompt).toContain('pattern_0');
      expect(prompt).toContain('pattern_199');
      expect(prompt).not.toContain('pattern_200');
    });

    it('should include strict JSON schema requirements', () => {
      const prompt = createPatternSuggestionPrompt(MOCK_AVAILABLE_PATTERNS);
      
      expect(prompt).toContain('NO markdown');
      expect(prompt).toContain('NO code fences');
      expect(prompt).toContain('NO explanations');
      expect(prompt).toContain('exactly 5 patterns');
    });
  });
});

// =============================================================================
// TEST: LLM RESPONSE PARSING
// =============================================================================

describe('Pattern Suggestion Response Parsing', () => {

  describe('parsePatternSuggestionResponse() - SUCCESS CASES', () => {
    
    it('should parse valid JSON response', () => {
      // MOCK LLM OUTPUT - Ideal response
      const llmResponse = '{"patterns":["summarize","create_summary","extract_main_idea","extract_wisdom","analyze_paper"]}';
      
      console.log('\n========== MOCK LLM OUTPUT (Ideal) ==========\n');
      console.log(llmResponse);
      console.log('\n==============================================\n');
      
      const result = parsePatternSuggestionResponse(llmResponse, MOCK_AVAILABLE_PATTERNS);
      
      expect(result).toEqual([
        'summarize',
        'create_summary', 
        'extract_main_idea',
        'extract_wisdom',
        'analyze_paper'
      ]);
    });

    it('should handle JSON with markdown code fence (common LLM mistake)', () => {
      // MOCK LLM OUTPUT - With code fence
      const llmResponse = '```json\n{"patterns":["summarize","create_summary","extract_main_idea","extract_wisdom","analyze_paper"]}\n```';
      
      console.log('\n========== MOCK LLM OUTPUT (With Code Fence) ==========\n');
      console.log(llmResponse);
      console.log('\n=======================================================\n');
      
      const result = parsePatternSuggestionResponse(llmResponse, MOCK_AVAILABLE_PATTERNS);
      
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('summarize');
    });

    it('should filter out invalid pattern names', () => {
      // MOCK LLM OUTPUT - Contains invalid patterns
      const llmResponse = '{"patterns":["summarize","fake_pattern","extract_wisdom","nonexistent","analyze_paper"]}';
      
      const result = parsePatternSuggestionResponse(llmResponse, MOCK_AVAILABLE_PATTERNS);
      
      // Should only include valid patterns
      expect(result).toEqual(['summarize', 'extract_wisdom', 'analyze_paper']);
      expect(result).not.toContain('fake_pattern');
      expect(result).not.toContain('nonexistent');
    });
  });

  describe('parsePatternSuggestionResponse() - FAILURE CASES', () => {
    
    it('should return empty array for narrative/prose response', () => {
      // MOCK LLM OUTPUT - BAD: Narrative response (the original problem)
      const llmResponse = `
Based on your request to summarize an article about AI safety, I would recommend the following patterns:

1. **summarize** - This pattern will help you create a concise summary of the article.
2. **extract_wisdom** - Use this to extract key insights and wisdom from the content.
3. **analyze_claims** - This will help you evaluate the claims made in the article.

These patterns work well together for article analysis. Let me know if you need more help!
      `.trim();
      
      console.log('\n========== MOCK LLM OUTPUT (BAD - Narrative) ==========\n');
      console.log(llmResponse);
      console.log('\n=======================================================\n');
      
      const result = parsePatternSuggestionResponse(llmResponse, MOCK_AVAILABLE_PATTERNS);
      
      // Should fail to parse - returns empty
      expect(result).toEqual([]);
    });

    it('should return empty array for completely invalid JSON', () => {
      const llmResponse = 'this is not json at all';
      const result = parsePatternSuggestionResponse(llmResponse, MOCK_AVAILABLE_PATTERNS);
      expect(result).toEqual([]);
    });

    it('should handle error response from LLM', () => {
      const llmResponse = '{"error":"insufficient_matches","patterns":["summarize","extract_wisdom"]}';
      const result = parsePatternSuggestionResponse(llmResponse, MOCK_AVAILABLE_PATTERNS);
      
      // Should still return valid patterns from error response
      expect(result).toEqual(['summarize', 'extract_wisdom']);
    });
  });
});

// =============================================================================
// END-TO-END FLOW SIMULATION
// =============================================================================

describe('End-to-End Flow Simulation', () => {

  it('should simulate complete wand-click flow', () => {
    const userInput = MOCK_USER_INPUTS.summarization;
    
    // STEP 1: Generate system prompt
    const systemPrompt = createPatternSuggestionPrompt(MOCK_AVAILABLE_PATTERNS);
    
    console.log('\n==================== E2E FLOW TEST ====================\n');
    console.log('📝 USER INPUT:', userInput);
    console.log('\n📤 SYSTEM PROMPT SENT TO LLM:');
    console.log('   Length:', systemPrompt.length, 'characters');
    console.log('   First 200 chars:', systemPrompt.substring(0, 200) + '...');
    
    // STEP 2: Mock the LLM response (this is what the API returns)
    const mockLlmResponse = '{"patterns":["summarize","create_summary","extract_main_idea","extract_article_wisdom","extract_wisdom"]}';
    
    console.log('\n📥 LLM RESPONSE:');
    console.log('  ', mockLlmResponse);
    
    // STEP 3: Parse the response
    const suggestions = parsePatternSuggestionResponse(mockLlmResponse, MOCK_AVAILABLE_PATTERNS);
    
    console.log('\n✅ PARSED SUGGESTIONS:', suggestions);
    console.log('\n========================================================\n');
    
    expect(suggestions).toHaveLength(5);
    expect(suggestions[0]).toBe('summarize');
  });
});

// =============================================================================
// RCA (ROOT CAUSE ANALYSIS) DOCUMENTATION
// =============================================================================

/**
 * # ROOT CAUSE ANALYSIS - Pattern Suggestion Failures
 * 
 * ## PROBLEM 1: LLM returns narrative text instead of JSON
 * 
 * ### Symptoms:
 * - parsePatternSuggestionResponse() returns empty array
 * - Console shows "Failed to parse pattern suggestion response"
 * - UI shows no suggestions
 * 
 * ### Root Causes:
 * 1. System prompt is too verbose/permissive
 * 2. LLM is combining with other conversation context
 * 3. Model temperature is too high
 * 4. Wrong model being used (e.g., creative model vs deterministic)
 * 
 * ### Fixes:
 * 1. ✅ Use isolated prompt (createPatternSuggestionPrompt)
 * 2. ✅ Use "function" framing: "You are a pattern matching function"
 * 3. ⚠️ Set temperature to 0 in API call for deterministic output
 * 4. ⚠️ Add response_format: { type: "json_object" } if using OpenAI
 * 
 * ---
 * 
 * ## PROBLEM 2: LLM returns invalid pattern names
 * 
 * ### Symptoms:
 * - Suggestions array contains names not in the pattern list
 * - parsePatternSuggestionResponse() filters them out
 * - Fewer than 5 suggestions shown
 * 
 * ### Root Causes:
 * 1. Pattern list in prompt is truncated
 * 2. LLM is hallucinating pattern names
 * 3. Case sensitivity issues
 * 
 * ### Fixes:
 * 1. ✅ Validation in parsePatternSuggestionResponse() filters invalid
 * 2. ⚠️ Ensure full pattern list is passed to createPatternSuggestionPrompt()
 * 3. ⚠️ Consider case-insensitive matching if needed
 * 
 * ---
 * 
 * ## PROBLEM 3: LLM wraps JSON in markdown code fence
 * 
 * ### Symptoms:
 * - Response is: ```json\n{...}\n```
 * - JSON.parse fails on first attempt
 * 
 * ### Root Causes:
 * 1. LLM default behavior to format code
 * 2. System prompt not explicit enough about raw JSON
 * 
 * ### Fixes:
 * 1. ✅ parsePatternSuggestionResponse() strips code fences
 * 2. ✅ System prompt explicitly says "NO code fences"
 * 
 * ---
 * 
 * ## PROBLEM 4: High token usage / slow response
 * 
 * ### Symptoms:
 * - API calls take > 2 seconds
 * - Token usage reports show high input tokens
 * 
 * ### Root Causes:
 * 1. ❌ OLD: Using 131-line suggest_pattern/system.md (14KB)
 * 2. Full pattern list is too long
 * 
 * ### Fixes:
 * 1. ✅ NEW: Using ~1.5KB isolated prompt
 * 2. ✅ Pattern list limited to 200 items
 */

describe('RCA Documentation', () => {
  it('should document RCA in test output', () => {
    console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                   ROOT CAUSE ANALYSIS GUIDE                       ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  FAILURE MODE 1: Narrative response instead of JSON               ║
║  ─────────────────────────────────────────────────────            ║
║  Symptom:  Empty suggestions array                                ║
║  RCA:      System prompt too permissive / context bleed           ║
║  Fix:      Use isolated prompt, set temperature=0                 ║
║                                                                   ║
║  FAILURE MODE 2: Invalid pattern names                            ║
║  ─────────────────────────────────────────────────────            ║
║  Symptom:  Fewer than 5 suggestions shown                         ║
║  RCA:      LLM hallucinating names                                ║
║  Fix:      Validation filters them out (already implemented)      ║
║                                                                   ║
║  FAILURE MODE 3: JSON wrapped in code fence                       ║
║  ─────────────────────────────────────────────────────            ║
║  Symptom:  JSON.parse fails initially                             ║
║  RCA:      LLM formatting habit                                   ║
║  Fix:      Strip code fences (already implemented)                ║
║                                                                   ║
║  FAILURE MODE 4: Slow / expensive API calls                       ║
║  ─────────────────────────────────────────────────────            ║
║  Symptom:  High token count, slow response                        ║
║  RCA:      Using verbose 131-line pattern prompt                  ║
║  Fix:      Use new ~50 line isolated prompt                       ║
║                                                                   ║
╚══════════════════════════════════════════════════════════════════╝
    `);
    expect(true).toBe(true);
  });
});

// =============================================================================
// EXPORT: For manual testing in browser console
// =============================================================================

export const testUtils = {
  MOCK_AVAILABLE_PATTERNS,
  MOCK_USER_INPUTS,
  
  /**
   * Call this from browser console to test the prompt:
   * 
   * import { testUtils } from '$lib/prompts/pattern-suggestion-prompt.test';
   * testUtils.showFullPrompt();
   */
  showFullPrompt: () => {
    const prompt = createPatternSuggestionPrompt(MOCK_AVAILABLE_PATTERNS);
    console.log('\n========== FULL SYSTEM PROMPT ==========\n');
    console.log(prompt);
    console.log('\n=========================================\n');
    return prompt;
  },
  
  /**
   * Test response parsing:
   * 
   * testUtils.testParse('{"patterns":["summarize","extract_wisdom"]}');
   */
  testParse: (response: string) => {
    const result = parsePatternSuggestionResponse(response, MOCK_AVAILABLE_PATTERNS);
    console.log('Parsed result:', result);
    return result;
  },
};
