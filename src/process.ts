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
for(const place of places.values()) {
    const res = place.id + ": " + place.links.map(link => {
        const linkres = places.get(link);
        if(linkres == null) {
            missing_content.add(link);
            return "??";
        }
        return linkres.id;
    }).join(",");
    console.log(res);
}
console.log("Missing Contents:");
for(const link of missing_content.values()) console.log("- "+link);