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
    symbolSize: name === 'Outside' ? 40 : 20,
    itemStyle: {
        color: '#67B7D1'
    },
    x: undefined,
    y: undefined,
    fixed: name === 'Outside',
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
    // Priority queue with cost as priority
    const queue: { 
        place: PlaceName; 
        path: PlaceName[]; 
        hasTeleport: boolean;
        cost: number;
    }[] = [
        { place: start, path: [start], hasTeleport: false, cost: 0 }
    ];
    
    const getPathCost = (here: string, link: PlaceLink) => {
        // Penalize paths through Outside and Waterways
        if (link.place_name === 'Outside' || link.place_name === 'Waterways' || link.place_name === 'Water2ays' || link.place_name === 'Dumpinggrounds') {
            return 20; // Higher cost for these locations
        }
        // Penalize one-way routes
        if(link.one_way) {
            return 5;
        }
        return 1; // Normal cost for other locations
    };
    
    while (queue.length > 0) {
        // Sort by cost - lowest cost first
        queue.sort((a, b) => a.cost - b.cost);
        const { place, path, hasTeleport, cost } = queue.shift()!;
        
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
                    const newCost = cost + getPathCost(place, link);
                    queue.push({
                        place: link.place_name,
                        path: [...path, link.place_name],
                        hasTeleport: hasTeleport || link.teleport,
                        cost: newCost
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
            <div className="mb-6 p-6 bg-white rounded-lg shadow-md border border-gray-200">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Route Planning</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                        <span className="text-sm text-gray-600 block mb-1">Starting Point</span>
                        <div className="font-medium text-lg">
                            {startPoint ? (
                                <span className="flex items-center">
                                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                                    {startPoint}
                                </span>
                            ) : (
                                <span className="text-gray-400 italic">Click a location to set start</span>
                            )}
                        </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                        <span className="text-sm text-gray-600 block mb-1">Destination</span>
                        <div className="font-medium text-lg">
                            {endPoint ? (
                                <span className="flex items-center">
                                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                                    {endPoint}
                                </span>
                            ) : (
                                <span className="text-gray-400 italic">Click another location to set destination</span>
                            )}
                        </div>
                    </div>
                </div>
                {route && (
                    <div className="mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-semibold text-gray-800">Route Instructions</h4>
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
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center gap-2 border border-gray-300"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Clear Route
                            </button>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <ol className="relative border-l border-gray-200 ml-3">
                                {route.path.map((place, index) => {
                                    const isLast = index === route.path.length - 1;
                                    const nextPlace = route.path[index + 1];
                                    const isTeleport = !isLast && 
                                        mapData.places[place].links.find(
                                            l => l.place_name === nextPlace
                                        )?.teleport;
                                    
                                    // Check if this is a one-way path
                                    const isOneWay = mapData.places[place].links.find(
                                        l => l.place_name === nextPlace
                                    )?.one_way;
                                    
                                    return (
                                        <li key={index} className="mb-6 ml-6 last:mb-0">
                                            <span className={`absolute flex items-center justify-center w-6 h-6 rounded-full -left-3 ring-8 ring-white
                                                ${index === 0 ? 'bg-green-500' : isLast ? 'bg-red-500' : 'bg-blue-500'}`}>
                                                {index + 1}
                                            </span>
                                            <div className="flex flex-col">
                                                <h3 className="font-medium text-gray-900">{place}</h3>
                                                {!isLast && (
                                                    <div className="mt-1 flex items-center gap-2">
                                                        {isTeleport ? (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                                Teleport
                                                            </span>
                                                        ) : (
                                                            <svg className="w-5 h-5 text-gray-400 my-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                            </svg>
                                                        )}
                                                        {isOneWay && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                                One-way
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                            {route.containsTeleport && (
                                <div className="mt-4 flex items-center gap-2 text-purple-700 bg-purple-50 p-3 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    <span className="font-medium">This route includes teleportation points</span>
                                </div>
                            )}
                        </div>
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
