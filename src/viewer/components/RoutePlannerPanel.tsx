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
  parentHallId?: HallID;
}

const RoutePlannerPanel: React.FC = () => {
  const { routeItems, removeItemFromRoute, reorderItemsInRoute, clearRoute } = useRoute();
  const { data } = useData();
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
        acc[item.id as string] = detail;
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
        let from = fromHallName + (fromHallName !== fromItemNameStr ? " (for " + fromItemNameStr + ")" : "");
        let to = toHallName + (toHallName !== toItemNameStr ? " (for " + toItemNameStr + ")" : "");
        pathDescriptionStr = `Path from ${from} to ${to}`;
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
        className="fixed bottom-4 right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 z-50 transition-transform hover:scale-105"
        aria-label="Toggle Route Planner"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m0 0v2.25m0-2.25h1.5M12 9m0 0H9m3 0h.008M12 12.75m0 0H9m3 0h.008m0 0H12m3 0h.008M12 15.75m0 0H9m3 0h.008m0 0h.75m3-12h.008v.008H18V3.75m-3 .008H18V6.75m0 0H18M15 6.75H9m6 0V3.75M3 12h18M3 12c0-1.657 1.343-3 3-3h1.372c.863 0 1.609-.304 2.228-.834L10.5 7.5M3 12c0 1.657 1.343 3 3 3h1.372c.863 0 1.609.304 2.228.834L10.5 16.5m5.25-9v9" />
        </svg>
        {routeItems.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {routeItems.length}
          </span>
        )}
      </button>

      <div
        className={`fixed top-0 right-0 h-full w-80 md:w-96 bg-gray-800 text-white p-4 shadow-xl z-40 overflow-y-auto transform transition-transform duration-300 ease-in-out
                      ${showPanel ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="route-planner-title"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 id="route-planner-title" className="text-xl font-bold text-purple-300">Route Planner</h2>
          <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-white" aria-label="Close Route Planner">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {routeItems.length === 0 ? (
          <p className="text-gray-400 text-sm">No items added to your route. Click the '+' on item cards or use the 'Add to Route' buttons on item pages.</p>
        ) : (
          <>
            <ul className="space-y-2 mb-4">
              {routeItems.map((item, index) => {
                const detail = itemDetailsMap[item.id as string];
                const itemName = detail?.name || `Item ID: ${(item.id as string).substring(0, 6)}...`;
                const itemTypeDisplay = detail?.type ? ` (${detail.type})` : '';
                return (
                  <li key={`${item.id}-${item.type}-${index}`} className="p-2 bg-gray-700 rounded flex justify-between items-center group">
                    <span className="truncate text-sm" title={`${itemName}${itemTypeDisplay}`}>{index + 1}. {itemName}{itemTypeDisplay}</span>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                        title="Move Up"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === routeItems.length - 1}
                        className="p-1 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                        title="Move Down"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => { removeItemFromRoute(item); setDirections(null); }}
                        className="text-red-400 hover:text-red-300 p-1 hover:bg-gray-600 rounded"
                        title="Remove"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.096 3.222.261m3.222.261L12 5.291M8.25 5.291L12 5.291m0 0L15.75 5.291M3.375 5.291L12 1.35m0 0L20.625 5.291" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex space-x-2 mb-4">
              <button
                onClick={handleCalculateRoute}
                disabled={routeItems.length < 2 || !data}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded disabled:opacity-50 transition-colors"
              >
                Get Directions
              </button>
              <button
                onClick={() => { clearRoute(); setDirections(null); }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded transition-colors"
              >
                Clear Route
              </button>
            </div>
          </>
        )}

        {directions && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2 text-purple-300">Directions:</h3>
            {directions.length === 0 && routeItems.length >= 2 && <p className="text-gray-400 text-sm">Could not calculate a route. Ensure items are in valid locations or add more items.</p>}
            {directions.length === 0 && routeItems.length < 2 && <p className="text-gray-400 text-sm">Add at least two items to calculate a route.</p>}

            <ul className="space-y-3">
              {directions.map((segment, index) => (
                <li key={index} className="p-3 bg-gray-700 rounded-md">
                  <p className="font-medium text-sm">Segment {index + 1}: {segment.fromItemName} <span className="text-gray-400">to</span> {segment.toItemName}</p>
                  <p className="text-xs text-gray-400 italic mt-0.5">{segment.pathDescription}</p>
                  {segment.pathResult ? (
                    <>
                      {segment.pathResult.path.length > 1 && (
                        <p className="text-xs text-gray-300 mt-1">
                          Route: {segment.pathResult.path.map(pid => data.halls[pid]?.name || pid.substring(0, 6)).join(' → ')}
                        </p>
                      )}
                      <p className="text-xs text-green-400 mt-0.5">Time: {segment.pathResult.totalSeconds} seconds</p>
                    </>
                  ) : (
                    <p className="text-xs text-red-400 mt-1">No path found for this segment.</p>
                  )}
                </li>
              ))}
            </ul>
            {directions.length > 0 && totalRouteTime > 0 && (
              <p className="mt-4 font-bold text-md text-green-300">
                Total Estimated Route Time: {totalRouteTime} seconds
              </p>
            )}
          </div>
        )}
      </div>

      {showPanel && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setShowPanel(false)}
          aria-hidden="true"
        ></div>
      )}
    </>
  );
};

export default RoutePlannerPanel;