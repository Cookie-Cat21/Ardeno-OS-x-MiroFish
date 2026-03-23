import { useEffect, useState } from "react";
import { ExternalLink, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface DeployStatus {
  status: 'building' | 'ready' | 'failed';
  previewUrl: string | null;
  productionUrl: string | null;
  lastDeploy: string | null;
}

export function VercelStatusBadge({ projectId }: { projectId: string }) {
  const [data, setData] = useState<DeployStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/deploy-status`);
        const statusData = await res.json();
        setData(statusData);
      } catch (e) {
        console.error("Failed to fetch deploy status:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    // Poll every 30 seconds for live updates
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  if (loading) return <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />;

  const statusConfig = {
    building: { color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", icon: Loader2, label: "Building" },
    ready: { color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", icon: CheckCircle2, label: "Ready" },
    failed: { color: "text-rose-400 bg-rose-400/10 border-rose-400/20", icon: AlertCircle, label: "Failed" },
  };

  const current = statusConfig[data?.status || 'ready'];

  return (
    <div className="flex items-center gap-3">
      <Badge className={`${current.color} flex items-center gap-1.5 px-2 py-0.5`}>
        <current.icon className={`h-3 w-3 ${data?.status === 'building' ? 'animate-spin' : ''}`} />
        <span>{current.label}</span>
      </Badge>
      
      {data?.previewUrl && (
        <a 
          href={data.previewUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Preview
        </a>
      )}

      {data?.lastDeploy && (
        <span className="text-[9px] text-muted-foreground/60 hidden sm:flex items-center gap-1">
          <Clock className="h-2.5 w-2.5" />
          {new Date(data.lastDeploy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}
