import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useRoute } from '../contexts/RouteContext';
import ImageDisplay from '../components/ImageDisplay';
import HallCard from '../components/HallCard';
import RoomCard from '../components/RoomCard';
import PoiCard from '../components/PoiCard';
import CarouselSection from '../components/CarouselSection';
import { shuffleArray } from '../utils/shuffle';
import type { BuildingID, HallID, RoomID, Hall, Room, PointOfInterest } from '../types';

const CAROUSEL_ITEM_LIMIT = 5; // Define how many items to show in carousels

const BuildingPage: React.FC = () => {
  const { id } = useParams<{ id: BuildingID }>();
  const { data } = useData();
  const { setBreadcrumbs } = useRoute();

  const building = id ? data.buildings[id] : null;

  useEffect(() => {
    if (building) {
      setBreadcrumbs([
        { label: 'Home', link: '/' },
        { label: 'Buildings', link: '/all-buildings' },
        { label: building.name }
      ]);
    } else {
       setBreadcrumbs([
         { label: 'Home', link: '/' },
         { label: 'Buildings', link: '/all-buildings' }
        ]);
    }
  }, [setBreadcrumbs, building]);

  const hallsInBuilding = useMemo(() => {
    if (!building || !data) return [];
    return building.relations.halls
      .map(hallId => data.halls[hallId as HallID])
      .filter(hall => hall !== undefined) as Hall[];
  }, [building, data]);

  const roomsInBuilding = useMemo(() => {
    if (!building || !data || !hallsInBuilding) return [];
    const allRooms: Room[] = [];
    const hallIdsInBuilding = new Set(hallsInBuilding.map(h => h.id));

    hallIdsInBuilding.forEach(hallId => {
      const hall = data.halls[hallId as HallID];
      if (hall) {
        hall.relations.rooms.forEach(roomId => {
          const room = data.rooms[roomId as RoomID];
          if (room) {
            allRooms.push(room);
          }
        });
      }
    });
    return shuffleArray(allRooms);
  }, [building, data, hallsInBuilding]);

  const poisInBuilding = useMemo(() => {
    if (!building || !data || !hallsInBuilding) return [];
    const allPois: PointOfInterest[] = [];
    const hallIdsInBuilding = new Set(hallsInBuilding.map(h => h.id));

    Object.values(data.points_of_interest).forEach(poi => {
      if (hallIdsInBuilding.has(poi.relations.hall as HallID)) {
        allPois.push(poi);
      }
    });
    return shuffleArray(allPois);
  }, [building, data, hallsInBuilding]);


  if (!building) return <p className="text-center py-10">Building not found.</p>;


  return (
    <div className="space-y-10">
      <section className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        <div className="md:flex md:space-x-8">
          <div className="md:w-1/3 mb-6 md:mb-0">
            <ImageDisplay image={building.image} className="w-full h-auto rounded-lg shadow-md" />
          </div>
          <div className="md:w-2/3">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-sky-700">{building.name}</h1>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">{building.description}</p>
          </div>
        </div>
      </section>
      
      <CarouselSection
        title="Rooms in this Building"
        items={roomsInBuilding.slice(0, CAROUSEL_ITEM_LIMIT)}
        renderItem={(room: Room) => (
          <RoomCard
            room={room}
            hallName={data.halls[room.relations.hall]?.name}
          />
        )}
        viewAllLink="/all-rooms" // Path changed
        viewAllText="View All Rooms"
        itemWidthClass="w-80" // Same as HomePage for RoomCard
        emptyMessage="No rooms found in this building."
      />

      <CarouselSection
        title="Points of Interest in this Building"
        items={poisInBuilding.slice(0, CAROUSEL_ITEM_LIMIT)}
        renderItem={(poi: PointOfInterest) => <PoiCard poi={poi} />}
        viewAllLink="/all-pois" // General link
        viewAllText="View All POIs"
        itemWidthClass="w-72" // Same as HomePage for PoiCard
        emptyMessage="No points of interest found in this building."
      />

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Halls in this Building</h2>
        {hallsInBuilding.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hallsInBuilding.map(hall => (
              <HallCard key={hall.id} hall={hall} showAddToRouteButton={true} />
            ))}
          </div>
        ) : <p className="text-gray-500 italic p-4 bg-white shadow rounded-lg">No halls listed for this building.</p>}
      </section>
    </div>
  );
};

export default BuildingPage;