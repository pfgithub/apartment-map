import React from 'react';
import { useData } from '../contexts/DataContext';
import HallCard from '../components/HallCard';
import type { Hall } from '../types';

const AllHallsPage: React.FC = () => {
  const { data, loading, error } = useData();

  if (loading) return <p className="text-center py-10">Loading halls...</p>;
  if (error) return <p className="text-center py-10 text-red-500">Error loading data: {error.message}</p>;
  if (!data) return <p className="text-center py-10">No data available.</p>;

  const allHalls = Object.values(data.halls);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-700">All Halls</h1>
      {allHalls.length === 0 ? (
        <p>No halls available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allHalls.map((hall: Hall) => (
            <HallCard key={hall.id} hall={hall} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllHallsPage;