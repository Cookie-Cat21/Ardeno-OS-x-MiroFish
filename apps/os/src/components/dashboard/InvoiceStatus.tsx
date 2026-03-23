import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { AnimatedNumber } from "@/components/MotionPrimitives";
import { Receipt } from "lucide-react";

export default function InvoiceStatus() {
  const [paid, setPaid] = useState(0);
  const [outstanding, setOutstanding] = useState(0);

  useEffect(() => {
    supabase
      .from("invoices")
      .select("amount, status")
      .then(({ data }) => {
        if (!data) return;
        let p = 0, o = 0;
        data.forEach((inv) => {
          const amt = Number(inv.amount) || 0;
          if (inv.status === "Paid") p += amt;
          else o += amt;
        });
        setPaid(p);
        setOutstanding(o);
      });
  }, []);

  const total = paid + outstanding;
  const paidPct = total > 0 ? (paid / total) * 100 : 0;
  const circumference = 2 * Math.PI * 36;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="glass-card p-6 relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground font-body font-medium">
          Invoices
        </p>
        <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(25 95% 62% / 0.08)' }}>
          <Receipt className="h-[18px] w-[18px] text-warning" />
        </div>
      </div>
      <div className="flex items-center gap-6">
        {/* Progress ring */}
        <div className="relative shrink-0">
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(260, 15%, 11%)" strokeWidth="6" />
            <motion.circle
              cx="40" cy="40" r="36" fill="none"
              stroke="hsl(142, 70%, 62%)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - (circumference * paidPct) / 100 }}
              transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
              transform="rotate(-90 40 40)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[13px] font-display font-semibold text-foreground">{Math.round(paidPct)}%</span>
          </div>
        </div>
        <div className="space-y-2">
          <div>
            <p className="text-[11px] text-muted-foreground font-body">Paid</p>
            <p className="text-lg font-display font-semibold text-success">$<AnimatedNumber value={paid} /></p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground font-body">Outstanding</p>
            <p className="text-lg font-display font-semibold text-warning">$<AnimatedNumber value={outstanding} /></p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
