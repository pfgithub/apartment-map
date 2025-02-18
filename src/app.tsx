import {createRoot} from "react-dom/client";
import { useEffect, useRef, useState } from "react";
import Graph from "graphology";
import { Sigma } from "sigma";
import forceAtlas2 from 'graphology-layout-forceatlas2';

type PlaceName = string & {__is_place_name: true};
type PlaceId = string & {__is_place_id: true};
type Map = {
    places: Record<PlaceName, MapPlace>,
    pathfinding_results: Record<PlaceName, {route_in: PlaceName[], route_out: PlaceName[]}>,
};
type MapPlace = {
    id: PlaceId,
    // where you can go from here
    links: PlaceLink[],
    // what places can go to here
    backlinks: PlaceName[],
};
type PlaceLink = {
    place_name: PlaceName,
    teleport: boolean,
    one_way: boolean,
};

const mapData: Map = await fetch("/places.json").then(r => r.json());

function App() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [selectedNode, setSelectedNode] = useState<PlaceName | null>(null);
    const [hoveredNode, setHoveredNode] = useState<PlaceName | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Create a new graph instance
        const graph = new Graph();

        // Add nodes with initial positions in a circle
        const radius = 5;
        const total = Object.keys(mapData.places).length;
        Object.entries(mapData.places).forEach(([name, place], index) => {
            const angle = (index * 2 * Math.PI) / total;
            graph.addNode(name, {
                x: radius * Math.cos(angle),
                y: radius * Math.sin(angle),
                size: 10,
                label: name,
                color: '#67B7D1',
            });
        });

        // Add edges (links)
        Object.entries(mapData.places).forEach(([sourceName, place]) => {
            place.links.forEach(link => {
                const edgeId = `${sourceName}->${link.place_name}`;
                if (!graph.hasEdge(edgeId)) {
                    graph.addEdge(sourceName, link.place_name, {
                        id: edgeId,
                        size: 2,
                        color: link.teleport ? '#FF5733' : '#333333',
                        type: 'arrow',
                    });
                }
            });
        });

        // Apply force-directed layout
        const settings = forceAtlas2.inferSettings(graph);
        forceAtlas2.assign(graph, { iterations: 100, settings });

        // Create sigma instance
        const renderer = new Sigma(graph, containerRef.current, {
            minCameraRatio: 0.1,
            maxCameraRatio: 10,
            renderEdgeLabels: true,
            allowInvalidContainer: true,
        });

        // Add interactions
        renderer.on('clickNode', ({ node }) => {
            setSelectedNode(node as PlaceName);
        });

        renderer.on('enterNode', ({ node }) => {
            setHoveredNode(node as PlaceName);
        });

        renderer.on('leaveNode', () => {
            setHoveredNode(null);
        });

        return () => {
            renderer.kill();
            graph.clear();
        };
    }, []);

    return (
        <div className="h-screen flex">
            <div ref={containerRef} className="flex-grow" />
            <div className="w-64 p-4 bg-gray-100 overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Place Information</h2>
                {(selectedNode || hoveredNode) && (
                    <div>
                        <h3 className="text-lg font-semibold">
                            {selectedNode || hoveredNode}
                        </h3>
                        {mapData.places[selectedNode || hoveredNode!].links.map(link => (
                            <div key={link.place_name} className="mt-2">
                                → {link.place_name}
                                {link.teleport && <span className="ml-2 text-red-500">(teleport)</span>}
                                {link.one_way && <span className="ml-2 text-blue-500">(one-way)</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

createRoot(document.getElementById("root")!).render(<App />);
