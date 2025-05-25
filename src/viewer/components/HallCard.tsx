import React from 'react';
import { Link } from 'react-router-dom';
import type { Hall } from '../types';
import ImageDisplay from './ImageDisplay';
import { useRoute } from '../contexts/RouteContext'; // For add/remove button
import AddIcon from '../icons/AddIcon';
import RemoveIcon from '../icons/RemoveIcon';

interface HallCardProps {
  hall: Hall;
  showAddToRouteButton?: boolean; // Optional: To control visibility of add/remove button
}

const HallCard: React.FC<HallCardProps> = ({ hall, showAddToRouteButton = false }) => {
  const { addItemToRoute, removeItemFromRoute, isItemInRoute } = useRoute();
  const routeItem = { id: hall.id, type: 'hall' as const };
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
      <Link to={`/halls/${hall.id}`} className="block">
        <div className="overflow-hidden">
          <ImageDisplay image={hall.image} className="w-full aspect-16/9 object-cover transition-transform duration-300" />
        </div>
        <div className="p-4">
          <h3 className="text-xl font-semibold mb-1 text-blue-700 group-hover:text-blue-800">{hall.name}</h3>
          <p className="text-gray-600 text-sm mb-2 truncate h-10">{hall.description}</p>
        </div>
      </Link>
      {showAddToRouteButton && (
        <button
          onClick={handleToggleRoute}
          title={inRoute ? 'Remove from route' : 'Add to route'}
          className={`absolute top-2 right-2 p-1.5 rounded-full text-white transition-colors
                      ${inRoute ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
        >
          {inRoute ? <RemoveIcon /> : <AddIcon />}
        </button>
      )}
    </div>
  );
};

export default HallCard;