import React from 'react';
import { Link } from 'react-router-dom';
import type { PointOfInterest } from '../types';
import ImageDisplay from './ImageDisplay';
import { useRoute } from '../contexts/RouteContext';

interface PoiCardProps {
  poi: PointOfInterest;
}

const PoiCard: React.FC<PoiCardProps> = ({ poi }) => {
  const { addItemToRoute, removeItemFromRoute, isItemInRoute } = useRoute();
  const routeItem = { id: poi.id, type: 'poi' as const };
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
      <Link to={`/pois/${poi.id}`} className="block">
        <div className="overflow-hidden">
          <ImageDisplay image={poi.image} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="p-4">
          <h3 className="text-xl font-semibold mb-1 text-blue-700 group-hover:text-blue-800">{poi.name}</h3>
          <p className="text-gray-600 text-sm mb-2 truncate h-10">{poi.description}</p>
        </div>
      </Link>
      <button
        onClick={handleToggleRoute}
        title={inRoute ? 'Remove from route' : 'Add to route'}
        className={`absolute top-2 right-2 p-1.5 rounded-full text-white transition-colors z-10
                    ${inRoute ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          {inRoute ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          )}
        </svg>
      </button>
    </div>
  );
};

export default PoiCard;