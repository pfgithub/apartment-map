import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import RoomCard from '../components/RoomCard';
import HallCard from '../components/HallCard';
import PoiCard from '../components/PoiCard';
import BuildingCard from '../components/BuildingCard';
import { shuffleArray } from '../utils/shuffle';
import type { Room, Hall, PointOfInterest, Building } from '../types';

const CAROUSEL_ITEM_LIMIT = 10;

interface CarouselSectionProps<T> {
  title: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  viewAllLink: string;
  viewAllText: string;
  itemWidthClass?: string; // e.g. "w-64", "w-72", "w-80"
}

function CarouselSection<T>({ title, items, renderItem, viewAllLink, viewAllText, itemWidthClass = "w-72" }: CarouselSectionProps<T>) {
  if (items.length === 0) {
    return null; // Or some placeholder like <p>No {title.toLowerCase()} to display.</p>
  }

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-700">{title}</h2>
        {items.length > 0 && (
           <Link to={viewAllLink} className="text-blue-600 hover:text-blue-800 transition-colors">
            {viewAllText} →
          </Link>
        )}
      </div>
      <div className="flex overflow-x-auto space-x-4 pb-4 -mb-4"> {/* pb-4 and -mb-4 to hide scrollbar track if possible or give space */}
        {items.map((item, index) => (
          <div key={index} className={`flex-shrink-0 ${itemWidthClass}`}>
            {renderItem(item)}
          </div>
        ))}
      </div>
    </section>
  );
}


const HomePage: React.FC = () => {
  const { data, loading, error } = useData();

  const shuffledAvailableRooms = useMemo(() => {
    if (!data?.rooms) return [];
    return shuffleArray(Object.values(data.rooms).filter(room => room.available));
  }, [data]);

  const shuffledHalls = useMemo(() => {
    if (!data?.halls) return [];
    return shuffleArray(Object.values(data.halls));
  }, [data]);

  const shuffledPois = useMemo(() => {
    if (!data?.points_of_interest) return [];
    return shuffleArray(Object.values(data.points_of_interest));
  }, [data]);

  const allBuildings = useMemo(() => {
    if (!data?.buildings) return [];
    return Object.values(data.buildings); // No shuffle needed for a list display
  }, [data]);

  if (loading) return <p className="text-center py-10">Loading homepage data...</p>;
  if (error) return <p className="text-center py-10 text-red-500">Error loading data: {error.message}</p>;
  if (!data) return <p className="text-center py-10">No data available.</p>;

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold mb-8 text-gray-800 text-center">Welcome to Our Viewer</h1>

      {/* Available Rooms Carousel */}
      <CarouselSection
        title="Featured Available Rooms"
        items={shuffledAvailableRooms.slice(0, CAROUSEL_ITEM_LIMIT)}
        renderItem={(room: Room) => (
          <RoomCard
            room={room}
            hallName={data.halls[room.relations.hall]?.name}
          />
        )}
        viewAllLink="/all-available-rooms"
        viewAllText="View All Available Rooms"
        itemWidthClass="w-80" // RoomCard might be wider
      />

      {/* Halls Carousel */}
      <CarouselSection
        title="Explore Halls"
        items={shuffledHalls.slice(0, CAROUSEL_ITEM_LIMIT)}
        renderItem={(hall: Hall) => <HallCard hall={hall} />}
        viewAllLink="/all-halls"
        viewAllText="View All Halls"
        itemWidthClass="w-72"
      />
      
      {/* Buildings List */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">Our Buildings</h2>
        {allBuildings.length === 0 ? (
          <p>No buildings to display.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allBuildings.map((building: Building) => (
              <BuildingCard key={building.id} building={building} />
            ))}
          </div>
        )}
      </section>

      {/* Points of Interest Carousel */}
      <CarouselSection
        title="Discover Points of Interest"
        items={shuffledPois.slice(0, CAROUSEL_ITEM_LIMIT)}
        renderItem={(poi: PointOfInterest) => <PoiCard poi={poi} />}
        viewAllLink="/all-pois"
        viewAllText="View All POIs"
        itemWidthClass="w-72"
      />
    </div>
  );
};

export default HomePage;