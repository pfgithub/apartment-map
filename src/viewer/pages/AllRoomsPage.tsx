import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useRoute } from '../contexts/RouteContext';
import RoomCard from '../components/RoomCard';
import type { Room, BuildingID, HallID, RoomID, Building, Hall } from '../types';
import { findShortestPath } from '../utils/pathfinding';
import WarningIcon from '../icons/WarningIcon';

const AllRoomsPage: React.FC = () => {
  const { data } = useData();
  const { setBreadcrumbs } = useRoute();

  // Filter states
  const [filterBuilding, setFilterBuilding] = useState<BuildingID | ''>('');
  const [filterMaxCost, setFilterMaxCost] = useState<string>('');
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'available' | 'unavailable'>('available');
  const [filterHall, setFilterHall] = useState<HallID | ''>('');
  const [filterDistanceToRoom, setFilterDistanceToRoom] = useState<RoomID | ''>('');
  const [filterMaxDistance, setFilterMaxDistance] = useState<string>(''); // in seconds

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', link: '/' },
      { label: 'Rooms' }
    ]);
  }, [setBreadcrumbs]);

  const buildingsList = useMemo(() => 
    Object.values(data.buildings).sort((a, b) => a.name.localeCompare(b.name)), 
  [data.buildings]);

  const hallsList = useMemo(() => 
    Object.values(data.halls).sort((a, b) => a.name.localeCompare(b.name)), 
  [data.halls]);

  const roomsListForDistanceFilter = useMemo(() => 
    Object.values(data.rooms).sort((a, b) => a.name.localeCompare(b.name)), 
  [data.rooms]);

  const displayedRooms = useMemo(() => {
    let roomsToFilter = Object.values(data.rooms);

    // Availability filter
    if (filterAvailability === 'available') {
      roomsToFilter = roomsToFilter.filter(room => room.available);
    } else if (filterAvailability === 'unavailable') {
      roomsToFilter = roomsToFilter.filter(room => !room.available);
    }

    // Building filter
    if (filterBuilding) {
      const buildingData = data.buildings[filterBuilding];
      if (buildingData) {
        const hallIdsInBuilding = new Set(buildingData.relations.halls);
        roomsToFilter = roomsToFilter.filter(room => hallIdsInBuilding.has(room.relations.hall));
      } else {
        roomsToFilter = []; 
      }
    }
    
    // Hall filter
    if (filterHall) {
      roomsToFilter = roomsToFilter.filter(room => room.relations.hall === filterHall);
    }

    // Cost filter
    const maxCostNum = parseFloat(filterMaxCost);
    if (!isNaN(maxCostNum) && filterMaxCost.trim() !== '') {
      roomsToFilter = roomsToFilter.filter(room => room.price <= maxCostNum);
    }

    // Distance to another room filter
    const maxDistanceSeconds = parseInt(filterMaxDistance, 10);
    if (filterDistanceToRoom && !isNaN(maxDistanceSeconds) && filterMaxDistance.trim() !== '') {
      const targetRoomData = data.rooms[filterDistanceToRoom];
      if (targetRoomData) {
        const targetHallId = targetRoomData.relations.hall;
        roomsToFilter = roomsToFilter.filter(room => {
          if (room.id === filterDistanceToRoom) return true; 

          const currentRoomHallId = room.relations.hall;
          if (currentRoomHallId === targetHallId) return true; 

          const path = findShortestPath(data, currentRoomHallId, targetHallId);
          return path !== null && path.totalSeconds <= maxDistanceSeconds;
        });
      } else {
         roomsToFilter = []; 
      }
    }
    return roomsToFilter;
  }, [
    data, 
    filterBuilding, 
    filterMaxCost, 
    filterAvailability, 
    filterHall, 
    filterDistanceToRoom, 
    filterMaxDistance
  ]);

  const resetFilters = () => {
    setFilterBuilding('');
    setFilterMaxCost('');
    setFilterAvailability('available');
    setFilterHall('');
    setFilterDistanceToRoom('');
    setFilterMaxDistance('');
  };

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">All Rooms</h1>
        <p className="text-gray-600 mt-1">Browse and filter all rooms available on campus.</p>
      </header>

      <div className="mb-8 p-4 sm:p-6 bg-white shadow rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Filter Rooms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="filterBuilding" className="block text-sm font-medium text-gray-700 mb-1">Building</label>
            <select
              id="filterBuilding"
              value={filterBuilding}
              onChange={(e) => setFilterBuilding(e.target.value as BuildingID | '')}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="">Any Building</option>
              {buildingsList.map(building => (
                <option key={building.id} value={building.id}>{building.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filterHall" className="block text-sm font-medium text-gray-700 mb-1">Hall</label>
            <select
              id="filterHall"
              value={filterHall}
              onChange={(e) => setFilterHall(e.target.value as HallID | '')}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="">Any Hall</option>
              {hallsList.map(hall => (
                <option key={hall.id} value={hall.id}>
                  {hall.name} (Building: {data.buildings[hall.relations.building]?.name || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filterMaxCost" className="block text-sm font-medium text-gray-700 mb-1">Max Cost ($)</label>
            <input
              type="number"
              id="filterMaxCost"
              value={filterMaxCost}
              onChange={(e) => setFilterMaxCost(e.target.value)}
              placeholder="e.g., 200"
              min="0"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div>
            <label htmlFor="filterAvailability" className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
            <select
              id="filterAvailability"
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value as 'all' | 'available' | 'unavailable')}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="all">All</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="filterDistanceToRoom" className="block text-sm font-medium text-gray-700 mb-1">Distance To (Room)</label>
            <select
              id="filterDistanceToRoom"
              value={filterDistanceToRoom}
              onChange={(e) => setFilterDistanceToRoom(e.target.value as RoomID | '')}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
              disabled={roomsListForDistanceFilter.length === 0}
            >
              <option value="">Select Target Room</option>
              {roomsListForDistanceFilter.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name} (Hall: {data.halls[room.relations.hall]?.name || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filterMaxDistance" className="block text-sm font-medium text-gray-700 mb-1">Max Distance (seconds)</label>
            <input
              type="number"
              id="filterMaxDistance"
              value={filterMaxDistance}
              onChange={(e) => setFilterMaxDistance(e.target.value)}
              placeholder="e.g., 300"
              min="0"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500"
              disabled={!filterDistanceToRoom}
            />
          </div>
        </div>
        <div className="mt-6 text-right">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Reset Filters
            </button>
        </div>
      </div>

      {displayedRooms.length === 0 ? (
        <div className="text-center py-10 bg-white shadow rounded-lg">
          <WarningIcon />
          <p className="text-xl text-gray-700">No rooms match your current filters.</p>
          <p className="text-gray-500 mt-1">Try adjusting your filter criteria or resetting them.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayedRooms.map((room: Room) => (
            <RoomCard
              key={room.id}
              room={room}
              hallName={data.halls[room.relations.hall]?.name}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllRoomsPage;