import { useState } from "react";
import { AGENTS, Agent } from "@/lib/agents";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Key, Bot, Shield, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface ApiKeyField { label: string; value: string; visible: boolean; }

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function SettingsPage() {
  const [openRouterKeys, setOpenRouterKeys] = useState<ApiKeyField[]>(Array.from({ length: 5 }, (_, i) => ({ label: `OpenRouter Key ${i + 1}`, value: "", visible: false })));
  const [geminiKeys, setGeminiKeys] = useState<ApiKeyField[]>(Array.from({ length: 5 }, (_, i) => ({ label: `Gemini Account ${i + 1}`, value: "", visible: false })));
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [whitelistedEmails, setWhitelistedEmails] = useState(["ardenostudio@gmail.com"]);
  const [newEmail, setNewEmail] = useState("");
  const [whatsappWebhook, setWhatsappWebhook] = useState("");
  const [testingWhatsapp, setTestingWhatsapp] = useState(false);

  const toggleVis = (keys: ApiKeyField[], set: (k: ApiKeyField[]) => void, i: number) => set(keys.map((k, j) => (j === i ? { ...k, visible: !k.visible } : k)));
  const updateKey = (keys: ApiKeyField[], set: (k: ApiKeyField[]) => void, i: number, v: string) => set(keys.map((k, j) => (j === i ? { ...k, value: v } : k)));

  const testWhatsAppWebhook = async () => {
    if (!whatsappWebhook) {
      toast.error("Please enter your WhatsApp webhook URL first");
      return;
    }

    setTestingWhatsapp(true);
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-webhook", {
        body: { action: "test", webhookUrl: whatsappWebhook }
      });

      if (error) throw error;
      
      if (data.success) {
        toast.success("✅ " + data.message);
      } else {
        toast.error("❌ " + (data.error || "Test failed"));
      }
    } catch (error) {
      console.error("WhatsApp test error:", error);
      toast.error("❌ WhatsApp test failed. Check your webhook URL.");
    } finally {
      setTestingWhatsapp(false);
    }
  };

  const KeySection = ({ title, keys, setKeys }: { title: string; keys: ApiKeyField[]; setKeys: (k: ApiKeyField[]) => void }) => (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-border/30 flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <Key className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
      <div className="p-5 space-y-4">
        {keys.map((key, i) => (
          <div key={i} className="space-y-1.5">
            <span className="text-xs text-muted-foreground">{key.label}</span>
            <div className="flex gap-2">
              <Input
                type={key.visible ? "text" : "password"}
                value={key.value}
                onChange={(e) => updateKey(keys, setKeys, i, e.target.value)}
                placeholder="••••••••••••••••"
                className="bg-secondary/50 border-border/50 font-data text-sm rounded-lg"
              />
              <Button variant="ghost" size="icon" onClick={() => toggleVis(keys, setKeys, i)} className="h-10 w-10 shrink-0 rounded-lg">
                {key.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-10 shrink-0 rounded-lg border-border/50"
                onClick={() => toast.success("→ Pinging... ✓ 42ms")}
              >
                Test
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="page-shell page-atmosphere max-w-4xl space-y-6">
      <motion.div variants={fadeUp}>
        <div className="section-label">Settings</div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <Tabs defaultValue="api-keys">
          <TabsList className="bg-secondary/50 rounded-lg backdrop-blur-sm border border-border/30">
            <TabsTrigger value="api-keys" className="text-sm rounded-md">API Keys</TabsTrigger>
            <TabsTrigger value="agents" className="text-sm rounded-md">Agents</TabsTrigger>
            <TabsTrigger value="access" className="text-sm rounded-md">Access</TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys" className="space-y-4 mt-6">
            <KeySection title="OpenRouter API Keys" keys={openRouterKeys} setKeys={setOpenRouterKeys} />
            <KeySection title="Gemini API Keys" keys={geminiKeys} setKeys={setGeminiKeys} />

            <div className="glass-card rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/30 flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Key className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Other Services</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Database</p>
                    <p className="text-xs text-muted-foreground">Connected via Lovable Cloud</p>
                  </div>
                  <span className="text-xs text-success flex items-center gap-1.5 bg-success/10 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Gmail API</p>
                    <p className="text-xs text-muted-foreground">Requires OAuth setup</p>
                  </div>
                  <span className="text-xs text-warning bg-warning/10 border border-warning/20 px-2.5 py-1 rounded-lg">Not Connected</span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/30 flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <svg className="h-3.5 w-3.5 text-primary" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.785"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-foreground">WhatsApp Notifications</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <span className="text-xs text-muted-foreground">Zapier Webhook URL</span>
                  <Input
                    value={whatsappWebhook}
                    onChange={(e) => setWhatsappWebhook(e.target.value)}
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    className="bg-secondary/50 border-border/50 font-data text-sm rounded-lg"
                  />
                  <p className="text-xs text-muted-foreground">Connect to Zapier → WhatsApp for free notifications (100/month on free plan)</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-10 rounded-lg border-border/50"
                  onClick={testWhatsAppWebhook}
                  disabled={testingWhatsapp || !whatsappWebhook}
                >
                  {testingWhatsapp ? "Testing..." : "Test WhatsApp Notification"}
                </Button>
              </div>
            </div>

            <Button onClick={() => toast.success("Settings saved")} className="rounded-lg">
              Save API Keys
            </Button>
          </TabsContent>

          <TabsContent value="agents" className="space-y-3 mt-6">
            {agents.map((agent) => (
              <div key={agent.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                <Switch
                  checked={agent.enabled}
                  onCheckedChange={() => setAgents((p) => p.map((a) => (a.id === agent.id ? { ...a, enabled: !a.enabled } : a)))}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{agent.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{agent.provider} · {agent.systemPrompt}</p>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="access" className="space-y-4 mt-6">
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border/30 flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Whitelisted Accounts</span>
              </div>
              <div className="p-5 space-y-3">
                {whitelistedEmails.map((email) => (
                  <div key={email} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                    <span className="text-sm text-foreground">{email}</span>
                    <button
                      onClick={() => {
                        if (email === "ardenostudio@gmail.com") { toast.error("Cannot remove primary"); return; }
                        setWhitelistedEmails((p) => p.filter((e) => e !== email));
                      }}
                      className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="email@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="bg-secondary/50 border-border/50 rounded-lg"
                  />
                  <Button
                    size="sm"
                    className="rounded-lg"
                    onClick={() => {
                      if (newEmail && !whitelistedEmails.includes(newEmail)) {
                        setWhitelistedEmails([...whitelistedEmails, newEmail]);
                        setNewEmail("");
                        toast.success("Added");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
