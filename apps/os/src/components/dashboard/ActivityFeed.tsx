import { AnimatePresence, motion } from 'framer-motion';
import { useActivity } from '@/context/ActivityContext';
import { ActivityItem } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  stage_change: 'bg-blue-400',
  review:       'bg-primary',
  telegram:     'bg-chart-2',
  github:       'bg-purple-400',
  create:       'bg-green-400',
  pdf:          'bg-pink-400',
  skill:        'bg-yellow-400',
  system:       'bg-muted',
};

function FeedItem({ item }: { item: ActivityItem }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.25 }}
      className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0"
    >
      {/* Dot */}
      <div className="mt-1.5 shrink-0">
        <div className={`h-2 w-2 rounded-full ${TYPE_COLORS[item.type] ?? 'bg-muted'}`} />
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-xs font-medium leading-snug">{item.title}</p>
        {item.description && (
          <p className="text-muted-foreground text-[11px] mt-0.5 truncate">{item.description}</p>
        )}
      </div>
      <span className="text-muted-foreground text-[10px] shrink-0 mt-0.5">
        {formatRelativeTime(item.timestamp)}
      </span>
    </motion.div>
  );
}

export function ActivityFeed() {
  const { activities, clearActivities } = useActivity();

  return (
    <div className="ardeno-panel rounded-xl p-5 flex flex-col gap-3 gold-border h-full">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-xs uppercase tracking-widest">Activity Feed</span>
        {activities.length > 0 && (
          <button
            onClick={clearActivities}
            className="text-muted-foreground hover:text-red-400 transition-colors"
            title="Clear feed"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-64 pr-1 space-y-0">
        <AnimatePresence mode="popLayout">
          {activities.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-muted-foreground text-xs text-center py-8"
            >
              No activity yet
            </motion.p>
          ) : (
            activities.map(item => <FeedItem key={item.id} item={item} />)
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
