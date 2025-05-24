import React, { useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useRoute } from '../contexts/RouteContext';
import type { Building, Hall, Room, PointOfInterest, HallID } from '../types';
import RoomCard from '../components/RoomCard';
import HallCard from '../components/HallCard';
import BuildingCard from '../components/BuildingCard';
import PoiCard from '../components/PoiCard';

const SearchPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.toLowerCase() || '';
  const { data, loading, error } = useData();
  const { setBreadcrumbs } = useRoute();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', link: '/' },
      { label: `Search: "${query}"` }
    ]);
  }, [setBreadcrumbs, query]);

  const searchResults = useMemo(() => {
    if (!data || !query) return { buildings: [], halls: [], rooms: [], pois: [] };

    const buildings: Building[] = [];
    const halls: Hall[] = [];
    const rooms: Room[] = [];
    const pois: PointOfInterest[] = [];

    Object.values(data.buildings).forEach(b => {
      if (b.name.toLowerCase().includes(query) || b.description.toLowerCase().includes(query)) buildings.push(b);
    });
    Object.values(data.halls).forEach(h => {
      if (h.name.toLowerCase().includes(query) || h.description.toLowerCase().includes(query)) halls.push(h);
    });
    Object.values(data.rooms).forEach(r => {
      if (r.name.toLowerCase().includes(query) || r.description.toLowerCase().includes(query)) rooms.push(r);
    });
    Object.values(data.points_of_interest).forEach(p => {
      if (p.name.toLowerCase().includes(query) || p.description.toLowerCase().includes(query)) pois.push(p);
    });
    return { buildings, halls, rooms, pois };
  }, [data, query]);


  if (loading) return <p className="text-center py-10">Loading search results...</p>;
  if (error) return <p className="text-center py-10 text-red-500">Error loading data: {error.message}</p>;
  if (!data) return <p className="text-center py-10">No data available for search.</p>;

  const { buildings: filteredBuildings, halls: filteredHalls, rooms: filteredRooms, pois: filteredPOIs } = searchResults;
  const totalResults = filteredBuildings.length + filteredHalls.length + filteredRooms.length + filteredPOIs.length;

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
          Search Results for "<span className="text-sky-600">{query || "..."}</span>"
        </h1>
        {query && <p className="text-gray-600 mt-1">{totalResults} result(s) found.</p>}
      </header>

      {!query && (
        <div className="text-center py-10 bg-white shadow rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 mx-auto mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
          </svg>
          <p className="text-xl text-gray-700">Please enter a search term.</p>
          <p className="text-gray-500 mt-1">Use the search bar in the header to find what you're looking for.</p>
        </div>
      )}
      
      {query && totalResults === 0 && (
        <div className="text-center py-10 bg-white shadow rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-gray-400 mx-auto mb-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-xl text-gray-700">No results found for "{query}".</p>
          <p className="text-gray-500 mt-1">Try a different search term or check your spelling.</p>
        </div>
      )}

      {filteredRooms.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-sky-700">Rooms ({filteredRooms.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRooms.map(room => (
              <RoomCard 
                key={room.id} 
                room={room}
                hallName={data.halls[room.relations.hall as HallID]?.name}
              />
            ))}
          </div>
        </section>
      )}
      
      {filteredHalls.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-sky-700">Halls ({filteredHalls.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredHalls.map(hall => (
              <HallCard 
                key={hall.id} 
                hall={hall}
                showAddToRouteButton={true}
              />
            ))}
          </div>
        </section>
      )}
      
      {filteredBuildings.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-sky-700">Buildings ({filteredBuildings.length})</h2>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBuildings.map(building => (
              <BuildingCard 
                key={building.id} 
                building={building}
              />
            ))}
          </div>
        </section>
      )}

      {filteredPOIs.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-sky-700">Points of Interest ({filteredPOIs.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPOIs.map(poi => (
              <PoiCard 
                key={poi.id} 
                poi={poi}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SearchPage;