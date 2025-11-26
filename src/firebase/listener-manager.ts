class ListenerManager {
  private listeners = new Map<string, () => void>();
  private maxConcurrentListeners = 5;

  async registerListener(key: string, setup: () => () => void): Promise<() => void> {
    while (this.listeners.size >= this.maxConcurrentListeners) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.listeners.has(key)) {
      return this.listeners.get(key)!;
    }

    const unsubscribe = setup();
    this.listeners.set(key, unsubscribe);

    return () => {
      this.listeners.delete(key);
      unsubscribe();
    };
  }

  cleanup() {
    this.listeners.forEach((unsub) => unsub());
    this.listeners.clear();
  }
}

export const listenerManager = new ListenerManager();
