/**
 * Sentiment analysis utility for determining character expressions
 * based on agent response content and context
 */

export type ExpressionType = 
  | "happy"      // Positive results, success, good news
  | "focused"    // Analysis, working, processing data
  | "thinking"   // Contemplating, planning, considering
  | "confident"  // Strong recommendations, certainty
  | "concerned"  // Issues found, warnings, problems
  | "surprised"  // Unexpected results, discoveries
  | "neutral";   // Default, balanced responses

interface SentimentPattern {
  keywords: string[];
  weight: number;
  context?: string[]; // Additional context clues
}

const sentimentPatterns: Record<ExpressionType, SentimentPattern> = {
  happy: {
    keywords: [
      "success", "great", "excellent", "perfect", "achieved", "completed", 
      "wonderful", "fantastic", "brilliant", "outstanding", "impressive",
      "well-done", "congratulations", "celebrating", "victory", "win"
    ],
    weight: 3,
    context: ["✅", "🎉", "positive", "good", "best"]
  },
  
  focused: {
    keywords: [
      "analyzing", "examining", "reviewing", "studying", "investigating", 
      "research", "data", "metrics", "performance", "statistics",
      "trends", "patterns", "insights", "breakdown", "analysis"
    ],
    weight: 2,
    context: ["📊", "📈", "data", "numbers", "stats"]
  },
  
  thinking: {
    keywords: [
      "considering", "evaluating", "thinking", "planning", "strategizing",
      "options", "possibilities", "approach", "methodology", "framework",
      "let me", "I think", "perhaps", "might", "could"
    ],
    weight: 2,
    context: ["🤔", "💭", "plan", "strategy"]
  },
  
  confident: {
    keywords: [
      "recommend", "definitely", "certainly", "clearly", "obviously",
      "should", "must", "essential", "critical", "important",
      "strong", "solid", "proven", "effective", "reliable"
    ],
    weight: 2,
    context: ["💪", "✨", "strong", "solid"]
  },
  
  concerned: {
    keywords: [
      "issue", "problem", "error", "warning", "concern", "risk",
      "difficulty", "challenge", "obstacle", "limitation",
      "unfortunately", "however", "but", "needs improvement"
    ],
    weight: 3,
    context: ["⚠️", "❌", "🚨", "problem", "issue"]
  },
  
  surprised: {
    keywords: [
      "unexpected", "surprising", "interesting", "remarkable", "unusual",
      "discovered", "found", "reveals", "shows", "indicates",
      "wow", "amazing", "incredible", "noteworthy"
    ],
    weight: 2,
    context: ["😲", "🔍", "discovery", "finding"]
  },
  
  neutral: {
    keywords: [],
    weight: 1
  }
};

/**
 * Analyze text content to determine appropriate character expression
 */
export function analyzeSentiment(
  text: string, 
  agentType?: string,
  responseTime?: number
): ExpressionType {
  if (!text || text.trim().length === 0) {
    return "neutral";
  }

  const lowerText = text.toLowerCase();
  const scores: Record<ExpressionType, number> = {
    happy: 0,
    focused: 0,
    thinking: 0,
    confident: 0,
    concerned: 0,
    surprised: 0,
    neutral: 1
  };

  // Score based on keyword matches
  Object.entries(sentimentPatterns).forEach(([expression, pattern]) => {
    const expr = expression as ExpressionType;
    
    // Count keyword matches
    pattern.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = (lowerText.match(regex) || []).length;
      scores[expr] += matches * pattern.weight;
    });
    
    // Bonus points for context clues
    if (pattern.context) {
      pattern.context.forEach(contextClue => {
        if (lowerText.includes(contextClue.toLowerCase())) {
          scores[expr] += 0.5;
        }
      });
    }
  });

  // Agent-specific modifiers
  if (agentType) {
    switch (agentType) {
      case "analyst":
      case "data-analyst":
      case "performance-reporter":
        scores.focused += 1;
        break;
      case "strategist":
      case "strategy-advisor":
        scores.thinking += 1;
        scores.confident += 0.5;
        break;
      case "copywriter":
      case "creative":
        scores.happy += 0.5;
        scores.surprised += 0.5;
        break;
    }
  }

  // Response time modifiers (longer responses might indicate deeper analysis)
  if (responseTime && responseTime > 2000) {
    scores.focused += 0.5;
    scores.thinking += 0.3;
  }

  // Special patterns
  if (lowerText.includes("error") || lowerText.includes("failed")) {
    scores.concerned += 2;
  }
  
  if (lowerText.includes("completed") || lowerText.includes("done")) {
    scores.happy += 1.5;
  }

  if (lowerText.match(/\d+%|\$[\d,]+|[\d,]+\s*(users?|customers?|leads?)/gi)) {
    scores.focused += 1;
  }

  // Find the expression with the highest score
  const maxExpression = Object.entries(scores).reduce((a, b) => 
    scores[a[0] as ExpressionType] > scores[b[0] as ExpressionType] ? a : b
  )[0] as ExpressionType;

  // Require minimum threshold to avoid neutral
  const maxScore = scores[maxExpression];
  return maxScore > 1.5 ? maxExpression : "neutral";
}

/**
 * Get a brief description of what each expression represents
 */
export function getExpressionDescription(expression: ExpressionType): string {
  const descriptions: Record<ExpressionType, string> = {
    happy: "Positive results and successful outcomes",
    focused: "Analyzing data and providing insights", 
    thinking: "Considering options and planning strategies",
    confident: "Strong recommendations and certainty",
    concerned: "Identifying issues and potential problems",
    surprised: "Unexpected discoveries and interesting findings",
    neutral: "Balanced, informational responses"
  };
  
  return descriptions[expression];
}