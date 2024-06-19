const data = await Bun.file("data/DATA").text();
const lines = data.split("\n").filter(l => l.trim());

type Place = {
    id: string,
    links: string[],
};
const places = new Map<string, Place>();
let thisplace: Place | null = null;
for(const line of lines) {
    if(line.startsWith("- ")) {
        const cont = line.substring(2);
        thisplace!.links.push(cont);
    }else{
        const lm = line.match(/\[(.+?)\] (.+?):/);
        const matchrmnum = lm![1]!;
        const matchname = lm![2]!;
        thisplace = {
            id: matchrmnum,
            links: [],
        };
        if(places.has(matchname)) throw new Error("duplicate name: "+matchname);
        places.set(matchname, thisplace);
    }
}

console.log(places);