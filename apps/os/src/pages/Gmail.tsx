import { useState } from "react";
import { MOCK_EMAILS } from "@/lib/mock-data";
import { MockEmail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FileText, MessageSquare, Target, Link2, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function Gmail() {
  const [emails] = useState<MockEmail[]>(MOCK_EMAILS);
  const [selectedEmail, setSelectedEmail] = useState<MockEmail | null>(null);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = emails.filter(
    (e) => e.from.toLowerCase().includes(search.toLowerCase()) || e.subject.toLowerCase().includes(search.toLowerCase())
  );

  if (selectedEmail) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-[calc(100vh-3.5rem)]">
        <div className="page-shell flex-1 flex max-w-3xl flex-col">
          <button onClick={() => setSelectedEmail(null)} className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mb-6">
            <ArrowLeft className="h-4 w-4" /> Back to Inbox
          </button>

          <div className="flex flex-wrap gap-2 mb-6">
            {[
              { icon: FileText, label: "Summarise", onClick: () => navigate("/chat") },
              { icon: MessageSquare, label: "Draft Reply", onClick: () => navigate("/chat") },
              { icon: Target, label: "Qualify Lead", onClick: () => navigate("/leads") },
              { icon: Link2, label: "Link to Project", onClick: () => navigate("/projects") },
            ].map((btn) => (
              <button key={btn.label} onClick={btn.onClick} className="glass-card flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-all">
                <btn.icon className="h-3.5 w-3.5" /> {btn.label}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <h2 className="font-display text-2xl tracking-tight text-foreground">{selectedEmail.subject}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium text-foreground">{selectedEmail.from}</span>
              <span className="text-xs text-muted-foreground">&lt;{selectedEmail.fromEmail}&gt;</span>
              <span className="text-xs text-muted-foreground ml-auto">{new Date(selectedEmail.date).toLocaleString()}</span>
            </div>
          </div>

          <div className="border-t border-border/30 pt-6 max-w-[680px]">
            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{selectedEmail.body}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="page-shell page-atmosphere max-w-[1440px] space-y-6">
      <motion.div variants={fadeUp}>
        <div className="section-label mb-1">Gmail</div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">ardenostudio@gmail.com</span>
          <span className="text-[10px] bg-warning/10 text-warning border border-warning/20 px-2 py-0.5 rounded-md">Mock</span>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search emails..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-secondary/50 border-border/50 pl-10 rounded-lg backdrop-blur-sm" />
      </motion.div>

      <motion.div variants={fadeUp} className="space-y-2">
        {filtered.map((email) => (
          <div
            key={email.id}
            onClick={() => setSelectedEmail(email)}
            className="glass-card rounded-xl flex items-center gap-4 px-5 py-3.5 cursor-pointer"
          >
            {!email.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
            {email.read && <div className="h-2 w-2 shrink-0" />}
            <span className={`text-sm w-36 shrink-0 truncate ${!email.read ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              {email.from}
            </span>
            <span className={`text-sm shrink-0 ${!email.read ? "text-foreground" : "text-muted-foreground"}`}>
              {email.subject}
            </span>
            <span className="text-xs text-muted-foreground truncate flex-1 hidden md:block ml-2">
              — {email.preview}
            </span>
            <span className="text-xs text-muted-foreground shrink-0 ml-auto">
              {new Date(email.date).toLocaleDateString()}
            </span>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}
