// src/viewer/contexts/RouteContext.tsx
import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';
import type { HallID } from '../types';

interface RouteContextType {
  routeHalls: HallID[];
  addHallToRoute: (hallId: HallID) => void;
  removeHallFromRoute: (hallId: HallID) => void;
  reorderHallsInRoute: (newOrder: HallID[]) => void;
  clearRoute: () => void;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const RouteProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [routeHalls, setRouteHalls] = useState<HallID[]>([]);

  const addHallToRoute = useCallback((hallId: HallID) => {
    setRouteHalls(prevHalls => {
      if (!prevHalls.includes(hallId)) {
        return [...prevHalls, hallId];
      }
      return prevHalls;
    });
  }, []);

  const removeHallFromRoute = useCallback((hallId: HallID) => {
    setRouteHalls(prevHalls => prevHalls.filter(id => id !== hallId));
  }, []);

  const reorderHallsInRoute = useCallback((newOrder: HallID[]) => {
    setRouteHalls(newOrder);
  }, []);

  const clearRoute = useCallback(() => {
    setRouteHalls([]);
  }, []);

  return (
    <RouteContext.Provider value={{ routeHalls, addHallToRoute, removeHallFromRoute, reorderHallsInRoute, clearRoute }}>
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