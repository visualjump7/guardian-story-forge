/**
 * Content filter for children's content (ages 12 and under)
 * Validates user input to ensure it's appropriate for young audiences
 */

const INAPPROPRIATE_WORDS = [
  // Common profanity
  'damn', 'hell', 'crap', 'suck', 'stupid', 'idiot', 'dumb', 'hate',
  // Strong profanity
  'fuck', 'shit', 'ass', 'asshole', 'bitch', 'bastard', 'piss', 'dick',
  'cock', 'pussy', 'cunt', 'whore', 'slut', 'fag', 'retard',
  // Variations and related
  'fucking', 'fucked', 'fucker', 'shitty', 'shitting', 'bullshit',
  'asshat', 'dumbass', 'jackass', 'bitching', 'bitchy',
  // Violence-related
  'kill', 'murder', 'death', 'dead', 'die', 'blood', 'knife', 'gun', 'weapon',
  // Scary/intense
  'terror', 'horror', 'nightmare', 'demon', 'devil', 'evil',
  // Inappropriate themes
  'sexy', 'drugs', 'alcohol', 'drunk', 'beer', 'wine',
  // Body functions
  'poop', 'pee', 'fart', 'butt', 'poo', 'wee',
  // Bullying terms
  'ugly', 'fat', 'loser', 'dummy', 'freak'
];

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface SanitizationResult {
  sanitizedContent: string;
  wasModified: boolean;
  replacedWords: string[];
}

/**
 * Validates content for appropriateness for children
 * @param content - The user input to validate
 * @returns ValidationResult with isValid and optional error message
 */
export const validateContent = (content: string): ValidationResult => {
  if (!content || !content.trim()) {
    return {
      isValid: false,
      message: "Please enter a description"
    };
  }

  const trimmedContent = content.trim();
  
  // Check length
  if (trimmedContent.length < 3) {
    return {
      isValid: false,
      message: "Description is too short (minimum 3 characters)"
    };
  }

  if (trimmedContent.length > 80) {
    return {
      isValid: false,
      message: "Description is too long (maximum 80 characters)"
    };
  }

  // Convert to lowercase for checking
  const lowerContent = trimmedContent.toLowerCase();
  
  // Check for inappropriate words
  for (const word of INAPPROPRIATE_WORDS) {
    // Use word boundaries to avoid false positives (e.g., "grass" containing "ass")
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lowerContent)) {
      return {
        isValid: false,
        message: "Please use kid-friendly language for your description"
      };
    }
  }

  // Check for excessive special characters (potential spam/gibberish)
  const specialCharCount = (trimmedContent.match(/[^a-zA-Z0-9\s,.'!?-]/g) || []).length;
  if (specialCharCount > trimmedContent.length * 0.3) {
    return {
      isValid: false,
      message: "Please use normal words to describe your character"
    };
  }

  return {
    isValid: true
  };
};

/**
 * Sanitizes content by replacing inappropriate words with ***
 * @param content - The user input to sanitize
 * @returns Object with sanitized content and whether changes were made
 */
export const sanitizeContent = (content: string): SanitizationResult => {
  if (!content || !content.trim()) {
    return {
      sanitizedContent: content,
      wasModified: false,
      replacedWords: []
    };
  }

  let sanitized = content;
  const replacedWords: string[] = [];
  
  // Replace each inappropriate word with ***
  for (const word of INAPPROPRIATE_WORDS) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi'); // Case-insensitive, global
    
    if (regex.test(sanitized)) {
      replacedWords.push(word);
      sanitized = sanitized.replace(regex, '***');
    }
  }

  return {
    sanitizedContent: sanitized,
    wasModified: replacedWords.length > 0,
    replacedWords
  };
};
