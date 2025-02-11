import Sigma from "sigma";
import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceAtlas2";
import noverlap from "graphology-layout-noverlap";

const graph_data = await fetch("/graph.json").then(r => r.json());

function hashString(str: string) {
    var hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

// Create a graphology graph
const graph = new Graph();
console.log(graph_data);
for(const node of graph_data.nodes) {
    const nh = hashString(node);
    graph.addNode(node.id, { label: node.id, x: nh / 2**32, y: nh / 2**32, size: 10, color: "blue" });
}
for(const link of graph_data.links) {
    graph.addEdge(link.source, link.target, { size: 5, color: "purple" });
}

noverlap.assign(graph, 99);
forceAtlas2.assign(graph, 200);
// supposedly Fruchterman-Reingold is good

// Instantiate sigma.js and render the graph
const sigmaInstance = new Sigma(graph, document.getElementById("container")!);
