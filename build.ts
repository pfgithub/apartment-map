import { renameSync, rmdirSync } from "fs";
import { newdata } from "./src/process";
import { genViewerPrompt } from "./src/viewerprompt";
import tailwind from "bun-plugin-tailwind";
import {relative} from "path";

await rmdirSync(import.meta.dirname + "/dist", {recursive: true});
const result = await Bun.build({
    entrypoints: ["./src/viewer/viewer.html"],
    outdir: import.meta.dirname + "/dist",
    plugins: [tailwind],
    minify: true,
    target: "browser",
    sourcemap: "linked",
});
async function addf(p: string, v: string) {
  await Bun.write(p, v);
  result.outputs.push({path: p, kind: "asset", size: Buffer.byteLength(v, "utf-8")} as any);
}
await addf(import.meta.dirname + "/dist/viewerprompt.txt", genViewerPrompt());
await addf(import.meta.dirname + "/dist/root.json", JSON.stringify(newdata));
await renameSync(import.meta.dirname + "/dist/viewer.html", import.meta.dirname + "/dist/404.html");
await Bun.write(import.meta.dirname + "/dist/index.html", Bun.file(import.meta.dirname + "/dist/404.html"));

const formatFileSize = (bytes: number): string => {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

const outputTable = result.outputs.map(output => ({
  "File": relative(process.cwd(), output.path),
  "Type": output.kind,
  "Size": formatFileSize(output.size),
}));

console.table(outputTable);