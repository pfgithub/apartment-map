import app from "./src/app.html";
import graph from "./src/graph2.html";
import d3graph from "./src/graph.html";
import forcegraph from "./src/forcegraph.html";
import {graph_json, planner_graph, dgdata, cmd_mc, sortedplaces_json, pathfinding_results_json, newdata} from "./src/process";
import { force_directed_graph } from "./force_directed_layout";
import planner from "./src/planner/planner.html";
import vivagraph from "./src/vivagraph/vivagraph.html";
import viewer from "./src/viewer/viewer.html";
import { genViewerPrompt } from "./src/viewerprompt";

const server = Bun.serve({
    routes: {
        "/": Response.redirect("/viewer"),
        "/app": app,
        "/forcegraph": forcegraph,
        "/graph": graph,
        "/d3graph": d3graph,
        "/planner": planner,
        "/vivagraph": vivagraph,
        "/viewer": viewer,
        "/viewer/*": viewer,
        "/graph.json": new Response(JSON.stringify(graph_json), {headers: {'content-type': "application/json; charset=utf-8"}}),
        "/planner.json": new Response(JSON.stringify(planner_graph), {headers: {'content-type': "application/json; charset=utf-8"}}),
        "/root.json": new Response(JSON.stringify(newdata), {headers: {'content-type': "application/json; charset=utf-8"}}),
        "/dgdata.txt": new Response(dgdata, {headers: {'content-type': "text/plain; charset=utf-8"}}),
        "/viewerprompt.txt": () => new Response(genViewerPrompt(), {headers: {'content-type': "text/plain; charset=utf-8"}}),
        "/cmd": new Response(cmd_mc, {headers: {'content-type': "text/plain; charset=utf-8"}}),
        "/places.json": new Response(JSON.stringify({
            places: sortedplaces_json,
            pathfinding_results: pathfinding_results_json,
        }), {headers: {'content-type': "application/json; charset=utf-8"}}),
        "/force_directed_graph.json": new Response(JSON.stringify(force_directed_graph), {headers: {'content-type': "application/json; charset=utf-8"}}),
    },
    fetch(req) {
        return new Response("404", {status: 404});
    },
    port: 5566,
    development: true,
});
console.log("listening at "+server.url);