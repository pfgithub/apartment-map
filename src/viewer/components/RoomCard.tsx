import React from 'react';
import { Link } from 'react-router-dom';
import type { Room } from '../types';
import ImageDisplay from './ImageDisplay';
import { useRoute } from '../contexts/RouteContext';

interface RoomCardProps {
  room: Room;
  hallName?: string;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, hallName }) => {
  const { addItemToRoute, removeItemFromRoute, isItemInRoute } = useRoute();
  const routeItem = { id: room.id, type: 'room' as const };
  const inRoute = isItemInRoute(routeItem);

  const handleToggleRoute = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if card is a Link
    e.stopPropagation();
    if (inRoute) {
      removeItemFromRoute(routeItem);
    } else {
      addItemToRoute(routeItem);
    }
  };

  return (
    <div className="relative bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <Link to={`/rooms/${room.id}`} className="block">
        <ImageDisplay image={room.image} className="w-full h-48" />
        <div className="p-4">
          <h3 className="text-xl font-semibold mb-1">{room.name}</h3>
          {hallName && <p className="text-sm text-gray-600 mb-1">In: {hallName}</p>}
          <p className="text-gray-700 text-sm mb-2 truncate h-10">{room.description}</p>
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
      <button
        onClick={handleToggleRoute}
        title={inRoute ? 'Remove from route' : 'Add to route'}
        className={`absolute top-2 right-2 p-1.5 rounded-full text-white transition-colors
                    ${inRoute ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          {inRoute ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /> // Minus circle
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /> // Plus circle
          )}
        </svg>
      </button>
    </div>
  );
};

export default RoomCard;