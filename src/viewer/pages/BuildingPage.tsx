import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import ImageDisplay from '../components/ImageDisplay';
import type { BuildingID, HallID } from '../types';

const BuildingPage: React.FC = () => {
  const { id } = useParams<{ id: BuildingID }>();
  const { data, loading, error } = useData();

  if (loading) return <p className="text-center py-10">Loading building details...</p>;
  if (error) return <p className="text-center py-10 text-red-500">Error loading data: {error.message}</p>;
  if (!data || !id || !data.buildings[id]) return <p className="text-center py-10">Building not found.</p>;

  const building = data.buildings[id];

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
      <div className="md:flex md:space-x-8">
        <div className="md:w-1/3">
          <ImageDisplay image={building.image} className="w-full h-auto rounded-lg mb-4 md:mb-0" />
        </div>
        <div className="md:w-2/3">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-blue-700">{building.description.split('.')[0]}</h1>
          <p className="text-gray-600 text-lg mb-6">{building.description}</p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-3 text-gray-700">Halls in this Building</h2>
        {building.relations.halls.length > 0 ? (
          <ul className="space-y-2">
            {building.relations.halls.map(hallId => {
              const hall = data.halls[hallId as HallID];
              return hall ? (
                <li key={hallId} className="p-3 bg-gray-50 rounded hover:bg-gray-100">
                  <Link to={`/halls/${hall.id}`} className="text-blue-600 hover:underline font-medium">{hall.name}</Link>
                  <p className="text-sm text-gray-500 mt-1">{hall.description.length > 100 ? `${hall.description.substring(0, 100)}...` : hall.description}</p>
                </li>
              ) : null;
            })}
          </ul>
        ) : <p className="text-gray-500">No halls listed for this building.</p>}
      </div>
    </div>
  );
};

export default BuildingPage;