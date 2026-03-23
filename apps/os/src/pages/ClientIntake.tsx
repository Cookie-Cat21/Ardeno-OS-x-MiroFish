import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } } as const;

export default function ClientIntake() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "", industry: "",
    website_url: "", project_type: "Website Redesign", budget_range: "",
    timeline: "", description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("process-intake", { body: form });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="glass-card rounded-2xl p-12 text-center max-w-md">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          </div>
          <h2 className="text-xl font-display text-foreground mb-2">Thank You!</h2>
          <p className="text-sm text-muted-foreground">
            Your project inquiry has been received. We'll review your details and get back to you within 24 hours with a tailored proposal.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="min-h-screen flex items-center justify-center p-6 bg-background">
      <motion.div variants={fadeUp} className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display text-foreground mb-2">Start Your Project</h1>
          <p className="text-sm text-muted-foreground">Tell us about your vision and we'll craft the perfect solution</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Full Name *</label>
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" className="bg-secondary/50 border-border/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Email *</label>
              <Input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" className="bg-secondary/50 border-border/50" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Phone</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+94 77 123 4567" className="bg-secondary/50 border-border/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Company</label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" className="bg-secondary/50 border-border/50" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Industry</label>
              <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {["Dental", "Salon/Spa", "Restaurant", "Gym/Fitness", "Real Estate", "E-commerce", "Healthcare", "Education", "Technology", "Other"].map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Current Website</label>
              <Input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} placeholder="https://currentsite.com" className="bg-secondary/50 border-border/50" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Project Type</label>
              <Select value={form.project_type} onValueChange={(v) => setForm({ ...form, project_type: v })}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Website Redesign", "New Website", "E-commerce", "Landing Page", "Web Application", "Branding + Website"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Budget Range</label>
              <Select value={form.budget_range} onValueChange={(v) => setForm({ ...form, budget_range: v })}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Select range" /></SelectTrigger>
                <SelectContent>
                  {["$500 - $1,000", "$1,000 - $2,000", "$2,000 - $5,000", "$5,000 - $10,000", "$10,000+"].map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">Timeline</label>
              <Select value={form.timeline} onValueChange={(v) => setForm({ ...form, timeline: v })}>
                <SelectTrigger className="bg-secondary/50 border-border/50"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {["ASAP", "1-2 weeks", "1 month", "2-3 months", "Flexible"].map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">Project Description</label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell us about your project, goals, and any specific features you need..." className="bg-secondary/50 border-border/50 min-h-[120px]" />
          </div>

          <Button type="submit" disabled={loading} className="w-full rounded-lg h-12 text-sm">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            {loading ? "Submitting..." : "Submit Project Inquiry"}
          </Button>

          <p className="text-[10px] text-muted-foreground text-center">
            This automatically creates your client profile, project, and onboarding tasks.
          </p>
        </form>
      </motion.div>
    </motion.div>
  );
}
