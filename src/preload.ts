import { contextBridge, ipcRenderer } from "electron";
import type { FeedConfig } from "./feedStore";
import type { NewItem } from "./watcher";

contextBridge.exposeInMainWorld("api", {
  listFeeds: (): Promise<FeedConfig[]> => ipcRenderer.invoke("feeds:list"),
  addFeed: (feed: FeedConfig): Promise<FeedConfig[]> => ipcRenderer.invoke("feeds:add", feed),
  removeFeed: (url: string): Promise<FeedConfig[]> => ipcRenderer.invoke("feeds:remove", url),
  openLink: (url: string): Promise<void> => ipcRenderer.invoke("item:open", url),
  onNewItem: (cb: (item: NewItem) => void): void => {
    ipcRenderer.on("item:new", (_e, item: NewItem) => cb(item));
  },
});
