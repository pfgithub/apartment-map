import * as echarts from 'echarts';
import { useState, useCallback } from "react";
import { createRoot } from "react-dom/client";

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

type EChartsNode = {
    id: string;
    name: string;
    symbolSize: number;
    itemStyle: {
        color: string;
    };
    x?: number;
    y?: number;
    fixed?: boolean;
};

type EChartsEdge = {
    source: string;
    target: string;
    lineStyle: {
        color: string;
        width: number;
    };
    symbol: [string, string];
    symbolSize: [number, number];
};

type EChartsParams = {
    dataType: 'node' | 'edge';
    data: EChartsNode;
};
const nodes: EChartsNode[] = Object.keys(mapData.places).map(name => ({
    id: name,
    name: name,
    symbolSize: 20,
    itemStyle: {
        color: '#67B7D1'
    },
    x: undefined,
    y: undefined,
    fixed: false,
}));

const edges: EChartsEdge[] = [];
const processedEdges = new Set<string>();

Object.entries(mapData.places).forEach(([sourceName, place]) => {
    place.links.forEach(link => {
        const edgeId = [sourceName, link.place_name].sort().join('-');
        if (!processedEdges.has(edgeId)) {
            processedEdges.add(edgeId);
            
            // Check if there's a reverse link
            const targetPlace = mapData.places[link.place_name];
            const hasReverseLink = targetPlace.links.some(l => l.place_name === sourceName);
            
            edges.push({
                source: sourceName,
                target: link.place_name,
                lineStyle: {
                    color: hasReverseLink ? '#888888' : '#67B7D1',
                    width: hasReverseLink ? 8 : 2,
                },
                symbol: hasReverseLink ? ['arrow', 'arrow'] : ['none', 'arrow'],
                symbolSize: [8, 8]
            });
        }
    });
});

// Add these new types and functions after the existing types
type Route = {
    path: PlaceName[];
    containsTeleport: boolean;
};

function findShortestPath(
    start: PlaceName,
    end: PlaceName,
    mapData: Map
): Route | null {
    const visited = new Set<PlaceName>();
    const queue: { place: PlaceName; path: PlaceName[]; hasTeleport: boolean }[] = [
        { place: start, path: [start], hasTeleport: false }
    ];
    
    while (queue.length > 0) {
        const { place, path, hasTeleport } = queue.shift()!;
        
        if (place === end) {
            return {
                path,
                containsTeleport: hasTeleport
            };
        }
        
        if (!visited.has(place)) {
            visited.add(place);
            const currentPlace = mapData.places[place];
            
            for (const link of currentPlace.links) {
                if (!visited.has(link.place_name)) {
                    queue.push({
                        place: link.place_name,
                        path: [...path, link.place_name],
                        hasTeleport: hasTeleport || link.teleport
                    });
                }
            }
        }
    }
    
    return null;
}

// Add this type before the graphOption declaration
type GraphSeriesOption = echarts.GraphSeriesOption & {
    force?: {
        repulsion?: number;
        edgeLength?: number;
        gravity?: number;
        initLayout?: 'circular';
        layoutAnimation?: boolean;
        friction?: number;
    };
};

const graphOption: echarts.EChartsOption = {
    tooltip: {
        show: true,
        formatter: (params: any) => {
            if (params.dataType === 'node') {
                return params.data.name;
            }
            return '';
        }
    },
    series: [{
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: edges,
        roam: true,
        draggable: true,
        force: {
            repulsion: 1000,
            edgeLength: 200,
            gravity: 0.1,
            initLayout: 'circular',
            layoutAnimation: false,
            friction: 0.1
        },
        emphasis: {
            focus: 'adjacency',
            lineStyle: {
                width: 4,
                color: '#ff0000'
            }
        },
        label: {
            show: true,
            position: 'right',
            formatter: '{b}'
        },
        lineStyle: {
            curveness: 0.1,
            width: 2
        },
        select: {
            itemStyle: {
                color: '#ff0000'
            }
        }
    } as GraphSeriesOption]
};

const chartDom = document.getElementById("chart-here") as HTMLElement;
const chart = echarts.init(chartDom);
chart.setOption(graphOption);
new ResizeObserver(() => {
    chart.resize();
}).observe(chartDom);
let onClick: (placeName: PlaceName) => void;
chart.on('click', (params: any) => {
    if (params.dataType === 'node') {
        onClick?.(params.data.name as PlaceName);
    }
});
chart.on('finished', () => {
    // mark all nodes as fixed
    nodes.forEach(node => {
        node.fixed = true;
    });
});

