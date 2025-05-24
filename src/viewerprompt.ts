import {readFileSync, readdirSync} from "fs";
import {extname} from "path";

export function genViewerPrompt(): string {
    let res: string = "";

    const all = readdirSync(import.meta.dir + "/viewer", {recursive: true}).filter(q => typeof q === "string").map(q => q.replaceAll("\\", "/"));
    // let has_icon_msg = false;
    for(const file of all) {
        // if(file.includes("/icons/")) {
        //     if(!has_icon_msg) {
        //         has_icon_msg = true;
        //         res += "# File `src/icons/...`\n";
        //         res += "Omitted\n\n";
        //     }
        //     continue;
        // }
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
    return res;
}