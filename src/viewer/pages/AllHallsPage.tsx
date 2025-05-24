import React, { useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useRoute } from '../contexts/RouteContext';
import HallCard from '../components/HallCard';
import type { Hall } from '../types';

const AllHallsPage: React.FC = () => {
  const { data, loading, error } = useData();
  const { setBreadcrumbs } = useRoute();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', link: '/' },
      { label: 'All Halls' }
    ]);
  }, [setBreadcrumbs]);

  if (loading) return <p className="text-center py-10">Loading halls...</p>;
  if (error) return <p className="text-center py-10 text-red-500">Error loading data: {error.message}</p>;
  if (!data) return <p className="text-center py-10">No data available.</p>;

  const allHalls = Object.values(data.halls);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">All Halls</h1>
        <p className="text-gray-600 mt-1">Explore all the halls within our campus.</p>
      </header>
      {allHalls.length === 0 ? (
        <div className="text-center py-10 bg-white shadow rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 mx-auto mb-4">
             <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6M9 12h6m-6 5.25h6M5.25 3h13.5v18h-13.5z" />
          </svg>
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