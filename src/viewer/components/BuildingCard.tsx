import React from 'react';
import { Link } from 'react-router-dom';
import type { Building } from '../types';
import ImageDisplay from './ImageDisplay';

interface BuildingCardProps {
  building: Building;
}

const BuildingCard: React.FC<BuildingCardProps> = ({ building }) => {
  // Building type has 'description' but not 'name'. We'll use description as the prominent text.
  return (
    <Link to={`/buildings/${building.id}`} className="block bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <ImageDisplay image={building.image} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-1">{building.name}</h3>
        <p className="text-gray-700 text-sm mb-2 truncate h-10">{building.description}</p>
      </div>
    </Link>
  );
};

export default BuildingCard;