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
import sharp from 'sharp';
import { rgbaToThumbHash } from 'thumbhash';
import type { Image } from "./src/viewer/types";

const server = Bun.serve({
    routes: {
        "/": Response.redirect("/apartment-map"),
        "/app": app,
        "/forcegraph": forcegraph,
        "/graph": graph,
        "/d3graph": d3graph,
        "/planner": planner,
        "/vivagraph": vivagraph,
        "/apartment-map": viewer,
        "/apartment-map/*": viewer,
        "/graph.json": new Response(JSON.stringify(graph_json), {headers: {'content-type': "application/json; charset=utf-8"}}),
        "/planner.json": new Response(JSON.stringify(planner_graph), {headers: {'content-type': "application/json; charset=utf-8"}}),
        "/apartment-map/root.json": new Response(JSON.stringify(newdata), {headers: {'content-type': "application/json; charset=utf-8"}}),
        "/dgdata.txt": new Response(dgdata, {headers: {'content-type': "text/plain; charset=utf-8"}}),
        "/apartment-map/viewerprompt.txt": () => new Response(genViewerPrompt(), {headers: {'content-type': "text/plain; charset=utf-8"}}),
        "/cmd": new Response(cmd_mc, {headers: {'content-type': "text/plain; charset=utf-8"}}),
        "/places.json": new Response(JSON.stringify({
            places: sortedplaces_json,
            pathfinding_results: pathfinding_results_json,
        }), {headers: {'content-type': "application/json; charset=utf-8"}}),
        "/force_directed_graph.json": new Response(JSON.stringify(force_directed_graph), {headers: {'content-type': "application/json; charset=utf-8"}}),

        "/api/image": {PUT: async (req) => {
            const originalImageBuffer = await req.arrayBuffer();

            const uuid = crypto.randomUUID();
            console.log(`  UUID: ${uuid}`);

            const originalImage = sharp(originalImageBuffer);
            const metadata = await originalImage.metadata();
            const originalWidth = metadata.width;
            const originalHeight = metadata.height;
            console.log(`  Original dimensions: ${originalWidth}x${originalHeight}`);

            // 4. Resize the image to 100x100
            console.log(`  Resizing to 100x100`);
            const resizedImageBuffer = await originalImage
                .resize(100, 100, {
                fit: sharp.fit.fill, // Or 'contain', 'fill', etc. 'cover' is usually good.
                })
                .png() // Ensure output is PNG
                .toBuffer();

            const { data: rgba, info } = await sharp(resizedImageBuffer)
                .ensureAlpha() // ThumbHash expects RGBA
                .raw()
                .toBuffer({ resolveWithObject: true });

            if (info.width > 100 || info.height > 100) {
                console.warn(`  Warning: Resized image for ThumbHash is ${info.width}x${info.height}, not exactly 100x100. This might affect ThumbHash quality or cause errors if the library strictly expects <=100px dimensions.`);
            }
            
            const thumbhashBytes = rgbaToThumbHash(info.width, info.height, rgba);
            const thumbhashBase64 = Buffer.from(thumbhashBytes).toString('base64');
            console.log(`  ThumbHash (Base64): ${thumbhashBase64}`);

            const result: Image = {
                uuid,
                alt: "",
                width: originalWidth,
                height: originalHeight,
                thumbhash: thumbhashBase64,
            };

            // upload
            const up1 = await fetch(process.env.UPLOAD_HOSTNAME + "/source/"+uuid+".png", {
                method: "PUT",
                headers: {
                    AccessKey: process.env.UPLOAD_DATA ?? "",
                    'Content-Type': "application/octet-stream",
                },
                body: originalImageBuffer,
            });
            if(!up1.ok) return new Response("upload fail: "+up1.statusText, {status: 400});
            const up2 = await fetch(process.env.UPLOAD_HOSTNAME + "/generated/"+uuid+"_100x100.png", {
                method: "PUT",
                headers: {
                    AccessKey: process.env.UPLOAD_DATA ?? "",
                    'Content-Type': "application/octet-stream",
                },
                body: resizedImageBuffer,
            })
            if(!up2.ok) return new Response("upload fail: "+up2.statusText, {status: 400});

            console.log("success", result);

            return Response.json(result);
        }}
    },
    fetch(req) {
        return new Response("404", {status: 404});
    },
    port: 5566,
    development: true,
});
console.log("listening at "+server.url);