const feedsEl = document.getElementById("feeds") as HTMLUListElement;
const itemsEl = document.getElementById("items") as HTMLUListElement;
const nameInput = document.getElementById("name") as HTMLInputElement;
const urlInput = document.getElementById("url") as HTMLInputElement;
const intervalInput = document.getElementById("interval") as HTMLInputElement;
const addBtn = document.getElementById("add") as HTMLButtonElement;

function renderFeeds(feeds: FeedConfigDTO[]): void {
  feedsEl.innerHTML = "";
  for (const f of feeds) {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.textContent = `${f.name} · ${Math.round(f.intervalMs / 1000)}s`;
    span.title = f.url;

    const btn = document.createElement("button");
    btn.textContent = "✕";
    btn.className = "remove";
    btn.onclick = async () => renderFeeds(await window.api.removeFeed(f.url));

    li.append(span, btn);
    feedsEl.append(li);
  }
}

addBtn.onclick = async () => {
  const url = urlInput.value.trim();
  if (!url) return;
  const name = nameInput.value.trim() || url;
  const seconds = Number(intervalInput.value) || 300;

  const feeds = await window.api.addFeed({ name, url, intervalMs: seconds * 1000 });
  nameInput.value = "";
  urlInput.value = "";
  renderFeeds(feeds);
};

window.api.onNewItem((item) => {
  const li = document.createElement("li");

  const a = document.createElement("a");
  a.textContent = item.title;
  a.href = "#";
  a.onclick = (e) => {
    e.preventDefault();
    if (item.link) void window.api.openLink(item.link);
  };

  const meta = document.createElement("div");
  meta.className = "meta";
  const when = item.isoDate ? " · " + new Date(item.isoDate).toLocaleString() : "";
  meta.textContent = item.feedName + when;

  li.append(a, meta);
  itemsEl.prepend(li);
});

void (async () => renderFeeds(await window.api.listFeeds()))();
