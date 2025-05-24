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

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Campus Map</h1>
      </header>
      <div className="w-full overflow-x-auto bg-white shadow-lg rounded-lg p-2 sm:p-4">
        Coming Soon!
      </div>
      <p className="text-xs text-gray-500 mt-4 text-center">Note: Map layout is auto-generated and may not represent actual geographical locations or precise distances.</p>
    </div>
  );
};

export default MapPage;