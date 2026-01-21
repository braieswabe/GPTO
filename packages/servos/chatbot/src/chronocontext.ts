/**
 * ChronoContext Protocol
 * Maintains narrative continuity without persistent memory by tracking time lag and rehydration anchors
 */

export interface ChronoContext {
  sessionId: string;
  anchors: Array<{
    timestamp: Date;
    messageId: string;
    summary: string;
    keyPoints: string[];
  }>;
  timeLag: number; // Seconds since last interaction
  coherence: number; // 0-1, how well current context connects to anchors
}

export interface RehydrationAnchor {
  messageId: string;
  timestamp: Date;
  summary: string;
  keyPoints: string[];
  relevanceScore: number;
}

/**
 * Connectivity Constant (κ)
 * Quantifies synchrony between human and LLM temporal coherence
 */
export function calculateConnectivityConstant(
  humanTimeLag: number,
  llmTimeLag: number,
  coherence: number
): number {
  // κ = coherence * (1 - |human_lag - llm_lag| / max_lag)
  const maxLag = Math.max(humanTimeLag, llmTimeLag, 1);
  const lagDiff = Math.abs(humanTimeLag - llmTimeLag);
  const lagSync = 1 - Math.min(lagDiff / maxLag, 1);
  
  const kappa = coherence * lagSync;
  return Math.max(0, Math.min(1, kappa));
}

/**
 * Create a new ChronoContext
 */
export function createChronoContext(sessionId: string): ChronoContext {
  return {
    sessionId,
    anchors: [],
    timeLag: 0,
    coherence: 1.0,
  };
}

/**
 * Add an anchor to ChronoContext
 */
export function addAnchor(
  context: ChronoContext,
  messageId: string,
  summary: string,
  keyPoints: string[]
): ChronoContext {
  const now = new Date();
  
  // Calculate time lag since last anchor
  const lastAnchor = context.anchors[context.anchors.length - 1];
  const timeLag = lastAnchor
    ? (now.getTime() - lastAnchor.timestamp.getTime()) / 1000
    : 0;
  
  // Add new anchor
  const newAnchors = [
    ...context.anchors,
    {
      timestamp: now,
      messageId,
      summary,
      keyPoints,
    },
  ];
  
  // Keep only last 10 anchors (sliding window)
  const trimmedAnchors = newAnchors.slice(-10);
  
  // Calculate coherence based on anchor continuity
  const coherence = calculateCoherence(trimmedAnchors);
  
  return {
    ...context,
    anchors: trimmedAnchors,
    timeLag,
    coherence,
  };
}

/**
 * Calculate coherence from anchors
 */
function calculateCoherence(
  anchors: ChronoContext['anchors']
): number {
  if (anchors.length < 2) return 1.0;
  
  // Simple coherence: check if key points overlap between consecutive anchors
  let overlapCount = 0;
  let totalChecks = 0;
  
  for (let i = 1; i < anchors.length; i++) {
    const prev = anchors[i - 1];
    const curr = anchors[i];
    
    const prevPoints = new Set(prev.keyPoints.map((p) => p.toLowerCase()));
    const currPoints = new Set(curr.keyPoints.map((p) => p.toLowerCase()));
    
    const intersection = new Set([...prevPoints].filter((x) => currPoints.has(x)));
    const union = new Set([...prevPoints, ...currPoints]);
    
    if (union.size > 0) {
      overlapCount += intersection.size / union.size;
      totalChecks++;
    }
  }
  
  return totalChecks > 0 ? overlapCount / totalChecks : 1.0;
}

/**
 * Rehydrate context from anchors
 */
export function rehydrateContext(
  context: ChronoContext,
  currentMessage: string,
  maxAnchors: number = 3
): RehydrationAnchor[] {
  const now = new Date();
  const currentTime = now.getTime();
  
  // Score anchors by relevance and recency
  const scoredAnchors: RehydrationAnchor[] = context.anchors.map((anchor) => {
    // Recency score (more recent = higher score)
    const ageSeconds = (currentTime - anchor.timestamp.getTime()) / 1000;
    const recencyScore = Math.max(0, 1 - ageSeconds / 3600); // Decay over 1 hour
    
    // Relevance score (simple keyword matching, would use semantic similarity in production)
    const anchorWords = new Set(
      [...anchor.summary, ...anchor.keyPoints.join(' ')]
        .join(' ')
        .toLowerCase()
        .split(/\s+/)
    );
    const messageWords = new Set(currentMessage.toLowerCase().split(/\s+/));
    const intersection = new Set([...anchorWords].filter((x) => messageWords.has(x)));
    const relevanceScore = anchorWords.size > 0 ? intersection.size / anchorWords.size : 0;
    
    // Combined score
    const score = (recencyScore * 0.4 + relevanceScore * 0.6);
    
    return {
      messageId: anchor.messageId,
      timestamp: anchor.timestamp,
      summary: anchor.summary,
      keyPoints: anchor.keyPoints,
      relevanceScore: Math.round(score * 100) / 100,
    };
  });
  
  // Sort by relevance and return top N
  scoredAnchors.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return scoredAnchors.slice(0, maxAnchors);
}

/**
 * Update time lag in context
 */
export function updateTimeLag(context: ChronoContext): ChronoContext {
  const now = new Date();
  const lastAnchor = context.anchors[context.anchors.length - 1];
  
  const timeLag = lastAnchor
    ? (now.getTime() - lastAnchor.timestamp.getTime()) / 1000
    : 0;
  
  return {
    ...context,
    timeLag,
  };
}
