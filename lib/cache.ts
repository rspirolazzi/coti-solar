type Entry<T> = { value: T; expiresAt: number };

export class TtlCache<T> {
  private entries = new Map<string, Entry<T>>();
  constructor(private readonly maxEntries = 250) {}

  get(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number) {
    if (this.entries.size >= this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest) this.entries.delete(oldest);
    }
    this.entries.set(key, { value, expiresAt: Date.now() + ttlMs });
  }
}
