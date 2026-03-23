import { Shield, AlertTriangle, ShieldCheck, Loader2, CheckCircle } from 'lucide-react';
import { useSecurityScans, useRunSecurityScan } from '@/hooks/useSecurityScans';
import { useProjects } from '@/hooks/useProjects';
import { formatRelativeTime, cn } from '@/lib/utils';

const SEVERITY_STYLES = {
  critical: 'bg-red-400/20 text-red-300 border-red-400/30',
  high:     'bg-orange-400/20 text-orange-300 border-orange-400/30',
  medium:   'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
  low:      'bg-blue-400/20 text-blue-300 border-blue-400/30',
};

export default function SecurityOverviewPage() {
  const { data: scans = [], isLoading } = useSecurityScans();
  const { data: projects = [] }         = useProjects();
  const runScan = useRunSecurityScan();

  const totalVulns    = scans.reduce((s, sc) => s + sc.vulns_found, 0);
  const cleanScans    = scans.filter(sc => sc.vulns_found === 0).length;
  const criticalCount = scans.flatMap(sc => sc.details).filter(d => d.severity === 'critical').length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="ardeno-panel rounded-xl p-4 border border-border text-center">
          <p className="text-red-400 text-2xl font-bold font-display">{totalVulns}</p>
          <p className="text-muted-foreground text-xs">Total Vulns</p>
        </div>
        <div className="ardeno-panel rounded-xl p-4 border border-border text-center">
          <p className="text-red-400 text-2xl font-bold font-display">{criticalCount}</p>
          <p className="text-muted-foreground text-xs">Critical</p>
        </div>
        <div className="ardeno-panel rounded-xl p-4 border border-border text-center">
          <p className="text-green-400 text-2xl font-bold font-display">{cleanScans}</p>
          <p className="text-muted-foreground text-xs">Clean Scans</p>
        </div>
      </div>

      {/* Run scan */}
      <div className="ardeno-panel rounded-xl p-5 border border-border space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <p className="text-foreground text-sm font-semibold">Run Security Scan</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {projects.filter(p => ['Build','Security','Deploy'].includes(p.stage)).map(p => (
            <div key={p.id} className="flex items-center justify-between rounded-lg bg-card-3 border border-border px-3 py-2.5">
              <div>
                <p className="text-foreground text-sm font-medium">{p.title}</p>
                <p className="text-muted-foreground text-[11px]">{p.stage} · Risk: {p.risk_score}%</p>
              </div>
              <button
                onClick={() => runScan.mutate(p.id)}
                disabled={runScan.isPending}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
              >
                {runScan.isPending
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Shield className="h-3.5 w-3.5" />
                }
                Scan
              </button>
            </div>
          ))}
          {projects.filter(p => ['Build','Security','Deploy'].includes(p.stage)).length === 0 && (
            <p className="text-muted-foreground text-sm col-span-2">
              No projects in Build / Security / Deploy stage to scan.
            </p>
          )}
        </div>
      </div>

      {/* Scan history */}
      <div className="ardeno-panel rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-muted-foreground text-xs uppercase tracking-widest">Scan History</p>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-2">
            {[1,2,3].map(i => <div key={i} className="h-16 rounded shimmer" />)}
          </div>
        ) : scans.length === 0 ? (
          <div className="py-12 text-center">
            <ShieldCheck className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No scans yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {scans.map(scan => {
              const project = projects.find(p => p.id === scan.project_id);
              return (
                <div key={scan.id} className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-foreground text-sm font-medium">
                        {project?.title ?? scan.project_id.slice(0, 8)}
                      </p>
                      <p className="text-muted-foreground text-xs">{formatRelativeTime(scan.scan_timestamp)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {scan.vulns_found === 0 ? (
                        <span className="flex items-center gap-1 text-green-400 text-xs">
                          <CheckCircle className="h-3.5 w-3.5" /> Clean
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-400 text-xs">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {scan.vulns_found} issue{scan.vulns_found > 1 ? 's' : ''}
                          {scan.risk_delta > 0 && <span className="text-muted-foreground ml-1">+{scan.risk_delta}% risk</span>}
                        </span>
                      )}
                    </div>
                  </div>

                  {scan.details.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {scan.details.map((vuln, i) => (
                        <span
                          key={i}
                          className={cn(
                            'text-[10px] font-medium px-2 py-0.5 rounded border',
                            SEVERITY_STYLES[vuln.severity]
                          )}
                          title={vuln.description}
                        >
                          {vuln.type} ({vuln.severity})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
