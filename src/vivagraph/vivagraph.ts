// @ts-ignore
import * as Viva from "vivagraphjs";
import type { PlannerGraph } from "../planner/types";

const graph_data: PlannerGraph = await fetch("/planner.json").then(r => r.json());

var graph = Viva.Graph.graph();

for(const [key, value] of Object.entries(graph_data.places)) {
  graph.addNode(key, value);
}
for(const connection of graph_data.routes) {
  graph.addLink(connection.from, connection.to);
}


var graphics = Viva.Graph.View.webglGraphics();

var renderer = Viva.Graph.View.renderer(graph,
    {
        graphics : graphics
    });
renderer.run();