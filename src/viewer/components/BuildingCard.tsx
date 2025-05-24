import React from 'react';
import { Link } from 'react-router-dom';
import type { Building } from '../types';
import ImageDisplay from './ImageDisplay';

interface BuildingCardProps {
  building: Building;
}

const BuildingCard: React.FC<BuildingCardProps> = ({ building }) => {
  return (
    <Link to={`/buildings/${building.id}`} className="group block bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="overflow-hidden">
        <ImageDisplay image={building.image} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
      </div>
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-1 text-blue-700 group-hover:text-blue-800">{building.name}</h3>
        <p className="text-gray-600 text-sm mb-2 truncate h-10">{building.description}</p>
      </div>
    </Link>
  );
};

export default BuildingCard;