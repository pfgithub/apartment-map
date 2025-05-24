import {readFileSync, readdirSync} from "fs";
import {extname} from "path";

let res: string = "";

const all = readdirSync(import.meta.dir + "/viewer", {recursive: true}).filter(q => typeof q === "string").map(q => q.replaceAll("\\", "/"));
for(const file of all) {
    let contents: string;
    try {
        contents = readFileSync(import.meta.dir + "/viewer/" + file, "utf-8");
    }catch(e) {
        continue;
    }
    res += "# File `src/viewer/"+file+"`\n\n"
    res += "```"+extname(file).slice(1) + "\n";
    res += contents;
    res += "\n```\n\n";
}
console.log(res);