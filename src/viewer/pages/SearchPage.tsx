import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import type { Building, Hall, Room, PointOfInterest, HallID } from '../types'; // Added HallID
import RoomCard from '../components/RoomCard';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.toLowerCase() || '';
  const { data, loading, error } = useData();

  if (loading) return <p className="text-center py-10">Loading search results...</p>;
  if (error) return <p className="text-center py-10 text-red-500">Error loading data: {error.message}</p>;
  if (!data) return <p className="text-center py-10">No data available for search.</p>;

  const filteredBuildings: Building[] = [];
  const filteredHalls: Hall[] = [];
  const filteredRooms: Room[] = [];
  const filteredPOIs: PointOfInterest[] = [];

  if (query) {
    Object.values(data.buildings).forEach(b => {
      if (b.description.toLowerCase().includes(query)) filteredBuildings.push(b);
    });
    Object.values(data.halls).forEach(h => {
      if (h.name.toLowerCase().includes(query) || h.description.toLowerCase().includes(query)) filteredHalls.push(h);
    });
    Object.values(data.rooms).forEach(r => {
      if (r.name.toLowerCase().includes(query) || r.description.toLowerCase().includes(query)) filteredRooms.push(r);
    });
    Object.values(data.points_of_interest).forEach(p => {
      if (p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)) filteredPOIs.push(p);
    });
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-gray-700">Search Results for "{query}"</h1>

      {!query && <p>Please enter a search term in the header.</p>}
      
      {query && (filteredBuildings.length + filteredHalls.length + filteredRooms.length + filteredPOIs.length === 0) && (
        <p>No results found for "{query}".</p>
      )}

      {filteredRooms.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Rooms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map(room => (
              <RoomCard key={room.id} room={room} hallName={data.halls[room.relations.hall as HallID]?.name} />
            ))}
          </div>
        </section>
      )}

      {filteredHalls.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Halls</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredHalls.map(hall => (
              <Link key={hall.id} to={`/halls/${hall.id}`} className="block p-4 bg-white shadow rounded hover:shadow-md">
                <h3 className="text-xl font-medium text-blue-700">{hall.name}</h3>
                <p className="text-sm text-gray-600 truncate">{hall.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
      
      {filteredBuildings.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Buildings</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredBuildings.map(building => (
              <Link key={building.id} to={`/buildings/${building.id}`} className="block p-4 bg-white shadow rounded hover:shadow-md">
                <h3 className="text-xl font-medium text-blue-700">Building {building.id}</h3>
                <p className="text-sm text-gray-600 truncate">{building.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {filteredPOIs.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">Points of Interest</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredPOIs.map(poi => (
              <Link key={poi.id} to={`/pois/${poi.id}`} className="block p-4 bg-white shadow rounded hover:shadow-md">
                <h3 className="text-xl font-medium text-blue-700">{poi.name}</h3>
                <p className="text-sm text-gray-600 truncate">{poi.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SearchPage;