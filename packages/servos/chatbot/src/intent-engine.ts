/**
 * Intent Engine - Maps user queries to canonical modes and servos
 */

export type UserMode = 'ask' | 'plan' | 'do' | 'audit' | 'explain' | 'teach' | 'simulate' | 'benchmark';

export type ServoType = 'gpto' | 'agcc' | 'mibi' | 'candidate-first' | 'paid' | 'social' | 'email';

export interface IntentResult {
  mode: UserMode;
  servos: ServoType[];
  confidence: number;
  entities: Record<string, string>;
}

/**
 * Classify intent from user query
 */
export function classifyIntent(query: string): IntentResult {
  const queryLower = query.toLowerCase();

  // Simple keyword-based classification (would use ML/NLP in production)
  let mode: UserMode = 'ask';
  const servos: ServoType[] = [];
  const entities: Record<string, string> = {};

  // Mode detection
  if (queryLower.includes('generate') || queryLower.includes('create') || queryLower.includes('write')) {
    mode = 'do';
    servos.push('agcc');
  } else if (queryLower.includes('plan') || queryLower.includes('strategy')) {
    mode = 'plan';
    servos.push('gpto', 'mibi');
  } else if (queryLower.includes('audit') || queryLower.includes('check') || queryLower.includes('review')) {
    mode = 'audit';
    servos.push('gpto', 'mibi');
  } else if (queryLower.includes('explain') || queryLower.includes('why') || queryLower.includes('how')) {
    mode = 'explain';
  } else if (queryLower.includes('teach') || queryLower.includes('learn') || queryLower.includes('tutorial')) {
    mode = 'teach';
  }

  // Servo detection
  if (queryLower.includes('content') || queryLower.includes('blog') || queryLower.includes('post')) {
    servos.push('agcc');
  }
  if (queryLower.includes('insight') || queryLower.includes('analytics') || queryLower.includes('trend')) {
    servos.push('mibi');
  }
  if (queryLower.includes('candidate') || queryLower.includes('recruit') || queryLower.includes('hire')) {
    servos.push('candidate-first');
  }
  if (queryLower.includes('ad') || queryLower.includes('campaign') || queryLower.includes('ppc')) {
    servos.push('paid');
  }
  if (queryLower.includes('social') || queryLower.includes('twitter') || queryLower.includes('linkedin')) {
    servos.push('social');
  }
  if (queryLower.includes('email') || queryLower.includes('newsletter')) {
    servos.push('email');
  }

  // Default to GPTO if no specific servos detected
  if (servos.length === 0) {
    servos.push('gpto');
  }

  // Extract entities (simplified)
  const siteMatch = query.match(/site[:\s]+(\S+)/i);
  if (siteMatch) {
    entities.site = siteMatch[1];
  }

  const topicMatch = query.match(/about[:\s]+(.+?)(?:\s|$)/i);
  if (topicMatch) {
    entities.topic = topicMatch[1];
  }

  return {
    mode,
    servos: [...new Set(servos)], // Remove duplicates
    confidence: 0.8, // Would calculate actual confidence in production
    entities,
  };
}
