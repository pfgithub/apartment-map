import React from 'react';
import { Link } from 'react-router-dom';
import type { Room } from '../types';
import ImageDisplay from './ImageDisplay';

interface RoomCardProps {
  room: Room;
  hallName?: string;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, hallName }) => {
  return (
    <Link to={`/rooms/${room.id}`} className="block bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <ImageDisplay image={room.image} className="w-full h-48" />
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-1">{room.name}</h3>
        {hallName && <p className="text-sm text-gray-600 mb-1">In: {hallName}</p>}
        <p className="text-gray-700 text-sm mb-2 truncate">{room.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-blue-600">${room.price}/night</span>
          {room.available ? (
            <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-200 rounded-full">Available</span>
          ) : (
            <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-200 rounded-full">Unavailable</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default RoomCard;