// Expanded English vocabulary and phrase collection for instant (0-100ms) completions
export const PHRASE_DATABASE = [
  // Email & Communication
  { prefix: "thank you for your", completion: " time and consideration." },
  { prefix: "thank you for", completion: " reaching out to us." },
  { prefix: "please let me know if", completion: " you have any questions or concerns." },
  { prefix: "please let me know", completion: " your availability for a quick call." },
  { prefix: "looking forward to", completion: " hearing from you soon." },
  { prefix: "looking forward to our", completion: " upcoming discussion." },
  { prefix: "as discussed earlier", completion: " in our previous conversation," },
  { prefix: "as discussed", completion: " during our team sync," },
  { prefix: "hope this email finds", completion: " you well." },
  { prefix: "hope you are having", completion: " a great productive week." },
  { prefix: "feel free to reach", completion: " out if you need any assistance." },
  { prefix: "feel free to", completion: " let me know if you need anything else." },
  { prefix: "let me know if you", completion: " have any thoughts or feedback." },
  { prefix: "let me know if", completion: " that timeline works for you." },
  { prefix: "just following up on", completion: " our previous discussion regarding this." },
  { prefix: "i wanted to follow up", completion: " on the status of this item." },
  { prefix: "i would appreciate your", completion: " feedback on the attached draft." },
  { prefix: "at your earliest", completion: " convenience." },
  { prefix: "apologies for the", completion: " delayed response." },
  { prefix: "don't hesitate to", completion: " contact me if you have any questions." },

  // Analytical & Transition Phrases
  { prefix: "in order to", completion: " achieve our project objectives efficiently," },
  { prefix: "in order", completion: " to ensure optimal performance," },
  { prefix: "in accordance with", completion: " the established architectural guidelines," },
  { prefix: "in terms of", completion: " scalability and maintainability," },
  { prefix: "with respect to", completion: " the proposed system changes," },
  { prefix: "with regard to", completion: " the latest project requirements," },
  { prefix: "for example,", completion: " consider the following scenario:" },
  { prefix: "for instance,", completion: " this strategy reduces overall execution time." },
  { prefix: "such as", completion: " performance, reliability, and security." },
  { prefix: "as a result of", completion: " these architectural improvements," },
  { prefix: "as a consequence,", completion: " the latency dropped significantly." },
  { prefix: "in addition to", completion: " the standard feature set," },
  { prefix: "in contrast to", completion: " the previous legacy approach," },
  { prefix: "on the other hand,", completion: " we must evaluate the trade-offs carefully." },
  { prefix: "on one hand,", completion: " this provides immediate speed advantages." },
  { prefix: "at the same time,", completion: " code maintainability should not be compromised." },
  { prefix: "it is important to note", completion: " that all tests must pass before deployment." },
  { prefix: "it is important to", completion: " keep the user experience seamless." },
  { prefix: "it is worth noting", completion: " that this implementation is fully backward-compatible." },
  { prefix: "it should be noted that", completion: " error recovery is handled automatically." },
  { prefix: "one of the main", completion: " advantages of this architecture is simplicity." },
  { prefix: "one of the most", completion: " critical aspects to keep in mind is data integrity." },
  { prefix: "based on the", completion: " empirical benchmarks and feedback gathered," },
  { prefix: "according to the", completion: " technical specification outlined below," },
  { prefix: "in the context of", completion: " modern distributed web applications," },
  { prefix: "to a large extent,", completion: " this resolves the underlying concurrency issue." },
  { prefix: "in other words,", completion: " the client-side state remains synchronized." },
  { prefix: "as mentioned earlier,", completion: " the system relies on an optimistic update strategy." },
  { prefix: "as noted above,", completion: " the verification pipeline runs automatically." },

  // Project, Technical & Engineering
  { prefix: "the purpose of this document", completion: " is to provide a comprehensive roadmap." },
  { prefix: "the goal of this", completion: " feature is to improve writer velocity." },
  { prefix: "this document describes", completion: " the design and technical architecture of the system." },
  { prefix: "the next steps are to", completion: " finalize code reviews and begin testing." },
  { prefix: "we recommend that", completion: " we proceed with a phased rollout strategy." },
  { prefix: "we need to ensure that", completion: " all edge cases are properly handled." },
  { prefix: "to ensure that", completion: " responsiveness remains under acceptable thresholds," },
  { prefix: "take into account", completion: " potential network failures and retries." },
  { prefix: "keep in mind that", completion: " user interaction must remain uninterrupted." },
  { prefix: "from a technical standpoint,", completion: " this design minimizes unnecessary re-renders." },
  { prefix: "from the perspective of", completion: " end-user usability and accessibility," },
  { prefix: "it is recommended to", completion: " write automated unit tests for this module." },
  { prefix: "an alternative approach would be", completion: " to process updates asynchronously in the background." },
  { prefix: "the primary benefit is", completion: " a noticeable reduction in round-trip latency." },
  { prefix: "this allows us to", completion: " decouple state management from the rendering layer." },
  { prefix: "by doing so, we can", completion: " avoid redundant database queries and round-trips." },
  { prefix: "the main challenge is", completion: " ensuring real-time consistency across all clients." },

  // Conclusions & Summaries
  { prefix: "in conclusion,", completion: " the proposed solution meets all core specifications." },
  { prefix: "to summarize,", completion: " we have outlined the key milestones and deliverables." },
  { prefix: "all in all,", completion: " this significantly improves operational reliability." },
  { prefix: "moving forward, we will", completion: " monitor performance metrics closely." }
];

// Expanded list of 250+ common multi-syllable English words for instant word-level completion
export const COMMON_VOCABULARY = [
  "accommodate", "achievement", "acknowledge", "acquisition", "administration",
  "advantageous", "alternative", "analytically", "application", "appreciation",
  "architecture", "authentication", "authorization", "availability", "benchmark",
  "capabilities", "categorization", "collaboration", "collaborative", "compatibility",
  "comprehensive", "configuration", "consequently", "consideration", "consistency",
  "contribution", "convenience", "customization", "dependencies", "deployments",
  "description", "destination", "development", "documentation", "effectiveness",
  "efficiencies", "enhancement", "environment", "established", "evaluation",
  "exceptionally", "expectations", "flexibility", "functionality", "fundamental",
  "implementation", "improvements", "infrastructure", "initialization", "installation",
  "integration", "intelligence", "interactive", "intermediate", "investigation",
  "maintainability", "methodology", "modifications", "multithreading", "notification",
  "optimization", "organization", "performance", "permissions", "possibilities",
  "predetermined", "preferences", "preliminary", "prerequisites", "productivity",
  "programmable", "recommendation", "refactoring", "relationships", "reliability",
  "requirements", "responsiveness", "scalability", "significantly", "simultaneous",
  "specification", "standardization", "synchronization", "technologies", "transformation",
  "troubleshooting", "understanding", "unprecedented", "user-friendly", "verification",
  "visualization", "vulnerability", "workstation"
];

/**
 * High-speed lookup matching either:
 * 1. An exact or tail-matching phrase starter
 * 2. An unfinished word prefix (e.g. typing "collab" -> "orators", or "or" -> "der")
 */
export function findPhraseCompletion(precedingText) {
  if (!precedingText || typeof precedingText !== 'string') return null;

  const normalized = precedingText.toLowerCase().replace(/\s+/g, ' ');
  const trimmed = normalized.trim();
  const endsWithSpace = /\s$/.test(precedingText);

  // 1. Check Phrase Database:
  // If user just finished typing a phrase word (or has a space), match tail against phrase entries
  for (const item of PHRASE_DATABASE) {
    const key = item.prefix.toLowerCase();
    
    // Case A: Exact match at tail (e.g., "... in order to" -> " achieve our project objectives...")
    if (trimmed.endsWith(key)) {
      // If user hasn't typed trailing space, prepend space
      const textToAppend = endsWithSpace 
        ? item.completion.replace(/^\s+/, '') 
        : item.completion.startsWith(' ') ? item.completion : ` ${item.completion}`;
      return textToAppend;
    }

    // Case B: Incomplete phrase match (e.g., user typed "in ord" -> completion "er to achieve...")
    // Find if the end of trimmed text matches the beginning of key
    const words = trimmed.split(' ');
    const lastTwoOrThree = words.slice(-3).join(' ');
    if (lastTwoOrThree.length >= 4 && key.startsWith(lastTwoOrThree) && key.length > lastTwoOrThree.length) {
      const remainingKey = key.slice(lastTwoOrThree.length);
      return `${remainingKey}${item.completion}`;
    }
  }

  // 2. Word-level completion for currently typed word:
  // When cursor is directly at the end of a word (no trailing space), append letters directly!
  // e.g. "or" -> "der", "collab" -> "oration", "docu" -> "mentation"
  if (!endsWithSpace) {
    const wordMatch = precedingText.match(/([a-zA-Z]{2,})$/);
    if (wordMatch) {
      const currentWord = wordMatch[1].toLowerCase();
      // Look up common vocabulary
      for (const vocab of COMMON_VOCABULARY) {
        if (vocab.startsWith(currentWord) && vocab.length > currentWord.length) {
          // Return EXACT suffix with NO leading space so it appends directly to the word!
          return vocab.slice(currentWord.length);
        }
      }
    }
  }

  return null;
}
