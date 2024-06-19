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
        };
        if(places.has(matchname)) throw new Error("duplicate name: "+matchname);
        places.set(matchname, thisplace);
    }
}

// console.log(places);

const missing_content = new Set<string>();
const one_ways = new Set<string>();
console.log("Places ("+places.size+"):");
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
    }).join(",");
    console.log(res);
}
console.log("One way connections ("+one_ways.size+"):");
for(const mb of one_ways.values()) console.log("- "+mb);
console.log("Missing Contents ("+missing_content.size+"):");
for(const link of missing_content.values()) console.log("- "+link);