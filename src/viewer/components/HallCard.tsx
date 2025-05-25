import React from 'react';
import { Link } from 'react-router-dom';
import type { Hall } from '../types';
import ImageDisplay from './ImageDisplay';
import { useRoute } from '../contexts/RouteContext';
import AddIcon from '../icons/AddIcon';
import RemoveIcon from '../icons/RemoveIcon';

interface HallCardProps {
  hall: Hall;
  showAddToRouteButton?: boolean;
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

  // The specified style string: "p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
  // This will be applied to the Link component, which acts as the card body.
  // The outer div is for relative positioning of the add/remove button and for the group hover effect.
  return (
    <div className="relative group">
      <Link
        to={`/halls/${hall.id}`}
        className="flex items-center p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
      >
        {/* Image on the left */}
        <div className="flex-shrink-0 w-20 h-20 mr-4">
          <ImageDisplay
            image={hall.image}
            className="w-full h-full object-cover rounded-md"
          />
        </div>

        {/* Text content on the right: Name and Description vertically stacked */}
        <div className="flex-grow min-w-0"> {/* min-w-0 for better flex truncation handling */}
          <h3 className="font-semibold text-lg text-blue-700 group-hover:text-blue-800 truncate">
            {hall.name}
          </h3>
          <p className="text-gray-600 text-sm mt-0.5 line-clamp-2"> {/* line-clamp-2 limits description to 2 lines */}
            {hall.description}
          </p>
        </div>
      </Link>

      {/* Add/Remove button, positioned absolutely relative to the outer div */}
      {showAddToRouteButton && (
        <button
          onClick={handleToggleRoute}
          title={inRoute ? 'Remove from route' : 'Add to route'}
          className={`absolute top-2 right-2 p-1.5 rounded-full text-white transition-colors z-10
                      ${inRoute ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
        >
          {inRoute ? <RemoveIcon /> : <AddIcon />}
        </button>
      )}
    </div>
  );
};

export default HallCard;