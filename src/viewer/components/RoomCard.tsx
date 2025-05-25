import React from 'react';
import { Link } from 'react-router-dom';
import type { Room } from '../types';
import ImageDisplay from './ImageDisplay';
import { useRoute } from '../contexts/RouteContext';
import AddIcon from '../icons/AddIcon';
import RemoveIcon from '../icons/RemoveIcon';

interface RoomCardProps {
  room: Room;
  hallName?: string;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, hallName }) => {
  const { addItemToRoute, removeItemFromRoute, isItemInRoute } = useRoute();
  const routeItem = { id: room.id, type: 'room' as const };
  const inRoute = isItemInRoute(routeItem);

  const handleToggleRoute = (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (inRoute) {
      removeItemFromRoute(routeItem);
    } else {
      addItemToRoute(routeItem);
    }
  };

  return (
    <div className="relative group bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <Link to={`/rooms/${room.id}`} className="block">
        <div className="overflow-hidden">
          <ImageDisplay image={room.image} className="w-full aspect-16/9 object-cover transition-transform duration-300" />
        </div>
        <div className="p-4">
          <h3 className="text-xl font-semibold mb-1 text-blue-700 group-hover:text-blue-800">{room.name}</h3>
          {hallName && <p className="text-xs text-gray-500 mb-1">In: {hallName}</p>}
          <p className="text-gray-600 text-sm mb-2 truncate h-10">{room.description}</p>
          <div className="flex justify-between items-center mt-2">
            <span className="text-lg font-bold text-sky-600">${room.price}<span className="text-xs font-normal text-gray-500">/night</span></span>
            {room.available ? (
              <span className="px-2 py-0.5 text-xs font-semibold text-green-700 bg-green-100 rounded-full">Available</span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-semibold text-red-700 bg-red-100 rounded-full">Unavailable</span>
            )}
          </div>
        </div>
      </Link>
      <button
        onClick={handleToggleRoute}
        title={inRoute ? 'Remove from route' : 'Add to route'}
        className={`absolute top-2 right-2 p-1.5 rounded-full text-white transition-colors z-10
                    ${inRoute ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
      >
        {inRoute ? <RemoveIcon /> : <AddIcon />}
      </button>
    </div>
  );
};

export default RoomCard;