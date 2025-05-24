import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import ImageDisplay from '../components/ImageDisplay';
import type { PointOfInterestID, HallID } from '../types';

const PointOfInterestPage: React.FC = () => {
  const { id } = useParams<{ id: PointOfInterestID }>();
  const { data, loading, error } = useData();

  if (loading) return <p className="text-center py-10">Loading point of interest details...</p>;
  if (error) return <p className="text-center py-10 text-red-500">Error loading data: {error.message}</p>;
  if (!data || !id || !data.points_of_interest[id]) return <p className="text-center py-10">Point of Interest not found.</p>;

  const poi = data.points_of_interest[id];
  const hall = data.halls[poi.relations.hall as HallID];

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
      <div className="md:flex md:space-x-8">
        <div className="md:w-1/3">
          <ImageDisplay image={poi.image} className="w-full h-auto rounded-lg mb-4 md:mb-0" />
        </div>
        <div className="md:w-2/3">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-blue-700">{poi.name}</h1>
          <p className="text-gray-600 text-lg mb-6">{poi.description}</p>

          {hall && (
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-1 text-gray-700">Location:</h3>
              <p className="text-gray-600">
                Located in Hall: <Link to={`/halls/${hall.id}`} className="text-blue-600 hover:underline">{hall.name}</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PointOfInterestPage;