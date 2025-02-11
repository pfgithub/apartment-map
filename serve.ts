import graph from "./src/graph2.html";
import d3graph from "./src/graph.html";
import {graph_json, cmd_mc} from "./src/process";

const server = Bun.serve({
    static: {
        "/": graph,
        "/d3graph": d3graph,
        "/graph.json": new Response(JSON.stringify(graph_json), {headers: {'content-type': "application/json"}}),
        "/cmd": new Response(cmd_mc, {headers: {'content-type': "text/plain"}}),
    },
    fetch(req) {
        return new Response("404", {status: 404});
    },
    port: 5566,
});
console.log("listening at "+server.url);