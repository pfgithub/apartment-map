import {createRoot} from "react-dom/client";
import { useEffect, useMemo, useState } from "react";
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

    const getGraphOption = useMemo(() => {
        const nodes: EChartsNode[] = Object.keys(mapData.places).map(name => ({
            id: name,
            name: name,
            symbolSize: 20,
            itemStyle: {
                color: '#67B7D1'
            }
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
                    edgeLength: 200
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
                }
            }]
        };
    }, []);

    const placeNames = Object.keys(mapData.places) as PlaceName[];

    return (
        <div className="h-screen flex relative">
            <ReactECharts
                option={getGraphOption}
                style={{ height: '100%', width: '100%' }}
            />
        </div>
    );
}

createRoot(document.getElementById("root")!).render(<App />);
