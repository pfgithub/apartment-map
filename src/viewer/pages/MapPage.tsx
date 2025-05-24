// src/viewer/pages/MapPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useRoute } from '../contexts/RouteContext';
import type { HallID, Connection, Hall } from '../types';

// SVG styling constants
const SVG_WIDTH = 800;
const SVG_HEIGHT = 600;
const PADDING = 70; 
const HALL_RADIUS = 20;
const HALL_FILL_COLOR = "rgb(147 197 253)"; // Tailwind blue-300
const HALL_HOVER_FILL_COLOR = "rgb(59 130 246)"; // Tailwind blue-500
const HALL_STROKE_COLOR = "rgb(30 64 175)"; // Tailwind blue-800
const HALL_TEXT_COLOR = "rgb(17 24 39)"; // Tailwind gray-900
const CONNECTION_LINE_COLOR = "rgb(107 114 128)"; // Tailwind gray-500
const CONNECTION_ARROW_COLOR = "rgb(107 114 128)"; // Tailwind gray-500
const CONNECTION_STROKE_WIDTH = 1.5;
const ARROW_MARKER_ID = "campusMapArrowhead";

interface HallPosition {
  x: number;
  y: number;
}

const MapPage: React.FC = () => {
  const { data } = useData();
  const { setBreadcrumbs } = useRoute();
  const navigate = useNavigate();
  const [hallPositions, setHallPositions] = useState<Record<HallID, HallPosition>>({});
  const [hoveredHall, setHoveredHall] = useState<HallID | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', link: '/' },
      { label: 'Campus Map' }
    ]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    if (data && data.halls) {
      const halls = Object.values(data.halls);
      const newPositions: Record<HallID, HallPosition> = {};
      const numHalls = halls.length;

      if (numHalls === 0) {
        setHallPositions({});
        return;
      }

      let cols = Math.ceil(Math.sqrt(numHalls * (SVG_WIDTH / Math.max(1, SVG_HEIGHT))));
      let rows = Math.ceil(numHalls / cols);
      
      cols = Math.max(1, cols);
      rows = Math.max(1, rows);
      if (numHalls === 1) {
          cols = 1; rows = 1;
      }

      const drawingWidth = SVG_WIDTH - 2 * PADDING;
      const drawingHeight = SVG_HEIGHT - 2 * PADDING;

      halls.forEach((hall, index) => {
        const r = Math.floor(index / cols);
        const c = index % cols;

        const x = PADDING + (cols > 1 ? (c / (cols - 1)) * drawingWidth : drawingWidth / 2);
        const y = PADDING + (rows > 1 ? (r / (rows - 1)) * drawingHeight : drawingHeight / 2);
        
        newPositions[hall.id] = { x, y };
      });
      setHallPositions(newPositions);
    }
  }, [data]);

  const connectionsWithPositions = useMemo(() => {
    if (!data || Object.keys(hallPositions).length === 0) return [];
    return Object.values(data.connections).map(conn => {
      const fromPos = hallPositions[conn.relations.from];
      const toPos = hallPositions[conn.relations.to];
      if (!fromPos || !toPos) return null;

      const dx = toPos.x - fromPos.x;
      const dy = toPos.y - fromPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist === 0) return null; 

      // Line should end HALL_RADIUS away from the target hall's center so arrow tip touches the circle
      const ratio = (dist - HALL_RADIUS) / dist;
      const endX = fromPos.x + dx * ratio;
      const endY = fromPos.y + dy * ratio;
      
      return {
        ...conn,
        x1: fromPos.x,
        y1: fromPos.y,
        x2: endX,
        y2: endY,
      };
    }).filter(conn => conn !== null) as (Connection & { x1: number; y1: number; x2: number; y2: number; })[];
  }, [data, hallPositions]);
  
  const hallsToDisplay = data ? Object.values(data.halls) : [];

  if (!data || hallsToDisplay.length === 0) {
    return (
      <div>
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Campus Map</h1>
        </header>
        <div className="text-center py-10 bg-white shadow rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 mx-auto mb-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m0 0v2.25m0-2.25h1.5M12 9m0 0H9m3 0h.008M12 12.75m0 0H9m3 0h.008m0 0H12m3 0h.008M12 15.75m0 0H9m3 0h.008m0 0h.75m3-12h.008v.008H18V3.75m-3 .008H18V6.75m0 0H18M15 6.75H9m6 0V3.75M3 12h18M3 12c0-1.657 1.343-3 3-3h1.372c.863 0 1.609-.304 2.228-.834L10.5 7.5M3 12c0 1.657 1.343 3 3 3h1.372c.863 0 1.609.304 2.228.834L10.5 16.5m5.25-9v9" />
            </svg>
            <p className="text-xl text-gray-700">No halls available to display on the map.</p>
            <p className="text-gray-500 mt-1">Map cannot be rendered without hall data.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Campus Map</h1>
        <p className="text-gray-600 mt-1">Visual representation of halls and their connections. Click on a hall to see details.</p>
      </header>
      <div className="w-full overflow-x-auto bg-white shadow-lg rounded-lg p-2 sm:p-4">
        <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className={`min-w-[${SVG_WIDTH}px] min-h-[${SVG_HEIGHT}px]`}>
          <defs>
            <marker
              id={ARROW_MARKER_ID}
              markerWidth="10" // The width of the marker viewport
              markerHeight="7" // The height of the marker viewport
              refX="10"         // The x-coordinate of the reference point (tip of the arrow)
              refY="3.5"       // The y-coordinate of the reference point (middle of the arrow height)
              orient="auto"
              fill={CONNECTION_ARROW_COLOR}>
              <polygon points="0 0, 10 3.5, 0 7" /> {/* Defines the arrow shape (points from left to right) */}
            </marker>
          </defs>

          <g className="connections">
            {connectionsWithPositions.map(conn => (
              <line
                key={conn.id}
                x1={conn.x1}
                y1={conn.y1}
                x2={conn.x2}
                y2={conn.y2}
                stroke={CONNECTION_LINE_COLOR}
                strokeWidth={CONNECTION_STROKE_WIDTH}
                markerEnd={`url(#${ARROW_MARKER_ID})`}
              />
            ))}
          </g>

          <g className="halls">
            {hallsToDisplay.map((hall: Hall) => {
              const pos = hallPositions[hall.id];
              if (!pos) return null;
              const isHovered = hall.id === hoveredHall;
              return (
                <g
                  key={hall.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => navigate(`/halls/${hall.id}`)}
                  onMouseEnter={() => setHoveredHall(hall.id)}
                  onMouseLeave={() => setHoveredHall(null)}
                  className="cursor-pointer group"
                  aria-label={`Hall: ${hall.name}`}
                >
                  <circle
                    r={HALL_RADIUS}
                    fill={isHovered ? HALL_HOVER_FILL_COLOR : HALL_FILL_COLOR}
                    stroke={HALL_STROKE_COLOR}
                    strokeWidth="2"
                    className="transition-colors duration-150"
                  />
                  <text
                    textAnchor="middle"
                    y={HALL_RADIUS + 14} 
                    fontSize="10px"
                    fill={HALL_TEXT_COLOR}
                    className="font-medium select-none transition-all group-hover:font-bold"
                  >
                    {hall.name}
                  </text>
                  <title>{hall.name} - Click to view details</title>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      <p className="text-xs text-gray-500 mt-4 text-center">Note: Map layout is auto-generated and may not represent actual geographical locations or precise distances.</p>
    </div>
  );
};

export default MapPage;