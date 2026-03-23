import InteractiveAuroraCharacter from "@/components/InteractiveAuroraCharacter";
import type { ExpressionType } from "@/lib/sentiment-analysis";
import type { CharacterPersonality } from "@/lib/character-personalities";

interface InteractiveCharacterProps {
  state: "idle" | "processing" | "success" | "error";
  size?: "sm" | "md" | "lg";
  personality?: CharacterPersonality;
  agentId?: string;
  className?: string;
  expression?: ExpressionType;
}

export default function InteractiveCharacter({ 
  state, 
  size = "md", 
  className = "",
  expression = "neutral"
}: InteractiveCharacterProps) {
  return (
    <InteractiveAuroraCharacter
      state={state}
      size={size}
      expression={expression}
      className={className}
    />
  );
}