<script lang="ts">
  import { onMount } from 'svelte';
  import { Select } from "$lib/components/ui/select";
  import { patterns, patternAPI, systemPrompt, selectedPatternName } from "$lib/store/pattern-store";
  import { userInput } from "$lib/store/user-input-store";
  import { Button } from "$lib/components/ui/button";
  import { Wand2, X, Loader2 } from 'lucide-svelte';
  import { ChatService } from '$lib/services/ChatService';
  import { get } from 'svelte/store';
  import { createPatternSuggestionMessages, parsePatternSuggestionResponse } from '$lib/prompts/pattern-suggestion-prompt';

  let selectedPreset = $selectedPatternName || "";
  let isSuggesting = false;
  let suggestedPatternNames: string[] = [];
  const chatService = new ChatService();

  // Subscribe to selectedPatternName changes
  selectedPatternName.subscribe(value => {
    if (value && value !== selectedPreset) {
      console.log('Pattern selected from modal:', value);
      selectedPreset = value;
    }
  });

  // Watch selectedPreset changes
  // Always call selectPattern when the dropdown value changes.
  // The patternAPI.selectPattern function handles empty strings correctly.
  $: {
    // Log the change regardless of the value
    console.log('Dropdown selection changed to:', selectedPreset);
    try {
      // Call the function to select the pattern (or reset if selectedPreset is empty)
      patternAPI.selectPattern(selectedPreset);

      // Optional: Keep verification logs if helpful for debugging
      const currentSystemPrompt = get(systemPrompt);
      const currentPattern = get(selectedPatternName);
      console.log('After dropdown selection - Pattern:', currentPattern);
      console.log('After dropdown selection - System Prompt length:', currentSystemPrompt?.length);

      // Optional: Refine verification logic if needed
      // For example, only log error if a pattern was expected but not set
      // if (selectedPreset && (!currentPattern || !currentSystemPrompt)) {
      //   console.error('Pattern selection verification failed:');
      //   console.error('- Selected Pattern:', currentPattern);
      //   console.error('- System Prompt:', currentSystemPrompt);
      // }
    } catch (error) {
      // Log any errors during the pattern selection process
      console.error('Error processing pattern selection:', error);
    }
  }

  $: suggestions = suggestedPatternNames.length > 0 
    ? $patterns.filter(p => suggestedPatternNames.includes(p.Name))
    : [];

  $: otherPatterns = suggestedPatternNames.length > 0
    ? $patterns.filter(p => !suggestedPatternNames.includes(p.Name))
    : $patterns;

  async function suggestPatterns() {
    if (!$userInput.trim()) return;
    
    isSuggesting = true;
    suggestedPatternNames = [];
    
    try {
      console.log('--- START PATTERN SUGGESTION ---');
      console.log('User Input:', $userInput);

      // Get valid pattern names for the prompt
      const validPatternNames = $patterns.map(p => p.Name);
      
      // Use the isolated, strict JSON prompt with formatted user message
      const { systemPrompt: systemPromptText, userMessage } = createPatternSuggestionMessages($userInput, validPatternNames);
      console.log('Using isolated pattern suggestion prompt');
      console.log('Formatted user message:', userMessage);

      const stream = await chatService.streamIsolated(userMessage, systemPromptText);
      
      let fullResponse = "";
      await chatService.processStream(
        stream,
        (content) => {
          fullResponse += content;
        },
        (error) => {
          console.error("Error streaming suggestions:", error);
        }
      );
      
      console.log('Raw LLM Response:', fullResponse);

      // Use the dedicated parser with validation
      const foundPatterns = parsePatternSuggestionResponse(fullResponse, validPatternNames);
      
      if (foundPatterns.length > 0) {
        suggestedPatternNames = foundPatterns;
        console.log('Final suggested patterns:', suggestedPatternNames);
      } else {
        console.warn("No valid patterns found in response.");
      }

      console.log('--- END PATTERN SUGGESTION ---');

    } catch (e) {
      console.error("Failed to suggest patterns:", e);
    } finally {
      isSuggesting = false;
    }
  }

  function clearSuggestions() {
    suggestedPatternNames = [];
  }

    onMount(async () => {
      await patternAPI.loadPatterns();
    });
</script>

<div class="min-w-0 flex gap-2">
  <div class="flex-1 min-w-0">
  <Select
    bind:value={selectedPreset}
    class="bg-primary-800/30 border-none hover:bg-primary-800/40 transition-colors w-full"
  >
    <option value="">{suggestedPatternNames.length > 0 ? 'Select a pattern...' : 'Load a pattern...'}</option>
    
    {#if suggestions.length > 0}
        <optgroup label="Suggestions">
            {#each suggestions as pattern}
                <option value={pattern.Name}>{pattern.Name}</option>
            {/each}
        </optgroup>
        <optgroup label="All Patterns">
            {#each otherPatterns as pattern}
                 <option value={pattern.Name}>{pattern.Name}</option>
            {/each}
        </optgroup>
    {:else}
        {#each otherPatterns as pattern}
             <option value={pattern.Name}>{pattern.Name}</option>
        {/each}
    {/if}
  </Select>
  </div>
  
  {#if suggestedPatternNames.length > 0}
    <Button 
        variant="ghost" 
        size="icon" 
        class="h-8 w-8 text-white/70 hover:text-white"
        on:click={clearSuggestions}
        title="Clear suggestions"
    >
        <X class="h-4 w-4" />
    </Button>
  {:else}
    <Button 
        variant="ghost" 
        size="icon" 
        class="h-8 w-8 text-white/70 hover:text-white disabled:opacity-30"
        on:click={suggestPatterns}
        disabled={isSuggesting || !$userInput.trim()}
        title="Suggest patterns based on input"
    >
        {#if isSuggesting}
            <Loader2 class="h-4 w-4 animate-spin" />
        {:else}
            <Wand2 class="h-4 w-4" />
        {/if}
    </Button>
  {/if}
</div>
