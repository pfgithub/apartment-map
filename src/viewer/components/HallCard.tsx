// File: src/viewer/components/HallCard.tsx
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
  footerContent?: React.ReactNode; // New prop for additional content in the footer
}

const HallCard: React.FC<HallCardProps> = ({ hall, showAddToRouteButton = false, footerContent }) => {
  const { addItemToRoute, removeItemFromRoute, isItemInRoute } = useRoute();
  const routeItem = { id: hall.id, type: 'hall' as const };
  const inRoute = isItemInRoute(routeItem);

  const handleToggleRoute = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent Link navigation if button is on top of it.
    if (inRoute) {
      removeItemFromRoute(routeItem);
    } else {
      addItemToRoute(routeItem);
    }
  };

  // The outer div is now the main styled card container.
  // It uses flex-col to allow the main content (Link) and footerContent to stack.
  return (
    <div className="relative group bg-gray-50 rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-150 flex flex-col h-full">
      <Link
        to={`/halls/${hall.id}`}
        // This Link wraps the primary clickable area (image, name, description).
        // It has its own hover effect for background and contains the group 'link' for text hover.
        className="block p-3 group/link hover:bg-gray-100 transition-colors flex-grow" 
      >
        <div className="flex items-center"> {/* Original flex container for image and text */}
          {/* Image on the left */}
          <div className="flex-shrink-0 w-20 h-20 mr-4">
            <ImageDisplay
              image={hall.image}
              className="w-full h-full object-cover rounded-md"
            />
          </div>

          {/* Text content on the right: Name and Description vertically stacked */}
          <div className="flex-grow min-w-0"> {/* min-w-0 for better flex truncation handling */}
            <h3 className="font-semibold text-lg text-blue-700 group-hover/link:text-blue-800 truncate">
              {hall.name}
            </h3>
            <p className="text-gray-600 text-sm mt-0.5 line-clamp-2"> {/* line-clamp-2 limits description to 2 lines */}
              {hall.description}
            </p>
          </div>
        </div>
      </Link>

      {/* Footer content, rendered if provided */}
      {footerContent && (
        <div className="px-3 py-2 border-t border-gray-200 mt-auto"> {/* mt-auto pushes footer to bottom */}
          {footerContent}
        </div>
      )}

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