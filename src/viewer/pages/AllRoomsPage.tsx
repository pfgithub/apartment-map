// src/viewer/pages/AllRoomsPage.tsx
import React, { useMemo } from 'react';
import RoomCard from '../components/RoomCard';
import { useData } from '../contexts/DataContext';
import WarningIcon from '../icons/WarningIcon';
import type { Room } from '../types';

const AllRoomsPage: React.FC = () => {
  const { data } = useData();

  const displayedRooms = useMemo(() => {
    return Object.values(data.rooms);
  }, [data]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
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