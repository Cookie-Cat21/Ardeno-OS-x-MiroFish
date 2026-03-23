import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const DEFAULT_ORDER = [
  "briefing",
  "metrics",
  "goals",
  "revenue",
  "pipeline",
  "clientHealth",
  "agentPerformance",
  "tasks",
  "invoices",
  "quickActions",
  "agents",
  "activity",
];

// Ensure saved layouts get new widgets appended
function mergeWithDefaults(saved: string[]): string[] {
  const missing = DEFAULT_ORDER.filter(id => !saved.includes(id));
  return [...saved, ...missing];
}

export function useDashboardLayout() {
  const { user } = useAuth();
  const [widgetOrder, setWidgetOrder] = useState<string[]>(DEFAULT_ORDER);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    supabase
      .from("dashboard_layouts")
      .select("widget_order")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.widget_order) {
          setWidgetOrder(mergeWithDefaults(data.widget_order as string[]));
        }
        setLoading(false);
      });
  }, [user]);

  const saveOrder = useCallback(
    async (newOrder: string[]) => {
      setWidgetOrder(newOrder);
      if (!user) return;

      await supabase.from("dashboard_layouts").upsert(
        {
          user_id: user.id,
          widget_order: newOrder as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    },
    [user]
  );

  return { widgetOrder, saveOrder, loading };
}
