import { app } from "electron";
import { promises as fs } from "fs";
import path from "path";

export interface FeedConfig {
  name: string;
  url: string;
  intervalMs: number;
}

interface PersistedState {
  feeds: FeedConfig[];
  seen: Record<string, string[]>; // key = feed url, value = seen item IDs
}

const SEEN_CAP = 500; // cap history growth per feed

export class FeedStore {
  private readonly file = path.join(app.getPath("userData"), "rss-state.json");
  private state: PersistedState = { feeds: [], seen: {} };

  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.file, "utf-8");
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      this.state = { feeds: parsed.feeds ?? [], seen: parsed.seen ?? {} };
    } catch {
      // first run — file does not exist yet
    }
  }

  async save(): Promise<void> {
    await fs.writeFile(this.file, JSON.stringify(this.state, null, 2), "utf-8");
  }

  getFeeds(): FeedConfig[] {
    return this.state.feeds;
  }

  async addFeed(feed: FeedConfig): Promise<void> {
    if (this.state.feeds.some((f) => f.url === feed.url)) return;
    this.state.feeds.push(feed);
    await this.save();
  }

  async removeFeed(url: string): Promise<void> {
    this.state.feeds = this.state.feeds.filter((f) => f.url !== url);
    delete this.state.seen[url];
    await this.save();
  }

  /** Returns true if the id is new for this feed. */
  markSeen(feedUrl: string, id: string): boolean {
    const set = (this.state.seen[feedUrl] ??= []);
    if (set.includes(id)) return false;
    set.push(id);
    if (set.length > SEEN_CAP) set.splice(0, set.length - SEEN_CAP);
    return true;
  }
}
