import React from 'react';
import { useData } from '../contexts/DataContext';
import RoomCard from '../components/RoomCard';
import { Room, HallID } from '../types';

const HomePage: React.FC = () => {
  const { data, loading, error } = useData();

  if (loading) return <p className="text-center py-10">Loading available rooms...</p>;
  if (error) return <p className="text-center py-10 text-red-500">Error loading data: {error.message}</p>;
  if (!data) return <p className="text-center py-10">No data available.</p>;

  const availableRooms = Object.values(data.rooms).filter(room => room.available);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-700">Available Rooms</h1>
      {availableRooms.length === 0 ? (
        <p>No rooms currently available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableRooms.map((room: Room) => (
            <RoomCard
              key={room.id}
              room={room}
              hallName={data.halls[room.relations.hall as HallID]?.name}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HomePage;