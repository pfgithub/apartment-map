import React from 'react';
import { useData } from '../contexts/DataContext';
import PoiCard from '../components/PoiCard';
import type { PointOfInterest } from '../types';

const AllPoisPage: React.FC = () => {
  const { data, loading, error } = useData();

  if (loading) return <p className="text-center py-10">Loading points of interest...</p>;
  if (error) return <p className="text-center py-10 text-red-500">Error loading data: {error.message}</p>;
  if (!data) return <p className="text-center py-10">No data available.</p>;

  const allPois = Object.values(data.points_of_interest);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-700">All Points of Interest</h1>
      {allPois.length === 0 ? (
        <p>No points of interest available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allPois.map((poi: PointOfInterest) => (
            <PoiCard key={poi.id} poi={poi} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllPoisPage;