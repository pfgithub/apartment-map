// src/viewer/components/RoutePlannerPanel.tsx
import React, { useState, useMemo } from 'react';
import { useRoute, type RouteItem } from '../contexts/RouteContext';
import { useData } from '../contexts/DataContext';
import { findShortestPath, type PathResult } from '../utils/pathfinding';
import type { HallID, RoomID, PointOfInterestID, Root } from '../types';

interface RouteSegmentResult {
  fromItemName: string;
  toItemName: string;
  pathDescription: string;
  pathResult: PathResult | null;
}

interface ItemDetail {
  name: string;
  type: 'hall' | 'room' | 'poi';
  parentHallId?: HallID; // For rooms and POIs
}

const RoutePlannerPanel: React.FC = () => {
  const { routeItems, removeItemFromRoute, reorderItemsInRoute, clearRoute } = useRoute();
  const { data, loading: dataLoading, error: dataError } = useData();
  const [directions, setDirections] = useState<RouteSegmentResult[] | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  const itemDetailsMap = useMemo(() => {
    if (!data) return {};
    return routeItems.reduce((acc, item) => {
      let detail: ItemDetail | undefined;
      if (item.type === 'hall') {
        const hall = data.halls[item.id as HallID];
        if (hall) detail = { name: hall.name, type: 'hall' };
      } else if (item.type === 'room') {
        const room = data.rooms[item.id as RoomID];
        if (room) detail = { name: room.name, type: 'room', parentHallId: room.relations.hall };
      } else if (item.type === 'poi') {
        const poi = data.points_of_interest[item.id as PointOfInterestID];
        if (poi) detail = { name: poi.name, type: 'poi', parentHallId: poi.relations.hall };
      }
      if (detail) {
        acc[item.id as string] = detail; // Assuming IDs are unique strings
      }
      return acc;
    }, {} as Record<string, ItemDetail>);
  }, [data, routeItems]);

  const getEffectiveHallId = (item: RouteItem, currentData: Root): HallID | undefined => {
    const detail = itemDetailsMap[item.id as string];
    if (!detail) return undefined;

    if (item.type === 'hall') {
      return item.id as HallID;
    }
    if ((item.type === 'room' || item.type === 'poi') && detail.parentHallId) {
      return detail.parentHallId;
    }
    return undefined;
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === routeItems.length - 1) return;

    const newRouteItems = [...routeItems];
    const itemToMove = newRouteItems.splice(index, 1)[0];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    newRouteItems.splice(newIndex, 0, itemToMove);
    reorderItemsInRoute(newRouteItems);
    setDirections(null);
  };

  const handleCalculateRoute = () => {
    if (!data || routeItems.length < 2) {
      setDirections([]);
      return;
    }

    const newDirections: RouteSegmentResult[] = [];
    const getItemName = (item: RouteItem) => itemDetailsMap[item.id as string]?.name || `Unknown ${item.type}`;

    for (let i = 0; i < routeItems.length - 1; i++) {
      const fromItem = routeItems[i];
      const toItem = routeItems[i + 1];

      const fromEffectiveHallId = getEffectiveHallId(fromItem, data);
      const toEffectiveHallId = getEffectiveHallId(toItem, data);

      const fromItemNameStr = getItemName(fromItem);
      const toItemNameStr = getItemName(toItem);

      if (!fromEffectiveHallId || !toEffectiveHallId) {
        newDirections.push({
          fromItemName: fromItemNameStr,
          toItemName: toItemNameStr,
          pathDescription: "Error: Could not determine location for one or more items.",
          pathResult: null,
        });
        continue;
      }
      
      const fromHallName = data.halls[fromEffectiveHallId]?.name || 'Unknown Hall';
      const toHallName = data.halls[toEffectiveHallId]?.name || 'Unknown Hall';
      let pathResult: PathResult | null = null;
      let pathDescriptionStr = "";

      if (fromEffectiveHallId === toEffectiveHallId) {
        pathDescriptionStr = `Travel within ${fromHallName} (from ${fromItemNameStr} to ${toItemNameStr})`;
        pathResult = { path: [fromEffectiveHallId], totalSeconds: 0 };
      } else {
        pathDescriptionStr = `Path from ${fromHallName} (for ${fromItemNameStr}) to ${toHallName} (for ${toItemNameStr})`;
        pathResult = findShortestPath(data, fromEffectiveHallId, toEffectiveHallId);
      }

      newDirections.push({
        fromItemName: fromItemNameStr,
        toItemName: toItemNameStr,
        pathDescription: pathDescriptionStr,
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
            <button onClick={() => setShowPanel(false)} className="text-gray-300 hover:text-white text-2xl leading-none">×</button>
          </div>
          
          {dataLoading ? (
            <p className="text-gray-400">Loading data...</p>
          ) : dataError ? (
            <p className="text-red-400">Error loading data: {dataError.message}</p>
          ) : !data ? (
            <p className="text-gray-400">No data available.</p>
          ) : (
            <> {/* Data is available, render main content */}
              {routeItems.length === 0 ? (
                <p className="text-gray-400">No items added to the route yet. Add halls, rooms, or POIs from their respective pages or cards.</p>
              ) : (
                <>
                  <ul className="space-y-2 mb-4">
                    {routeItems.map((item, index) => {
                      const detail = itemDetailsMap[item.id as string];
                      const itemName = detail?.name || `Item ID: ${(item.id as string).substring(0,6)}...`;
                      const itemTypeDisplay = detail?.type ? ` (${detail.type})` : '';
                      return (
                        <li key={`${item.id}-${item.type}-${index}`} className="p-2 bg-gray-700 rounded flex justify-between items-center">
                          <span className="truncate" title={`${itemName}${itemTypeDisplay}`}>{index + 1}. {itemName}{itemTypeDisplay}</span>
                          <div className="flex space-x-1">
                            <button onClick={() => handleMove(index, 'up')} disabled={index === 0} className="text-xs p-1 hover:bg-gray-600 disabled:opacity-50">▲</button>
                            <button onClick={() => handleMove(index, 'down')} disabled={index === routeItems.length - 1} className="text-xs p-1 hover:bg-gray-600 disabled:opacity-50">▼</button>
                            <button onClick={() => { removeItemFromRoute(item); setDirections(null); }} className="text-red-400 hover:text-red-300 text-xs p-1">Remove</button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="flex space-x-2 mb-4">
                    <button
                      onClick={handleCalculateRoute}
                      disabled={routeItems.length < 2 || !data}
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
                  {directions.length === 0 && routeItems.length >= 2 && <p className="text-gray-400">Could not calculate a route. Ensure items are in valid locations or add more items.</p>}
                  {directions.length === 0 && routeItems.length < 2 && <p className="text-gray-400">Add at least two items to calculate a route.</p>}
                  
                  <ul className="space-y-3">
                    {directions.map((segment, index) => (
                      <li key={index} className="p-2 bg-gray-700 rounded">
                        <p className="font-medium">Segment {index + 1}: {segment.fromItemName} to {segment.toItemName}</p>
                        <p className="text-sm text-gray-400 italic">{segment.pathDescription}</p>
                        {segment.pathResult ? (
                          <>
                            {segment.pathResult.path.length > 1 && ( // Only show path if it's not just within the same hall
                               <p className="text-sm text-gray-300">
                                Route: {segment.pathResult.path.map(pid => data.halls[pid]?.name || pid.substring(0,6)).join(' → ')}
                              </p>
                            )}
                            <p className="text-sm text-green-400">Time: {segment.pathResult.totalSeconds} seconds</p>
                          </>
                        ) : (
                          <p className="text-sm text-red-400">No path found for this segment.</p>
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