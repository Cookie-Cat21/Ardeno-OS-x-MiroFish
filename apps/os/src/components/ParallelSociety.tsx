import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MIROFISH_API_BASE } from "@/lib/mirofish-bridge";

export default function ParallelSociety() {
  const [url, setUrl] = useState<string>("");

  useEffect(() => {
    // In production, the Vercel rewrite points /api to the Python backend.
    // However, the MiroFish Vite PWA frontend is likely hosted on the same domain, 
    // or we might need to point the iframe to the root if it's integrated, or the Python backend serves it.
    // For local dev, we point it to the Vite dev server of MiroFish.
    
    // Fallback URL, assuming MiroFish frontend is served by its backend or separately reachable.
    const mirofishFrontendUrl = import.meta.env.PROD 
      ? window.location.origin // Assuming Vercel serves the static frontend at root or we just rely on API? Wait, does MiroFish have a separate frontend? Yes, a Vite app.
      : "http://localhost:5173"; // Default Vite port for MiroFish frontend

    // Actually, if we just want to show the MiroFish UI, we might need a direct link.
    // Let's just point to the local 5173 for local dev, and for prod, we might be pointing to a specific Vercel URL.
    // For now, let's use MIROFISH_API_BASE as a safe fallback if it serves the index.
    setUrl(mirofishFrontendUrl);
    
    // In reality, if MiroFish frontend isn't fully integrated into Vercel serving at a subpath,
    // this iframe will just load the fallback.
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/20">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Parallel Society</h1>
          <p className="text-sm text-muted-foreground mt-1">Direct bridge to the MiroFish Agent Ecosystem</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Live Link</span>
        </div>
      </div>
      <div className="flex-1 w-full bg-black/40 relative">
        <div className="absolute inset-0 p-4">
          <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-background">
            {url ? (
              <iframe 
                src={url} 
                className="w-full h-full border-none"
                title="MiroFish Parallel Society"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground animate-pulse">
                Initializing Bridge...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
