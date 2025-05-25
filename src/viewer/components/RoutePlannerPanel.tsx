// src/viewer/components/RoutePlannerPanel.tsx
import React, { useState, useMemo, useCallback } from 'react'; // Added useCallback
import { useRoute, type RouteItem, type PathSegmentForMap } from '../contexts/RouteContext'; // Updated import
import { useData } from '../contexts/DataContext';
import { findShortestPath, type PathResult } from '../utils/pathfinding';
import type { HallID, RoomID, PointOfInterestID, Root } from '../types';
import RoutePlannerIcon from '../icons/RoutePlannerIcon';
import CloseIcon from '../icons/CloseIcon';
import UpIcon from '../icons/UpIcon';
import DownIcon from '../icons/DownIcon';
import TrashIcon from '../icons/TrashIcon';

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
  const { 
    routeItems, 
    removeItemFromRoute, 
    reorderItemsInRoute, 
    clearRoute, 
    setCalculatedRouteSegmentsForMap // Get the setter from context
  } = useRoute();
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

  const handleClearRouteAndHighlights = useCallback(() => {
    clearRoute(); // from context, already clears map highlights
    setDirections(null);
  }, [clearRoute]);

  const handleItemRemovalAndHighlights = useCallback((item: RouteItem) => {
    removeItemFromRoute(item); // from context, already clears map highlights
    setDirections(null);
  }, [removeItemFromRoute]);

  const handleReorderAndHighlights = useCallback((newRouteItems: RouteItem[]) => {
    reorderItemsInRoute(newRouteItems); // from context, already clears map highlights
    setDirections(null);
  }, [reorderItemsInRoute]);


  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === routeItems.length - 1) return;

    const newRouteItems = [...routeItems];
    const itemToMove = newRouteItems.splice(index, 1)[0];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    newRouteItems.splice(newIndex, 0, itemToMove);
    handleReorderAndHighlights(newRouteItems);
  };

  const handleCalculateRoute = () => {
    if (!data || routeItems.length < 2) {
      setDirections([]);
      setCalculatedRouteSegmentsForMap(null); // Clear map highlights
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

    // Update context for map visualization
    if (newDirections.length > 0) {
      const routeSegmentsForMap: PathSegmentForMap[] = newDirections
        .map(segment => segment.pathResult ? { path: segment.pathResult.path } : null)
        .filter((segment): segment is PathSegmentForMap => segment !== null && segment.path.length > 0);
      setCalculatedRouteSegmentsForMap(routeSegmentsForMap.length > 0 ? routeSegmentsForMap : null);
    } else {
      setCalculatedRouteSegmentsForMap(null);
    }
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
        <RoutePlannerIcon />
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
            <CloseIcon />
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
                        <UpIcon />
                      </button>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === routeItems.length - 1}
                        className="p-1 hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed rounded"
                        title="Move Down"
                      >
                        <DownIcon />
                      </button>
                      <button
                        onClick={() => handleItemRemovalAndHighlights(item) }
                        className="text-red-400 hover:text-red-300 p-1 hover:bg-gray-600 rounded"
                        title="Remove"
                      >
                        <TrashIcon />
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
                onClick={handleClearRouteAndHighlights}
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