// src/viewer/components/RoutePlannerPanel.tsx
import React, { useState, useMemo } from 'react';
import { useRoute } from '../contexts/RouteContext';
import { useData } from '../contexts/DataContext';
import { findShortestPath, type PathResult } from '../utils/pathfinding';
import type { HallID } from '../types';

interface RouteSegmentResult {
  fromHallName: string;
  toHallName: string;
  pathResult: PathResult | null;
}

const RoutePlannerPanel: React.FC = () => {
  const { routeHalls, removeHallFromRoute, reorderHallsInRoute, clearRoute } = useRoute();
  const { data, loading: dataLoading, error: dataError } = useData();
  const [directions, setDirections] = useState<RouteSegmentResult[] | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  const hallDetails = useMemo(() => {
    if (!data) return {};
    return routeHalls.reduce((acc, hallId) => {
      if (data.halls[hallId]) {
        acc[hallId] = data.halls[hallId];
      }
      return acc;
    }, {} as Record<HallID, typeof data.halls[HallID]>);
  }, [data, routeHalls]);

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === routeHalls.length - 1) return;

    const newRouteHalls = [...routeHalls];
    const itemToMove = newRouteHalls.splice(index, 1)[0];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    newRouteHalls.splice(newIndex, 0, itemToMove);
    reorderHallsInRoute(newRouteHalls);
    setDirections(null);
  };

  const handleCalculateRoute = () => {
    if (!data || routeHalls.length < 2) {
      setDirections([]);
      return;
    }

    const newDirections: RouteSegmentResult[] = [];
    for (let i = 0; i < routeHalls.length - 1; i++) {
      const startHallId = routeHalls[i];
      const endHallId = routeHalls[i + 1];
      const pathResult = findShortestPath(data, startHallId, endHallId);
      newDirections.push({
        fromHallName: hallDetails[startHallId]?.name || 'Unknown Hall',
        toHallName: hallDetails[endHallId]?.name || 'Unknown Hall',
        pathResult,
      });
    }
    setDirections(newDirections);
  };

  const totalRouteTime = useMemo(() => {
    if (!directions) return 0;
    return directions.reduce((sum, segment) => sum + (segment.pathResult?.totalSeconds || 0), 0);
  }, [directions]);  


  return (
    <>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 z-50"
        aria-label="Toggle Route Planner"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m0 0v2.25m0-2.25h1.5M12 9m0 0H9m3 0h.008M12 12.75m0 0H9m3 0h.008m0 0H12m3 0h.008M12 15.75m0 0H9m3 0h.008m0 0h.75m3-12h.008v.008H18V3.75m-3 .008H18V6.75m0 0H18M15 6.75H9m6 0V3.75M3 12h18M3 12c0-1.657 1.343-3 3-3h1.372c.863 0 1.609-.304 2.228-.834L10.5 7.5M3 12c0 1.657 1.343 3 3 3h1.372c.863 0 1.609.304 2.228.834L10.5 16.5m5.25-9v9" />
        </svg>
      </button>

        <div 
            className={`fixed top-0 right-0 h-full w-80 md:w-96 bg-gray-800 text-white p-4 shadow-xl z-40 overflow-y-auto transform transition-transform duration-300 ease-in-out
                        ${showPanel ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Route Planner</h2>
            <button onClick={() => setShowPanel(false)} className="text-gray-300 hover:text-white">×</button>
          </div>
          
          {dataLoading ? (
            <p className="text-gray-400">Loading data...</p>
          ) : dataError ? (
            <p className="text-red-400">Error loading data: {dataError.message}</p>
          ) : !data ? (
            <p className="text-gray-400">No data available.</p>
          ) : (
            <> {/* Data is available, render main content */}
              {routeHalls.length === 0 ? (
                <p className="text-gray-400">No halls added to the route yet. Add halls from their respective pages.</p>
              ) : (
                <>
                  <ul className="space-y-2 mb-4">
                    {routeHalls.map((hallId, index) => {
                      const hallName = hallDetails[hallId]?.name || `Hall ID: ${hallId.substring(0,6)}...`;
                      return (
                        <li key={hallId} className="p-2 bg-gray-700 rounded flex justify-between items-center">
                          <span className="truncate" title={hallName}>{index + 1}. {hallName}</span>
                          <div className="flex space-x-1">
                            <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="text-xs p-1 hover:bg-gray-600 disabled:opacity-50">▲</button>
                            <button onClick={() => handleMove(index, 'down')} disabled={index === routeHalls.length - 1} className="text-xs p-1 hover:bg-gray-600 disabled:opacity-50">▼</button>
                            <button onClick={() => removeHallFromRoute(hallId)} className="text-red-400 hover:text-red-300 text-xs p-1">Remove</button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="flex space-x-2 mb-4">
                    <button
                      onClick={handleCalculateRoute}
                      disabled={routeHalls.length < 2 || !data}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded disabled:opacity-50"
                    >
                      Get Directions
                    </button>
                    <button
                      onClick={() => { clearRoute(); setDirections(null); }}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded"
                    >
                      Clear Route
                    </button>
                  </div>
                </>
              )}

              {directions && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2">Directions:</h3>
                  {directions.length === 0 && routeHalls.length >= 2 && <p className="text-gray-400">Could not calculate a route. Ensure halls are connected or add more halls.</p>}
                  {directions.length === 0 && routeHalls.length < 2 && <p className="text-gray-400">Add at least two halls to calculate a route.</p>}
                  
                  <ul className="space-y-3">
                    {directions.map((segment, index) => (
                      <li key={index} className="p-2 bg-gray-700 rounded">
                        <p className="font-medium">Segment {index + 1}: {segment.fromHallName} to {segment.toHallName}</p>
                        {segment.pathResult ? (
                          <>
                            <p className="text-sm text-gray-300">
                              Path: {segment.pathResult.path.map(pid => hallDetails[pid]?.name || pid.substring(0,6)).join(' → ')}
                            </p>
                            <p className="text-sm text-green-400">Time: {segment.pathResult.totalSeconds} seconds</p>
                          </>
                        ) : (
                          <p className="text-sm text-red-400">No direct path found for this segment.</p>
                        )}
                      </li>
                    ))}
                  </ul>
                  {directions.length > 0 && totalRouteTime > 0 && (
                    <p className="mt-4 font-bold text-lg">
                      Total Estimated Route Time: {totalRouteTime} seconds
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      
       {/* Overlay to close panel when clicking outside */}
       {showPanel && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-30"
          onClick={() => setShowPanel(false)}
        ></div>
      )}
    </>
  );
};

export default RoutePlannerPanel;