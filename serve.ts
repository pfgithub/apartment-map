import app from "./src/app.html";
import graph from "./src/graph2.html";
import d3graph from "./src/graph.html";
import {graph_json, cmd_mc, sortedplaces_json, pathfinding_results_json} from "./src/process";

const server = Bun.serve({
    static: {
        "/": app,
        "/graph": graph,
        "/d3graph": d3graph,
        "/graph.json": new Response(JSON.stringify(graph_json), {headers: {'content-type': "application/json"}}),
        "/cmd": new Response(cmd_mc, {headers: {'content-type': "text/plain"}}),
        "/places.json": new Response(JSON.stringify({
            places: sortedplaces_json,
            pathfinding_results: pathfinding_results_json,
        }), {headers: {'content-type': "application/json"}}),
    },
    fetch(req) {
        return new Response("404", {status: 404});
    },
    port: 5566,
    development: true,
});
console.log("listening at "+server.url);