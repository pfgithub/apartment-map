// FOR DRAWING ON MAP:
// - all letters 3x3 (4x4 with whitespace around them)
// - we can put a bunch horizontal
// - everything should fit

import data from "../data/DATA.txt" with {type: "text"};
import imgdata from "../data/images.json";
import type { PlannerConnection, PlannerGraph, PlannerPlaceShortcode } from "./planner/types";
import type { BuildingID, ConnectionID, HallID, RoomID, Root } from "./viewer/types";
const lines = data.split("\n").map(l => l.trim()).filter(l => l);

type Link = {
    place_name: string,
    teleport: boolean,
    one_way: boolean,
};
type Place = {
    id: string,
    matchnum: string,
    links: Link[],
    backlinks: string[],
    group: string,
};
const places = new Map<string, Place>();
const used_tlid_set = new Set();
let thisplace: Place | null = null;
let thisgroup: string = "";
for(const line of lines) {
    if(line.startsWith("## ")) {
        const cont = line.substring(3);
        thisgroup = cont;
    }else if(line.startsWith("- ")) {
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
        const lm = line.match(/^\[(.+?)\] (.+?):?$/);
        if(!lm) throw new Error("Match failed: "+line);
        const matchnum = lm![1]!;
        const matchnumsplit = matchnum.split(" ");
        const matchname = lm![2]!;
        const tlid = matchnumsplit[0];
        if(used_tlid_set.has(tlid)) throw new Error("duplicate tlid: "+tlid);
        used_tlid_set.add(tlid);
        thisplace = {
            id: tlid,
            matchnum: matchnumsplit.slice(1).join(" "),
            links: [],
            backlinks: [],
            group: thisgroup,
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
// console.log("Places ("+places_strs.length+"):");
// for(const place of places_strs.sort()) console.log(place);
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
    for(const bit of text) addonetext(bit);
}
function addonetext(text: Text) {
    if(bookpages.length === 0) bookpages.push([]);
    const lastpage = bookpages[bookpages.length - 1];
    if(lastpage.length === 0) lastpage.push([]);
    const lastsegment = lastpage[lastpage.length - 1];
    const lastbit_i = lastsegment.length - 1;
    if(typeof lastsegment[lastbit_i] === "string" && typeof text === "string") {
        lastsegment[lastbit_i] += text;
    }else{
        lastsegment.push(text);
    }
}
function pagebreak() {
    bookpages.push([]);
}
function cmp(a: string, b: string): -1 | 0 | 1 {
    return a > b ? 1 : a === b ? 0 : -1;
}
let link_values: {ce: TextItm, link: string}[] = [];
const page_results = new Map<string, number>();
function getlink(place: string, text: string): TextItm {
    const ce: TextItm = {
        text: text,
        // hoverEvent: {
        //     action: "show_text",
        //     contents: link.place_name,
        // },
    };
    link_values.push({ce, link: place});
    return ce;
}

const colors = {
    "red": "§4",
    "light_red": "§c",
    "gold": "§6",
    "yellow": "§e",
    "dark_green": "§2",
    "lime": "§a",
    "cyan": "§b",
    "dark_cyan": "§3",
    "blue": "§1",
    "light_blue": "§9",
    "magenta": "§d",
    "purple": "§5",
    "white": "§f",
    "light": "§7",
    "dark": "§8",
    "black": "§0",
    "bold": "§l",
    "underline": "§n",
    "italic": "§o",
    "magic": "§k",
    "strikethrough": "§m",
    "reset": "§r",
};

const sortedplaces = [...places.entries()].sort((a, b) => cmp(a[0], b[0]));
const outsideindex = sortedplaces.findIndex(([a]) => a === "Outside");
sortedplaces.unshift(...sortedplaces.splice(outsideindex, 1));
addtext([colors.bold + "Table of Contents:\n"]);
for(const [i, [self_name, place]] of sortedplaces.entries()) {
    addtext([getlink(self_name, (i !== 0 ? " " : "") + place.id)]);
    // there can be 84 on the first page, leaving room for the last
    // line to say "continued on next page", then 91 on
    // subsequent pages
    // there's a limit of 100 pages in a book though so :/
    // we can start to put multiple entries on one page if we need
    //  (and remove the newline betwen the title and the links)
}

for(const [self_name, place] of sortedplaces) {
    pagebreak();
    addtext([{
        // text: "["+colors.blue+colors.underline+place.id+colors.reset+"] "+self_name,
        text: colors.bold + place.id,
        clickEvent: {
            action: "change_page",
            value: "0",
        },
    }," · " + self_name + "\n"]);
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

    const getid = (place: string): string => {
        const pgr = places.get(place);
        if(pgr == null) throw new Error("missing "+place);
        return pgr.id;
    }

    for(const link of [...backlinks_only].sort()) {
        addtext([getlink(link, "\n<-  " + colors.dark + colors.italic + getid(link))]);
    }
    for(const link of [...bothlinks].sort()) {
        addtext([getlink(link,"\n<-> " + colors.blue + getid(link))]);
    }
    for(const link of [...fwdlinks_only].sort()) {
        addtext([getlink(link,"\n -> " + colors.red + getid(link))]);
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
    strpg = strpg.replaceAll("§", "\\\\u00A7");
    strpg = "'" + strpg + "'";
    rescmd += strpg;
}
rescmd += "]";
rescmd += ",title:"+JSON.stringify("Swites Appt Mints Map 1.1");
rescmd += ",author:"+JSON.stringify("NovaWays: Find Your Way™");
rescmd += "}]";

type GraphEntry = {
    links: string[],
    route: string[] | null,
};
type Graph = Map<string, GraphEntry>;
type PathfindCfg = {
    disallow: Set<string>,
    allow_monodi: boolean,
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
        if(cfg.disallow.has(itm) && route.length > 1) return;
        for(const link of node.links) {
            if(!cfg.allow_monodi) {
                const backlink = graph.get(link);
                if(!backlink?.links.includes(itm)) {
                    break;
                }
            }
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

let pathfinding_results;
{
    const result = new Map<string, {route_in: string[], route_out: string[]}>();
    const START = "Front Entry";
    const cfg: PathfindCfg = {
        disallow: new Set(["Outside", "Waterways"]),
        allow_monodi: false,
    };
    const graph_bidi = makePfGraph();
    pathfind(START, graph_bidi, cfg);
    const graph_monodi = makePfGraph();
    pathfind(START, graph_monodi, {...cfg, allow_monodi: true});
    for(const [name, val] of graph_bidi) {
        const val_mono = graph_monodi.get(name);
        const sgraph = makePfGraph();
        pathfind(name, sgraph, cfg);
        const sgraph_mono = makePfGraph();
        pathfind(name, sgraph_mono, {...cfg, allow_monodi: true});
        const feres = sgraph.get(START);
        const feres_mono = sgraph_mono.get(START);

        result.set(name, {
            route_in: val.route ?? val_mono?.route ?? [],
            route_out: feres?.route ?? feres_mono?.route ?? [],
        });
    }

    pathfinding_results = [...result.entries()];
    if((false)) {
        console.log("Pathfinding results", result);
    }
}

type ResGraphNode = {
    id: string,
    group?: string,
};
type ResGraphLink = {
    source: string,
    target: string,
    value: number,
};
type ResGraph = {
    nodes: ResGraphNode[],
    links: ResGraphLink[],
};

const res_graph: ResGraph = {
    nodes: [],
    links: [],
};

for(const [self_name, place] of sortedplaces) {
    res_graph.nodes.push({
        id: self_name,
        group: "0",
    });

    const fwdlinks = new Set(place.links.map(link => link.place_name));
    
    for(const link of fwdlinks) {
        res_graph.links.push({
            source: self_name,
            target: link,
            value: 1.0,
            // unfortunately, the graph view optimizes for line width
            // but i want the graph to optimize for least overlapping
            //    edges
        });
    }
}

export const graph_json = res_graph;
export const cmd_mc = rescmd;
export const sortedplaces_json = Object.fromEntries(sortedplaces);
export const pathfinding_results_json = Object.fromEntries(pathfinding_results);

export const planner_graph: PlannerGraph = {
    places: {},
    routes: [],
};
const getPlaceForName = (name: string): Place => {
    return sortedplaces.find(p => p[0] === name)![1];
}
const getIdForName = (name: string): PlannerPlaceShortcode => {
    return sortedplaces.find(p => p[0] === name)![1].id as PlannerPlaceShortcode;
}
for(const node of res_graph.nodes) {
    planner_graph.places[getIdForName(node.id)] = {title: node.id, num_rooms: getPlaceForName(node.id).matchnum, group: getPlaceForName(node.id).group};
}
for(const conn of res_graph.links) {
    const route: PlannerConnection = {from: getIdForName(conn.source), to: getIdForName(conn.target), seconds: conn.value};
    if(route.to === "WW" || route.to === "W2") {
        route.seconds *= 100; // no one likes getting wet
    }
    if(route.from === "FE" && route.to === "OS" || route.from === "CM" && route.to === "OS") {
        route.seconds *= 20; // don't go outside unless you really have to
    }
    planner_graph.routes.push(route);
}
export const dgdata = planner_graph.routes.map(link => link.from + " " + link.to).join("\n");

export const newdata: Root = {
    buildings: {
        ["apts" as BuildingID]: {
            id: "apts" as BuildingID,
            name: "Appts, Swites, Inc.",
            description: "No description.",
            image: {url: "/200x150.png", alt: "", width: 200, height: 150},

            relations: {halls: []},
        },
        ["outside" as BuildingID]: {
            id: "outside" as BuildingID,
            name: "Outside",
            description: "The great outdoors",
            image: {url: "/200x150.png", alt: "", width: 200, height: 150},

            relations: {halls: []},
        },
        ["paths" as BuildingID]: {
            id: "paths" as BuildingID,
            name: "Paths",
            description: "No description.",
            image: {url: "/200x150.png", alt: "", width: 200, height: 150},

            relations: {halls: []},
        },
    },
    halls: {},
    connections: {},
    rooms: {},
    points_of_interest: {},
};
function addRoom(id: HallID, room_num: number) {
    const room_id = (id + "-" + room_num) as RoomID;
    newdata.rooms[room_id] = {
        id: room_id,
        name: room_id,
        description: "No description",
        image: {url: "/200x150.png", alt: "", width: 200, height: 150},

        price: 100,
        available: true,
        layout: {
            bedrooms: 1,
            bathrooms: 0,
            has_balcony: false,
            has_kitchen: false,
            has_window: false,
        },
        relations: {
            hall: id,
        }
    };
    newdata.halls[id].relations.rooms.push(room_id);
}
for(const [id, data] of Object.entries(planner_graph.places)) {
    const img = (imgdata as any)[data.title];
    newdata.halls[id as HallID] = {
        id: id as HallID,
        name: data.title,
        description: "No description.",
        image: img
            ? {url: "https://lfs.pfg.pw/source/"+img.uuid+".png", thumbhash: img.thumbhash, width: img.width, height: img.height, alt: ""}
            : {url: "/200x150.png", alt: "", width: 200, height: 150, thumbhash: ""},

        relations: {
            building: data.group as BuildingID,
            rooms: [],
            connections: [],
            reverse_connections: [],
        },
    };
    newdata.buildings[data.group as BuildingID].relations.halls.push(id as HallID);
    if(data.num_rooms === "") {
        // nothing to do
    }else if(data.num_rooms === "1") {
        addRoom(id as HallID, 1);
    }else{
        const dsplit = data.num_rooms.split("-").map(q => +q);
        if(dsplit.length === 2){
            for(let i = dsplit[0]; i <= dsplit[1]; i++) {
                addRoom(id as HallID, i);
            }
        }else{
            console.log("failed to parse num_rooms: "+data.num_rooms);
        }
    }
}
for(const conn of planner_graph.routes) {
    const conn_id = (conn.from + "-" + conn.to) as ConnectionID;
    newdata.connections[conn_id] = {
        id: conn_id,
        name: conn_id,
        seconds: conn.seconds,
        relations: {
            from: conn.from as string as HallID,
            to: conn.to as string as HallID,
        },
    };
    newdata.halls[conn.from as string as HallID].relations.connections.push(conn_id);
    newdata.halls[conn.to as string as HallID].relations.reverse_connections.push(conn_id);
}
/*
Add the ability to edit names, descriptions, and images. Images should be uploaded to bunny cdn for delivery.
*/

if(import.meta.main) {
    await Bun.write("dist/cmd", rescmd, {createPath: true});
    console.log((((rescmd.length / 32500) * 100) |0)+"%");
    if(rescmd.length > 32500) {
        console.log("rescmd too long:", rescmd.length+" ("+(rescmd.length - 32500)+" over)");
    }else{
    }
}

// GRAPHS:
// try graphviz
// ooh graphviz does trees
// https://graphviz.org/Gallery/directed/psg.html
// I wanted this for qxc/customvariants
// 
// @dagrejs/dagre
// - does straight line crossing minimization
// - look at its wiki for how to actually use

// NEXT STEP:
// - for every room:
//   - find the closest path from Front Entry to the room
//   - find the closest path from the room to Front Entry
//   - do not go through Outside or Waterways
// - or don't do this, just give people the book
// TODO WITH PATHFINDING:
// - prefer bidi pathways