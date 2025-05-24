// src/viewer/contexts/RouteContext.tsx
import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import type { HallID, RoomID, PointOfInterestID } from '../types';

export interface RouteItem {
  id: HallID | RoomID | PointOfInterestID;
  type: 'hall' | 'room' | 'poi';
}

interface RouteContextType {
  routeItems: RouteItem[];
  addItemToRoute: (item: RouteItem) => void;
  removeItemFromRoute: (item: RouteItem) => void;
  isItemInRoute: (item: RouteItem) => boolean;
  reorderItemsInRoute: (newOrder: RouteItem[]) => void;
  clearRoute: () => void;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const RouteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [routeItems, setRouteItems] = useState<RouteItem[]>([]);

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
  }, []);

  const isItemInRoute = useCallback((itemToCheck: RouteItem) => {
    return routeItems.some(item => item.id === itemToCheck.id && item.type === itemToCheck.type);
  }, [routeItems]);

  const reorderItemsInRoute = useCallback((newOrder: RouteItem[]) => {
    setRouteItems(newOrder);
  }, []);

  const clearRoute = useCallback(() => {
    setRouteItems([]);
  }, []);

  return (
    <RouteContext.Provider value={{ routeItems, addItemToRoute, removeItemFromRoute, isItemInRoute, reorderItemsInRoute, clearRoute }}>
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