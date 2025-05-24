import React, { useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useRoute } from '../contexts/RouteContext';
import PoiCard from '../components/PoiCard';
import type { PointOfInterest } from '../types';

const AllPoisPage: React.FC = () => {
  const { data, loading, error } = useData();
  const { setBreadcrumbs } = useRoute();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', link: '/' },
      { label: 'All Points of Interest' }
    ]);
  }, [setBreadcrumbs]);

  if (loading) return <p className="text-center py-10">Loading points of interest...</p>;
  if (error) return <p className="text-center py-10 text-red-500">Error loading data: {error.message}</p>;
  if (!data) return <p className="text-center py-10">No data available.</p>;

  const allPois = Object.values(data.points_of_interest);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">All Points of Interest</h1>
        <p className="text-gray-600 mt-1">Discover various points of interest around the campus.</p>
      </header>
      {allPois.length === 0 ? (
         <div className="text-center py-10 bg-white shadow rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 mx-auto mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <p className="text-xl text-gray-700">No Points of Interest found.</p>
          <p className="text-gray-500 mt-1">There are no POIs listed at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allPois.map((poi: PointOfInterest) => (
            <PoiCard key={poi.id} poi={poi} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllPoisPage;