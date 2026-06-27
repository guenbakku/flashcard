import { closeDb } from './rxdb';

export function registerGracefulDbClosing() {
  const handleBeforeUnload = async (_event: BeforeUnloadEvent) => {
    closeDb();
  };

  onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload));
  onUnmounted(() => window.removeEventListener('beforeunload', handleBeforeUnload));
};
