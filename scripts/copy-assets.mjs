import { mkdirSync, copyFileSync, existsSync } from "fs";
import { dirname } from "path";

const copies = [
  ["src/renderer/index.html", "dist/renderer/index.html"],
  ["assets/tray.png", "dist/assets/tray.png"],
];

for (const [from, to] of copies) {
  if (!existsSync(from)) continue;
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
}
