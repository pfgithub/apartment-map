import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

type Graph = {
    nodes: Record<string, Node>,
    links: Link[],
};
type Link = {
    from: string,
    to: string,
    bidirectional: boolean,
    cost: number,
};
type Node = {
    x: number,
    y: number,
};

const graph_data: Graph = await fetch("/force_directed_graph.json").then(r => r.json());

function Map(): JSX.Element {
    const svgRef = useRef<SVGSVGElement>(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        const updateDimensions = () => {
            if (svgRef.current?.parentElement) {
                const { width, height } = svgRef.current.parentElement.getBoundingClientRect();
                setDimensions({ width, height });
            }
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Scale node positions to fit the SVG
    const nodeEntries = Object.entries(graph_data.nodes);
    const xValues = nodeEntries.map(([_, node]) => node.x);
    const yValues = nodeEntries.map(([_, node]) => node.y);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);

    const padding = 50;
    const xScale = (x: number) => 
        ((x - xMin) / (xMax - xMin)) * (dimensions.width - 2 * padding) + padding;
    const yScale = (y: number) =>
        ((y - yMin) / (yMax - yMin)) * (dimensions.height - 2 * padding) + padding;

    return (
        <div className="w-full h-full">
            <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                className="bg-gray-100"
            >
                {/* Render links */}
                {graph_data.links.map((link, i) => {
                    const source = graph_data.nodes[link.from];
                    const target = graph_data.nodes[link.to];
                    return (
                        <line
                            key={`link-${i}`}
                            x1={xScale(source.x)}
                            y1={yScale(source.y)}
                            x2={xScale(target.x)}
                            y2={yScale(target.y)}
                            stroke={link.bidirectional ? "#666" : "#999"}
                            strokeWidth={Math.max(1, 3 - link.cost)}
                            markerEnd={link.bidirectional ? undefined : "url(#arrowhead)"}
                        />
                    );
                })}
                
                {/* Render nodes */}
                {nodeEntries.map(([id, node]) => (
                    <circle
                        key={`node-${id}`}
                        cx={xScale(node.x)}
                        cy={yScale(node.y)}
                        r={5}
                        fill="#1a73e8"
                    />
                ))}

                {/* Arrow marker definition for directed edges */}
                <defs>
                    <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon
                            points="0 0, 10 3.5, 0 7"
                            fill="#999"
                        />
                    </marker>
                </defs>
            </svg>
        </div>
    );
}

createRoot(document.getElementById("react-root")!).render(<Map />);
