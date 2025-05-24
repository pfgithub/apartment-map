import React, { useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useRoute } from '../contexts/RouteContext';
import RoomCard from '../components/RoomCard';
import type { Room } from '../types';

const AllAvailableRoomsPage: React.FC = () => {
  const { data } = useData();
  const { setBreadcrumbs } = useRoute();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', link: '/' },
      { label: 'All Available Rooms' }
    ]);
  }, [setBreadcrumbs]);

  const availableRooms = Object.values(data.rooms).filter(room => room.available);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">All Available Rooms</h1>
        <p className="text-gray-600 mt-1">Find your perfect stay from our currently available rooms.</p>
      </header>
      {availableRooms.length === 0 ? (
        <div className="text-center py-10 bg-white shadow rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 mx-auto mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-xl text-gray-700">No rooms currently available.</p>
          <p className="text-gray-500 mt-1">Please check back later or explore other sections.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {availableRooms.map((room: Room) => (
            <RoomCard
              key={room.id}
              room={room}
              hallName={data.halls[room.relations.hall]?.name}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllAvailableRoomsPage;