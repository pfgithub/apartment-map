import {sortedplaces_json} from "./src/process";
import { Graph as AntvGraph } from "@antv/graphlib";
import { FruchtermanLayout } from "@antv/layout";

type Graph = {
    nodes: Record<string, Node>,
    links: Link[],
};
type Link = {
    from: string,
    to: string,
    bidirectional: boolean,
    cost: number,
};
type Node = {
    x: number,
    y: number,
};

const graph: Graph = {
    nodes: {},
    links: [],
};

// First create nodes and links in our format
let i = 0;
for(const [name, value] of Object.entries(sortedplaces_json)) {
    const angle = (i * 2 * Math.PI) / Object.keys(sortedplaces_json).length;
    graph.nodes[name] = {
        x: 500 + 1000 * Math.cos(angle),
        y: 500 + 1000 * Math.sin(angle),
    };
    for(const link of value.links) {
        const prev_link = graph.links.find(l => (l.from === link.place_name && l.to === name));
        if(prev_link) {
            prev_link.bidirectional = true;
        }else{
            graph.links.push({
                from: name,
                to: link.place_name,
                bidirectional: false,
                cost: 1,
            });
        }
    }
    i += 1;
}

console.time("force layout");

// Convert to @antv/graphlib format
const antvGraph = new AntvGraph({
    nodes: Object.entries(graph.nodes).map(([id, value]) => ({id, data: {}})),
    edges: graph.links.map((link, i) => ({id: "" + i, source: link.from, target: link.to, data: {}}))
});

// Create and run Fruchterman layout
const fruchtermanLayout = new FruchtermanLayout({
    width: 1000,
    height: 1000,
});

// Execute layout
fruchtermanLayout.assign(antvGraph);
fruchtermanLayout.stop();
const res = fruchtermanLayout.tick(1000);
for(const node of res.nodes) {
    graph.nodes[node.id].x = node.data.x;    
    graph.nodes[node.id].y = node.data.y;    
}

// fruchtermanLayout.tick(1000);
// console.log(fruchtermanLayout);
// console.log(antvGraph.getAllNodes()[0]);



console.timeEnd("force layout");
export const force_directed_graph: Graph = graph;