type AwardNotice = { id: string; action: string; read: boolean; createdAt: string };

/** Initial history is silent. Only new, unread awards from this active account can alert. */
export function createAchievementDelivery(startedAt: number, persisted: readonly string[] = []) {
  let initialized = false;
  const seen = new Set(persisted.slice(-300));
  return {
    consume(items: readonly AwardNotice[]): string[] {
      const fresh: string[] = [];
      for (const item of items) {
        const isNew = !seen.has(item.id);
        seen.add(item.id);
        if (initialized && isNew && !item.read && item.action === "profile.achievement.earned"
          && Date.parse(item.createdAt) >= startedAt && fresh.length < 3) fresh.push(item.id);
      }
      initialized = true;
      while (seen.size > 300) seen.delete(seen.values().next().value!);
      return fresh;
    },
    seen: () => [...seen],
  };
}