function App() {
    const [selectedLocation, setSelectedLocation] = useState<PlaceName | null>(null);
    const [startPoint, setStartPoint] = useState<PlaceName | null>(null);
    const [endPoint, setEndPoint] = useState<PlaceName | null>(null);
    const [route, setRoute] = useState<Route | null>(null);

    onClick = useCallback((placeName: PlaceName) => {
        setSelectedLocation(placeName);
        
        // If start point is not set, set it
        if (!startPoint) {
            setStartPoint(placeName);
            setRoute(null);
            return;
        }
        
        // If end point is not set and it's different from start, set it and calculate route
        if (!endPoint && placeName !== startPoint) {
            setEndPoint(placeName);
            const newRoute = findShortestPath(startPoint, placeName, mapData);
            setRoute(newRoute);
            
            // Highlight the route on the graph
            if (newRoute) {
                const routeEdges = new Set<string>();
                for (let i = 0; i < newRoute.path.length - 1; i++) {
                    routeEdges.add(`${newRoute.path[i]}-${newRoute.path[i + 1]}`);
                }
                
                // Update edge styles based on whether they're part of the route
                const updatedEdges = edges.map(edge => ({
                    ...edge,
                    lineStyle: {
                        ...edge.lineStyle,
                        color: routeEdges.has(`${edge.source}-${edge.target}`) || 
                               routeEdges.has(`${edge.target}-${edge.source}`) 
                               ? '#ff0000' 
                               : edge.lineStyle.color,
                        width: routeEdges.has(`${edge.source}-${edge.target}`) || 
                               routeEdges.has(`${edge.target}-${edge.source}`)
                               ? 4
                               : edge.lineStyle.width
                    }
                }));
                
                chart.setOption({
                    series: [{
                        ...(graphOption.series as GraphSeriesOption[])[0],
                        links: updatedEdges
                    } as GraphSeriesOption]
                });
            }
            return;
        }
        
        // If both points are set, reset and start new route
        setStartPoint(placeName);
        setEndPoint(null);
        setRoute(null);
        
        // Reset edge styles
        chart.setOption({
            series: [{
                ...(graphOption.series as GraphSeriesOption[])[0],
                links: edges
            } as GraphSeriesOption]
        });
    }, [startPoint, endPoint]);

    return (
        <div>
            <div className="mb-6 p-4 bg-gray-100 rounded">
                <h3 className="text-lg font-semibold mb-2">Route Planning</h3>
                <div className="flex gap-4 items-center">
                    <div>
                        <span className="font-medium">Start:</span> {startPoint || 'Select a location'}
                    </div>
                    <div>
                        <span className="font-medium">End:</span> {endPoint || 'Select another location'}
                    </div>
                    {route && (
                        <button
                            onClick={() => {
                                setStartPoint(null);
                                setEndPoint(null);
                                setRoute(null);
                                chart.setOption({
                                    series: [{
                                        ...(graphOption.series as GraphSeriesOption[])[0],
                                        links: edges
                                    } as GraphSeriesOption]
                                });
                            }}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            Clear Route
                        </button>
                    )}
                </div>
                {route && (
                    <div className="mt-4">
                        <h4 className="font-medium mb-2">Route Instructions:</h4>
                        <ol className="list-decimal list-inside space-y-1">
                            {route.path.map((place, index) => (
                                <li key={index} className="pl-2">
                                    {place}
                                    {index < route.path.length - 1 && (
                                        <span className="text-gray-500">
                                            {mapData.places[place].links.find(
                                                l => l.place_name === route.path[index + 1]
                                            )?.teleport ? ' (Teleport) ' : ' → '}
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ol>
                        {route.containsTeleport && (
                            <p className="mt-2 text-purple-600">
                                This route includes teleportation points.
                            </p>
                        )}
                    </div>
                )}
            </div>
            
            {selectedLocation && (
                <>
                    <h2 className="text-xl font-bold mb-4">{selectedLocation}</h2>
                    
                    {/* Calculate the different types of links */}
                    {(() => {
                        const currentPlace = mapData.places[selectedLocation];
                        const linkNames = new Set(currentPlace.links.map(l => l.place_name));
                        const backlinkNames = new Set(currentPlace.backlinks);

                        // Places that only have backlinks to here
                        const backlinksOnly = currentPlace.backlinks.filter(name => !linkNames.has(name));
                        
                        // Places that have both links and backlinks
                        const bidirectional = currentPlace.backlinks.filter(name => linkNames.has(name));
                        
                        // Places that we can only link to (no backlinks)
                        const linksOnly = currentPlace.links.filter(link => !backlinkNames.has(link.place_name));

                        return (
                            <>
                                {/* Backlinks-only section */}
                                {backlinksOnly.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-2">Can reach here from:</h3>
                                        <div className="space-y-2">
                                            {backlinksOnly.map((placeName) => (
                                                <button
                                                    key={placeName}
                                                    onClick={() => setSelectedLocation(placeName)}
                                                    className="block w-full text-left px-3 py-2 bg-white rounded shadow hover:bg-blue-50 transition-colors"
                                                >
                                                    {placeName}
                                                    <span className="text-red-600 ml-2">(Can't go that way)</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Bidirectional section */}
                                {bidirectional.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-2">Two-way connections:</h3>
                                        <div className="space-y-2">
                                            {bidirectional.map((placeName) => (
                                                <button
                                                    key={placeName}
                                                    onClick={() => setSelectedLocation(placeName)}
                                                    className="block w-full text-left px-3 py-2 bg-white rounded shadow hover:bg-blue-50 transition-colors"
                                                >
                                                    {placeName}
                                                    {currentPlace.links.find(l => l.place_name === placeName)?.teleport && 
                                                        <span className="text-purple-600 ml-2">(Teleport)</span>
                                                    }
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Links-only section */}
                                {linksOnly.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold mb-2">One-way to:</h3>
                                        <div className="space-y-2">
                                            {linksOnly.map((link) => (
                                                <button
                                                    key={link.place_name}
                                                    onClick={() => setSelectedLocation(link.place_name)}
                                                    className="block w-full text-left px-3 py-2 bg-white rounded shadow hover:bg-blue-50 transition-colors"
                                                >
                                                    {link.place_name}
                                                    {link.teleport && 
                                                        <span className="text-purple-600 ml-2">(Teleport)</span>
                                                    }
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </>
            )}
        </div>
    );
}

createRoot(document.getElementById("react-root")!).render(<App />);
