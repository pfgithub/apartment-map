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

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', link: '/' },
      { label: 'All Rooms' }
    ]);
  }, [setBreadcrumbs]);

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

  const displayedRooms = useMemo(() => {
    let roomsToDisplay = Object.values(data.rooms);

    if (filters.availability === 'available') {
      roomsToDisplay = roomsToDisplay.filter(room => room.available);
    } else if (filters.availability === 'unavailable') {
      roomsToDisplay = roomsToDisplay.filter(room => !room.available);
    }

    const priceMinNum = parseFloat(filters.priceMin);
    if (!isNaN(priceMinNum) && filters.priceMin !== '') {
      roomsToDisplay = roomsToDisplay.filter(room => room.price >= priceMinNum);
    }

    const priceMaxNum = parseFloat(filters.priceMax);
    if (!isNaN(priceMaxNum) && filters.priceMax !== '') {
      roomsToDisplay = roomsToDisplay.filter(room => room.price <= priceMaxNum);
    }

    if (filters.bedrooms !== 'any') {
      const bedroomsNum = parseInt(filters.bedrooms, 10);
      roomsToDisplay = roomsToDisplay.filter(room => room.layout.bedrooms === bedroomsNum);
    }

    if (filters.bathrooms !== 'any') {
      const bathroomsNum = parseInt(filters.bathrooms, 10);
      roomsToDisplay = roomsToDisplay.filter(room => room.layout.bathrooms === bathroomsNum);
    }

    if (filters.features.kitchen) roomsToDisplay = roomsToDisplay.filter(room => room.layout.has_kitchen);
    if (filters.features.balcony) roomsToDisplay = roomsToDisplay.filter(room => room.layout.has_balcony);
    if (filters.features.window) roomsToDisplay = roomsToDisplay.filter(room => room.layout.has_window);
    if (filters.features.storage) roomsToDisplay = roomsToDisplay.filter(room => room.layout.has_storage);

    // Nearest Hall and Max Distance filter
    const selectedHallId = filters.nearestHall;
    const maxSeconds = parseFloat(filters.maxDistanceSeconds);

    if (selectedHallId !== 'any' && !isNaN(maxSeconds) && maxSeconds >= 0 && filters.maxDistanceSeconds !== '') {
      if (!data.halls[selectedHallId]) { // Selected hall doesn't exist (edge case)
         // roomsToDisplay remains as is, or could be set to []
      } else {
        roomsToDisplay = roomsToDisplay.filter(room => {
          const roomHallId = room.relations.hall;
          if (!roomHallId || !data.halls[roomHallId]) return false; // Room must be in a valid hall
  
          // If the room is in the selected hall itself, distance is 0
          if (roomHallId === selectedHallId) {
            return 0 <= maxSeconds;
          }
  
          // Calculate path from selectedHallId to roomHallId
          const pathResult = findShortestPath(data, selectedHallId, roomHallId);
          
          if (pathResult) {
            return pathResult.totalSeconds <= maxSeconds;
          }
          return false; // No path found, so it doesn't meet criteria
        });
      }
    }

    return roomsToDisplay;
  }, [data, filters]); // data includes data.rooms, data.halls, data.connections

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

        <p className="text-sm text-gray-600 mb-4">
          Showing {displayedRooms.length} of {Object.values(data.rooms).length} rooms.
        </p>

        {displayedRooms.length === 0 ? (
          <div className="text-center py-10 bg-white shadow rounded-lg mt-4">
            <WarningIcon />
            <p className="text-xl text-gray-700 mt-2">No rooms match your current filters.</p>
            <p className="text-gray-500 mt-1">Try adjusting your filter criteria or resetting them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {displayedRooms.map((room: Room) => (
              <RoomCard
                key={room.id}
                room={room}
                hallName={data.halls[room.relations.hall]?.name}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AllRoomsPage;