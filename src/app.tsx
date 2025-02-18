import {createRoot} from "react-dom/client";
import { useEffect, useRef, useState } from "react";
import Graph from "graphology";
import { Sigma } from "sigma";
// @ts-ignore
import forceAtlas2 from 'graphology-layout-forceatlas2';
import { bidirectional } from 'graphology-shortest-path';

type PlaceName = string & {__is_place_name: true};
type PlaceId = string & {__is_place_id: true};
type Map = {
    places: Record<PlaceName, MapPlace>,
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
    const [startPoint, setStartPoint] = useState<PlaceName | null>(null);
    const [endPoint, setEndPoint] = useState<PlaceName | null>(null);
    const [path, setPath] = useState<PlaceName[] | null>(null);
    const [graphInstance, setGraphInstance] = useState<Graph | null>(null);

    // Function to find and highlight path
    const findPath = () => {
        if (!graphInstance || !startPoint || !endPoint) return;
        try {
            const shortestPath = bidirectional(graphInstance, startPoint, endPoint);
            if (!shortestPath) {
                console.error('No path found between the selected points');
                setPath(null);
                return;
            }
            setPath(shortestPath as PlaceName[]);
            
            // Reset all node colors
            graphInstance.forEachNode((node: string) => {
                graphInstance.setNodeAttribute(node, 'color', '#67B7D1');
            });
            
            // Reset all edge colors
            graphInstance.forEachEdge((edge: string) => {
                const isTeleportion = graphInstance.getEdgeAttribute(edge, 'isTeleportion');
                graphInstance.setEdgeAttribute(edge, 'color', isTeleportion ? '#FF5733' : '#333333');
                graphInstance.setEdgeAttribute(edge, 'size', 2);
            });

            // Highlight path
            shortestPath.forEach((node: string, index: number) => {
                graphInstance.setNodeAttribute(node, 'color', '#4CAF50');
                if (index < shortestPath.length - 1) {
                    const nextNode = shortestPath[index + 1];
                    const edge = graphInstance.edge(node, nextNode);
                    if (edge) {
                        graphInstance.setEdgeAttribute(edge, 'color', '#4CAF50');
                        graphInstance.setEdgeAttribute(edge, 'size', 4);
                    }
                }
            });
        } catch (error) {
            console.error('No path found:', error);
            setPath(null);
        }
    };

    useEffect(() => {
        if (startPoint && endPoint) {
            findPath();
        }
    }, [startPoint, endPoint]);

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
                        isTeleportion: link.teleport
                    });
                }
            });
        });

        // Apply force-directed layout
        const settings = forceAtlas2.inferSettings(graph);
        forceAtlas2.assign(graph, { iterations: 100, settings });

        setGraphInstance(graph);

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

    useEffect(() => {
        if (!graphInstance || !hoveredNode) {
            // Reset all nodes and edges to default colors if no node is hovered
            graphInstance?.forEachNode((node: string) => {
                graphInstance.setNodeAttribute(node, 'color', '#67B7D1');
            });
            graphInstance?.forEachEdge((edge: string) => {
                const isTeleportion = graphInstance.getEdgeAttribute(edge, 'isTeleportion');
                graphInstance.setEdgeAttribute(edge, 'color', isTeleportion ? '#FF5733' : '#333333');
            });
            return;
        }

        // Set all nodes and edges to a muted color first
        graphInstance.forEachNode((node: string) => {
            graphInstance.setNodeAttribute(node, 'color', '#D3D3D3');
        });
        graphInstance.forEachEdge((edge: string) => {
            graphInstance.setEdgeAttribute(edge, 'color', '#E0E0E0');
        });

        // Highlight the hovered node
        graphInstance.setNodeAttribute(hoveredNode, 'color', '#FFA500');

        // Get all neighbors (both incoming and outgoing)
        const neighbors = new Set<string>();
        
        // Add outgoing connections
        mapData.places[hoveredNode].links.forEach(link => {
            neighbors.add(link.place_name);
            const edgeId = graphInstance.edge(hoveredNode, link.place_name);
            if (edgeId) {
                graphInstance.setEdgeAttribute(edgeId, 'color', '#FFA500');
                graphInstance.setEdgeAttribute(edgeId, 'size', 3);
            }
        });

        // Add incoming connections
        mapData.places[hoveredNode].backlinks.forEach(backlink => {
            neighbors.add(backlink);
            const edgeId = graphInstance.edge(backlink, hoveredNode);
            if (edgeId) {
                graphInstance.setEdgeAttribute(edgeId, 'color', '#FFA500');
                graphInstance.setEdgeAttribute(edgeId, 'size', 3);
            }
        });

        // Highlight all neighboring nodes
        neighbors.forEach(neighbor => {
            graphInstance.setNodeAttribute(neighbor, 'color', '#FFD700');
        });

    }, [hoveredNode, graphInstance]);

    const placeNames = Object.keys(mapData.places) as PlaceName[];

    return (
        <div className="h-screen flex">
            <div ref={containerRef} className="flex-grow" />
            <div className="w-80 p-4 bg-gray-100 overflow-y-auto">
                <div className="mb-6">
                    <h2 className="text-xl font-bold mb-4">Navigation</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Start Point</label>
                            <select 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={startPoint || ''}
                                onChange={(e) => setStartPoint(e.target.value as PlaceName)}
                            >
                                <option value="">Select start point...</option>
                                {placeNames.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">End Point</label>
                            <select 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                value={endPoint || ''}
                                onChange={(e) => setEndPoint(e.target.value as PlaceName)}
                            >
                                <option value="">Select end point...</option>
                                {placeNames.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {path && (
                        <div className="mt-4">
                            <h3 className="font-semibold mb-2">Directions:</h3>
                            <div className="space-y-2">
                                {path.map((place, index) => (
                                    <div key={index} className="flex items-center">
                                        <span className="mr-2">{index + 1}.</span>
                                        <span>{place}</span>
                                        {index < path.length - 1 && (
                                            <span className="mx-2">→</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-6">
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
        </div>
    );
}

createRoot(document.getElementById("root")!).render(<App />);
