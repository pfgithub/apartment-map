import React, { useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useRoute } from '../contexts/RouteContext';
import BuildingCard from '../components/BuildingCard';
import type { Building } from '../types';
import DrawerIcon from '../icons/DrawerIcon';

const AllBuildingsPage: React.FC = () => {
  const { data } = useData();
  const { setBreadcrumbs } = useRoute();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', link: '/' },
      { label: 'Buildings' }
    ]);
  }, [setBreadcrumbs]);

  if (!data) return <p className="text-center py-10">No data available.</p>;

  const allBuildings = Object.values(data.buildings);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">All Buildings</h1>
        <p className="text-gray-600 mt-1">Explore all the buildings on campus.</p>
      </header>
      {allBuildings.length === 0 ? (
        <div className="text-center py-10 bg-white shadow rounded-lg">
          <DrawerIcon />
          <p className="text-xl text-gray-700">No buildings found.</p>
          <p className="text-gray-500 mt-1">It seems there's no building data to display at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allBuildings.map((building: Building) => (
            <BuildingCard key={building.id} building={building} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllBuildingsPage;