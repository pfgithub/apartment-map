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
        <div className="h-screen flex relative">
            <div ref={containerRef} className="flex-grow" />
            
            {/* Search Box Overlay */}
            <div className="absolute top-4 left-4 w-96 bg-white rounded-lg shadow-lg z-10">
                <div className="p-4 space-y-4">
                    <div className="flex items-center space-x-2 bg-white rounded-lg">
                        <div className="flex-grow space-y-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Choose starting point..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={startPoint || ''}
                                    onChange={(e) => {
                                        const matchingPlace = placeNames.find(name => 
                                            name.toLowerCase() === e.target.value.toLowerCase()
                                        );
                                        if (matchingPlace) setStartPoint(matchingPlace);
                                    }}
                                    list="places-list-start"
                                />
                                <datalist id="places-list-start">
                                    {placeNames.map(name => (
                                        <option key={name} value={name} />
                                    ))}
                                </datalist>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Choose destination..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={endPoint || ''}
                                    onChange={(e) => {
                                        const matchingPlace = placeNames.find(name => 
                                            name.toLowerCase() === e.target.value.toLowerCase()
                                        );
                                        if (matchingPlace) setEndPoint(matchingPlace);
                                    }}
                                    list="places-list-end"
                                />
                                <datalist id="places-list-end">
                                    {placeNames.map(name => (
                                        <option key={name} value={name} />
                                    ))}
                                </datalist>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                setStartPoint(null);
                                setEndPoint(null);
                                setPath(null);
                            }}
                            className="p-2 text-gray-500 hover:text-gray-700"
                        >
                            ×
                        </button>
                    </div>

                    {path && (
                        <div className="mt-4 bg-white rounded-lg">
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3">Directions</h3>
                                <div className="space-y-3">
                                    {path.map((place, index) => {
                                        const nextPlace = path[index + 1];
                                        const currentPlaceData = mapData.places[place];
                                        const linkToNext = nextPlace ? currentPlaceData.links.find(l => l.place_name === nextPlace) : null;
                                        
                                        return (
                                            <div key={index} className="flex items-start space-x-3">
                                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="font-medium text-gray-800">{place}</div>
                                                    {linkToNext && (
                                                        <div className="text-sm text-gray-500">
                                                            {linkToNext.teleport ? 'Teleport to ' : 'Go to '} 
                                                            {nextPlace}
                                                            {linkToNext.one_way && ' (one-way)'}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Place Information Panel */}
            {(selectedNode || hoveredNode) && (
                <div className="absolute bottom-4 left-4 w-96 bg-white rounded-lg shadow-lg p-4">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                        {selectedNode || hoveredNode}
                    </h3>
                    <div className="space-y-2">
                        {mapData.places[selectedNode || hoveredNode!].links.map(link => (
                            <div key={link.place_name} className="flex items-center space-x-2 text-gray-700">
                                <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                                </svg>
                                <span>{link.place_name}</span>
                                {link.teleport && (
                                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                                        teleport
                                    </span>
                                )}
                                {link.one_way && (
                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                        one-way
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

createRoot(document.getElementById("root")!).render(<App />);
