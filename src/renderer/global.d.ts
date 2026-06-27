interface FeedConfigDTO {
  name: string;
  url: string;
  intervalMs: number;
}

interface NewItemDTO {
  feedName: string;
  title: string;
  link: string;
  isoDate?: string;
}

interface RssApi {
  listFeeds(): Promise<FeedConfigDTO[]>;
  addFeed(feed: FeedConfigDTO): Promise<FeedConfigDTO[]>;
  removeFeed(url: string): Promise<FeedConfigDTO[]>;
  openLink(url: string): Promise<void>;
  onNewItem(cb: (item: NewItemDTO) => void): void;
}

interface Window {
  api: RssApi;
}
