import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, GitBranch, Play, Pause, Edit } from "lucide-react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type NurturingSequence = Tables<"nurturing_sequences"> & {
  nurturing_steps: Tables<"nurturing_steps">[];
};

interface SequenceForm {
  name: string;
  description: string;
  trigger_type: string;
  trigger_conditions: {
    min_score?: number;
    status_from?: string;
    status_to?: string;
  };
  steps: {
    name: string;
    action_type: string;
    action_data: Record<string, any>;
    delay_hours: number;
  }[];
}

export default function Nurturing() {
  const [sequences, setSequences] = useState<NurturingSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<SequenceForm>({
    defaultValues: {
      name: "",
      description: "",
      trigger_type: "score_based",
      trigger_conditions: { min_score: 7 },
      steps: []
    }
  });

  useEffect(() => {
    loadSequences();
  }, []);

  const loadSequences = async () => {
    try {
      const { data, error } = await supabase
        .from("nurturing_sequences")
        .select(`
          *,
          nurturing_steps (*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSequences(data || []);
    } catch (error) {
      console.error("Error loading sequences:", error);
      toast({
        title: "Error",
        description: "Failed to load nurturing sequences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSequence = async (formData: SequenceForm) => {
    try {
      const { data: sequence, error: sequenceError } = await supabase
        .from("nurturing_sequences")
        .insert({
          name: formData.name,
          description: formData.description,
          trigger_type: formData.trigger_type,
          trigger_conditions: formData.trigger_conditions,
          active: true
        })
        .select()
        .single();

      if (sequenceError) throw sequenceError;

      if (formData.steps.length > 0) {
        const stepsToInsert = formData.steps.map((step, index) => ({
          sequence_id: sequence.id,
          step_name: step.name,
          step_order: index + 1,
          action_type: step.action_type,
          action_data: step.action_data,
          delay_hours: step.delay_hours
        }));

        const { error: stepsError } = await supabase
          .from("nurturing_steps")
          .insert(stepsToInsert);

        if (stepsError) throw stepsError;
      }

      toast({
        title: "Success",
        description: "Nurturing sequence created successfully",
      });

      setOpen(false);
      form.reset();
      loadSequences();
    } catch (error) {
      console.error("Error creating sequence:", error);
      toast({
        title: "Error",
        description: "Failed to create nurturing sequence",
        variant: "destructive",
      });
    }
  };

  const toggleSequenceStatus = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from("nurturing_sequences")
        .update({ active: !active })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Sequence ${!active ? "activated" : "paused"}`,
      });

      loadSequences();
    } catch (error) {
      console.error("Error updating sequence:", error);
      toast({
        title: "Error",
        description: "Failed to update sequence",
        variant: "destructive",
      });
    }
  };

  const addStep = () => {
    const currentSteps = form.getValues("steps");
    form.setValue("steps", [
      ...currentSteps,
      {
        name: "",
        action_type: "email",
        action_data: { subject: "", template: "" },
        delay_hours: 24
      }
    ]);
  };

  const removeStep = (index: number) => {
    const currentSteps = form.getValues("steps");
    form.setValue("steps", currentSteps.filter((_, i) => i !== index));
  };

  const triggerType = form.watch("trigger_type");

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Nurturing</h1>
          <p className="text-muted-foreground">Automated sequences to nurture leads based on scores and status</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Sequence
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Nurturing Sequence</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(createSequence)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sequence Name</FormLabel>
                      <FormControl>
                        <Input placeholder="High Score Follow-up" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Nurtures leads with high scores..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trigger_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trigger Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="score_based">Score Based</SelectItem>
                          <SelectItem value="status_change">Status Change</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {triggerType === "score_based" && (
                  <FormField
                    control={form.control}
                    name="trigger_conditions.min_score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Score</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="7"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {triggerType === "status_change" && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="trigger_conditions.status_from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="New">New</SelectItem>
                              <SelectItem value="Contacted">Contacted</SelectItem>
                              <SelectItem value="Qualified">Qualified</SelectItem>
                              <SelectItem value="Cold">Cold</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="trigger_conditions.status_to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>To Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Qualified">Qualified</SelectItem>
                              <SelectItem value="Interested">Interested</SelectItem>
                              <SelectItem value="Cold">Cold</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Sequence Steps</h3>
                    <Button type="button" variant="outline" onClick={addStep}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Step
                    </Button>
                  </div>

                  {form.watch("steps").map((_, index) => (
                    <Card key={index} className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Step {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStep(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`steps.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Step Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Send welcome email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`steps.${index}.delay_hours`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Delay (hours)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="24"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`steps.${index}.action_type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Action Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="email">Send Email</SelectItem>
                                <SelectItem value="task">Create Task</SelectItem>
                                <SelectItem value="status_change">Update Status</SelectItem>
                                <SelectItem value="webhook">Webhook</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch(`steps.${index}.action_type`) === "email" && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`steps.${index}.action_data.from`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>From Email</FormLabel>
                                  <FormControl>
                                    <Input placeholder="hello@yourdomain.com" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`steps.${index}.action_data.subject`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email Subject</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Following up on your interest" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`steps.${index}.action_data.greeting`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Greeting</FormLabel>
                                <FormControl>
                                  <Input placeholder="Thanks for your interest in our services!" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`steps.${index}.action_data.html_body`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Content (HTML)</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="<p>We'd love to help you with your project...</p>"
                                    className="min-h-[100px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`steps.${index}.action_data.cta_text`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Call-to-Action Button Text</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Schedule a Call" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`steps.${index}.action_data.cta_url`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Call-to-Action URL</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://calendly.com/your-calendar" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Sequence</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {sequences.map((sequence) => (
          <Card key={sequence.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">{sequence.name}</h3>
                  <Badge variant={sequence.active ? "default" : "secondary"}>
                    {sequence.active ? "Active" : "Paused"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{sequence.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span>
                    <strong>Trigger:</strong>{" "}
                    {sequence.trigger_type === "score_based"
                      ? `Score ≥ ${(sequence.trigger_conditions as any)?.min_score || "N/A"}`
                      : `${(sequence.trigger_conditions as any)?.status_from || "Any"} → ${
                          (sequence.trigger_conditions as any)?.status_to || "Any"
                        }`}
                  </span>
                  <span>
                    <strong>Steps:</strong> {sequence.nurturing_steps?.length || 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleSequenceStatus(sequence.id, sequence.active)}
                >
                  {sequence.active ? (
                    <>
                      <Pause className="mr-1 h-3 w-3" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="mr-1 h-3 w-3" />
                      Activate
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {sequence.nurturing_steps && sequence.nurturing_steps.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">Steps:</h4>
                <div className="space-y-2">
                  {sequence.nurturing_steps
                    .sort((a, b) => a.step_order - b.step_order)
                    .map((step, index) => (
                      <div key={step.id} className="flex items-center gap-3 text-sm">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                          {index + 1}
                        </div>
                        <span>{step.step_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {step.action_type}
                        </Badge>
                        <span className="text-muted-foreground">
                          +{step.delay_hours}h
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </Card>
        ))}

        {sequences.length === 0 && (
          <Card className="p-12 text-center">
            <GitBranch className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Nurturing Sequences</h3>
            <p className="text-muted-foreground mb-4">
              Create your first automated sequence to nurture leads based on their scores and status.
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Sequence
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}