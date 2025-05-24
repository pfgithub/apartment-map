import React, { useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useRoute } from '../contexts/RouteContext';
import RoomCard from '../components/RoomCard';
import HallCard from '../components/HallCard';
import PoiCard from '../components/PoiCard';
import BuildingCard from '../components/BuildingCard';
import CarouselSection from '../components/CarouselSection'; // Import the new component
import { shuffleArray } from '../utils/shuffle';
import type { Room, Hall, PointOfInterest, Building } from '../types';

const CAROUSEL_ITEM_LIMIT = 6; // Reduced for better visibility on typical screens

const HomePage: React.FC = () => {
  const { data } = useData();
  const { setBreadcrumbs } = useRoute();

  useEffect(() => {
    setBreadcrumbs([{ label: 'Home' }]);
  }, [setBreadcrumbs]);

  const shuffledAvailableRooms = useMemo(() => {
    if (!data.rooms) return [];
    return shuffleArray(Object.values(data.rooms).filter(room => room.available));
  }, [data]);

  const shuffledHalls = useMemo(() => {
    if (!data.halls) return [];
    return shuffleArray(Object.values(data.halls));
  }, [data]);

  const shuffledPois = useMemo(() => {
    if (!data.points_of_interest) return [];
    return shuffleArray(Object.values(data.points_of_interest));
  }, [data]);

  const allBuildings = useMemo(() => {
    if (!data.buildings) return [];
    // Sort buildings by name for consistent display, or shuffle if preferred
    return Object.values(data.buildings).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  return (
    <div className="space-y-10">
      <header className="text-center py-8 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-lg shadow-lg text-white">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">Welcome to Campus Explorer</h1>
        <p className="text-lg sm:text-xl text-sky-100">Your ultimate guide to navigating and discovering our campus.</p>
      </header>

      <CarouselSection
        title="Featured Available Rooms"
        items={shuffledAvailableRooms.slice(0, CAROUSEL_ITEM_LIMIT)}
        renderItem={(room: Room) => (
          <RoomCard
            room={room}
            hallName={data.halls[room.relations.hall]?.name}
          />
        )}
        viewAllLink="/all-rooms" // Path changed
        viewAllText="View All Rooms"
        itemWidthClass="w-80"
        emptyMessage="No rooms currently featured or available."
      />
      
      <section className="mb-12 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Our Buildings</h2>
        {allBuildings.length === 0 ? (
          <p className="text-gray-500 italic">No buildings to display at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allBuildings.map((building: Building) => (
              <BuildingCard key={building.id} building={building} />
            ))}
          </div>
        )}
      </section>

      <CarouselSection
        title="Explore Halls"
        items={shuffledHalls.slice(0, CAROUSEL_ITEM_LIMIT)}
        renderItem={(hall: Hall) => <HallCard hall={hall} showAddToRouteButton={true} />}
        viewAllLink="/all-halls"
        viewAllText="View All Halls"
        itemWidthClass="w-72"
        emptyMessage="No halls are currently listed."
      />

      <CarouselSection
        title="Discover Points of Interest"
        items={shuffledPois.slice(0, CAROUSEL_ITEM_LIMIT)}
        renderItem={(poi: PointOfInterest) => <PoiCard poi={poi} />}
        viewAllLink="/all-pois"
        viewAllText="View All POIs"
        itemWidthClass="w-72"
        emptyMessage="No points of interest to show right now."
      />
    </div>
  );
};

export default HomePage;