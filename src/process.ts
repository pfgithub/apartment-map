// FOR DRAWING ON MAP:
// - all letters 3x3 (4x4 with whitespace around them)
// - we can put a bunch horizontal
// - everything should fit

const data = await Bun.file("data/DATA").text();
const lines = data.split("\n").filter(l => l.trim());

type Place = {
    id: string,
    links: string[],
};
const places = new Map<string, Place>();
const used_tlid_set = new Set();
let thisplace: Place | null = null;
for(const line of lines) {
    if(line.startsWith("- ")) {
        const cont = line.substring(2);
        thisplace!.links.push(cont);
    }else{
        const lm = line.match(/\[(.+?)\] (.+?):/);
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

const missing_content = new Set();
const one_ways = new Set();
console.log("Places ("+places.size+"):");
for(const [self_name, place] of places.entries()) {
    const res = "- "+place.id + ": " + place.links.map(link => {
        const linkres = places.get(link);
        if(linkres == null) {
            missing_content.add(link);
            return "??";
        }
        if(!linkres.links.includes(self_name)) {
            one_ways.add(self_name + " -> " + link);
        }
        return linkres.id;
    }).join(",");
    console.log(res);
}
console.log("One way connections ("+one_ways.size+"):");
for(const mb of one_ways.values()) console.log("- "+mb);
console.log("Missing Contents ("+missing_content.size+"):");
for(const link of missing_content.values()) console.log("- "+link);