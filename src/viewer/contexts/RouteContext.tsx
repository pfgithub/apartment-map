// src/viewer/contexts/RouteContext.tsx
import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import type { HallID, RoomID, PointOfInterestID } from '../types';

export interface RouteItem {
  id: HallID | RoomID | PointOfInterestID;
  type: 'hall' | 'room' | 'poi';
}

export interface Breadcrumb {
  label: string;
  link?: string;
}

// New interface for map visualization
export interface PathSegmentForMap {
  path: HallID[]; // Sequence of hall IDs for this segment
}

interface RouteContextType {
  routeItems: RouteItem[];
  addItemToRoute: (item: RouteItem) => void;
  removeItemFromRoute: (item: RouteItem) => void;
  isItemInRoute: (item: RouteItem) => boolean;
  reorderItemsInRoute: (newOrder: RouteItem[]) => void;
  clearRoute: () => void;
  breadcrumbs: Breadcrumb[];
  setBreadcrumbs: (breadcrumbs: Breadcrumb[]) => void;
  calculatedRouteSegmentsForMap: PathSegmentForMap[] | null; // New state for map
  setCalculatedRouteSegmentsForMap: (segments: PathSegmentForMap[] | null) => void; // New setter for map
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const RouteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [routeItems, setRouteItems] = useState<RouteItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [calculatedRouteSegmentsForMap, setCalculatedRouteSegmentsForMap] = useState<PathSegmentForMap[] | null>(null); // New state

  const addItemToRoute = useCallback((itemToAdd: RouteItem) => {
    setRouteItems(prevItems => {
      if (!prevItems.some(item => item.id === itemToAdd.id && item.type === itemToAdd.type)) {
        return [...prevItems, itemToAdd];
      }
      return prevItems;
    });
  }, []);

  const removeItemFromRoute = useCallback((itemToRemove: RouteItem) => {
    setRouteItems(prevItems => prevItems.filter(item => !(item.id === itemToRemove.id && item.type === itemToRemove.type)));
    setCalculatedRouteSegmentsForMap(null); // Clear map highlights if route changes
  }, []);

  const isItemInRoute = useCallback((itemToCheck: RouteItem) => {
    return routeItems.some(item => item.id === itemToCheck.id && item.type === itemToCheck.type);
  }, [routeItems]);

  const reorderItemsInRoute = useCallback((newOrder: RouteItem[]) => {
    setRouteItems(newOrder);
    setCalculatedRouteSegmentsForMap(null); // Clear map highlights if route changes
  }, []);

  const clearRoute = useCallback(() => {
    setRouteItems([]);
    setCalculatedRouteSegmentsForMap(null); // Clear map highlights
  }, []);

  const handleSetBreadcrumbs = useCallback((newBreadcrumbs: Breadcrumb[]) => {
    setBreadcrumbs(newBreadcrumbs);
  }, []);

  const handleSetCalculatedRouteSegmentsForMap = useCallback((segments: PathSegmentForMap[] | null) => {
    setCalculatedRouteSegmentsForMap(segments);
  }, []);

  return (
    <RouteContext.Provider value={{ 
      routeItems, addItemToRoute, removeItemFromRoute, isItemInRoute, reorderItemsInRoute, clearRoute,
      breadcrumbs, setBreadcrumbs: handleSetBreadcrumbs,
      calculatedRouteSegmentsForMap, setCalculatedRouteSegmentsForMap: handleSetCalculatedRouteSegmentsForMap // Provide new state and setter
    }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRoute = () => {
  const context = useContext(RouteContext);
  if (context === undefined) {
    throw new Error('useRoute must be used within a RouteProvider');
  }
  return context;
};