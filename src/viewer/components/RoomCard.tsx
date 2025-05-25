// src/viewer/components/RoomCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import type { HallID, Room } from '../types';
import ImageDisplay from './ImageDisplay';
import { useRoute } from '../contexts/RouteContext';
import AddIcon from '../icons/AddIcon';
import RemoveIcon from '../icons/RemoveIcon';
import { BedIcon } from '../icons/BedIcon';
import { BathIcon } from '../icons/BathIcon';
import { KitchenIcon } from '../icons/KitchenIcon';
import { BalconyIcon } from '../icons/BalconyIcon';
import { WindowIcon } from '../icons/WindowIcon';
import { StorageIcon } from '../icons/StorageIcon';
import { useData } from '../contexts/DataContext';

interface RoomCardProps {
  room: Room;
  hallName?: string;
  distanceToSelectedHall?: {seconds: number, hallId: HallID}; // New prop
}

const RoomCard: React.FC<RoomCardProps> = ({ room, hallName, distanceToSelectedHall }) => {
  const { addItemToRoute, removeItemFromRoute, isItemInRoute } = useRoute();
  const { data } = useData();
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
    <div className="relative group bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
      <Link to={`/rooms/${room.id}`} className="flex flex-col flex-grow">
        <div className="overflow-hidden">
          <ImageDisplay image={room.image} className="w-full aspect-16/9 object-cover transition-transform duration-300" />
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-xl font-semibold mb-1 text-blue-700 group-hover:text-blue-800">{room.name}</h3>
          
          {hallName && <p className="text-xs text-gray-500 mb-0.5">In: {hallName}</p>}
          {distanceToSelectedHall && distanceToSelectedHall.seconds >= 0 && (
            <p className="text-xs text-purple-600 font-medium mb-1.5">
              Distance: {distanceToSelectedHall.seconds}s to <Link className='underline' to={`/halls/${distanceToSelectedHall.hallId}`}>{data.halls[distanceToSelectedHall.hallId].name}</Link>
            </p>
          )}

          <p className="text-gray-600 text-sm mb-2 truncate h-10 flex-shrink-0">{room.description}</p>
          
          <div className="mt-auto"> {/* Pushes content below to the bottom */}
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
              <span className="text-lg font-bold text-sky-600">${room.price}<span className="text-xs font-normal text-gray-500">/night</span></span>
              {room.available ? (
                <span className="px-2 py-0.5 text-xs font-semibold text-green-700 bg-green-100 rounded-full">Available</span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-semibold text-red-700 bg-red-100 rounded-full">Unavailable</span>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-500 mb-1.5">Features:</h4>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-gray-700">
                <span className="flex items-center">
                  <BedIcon className="w-4 h-4 mr-1.5 text-sky-600 flex-shrink-0" /> {room.layout.bedrooms} bed{room.layout.bedrooms !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center">
                  <BathIcon className="w-4 h-4 mr-1.5 text-sky-600 flex-shrink-0" /> {room.layout.bathrooms} bath{room.layout.bathrooms !== 1 ? 's' : ''}
                </span>
                {room.layout.has_kitchen && (
                  <span className="flex items-center">
                    <KitchenIcon className="w-4 h-4 mr-1.5 text-sky-600 flex-shrink-0" /> Kitchen
                  </span>
                )}
                {room.layout.has_balcony && (
                  <span className="flex items-center">
                    <BalconyIcon className="w-4 h-4 mr-1.5 text-sky-600 flex-shrink-0" /> Balcony
                  </span>
                )}
                {room.layout.has_window && (
                  <span className="flex items-center">
                    <WindowIcon className="w-4 h-4 mr-1.5 text-sky-600 flex-shrink-0" /> Window
                  </span>
                )}
                {room.layout.has_storage && (
                  <span className="flex items-center">
                    <StorageIcon className="w-4 h-4 mr-1.5 text-sky-600 flex-shrink-0" /> Storage
                  </span>
                )}
              </div>
            </div>
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