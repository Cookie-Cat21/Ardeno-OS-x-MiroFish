import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CustomSkill {
  id: string;
  skill_id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  enabled: boolean;
  created_by_orchestrator: boolean;
  parameters: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useCustomSkills() {
  return useQuery({
    queryKey: ["custom-skills"],
    queryFn: async (): Promise<CustomSkill[]> => {
      const { data, error } = await supabase
        .from("custom_skills")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CustomSkill[];
    },
  });
}

export function useCreateCustomSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (skill: Omit<CustomSkill, "id" | "created_at" | "updated_at">) => {
      const { error } = await supabase
        .from("custom_skills")
        .insert(skill as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-skills"] });
      toast.success("Custom skill created");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCustomSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("custom_skills")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["custom-skills"] });
      toast.success("Custom skill deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleCustomSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("custom_skills")
        .update({ enabled, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["custom-skills"] }),
  });
}
