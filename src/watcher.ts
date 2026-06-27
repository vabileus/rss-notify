import Parser from "rss-parser";
import type { FeedConfig, FeedStore } from "./feedStore";

export interface NewItem {
  feedName: string;
  title: string;
  link: string;
  isoDate?: string;
}

export class Watcher {
  private readonly parser = new Parser();
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly store: FeedStore,
    private readonly onNew: (item: NewItem) => void,
  ) {}

  start(): void {
    for (const feed of this.store.getFeeds()) this.schedule(feed);
  }

  stop(): void {
    for (const t of this.timers.values()) clearInterval(t);
    this.timers.clear();
  }

  schedule(feed: FeedConfig): void {
    void this.poll(feed, true); // silent priming pass — no notification flood
    const timer = setInterval(() => void this.poll(feed, false), feed.intervalMs);
    this.timers.set(feed.url, timer);
  }

  unschedule(url: string): void {
    const timer = this.timers.get(url);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(url);
    }
  }

  private async poll(feed: FeedConfig, silent: boolean): Promise<void> {
    try {
      const parsed = await this.parser.parseURL(feed.url);
      let changed = false;

      for (const item of parsed.items) {
        const id = item.guid ?? item.link ?? item.title;
        if (!id) continue;
        if (!this.store.markSeen(feed.url, id)) continue;

        changed = true;
        if (silent) continue;

        this.onNew({
          feedName: feed.name || parsed.title || feed.url,
          title: item.title ?? "(untitled)",
          link: item.link ?? "",
          isoDate: item.isoDate,
        });
      }

      if (changed) await this.store.save();
    } catch (err) {
      console.error(`[${feed.name}] feed error:`, err);
    }
  }
}
