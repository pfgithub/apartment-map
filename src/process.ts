// FOR DRAWING ON MAP:
// - all letters 3x3 (4x4 with whitespace around them)
// - we can put a bunch horizontal
// - everything should fit

const data: string = await Bun.file("data/DATA").text();
const lines = data.split("\n").map(l => l.trim()).filter(l => l);

type Link = {
    place_name: string,
    teleport: boolean,
    one_way: boolean,
};
type Place = {
    id: string,
    links: Link[],
    backlinks: string[],
};
const places = new Map<string, Place>();
const used_tlid_set = new Set();
let thisplace: Place | null = null;
for(const line of lines) {
    if(line.startsWith("- ")) {
        const cont = line.substring(2);
        thisplace!.links.push({
            place_name: cont,
            teleport: false,
            one_way: false,
        });
    }else if(line.startsWith("-> ")) {
        const cont = line.substring(3);
        thisplace!.links.push({
            place_name: cont,
            teleport: false,
            one_way: true,
        });
    }else{
        const lm = line.match(/^\[(.+?)\] (.+?):$/);
        if(!lm) throw new Error("Match failed: "+line);
        const matchnum = lm![1]!;
        const matchnumsplit = matchnum.split(" ");
        const matchname = lm![2]!;
        const tlid = matchnumsplit[0];
        if(used_tlid_set.has(tlid)) throw new Error("duplicate tlid: "+tlid);
        used_tlid_set.add(tlid);
        thisplace = {
            id: tlid,
            links: [],
            backlinks: [],
        };
        if(places.has(matchname)) throw new Error("duplicate name: "+matchname);
        places.set(matchname, thisplace);
    }
}
for(const [placename, place] of places.entries()) {
    for(const link of place.links) {
        const rv = places.get(link.place_name);
        if(!rv) continue;
        rv.backlinks.push(placename);
    }
}

// console.log(places);

const places_strs: string[] = [];
const missing_content = new Set<string>();
const one_ways = new Set<string>();
for(const [self_name, place] of places.entries()) {
    const res = "- "+place.id + ": " + place.links.map(link => {
        const linkres = places.get(link.place_name);
        if(linkres == null) {
            missing_content.add(link.place_name);
            return "??";
        }
        const bidi = linkres.links.find(itm => itm.place_name === self_name);
        if(bidi && link.one_way) throw new Error("bidi link marked one-way: "+self_name +" <-> "+link);
        if(!bidi && !link.one_way) {
            one_ways.add(self_name + " -> " + link.place_name);
        }
        return linkres.id;
    }).sort().join(",");
    places_strs.push(res);
}
console.log("Places ("+places_strs.length+"):");
for(const place of places_strs.sort()) console.log(place);
if(one_ways.size > 0) {
    console.log("One way connections ("+one_ways.size+"):");
    for(const mb of one_ways.values()) console.log("- "+mb);
}
if(missing_content.size > 0) {
    console.log("Missing Contents ("+missing_content.size+"):");
    for(const link of missing_content.values()) console.log("- "+link);
}

// cmdgen
type Color = "black" | "dark_blue" | "dark_green" | "dark_gray" | "gray" | "green" | "red";
type ClickEvent = {action: "change_page", value: `${number}`};
type HoverEvent = {action: "show_text", contents: string};
type TextItm = {
    text: string,
    underlined?: boolean,
    color?: Color,
    clickEvent?: ClickEvent,
    hoverEvent?: HoverEvent,
};
type Text = string | TextItm;
type BookLine = Text[];
type BookPage = BookLine[];
const bookpages: BookPage[] = [];
function addtext(text: Text[]) {
    if(bookpages.length === 0) bookpages.push([]);
    const lastpage = bookpages[bookpages.length - 1];
    if(lastpage.length === 0) lastpage.push([]);
    const lastsegment = lastpage[lastpage.length - 1];
    lastsegment.push(...text);
}
function pagebreak() {
    bookpages.push([]);
}
function cmp(a: string, b: string): -1 | 0 | 1 {
    return a > b ? 1 : a === b ? 0 : -1;
}
let link_values: {ce: TextItm, link: string}[] = [];
const page_results = new Map<string, number>();
function getlink(place: string, text: string, color: Color): TextItm {
    const ce: TextItm = {
        text: text,
        color: color === "black" ? undefined : color,
        // hoverEvent: {
        //     action: "show_text",
        //     contents: link.place_name,
        // },
    };
    link_values.push({ce, link: place});
    return ce;
}

