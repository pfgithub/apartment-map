// src/viewer/pages/AllRoomsPage.tsx
import React, { useMemo, useState, useEffect } from 'react';
import RoomCard from '../components/RoomCard';
import { useData } from '../contexts/DataContext';
import { useRoute } from '../contexts/RouteContext';
import WarningIcon from '../icons/WarningIcon';
import type { Room, HallID } from '../types';
import RoomFilterSidebar from '../components/RoomFilterSidebar.tsx';
import { findShortestPath } from '../utils/pathfinding';

export interface RoomFilters {
  availability: 'any' | 'available' | 'unavailable';
  priceMin: string;
  priceMax: string;
  bedrooms: string;
  bathrooms: string;
  features: {
    kitchen: boolean;
    balcony: boolean;
    window: boolean;
    storage: boolean;
  };
  nearestHall: HallID | 'any';
  maxDistanceSeconds: string;
}

interface SortConfig {
  key: string;
  order: 'asc' | 'desc';
}

const AllRoomsPage: React.FC = () => {
  const { data } = useData();
  const { setBreadcrumbs } = useRoute();

  const [filters, setFilters] = useState<RoomFilters>({
    availability: 'any',
    priceMin: '',
    priceMax: '',
    bedrooms: 'any',
    bathrooms: 'any',
    features: {
      kitchen: false,
      balcony: false,
      window: false,
      storage: false,
    },
    nearestHall: 'any',
    maxDistanceSeconds: '',
  });

  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'name', // Default sort key
    order: 'asc',  // Default sort order
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', link: '/' },
      { label: 'All Rooms' }
    ]);
  }, [setBreadcrumbs]);

  // Reset sort key if 'distance' is selected and nearestHall filter is cleared
  useEffect(() => {
    if (sortConfig.key === 'distance' && filters.nearestHall === 'any') {
      setSortConfig(prev => ({ ...prev, key: 'name' })); 
    }
  }, [filters.nearestHall, sortConfig.key]);

  const filterOptions = useMemo(() => {
    const allRoomsList = Object.values(data.rooms);
    const allHallsList = Object.values(data.halls);

    if (allRoomsList.length === 0 && allHallsList.length === 0) {
      return {
        minPrice: 0,
        maxPrice: 1000,
        bedroomOptions: ['any'],
        bathroomOptions: ['any'],
        hallOptions: [{ value: 'any' as const, label: 'Any Hall' }],
      };
    }
    const prices = allRoomsList.map(r => r.price).filter(p => typeof p === 'number');
    const bedroomCounts = new Set(allRoomsList.map(r => r.layout.bedrooms));
    const bathroomCounts = new Set(allRoomsList.map(r => r.layout.bathrooms));

    const sortedBedrooms = Array.from(bedroomCounts).sort((a, b) => a - b).map(String);
    const sortedBathrooms = Array.from(bathroomCounts).sort((a, b) => a - b).map(String);
    
    const hallOptions = [
      { value: 'any' as const, label: 'Any Hall' },
      ...allHallsList
        .map(hall => ({ value: hall.id, label: hall.name }))
        .sort((a, b) => a.label.localeCompare(b.label))
    ];

    return {
      minPrice: prices.length > 0 ? Math.min(...prices) : 0,
      maxPrice: prices.length > 0 ? Math.max(...prices) : 10000,
      bedroomOptions: ['any', ...sortedBedrooms],
      bathroomOptions: ['any', ...sortedBathrooms],
      hallOptions: hallOptions,
    };
  }, [data.rooms, data.halls]);

  const availableSortOptions = useMemo(() => {
    const baseOptions = [
      { value: 'name', label: 'Name' },
      { value: 'price', label: 'Price' },
      { value: 'availability', label: 'Availability' },
      { value: 'bedrooms', label: 'Bedrooms' },
      { value: 'bathrooms', label: 'Bathrooms' },
    ];
    if (filters.nearestHall !== 'any') {
      baseOptions.push({ value: 'distance', label: 'Distance to Selected Hall' });
    }
    return baseOptions;
  }, [filters.nearestHall]);

  const displayedRoomsData = useMemo(() => {
    let candidateRooms: Room[] = Object.values(data.rooms);

    // Apply standard filters first
    if (filters.availability === 'available') {
      candidateRooms = candidateRooms.filter(room => room.available);
    } else if (filters.availability === 'unavailable') {
      candidateRooms = candidateRooms.filter(room => !room.available);
    }

    const priceMinNum = parseFloat(filters.priceMin);
    if (!isNaN(priceMinNum) && filters.priceMin !== '') {
      candidateRooms = candidateRooms.filter(room => room.price >= priceMinNum);
    }

    const priceMaxNum = parseFloat(filters.priceMax);
    if (!isNaN(priceMaxNum) && filters.priceMax !== '') {
      candidateRooms = candidateRooms.filter(room => room.price <= priceMaxNum);
    }

    if (filters.bedrooms !== 'any') {
      const bedroomsNum = parseInt(filters.bedrooms, 10);
      candidateRooms = candidateRooms.filter(room => room.layout.bedrooms === bedroomsNum);
    }

    if (filters.bathrooms !== 'any') {
      const bathroomsNum = parseInt(filters.bathrooms, 10);
      candidateRooms = candidateRooms.filter(room => room.layout.bathrooms === bathroomsNum);
    }

    if (filters.features.kitchen) candidateRooms = candidateRooms.filter(room => room.layout.has_kitchen);
    if (filters.features.balcony) candidateRooms = candidateRooms.filter(room => room.layout.has_balcony);
    if (filters.features.window) candidateRooms = candidateRooms.filter(room => room.layout.has_window);
    if (filters.features.storage) candidateRooms = candidateRooms.filter(room => room.layout.has_storage);

    let roomsForDisplayProcessing: Array<{ room: Room; distanceToSelectedHall?: number }> = 
        candidateRooms.map(room => ({ room, distanceToSelectedHall: undefined }));

    const selectedHallId = filters.nearestHall;
    const isProximityEnabled = selectedHallId !== 'any';
    
    if (isProximityEnabled && data.halls[selectedHallId]) {
      roomsForDisplayProcessing.forEach(item => {
        const room = item.room;
        const roomHallId = room.relations.hall;

        if (!roomHallId || !data.halls[roomHallId]) {
          item.distanceToSelectedHall = undefined; 
          return;
        }

        if (roomHallId === selectedHallId) {
          item.distanceToSelectedHall = 0;
        } else {
          const pathResult = findShortestPath(data, selectedHallId, roomHallId);
          item.distanceToSelectedHall = pathResult ? pathResult.totalSeconds : undefined;
        }
      });

      const maxDistanceVal = parseFloat(filters.maxDistanceSeconds);
      const isDistanceConstraintActive = !isNaN(maxDistanceVal) && maxDistanceVal >= 0 && filters.maxDistanceSeconds !== '';
      
      if (isDistanceConstraintActive) {
        roomsForDisplayProcessing = roomsForDisplayProcessing.filter(item => {
          return typeof item.distanceToSelectedHall === 'number' && item.distanceToSelectedHall <= maxDistanceVal;
        });
      }
    }
    
    // Apply sorting
    let sortedRooms = [...roomsForDisplayProcessing];
    const { key: sortKey, order: sortOrder } = sortConfig;

    if (sortKey === 'name') {
      sortedRooms.sort((a, b) => {
        const comparison = a.room.name.localeCompare(b.room.name);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    } else if (sortKey === 'price') {
      sortedRooms.sort((a, b) => {
        const comparison = a.room.price - b.room.price;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    } else if (sortKey === 'availability') {
      sortedRooms.sort((a, b) => {
        const valA = a.room.available ? 0 : 1; // Available (true) comes first in asc
        const valB = b.room.available ? 0 : 1;
        const comparison = valA - valB;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    } else if (sortKey === 'bedrooms') {
      sortedRooms.sort((a, b) => {
        const comparison = a.room.layout.bedrooms - b.room.layout.bedrooms;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    } else if (sortKey === 'bathrooms') {
      sortedRooms.sort((a, b) => {
        const comparison = a.room.layout.bathrooms - b.room.layout.bathrooms;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    } else if (sortKey === 'distance' && filters.nearestHall !== 'any') {
      sortedRooms.sort((a, b) => {
        const distA = a.distanceToSelectedHall ?? Infinity;
        const distB = b.distanceToSelectedHall ?? Infinity;
        // Sorts rooms with undefined distance to the end for 'asc', and also to the end for 'desc' (farthest)
        if (sortOrder === 'asc') {
            return distA - distB;
        } else {
            return distB - distA;
        }
      });
    }
    return sortedRooms;
  }, [data, filters, sortConfig]);

  const resetFilters = () => {
    setFilters({
      availability: 'any',
      priceMin: '',
      priceMax: '',
      bedrooms: 'any',
      bathrooms: 'any',
      features: {
        kitchen: false,
        balcony: false,
        window: false,
        storage: false,
      },
      nearestHall: 'any',
      maxDistanceSeconds: '',
    });
    // Optionally reset sort to default when filters are reset
    // setSortConfig({ key: 'name', order: 'asc' }); 
  };

  return (
    <div className="flex flex-col lg:flex-row gap-x-6 gap-y-6">
      <RoomFilterSidebar
        filters={filters}
        setFilters={setFilters}
        resetFilters={resetFilters}
        filterOptions={filterOptions}
      />
      <main className="flex-1">
        <header className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">All Rooms</h1>
          <p className="text-gray-600 mt-1">Browse and filter all rooms available on campus.</p>
        </header>

        <div className="flex items-center justify-start space-x-4 mb-4 bg-gray-50 p-3 rounded-md border border-gray-200">
          <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            id="sort-select"
            value={sortConfig.key}
            onChange={(e) => setSortConfig(prev => ({ ...prev, key: e.target.value }))}
            className="block w-auto pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm rounded-md shadow-sm"
          >
            {availableSortOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button
            onClick={() => setSortConfig(prev => ({ ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' }))}
            title={`Toggle sort order (current: ${sortConfig.order})`}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sky-500 shadow-sm transition-colors"
          >
            {sortConfig.order === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Showing {displayedRoomsData.length} of {Object.values(data.rooms).length} rooms.
        </p>

        {displayedRoomsData.length === 0 ? (
          <div className="text-center py-10 bg-white shadow rounded-lg mt-4">
            <WarningIcon />
            <p className="text-xl text-gray-700 mt-2">No rooms match your current filters.</p>
            <p className="text-gray-500 mt-1">Try adjusting your filter criteria or resetting them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {displayedRoomsData.map((item) => (
              <RoomCard
                key={item.room.id}
                room={item.room}
                hallName={data.halls[item.room.relations.hall]?.name}
                distanceToSelectedHall={(filters.nearestHall !== "any" && typeof item.distanceToSelectedHall === 'number') ? {
                  hallId: filters.nearestHall,
                  seconds: item.distanceToSelectedHall
                } : undefined}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AllRoomsPage;