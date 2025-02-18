import {createRoot} from "react-dom/client";
import { useEffect, useMemo, useState, useRef } from "react";
import Graph from "graphology";
import ReactECharts from 'echarts-for-react';

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

const mapData: Map = await fetch("/places.json").then(r => r.json());

function App() {
    const [startPoint, setStartPoint] = useState<PlaceName | null>(null);
    const [endPoint, setEndPoint] = useState<PlaceName | null>(null);
    const [path, setPath] = useState<PlaceName[] | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<PlaceName | null>(null);
    const [nodePositions, setNodePositions] = useState<Record<string, [number, number]>>({});
    const isInitialized = useRef(false);

    const getGraphOption = useMemo(() => {
        const nodes: EChartsNode[] = Object.keys(mapData.places).map(name => ({
            id: name,
            name: name,
            symbolSize: 20,
            itemStyle: {
                color: '#67B7D1'
            },
            x: nodePositions[name]?.[0],
            y: nodePositions[name]?.[1],
            fixed: !!nodePositions[name]
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

        return {
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
                    friction: 0.1,
                    seed: 42  // Fixed seed for consistent initial layout
                },
                emphasis: {
                    focus: 'adjacency'
                },
                label: {
                    show: true,
                    position: 'right',
                    formatter: '{b}'
                },
                lineStyle: {
                    curveness: 0.1
                },
                select: {
                    itemStyle: {
                        color: '#ff0000'
                    }
                }
            }]
        };
    }, [nodePositions]);

    // Save node positions after initial layout
    const onChartReady = (chart: any) => {
        if (!isInitialized.current) {
            setTimeout(() => {
                const positions: Record<string, [number, number]> = {};
                chart.getEchartsInstance().getModel().getSeriesByIndex(0).getData().each((idx: number) => {
                    const item = chart.getEchartsInstance().getModel().getSeriesByIndex(0).getData().getItemLayout(idx);
                    const name = chart.getEchartsInstance().getModel().getSeriesByIndex(0).getData().getName(idx);
                    positions[name] = [item.x, item.y];
                });
                setNodePositions(positions);
                isInitialized.current = true;
            }, 1000); // Wait for force layout to settle
        }
    };

    const onChartClick = (params: any) => {
        if (params.dataType === 'node') {
            setSelectedLocation(params.data.name as PlaceName);
        }
    };

    const placeNames = Object.keys(mapData.places) as PlaceName[];

    return (
        <div className="h-screen flex relative">
            <ReactECharts
                option={getGraphOption}
                style={{ height: '100%', width: '75%' }}
                onEvents={{
                    click: onChartClick
                }}
                onChartReady={onChartReady}
            />
            {selectedLocation && (
                <div className="w-1/4 bg-gray-100 p-4 overflow-y-auto">
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
                </div>
            )}
        </div>
    );
}

createRoot(document.getElementById("root")!).render(<App />);