const sortedplaces = [...places.entries()].sort((a, b) => cmp(a[0], b[0]));
const outsideindex = sortedplaces.findIndex(([a]) => a === "Outside");
sortedplaces.unshift(...sortedplaces.splice(outsideindex, 1));
addtext(["Table of Contents:\n"]);
for(const [i, [self_name, place]] of sortedplaces.entries()) {
    if(i !== 0) addtext([", "]);
    addtext([getlink(self_name, place.id, "black")]);
}
for(const [self_name, place] of sortedplaces) {
    pagebreak();
    addtext([{
        text: "[H] ",
        clickEvent: {
            action: "change_page",
            value: "0",
        },
    }, self_name]);
    const backlinks_only = new Set(place.backlinks);
    const fwdlinks_only = new Set(place.links.map(link => link.place_name));
    const bothlinks = new Set<string>();
    for(const backlink of backlinks_only) {
        if(fwdlinks_only.has(backlink)) {
            backlinks_only.delete(backlink);
            fwdlinks_only.delete(backlink);
            bothlinks.add(backlink);
        }
    }


    for(const link of [...backlinks_only].sort()) {
        addtext(["\n<-  ",getlink(link, link, "dark_gray")]);
    }
    for(const link of [...bothlinks].sort()) {
        addtext(["\n<-> ",getlink(link, link, "dark_blue")]);
    }
    for(const link of [...fwdlinks_only].sort()) {
        addtext(["\n -> ",getlink(link, link, "red")]);
    }
    page_results.set(self_name, bookpages.length);
}
for(const link_value of link_values) {
    const resnum = page_results.get(link_value.link);
    if(resnum != null) {
        link_value.ce.clickEvent = {
            action: "change_page",
            value: `${resnum}`,
        };
    }else{
        // :/
        link_value.ce.underlined = undefined;
    }
}

let rescmd = "/give @p written_book[written_book_content={";
rescmd += "pages:[";
for(const [i, page] of bookpages.entries()) {
    if(i !== 0) rescmd += ",";
    let strpg = JSON.stringify(JSON.stringify(page));
    strpg = strpg.substring(1, strpg.length - 1);
    strpg = strpg.replaceAll("\\\"", "\"");
    strpg = strpg.replaceAll("'", "\\'");
    strpg = "'" + strpg + "'";
    rescmd += strpg;
}
rescmd += "]";
rescmd += ",title:"+JSON.stringify("Appt Swites Map 1.0");
rescmd += ",author:"+JSON.stringify("NovaWays: Find Your Way™");
rescmd += "}]";
if((true)) {
    await Bun.write("dist/cmd", rescmd, {makePath: true});
    console.log((((rescmd.length / 32500) * 100) |0)+"%");
    if(rescmd.length > 32500) {
        console.log("rescmd too long:", rescmd.length);
    }else{
    }
}

type GraphEntry = {
    links: string[],
    route: string[] | null,
};
type Graph = Map<string, GraphEntry>;
type PathfindCfg = {
    disallow: Set<string>,
};
function pathfind(start: string, graph: Graph, cfg: PathfindCfg) {
    const toprocess: string[][] = [];
    toprocess.push([start]);
    while(toprocess.length > 0) {
        const itm0 = toprocess.shift()!;
        pathfindStep(itm0, graph, toprocess, cfg);
    }
}
function pathfindStep(route: string[], graph: Graph, toprocess: string[][], cfg: PathfindCfg) {
    const itm = route[route.length - 1];
    const node = graph.get(itm);
    if(node != null && (node.route == null || route.length < node.route.length)) {
        node.route = route;
        for(const link of node.links) {
            if(cfg.disallow.has(link)) continue;
            toprocess.push([...route, link]);
        }
    }
}

function makePfGraph(): Graph {
    const res: Graph = new Map();
    for(const [pn, pv] of places.entries()) {
        res.set(pn, {
            links: pv.links.map(link => link.place_name),
            route: null,
        });
    }
    return res;
}

{
    const result = new Map<string, {route_in: string[], route_out: string[]}>();
    const START = "Front Entry";
    const cfg: PathfindCfg = {
        disallow: new Set(["Outside", "Waterways"]),
    };
    const graph = makePfGraph();
    pathfind(START, graph, cfg);
    console.log(graph);
    for(const [name, val] of graph) {
        const sgraph = makePfGraph();
        pathfind(name, sgraph, cfg);
        const feres = sgraph.get(START);

        result.set(name, {
            route_in: val.route ?? [],
            route_out: feres?.route ?? [],
        });
    }

    console.log(result);
}

// NEXT STEP:
// - for every room:
//   - find the closest path from Front Entry to the room
//   - find the closest path from the room to Front Entry
//   - do not go through Outside or Waterways
// - or don't do this, just give people the book