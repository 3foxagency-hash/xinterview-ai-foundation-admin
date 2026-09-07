/**
 * A Map that mirrors itself to localStorage so mock/demo data survives a
 * page refresh or a direct URL visit — without a real backend, every
 * hard navigation would otherwise reset the module's in-memory Maps and
 * make jobs, questions, team members, etc. vanish.
 *
 * Only the subset of Map's API these mock stores actually use is
 * implemented (get/set/has/size/values) — extend as needed.
 */
export class PersistentMap<V> {
  private map: Map<string, V>;
  private storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
    this.map = new Map(PersistentMap.load<V>(storageKey));
  }

  private static load<V>(key: string): [string, V][] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as [string, V][]) : [];
    } catch {
      return [];
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify([...this.map]));
    } catch {
      // Storage full or unavailable (private browsing) — fail silently,
      // the in-memory copy still works for the rest of this session.
    }
  }

  get(key: string): V | undefined {
    return this.map.get(key);
  }

  set(key: string, value: V): this {
    this.map.set(key, value);
    this.persist();
    return this;
  }

  has(key: string): boolean {
    return this.map.has(key);
  }

  get size(): number {
    return this.map.size;
  }

  values(): IterableIterator<V> {
    return this.map.values();
  }
}
