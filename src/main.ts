import {
  app,
  BrowserWindow,
  Notification,
  Tray,
  Menu,
  ipcMain,
  nativeImage,
  shell,
} from "electron";
import path from "path";
import { FeedStore, type FeedConfig } from "./feedStore";
import { Watcher, type NewItem } from "./watcher";

// Without this, Windows shows notifications from "electron.exe" instead of the app name.
if (process.platform === "win32") app.setAppUserModelId("com.vasyl.rssnotify");

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

const store = new FeedStore();
let watcher: Watcher;

function createWindow(): void {
  win = new BrowserWindow({
    width: 780,
    height: 620,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  void win.loadFile(path.join(__dirname, "renderer", "index.html"));
  win.on("ready-to-show", () => win?.show());

  // Closing the window hides it to the tray instead of quitting the app.
  win.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      win?.hide();
    }
  });
}

function setupTray(): void {
  const icon = nativeImage.createFromPath(path.join(__dirname, "assets", "tray.png"));
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip("RSS Notify");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Show", click: () => win?.show() },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ]),
  );
  tray.on("click", () => win?.show());
}

function notify(item: NewItem): void {
  if (Notification.isSupported()) {
    const n = new Notification({ title: item.feedName, body: item.title });
    n.on("click", () => {
      if (item.link) void shell.openExternal(item.link);
    });
    n.show();
  }
  win?.webContents.send("item:new", item); // mirror into the UI feed
}

function registerIpc(): void {
  ipcMain.handle("feeds:list", () => store.getFeeds());

  ipcMain.handle("feeds:add", async (_e, feed: FeedConfig) => {
    await store.addFeed(feed);
    watcher.schedule(feed);
    return store.getFeeds();
  });

  ipcMain.handle("feeds:remove", async (_e, url: string) => {
    watcher.unschedule(url);
    await store.removeFeed(url);
    return store.getFeeds();
  });

  ipcMain.handle("item:open", (_e, link: string) => shell.openExternal(link));
}

app.whenReady().then(async () => {
  await store.load();
  watcher = new Watcher(store, notify);
  registerIpc();
  createWindow();
  setupTray();
  watcher.start();
});

app.on("before-quit", () => {
  isQuitting = true;
  watcher?.stop();
});

// Stay in the tray even with no open windows.
app.on("window-all-closed", () => {
  /* intentionally a no-op */
});
