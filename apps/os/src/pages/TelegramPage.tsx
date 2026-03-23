import { useProjects } from '@/hooks/useProjects';
import { TelegramPanel } from '@/components/telegram/TelegramPanel';

export default function TelegramPage() {
  const { data: projects = [] } = useProjects();
  return (
    <div className="h-[calc(100vh-8rem)] animate-fade-in">
      <TelegramPanel projects={projects} />
    </div>
  );
}
