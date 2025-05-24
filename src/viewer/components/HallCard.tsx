import React from 'react';
import { Link } from 'react-router-dom';
import type { Hall } from '../types';
import ImageDisplay from './ImageDisplay';

interface HallCardProps {
  hall: Hall;
}

const HallCard: React.FC<HallCardProps> = ({ hall }) => {
  return (
    <Link to={`/halls/${hall.id}`} className="block bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <ImageDisplay image={hall.image} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-1">{hall.name}</h3>
        <p className="text-gray-700 text-sm mb-2 truncate h-10">{hall.description}</p>
      </div>
    </Link>
  );
};

export default HallCard;