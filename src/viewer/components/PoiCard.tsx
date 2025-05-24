import React from 'react';
import { Link } from 'react-router-dom';
import type { PointOfInterest } from '../types';
import ImageDisplay from './ImageDisplay';

interface PoiCardProps {
  poi: PointOfInterest;
}

const PoiCard: React.FC<PoiCardProps> = ({ poi }) => {
  return (
    <Link to={`/pois/${poi.id}`} className="block bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <ImageDisplay image={poi.image} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-1">{poi.name}</h3>
        <p className="text-gray-700 text-sm mb-2 truncate h-10">{poi.description}</p>
      </div>
    </Link>
  );
};

export default PoiCard;