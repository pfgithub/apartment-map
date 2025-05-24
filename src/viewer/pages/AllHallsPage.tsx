import React, { useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useRoute } from '../contexts/RouteContext';
import HallCard from '../components/HallCard';
import type { Hall } from '../types';
import DrawerIcon from '../icons/DrawerIcon';

const AllHallsPage: React.FC = () => {
  const { data } = useData();
  const { setBreadcrumbs } = useRoute();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', link: '/' },
      { label: 'All Halls' }
    ]);
  }, [setBreadcrumbs]);

  const allHalls = Object.values(data.halls);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">All Halls</h1>
        <p className="text-gray-600 mt-1">Explore all the halls within our campus.</p>
      </header>
      {allHalls.length === 0 ? (
        <div className="text-center py-10 bg-white shadow rounded-lg">
          <DrawerIcon />
          <p className="text-xl text-gray-700">No halls found.</p>
          <p className="text-gray-500 mt-1">It seems there's no hall data to display at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allHalls.map((hall: Hall) => (
            <HallCard key={hall.id} hall={hall} showAddToRouteButton={true} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllHallsPage;