import React, { useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useRoute } from '../contexts/RouteContext';
import PoiCard from '../components/PoiCard';
import type { PointOfInterest } from '../types';
import PoiIcon from '../icons/PoiIcon';

const AllPoisPage: React.FC = () => {
  const { data } = useData();
  const { setBreadcrumbs } = useRoute();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', link: '/' },
      { label: 'All Points of Interest' }
    ]);
  }, [setBreadcrumbs]);

  const allPois = Object.values(data.points_of_interest);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">All Points of Interest</h1>
        <p className="text-gray-600 mt-1">Discover various points of interest around the campus.</p>
      </header>
      {allPois.length === 0 || true ? (
         <div className="text-center py-10 bg-white shadow rounded-lg">
          <PoiIcon />
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