// src/viewer/pages/AllRoomsPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useRoute } from '../contexts/RouteContext';
import RoomCard from '../components/RoomCard';
import type { Room, BuildingID, HallID, RoomID, Root } from '../types'; // Added Root for findShortestPath
import { findShortestPath } from '../utils/pathfinding';
import WarningIcon from '../icons/WarningIcon';

// Constants for select options
const BEDROOM_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5+", label: "5+" },
];

const BATHROOM_OPTIONS = [
  { value: "", label: "Any" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4+", label: "4+" },
];

const YES_NO_ANY_OPTIONS = [
  { value: "any", label: "Any" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

type YesNoAny = 'any' | 'yes' | 'no';

const AllRoomsPage: React.FC = () => {
  const { data } = useData();
  const { setBreadcrumbs } = useRoute();

  // Filter states
  const [filterBuilding, setFilterBuilding] = useState<BuildingID | ''>('');
  const [filterHall, setFilterHall] = useState<HallID | ''>('');
  const [filterMaxCost, setFilterMaxCost] = useState<string>('');
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'available' | 'unavailable'>('available');
  const [filterBedrooms, setFilterBedrooms] = useState<string>('');
  const [filterBathrooms, setFilterBathrooms] = useState<string>('');
  
  // New layout feature filters
  const [filterHasKitchen, setFilterHasKitchen] = useState<YesNoAny>('any');
  const [filterHasBalcony, setFilterHasBalcony] = useState<YesNoAny>('any');
  const [filterHasWindow, setFilterHasWindow] = useState<YesNoAny>('any'); // Assuming most rooms have windows, but filter is available
  const [filterHasStorage, setFilterHasStorage] = useState<YesNoAny>('any');

  const [filterDistanceToRoom, setFilterDistanceToRoom] = useState<RoomID | ''>('');
  const [filterMaxDistance, setFilterMaxDistance] = useState<string>('');

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', link: '/' },
      { label: 'Rooms' }
    ]);
  }, [setBreadcrumbs]);

  const buildingsList = useMemo(() => 
    Object.values(data.buildings).sort((a, b) => a.name.localeCompare(b.name)), 
  [data.buildings]);

  const hallsListForSelect = useMemo(() => {
    let halls = Object.values(data.halls);
    if (filterBuilding) {
      const buildingData = data.buildings[filterBuilding];
      if (buildingData) {
        const hallIdsInBuilding = new Set(buildingData.relations.halls);
        halls = halls.filter(hall => hallIdsInBuilding.has(hall.id));
      } else {
        return []; // Should ideally not happen if filterBuilding is a valid ID
      }
    }
    return halls.sort((a, b) => a.name.localeCompare(b.name));
  }, [data.halls, data.buildings, filterBuilding]);

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

    // Bedroom filter
    if (filterBedrooms) {
      const num = parseInt(filterBedrooms);
      if (filterBedrooms.endsWith('+')) {
        roomsToFilter = roomsToFilter.filter(room => room.layout.bedrooms >= num);
      } else {
        roomsToFilter = roomsToFilter.filter(room => room.layout.bedrooms === num);
      }
    }

    // Bathroom filter
    if (filterBathrooms) {
      const num = parseInt(filterBathrooms);
      if (filterBathrooms.endsWith('+')) {
        roomsToFilter = roomsToFilter.filter(room => room.layout.bathrooms >= num);
      } else {
        roomsToFilter = roomsToFilter.filter(room => room.layout.bathrooms === num);
      }
    }

    // Layout features filters
    if (filterHasKitchen !== 'any') {
      roomsToFilter = roomsToFilter.filter(room => 
        filterHasKitchen === 'yes' ? room.layout.has_kitchen === true : !room.layout.has_kitchen
      );
    }
    if (filterHasBalcony !== 'any') {
      roomsToFilter = roomsToFilter.filter(room => 
        filterHasBalcony === 'yes' ? room.layout.has_balcony === true : !room.layout.has_balcony
      );
    }
    if (filterHasWindow !== 'any') {
      roomsToFilter = roomsToFilter.filter(room => 
        filterHasWindow === 'yes' ? room.layout.has_window === true : !room.layout.has_window
      );
    }
    if (filterHasStorage !== 'any') {
      roomsToFilter = roomsToFilter.filter(room => 
        filterHasStorage === 'yes' ? room.layout.has_storage === true : !room.layout.has_storage
      );
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

          // Ensure findShortestPath is called with the full Root data structure if it expects it
          const path = findShortestPath(data as Root, currentRoomHallId, targetHallId);
          return path !== null && path.totalSeconds <= maxDistanceSeconds;
        });
      } else {
         roomsToFilter = []; 
      }
    }
    return roomsToFilter.sort((a,b) => a.name.localeCompare(b.name));
  }, [
    data, 
    filterBuilding, 
    filterHall,
    filterMaxCost, 
    filterAvailability, 
    filterBedrooms,
    filterBathrooms,
    filterHasKitchen,
    filterHasBalcony,
    filterHasWindow,
    filterHasStorage,
    filterDistanceToRoom, 
    filterMaxDistance
  ]);

  const resetFilters = () => {
    setFilterBuilding('');
    setFilterHall('');
    setFilterMaxCost('');
    setFilterAvailability('available');
    setFilterBedrooms('');
    setFilterBathrooms('');
    setFilterHasKitchen('any');
    setFilterHasBalcony('any');
    setFilterHasWindow('any');
    setFilterHasStorage('any');
    setFilterDistanceToRoom('');
    setFilterMaxDistance('');
  };

  const commonSelectClass = "w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm";
  const commonInputClass = "w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm";
  const commonLabelClass = "block text-sm font-medium text-gray-700 mb-1";


  return (
    <div>
      <header className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">All Rooms</h1>
        <p className="text-gray-600 mt-1">Browse and filter all rooms available on campus.</p>
      </header>

      <div className="mb-8 p-4 sm:p-6 bg-white shadow-lg rounded-xl border border-gray-200">
        <h2 className="text-xl font-semibold mb-5 text-gray-700 border-b pb-3">Filter Rooms</h2>
        {/* Grid layout for filters: 4 columns on large screens, 2 on medium, 1 on small */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
          {/* Row 1: Location & Core Specs */}
          <div>
            <label htmlFor="filterBuilding" className={commonLabelClass}>Building</label>
            <select
              id="filterBuilding"
              value={filterBuilding}
              onChange={(e) => {
                setFilterBuilding(e.target.value as BuildingID | '');
                setFilterHall(''); // Reset hall when building changes
              }}
              className={commonSelectClass}
            >
              <option value="">Any Building</option>
              {buildingsList.map(building => (
                <option key={building.id} value={building.id}>{building.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filterHall" className={commonLabelClass}>Hall</label>
            <select
              id="filterHall"
              value={filterHall}
              onChange={(e) => setFilterHall(e.target.value as HallID | '')}
              className={commonSelectClass}
              disabled={!filterBuilding && hallsListForSelect.length === Object.values(data.halls).length && hallsListForSelect.length === 0} // Disable if no halls at all
            >
              <option value="">Any Hall</option>
              {hallsListForSelect.map(hall => (
                <option key={hall.id} value={hall.id}>
                  {hall.name}
                  {!filterBuilding && ` (Building: ${data.buildings[hall.relations.building]?.name || 'N/A'})`}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="filterAvailability" className={commonLabelClass}>Availability</label>
            <select
              id="filterAvailability"
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value as 'all' | 'available' | 'unavailable')}
              className={commonSelectClass}
            >
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
              <option value="all">All</option>
            </select>
          </div>

          <div>
            <label htmlFor="filterMaxCost" className={commonLabelClass}>Max Cost ($)</label>
            <input
              type="number"
              id="filterMaxCost"
              value={filterMaxCost}
              onChange={(e) => setFilterMaxCost(e.target.value)}
              placeholder="e.g., 200"
              min="0"
              className={commonInputClass}
            />
          </div>

          {/* Row 2: Room Layout Specs */}
          <div>
            <label htmlFor="filterBedrooms" className={commonLabelClass}>Bedrooms</label>
            <select
              id="filterBedrooms"
              value={filterBedrooms}
              onChange={(e) => setFilterBedrooms(e.target.value)}
              className={commonSelectClass}
            >
              {BEDROOM_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filterBathrooms" className={commonLabelClass}>Bathrooms</label>
            <select
              id="filterBathrooms"
              value={filterBathrooms}
              onChange={(e) => setFilterBathrooms(e.target.value)}
              className={commonSelectClass}
            >
              {BATHROOM_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filterHasKitchen" className={commonLabelClass}>Has Kitchen?</label>
            <select
              id="filterHasKitchen"
              value={filterHasKitchen}
              onChange={(e) => setFilterHasKitchen(e.target.value as YesNoAny)}
              className={commonSelectClass}
            >
              {YES_NO_ANY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filterHasBalcony" className={commonLabelClass}>Has Balcony?</label>
            <select
              id="filterHasBalcony"
              value={filterHasBalcony}
              onChange={(e) => setFilterHasBalcony(e.target.value as YesNoAny)}
              className={commonSelectClass}
            >
              {YES_NO_ANY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Row 3: More Layout Features & Proximity */}
          <div>
            <label htmlFor="filterHasWindow" className={commonLabelClass}>Has Window?</label>
            <select
              id="filterHasWindow"
              value={filterHasWindow}
              onChange={(e) => setFilterHasWindow(e.target.value as YesNoAny)}
              className={commonSelectClass}
            >
              {YES_NO_ANY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="filterHasStorage" className={commonLabelClass}>Has Storage?</label>
            <select
              id="filterHasStorage"
              value={filterHasStorage}
              onChange={(e) => setFilterHasStorage(e.target.value as YesNoAny)}
              className={commonSelectClass}
            >
              {YES_NO_ANY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filterDistanceToRoom" className={commonLabelClass}>Distance To (Room)</label>
            <select
              id="filterDistanceToRoom"
              value={filterDistanceToRoom}
              onChange={(e) => setFilterDistanceToRoom(e.target.value as RoomID | '')}
              className={commonSelectClass}
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
            <label htmlFor="filterMaxDistance" className={commonLabelClass}>Max Distance (seconds)</label>
            <input
              type="number"
              id="filterMaxDistance"
              value={filterMaxDistance}
              onChange={(e) => setFilterMaxDistance(e.target.value)}
              placeholder="e.g., 300"
              min="0"
              className={commonInputClass}
              disabled={!filterDistanceToRoom}
            />
          </div>
        </div>
        <div className="mt-6 pt-4 border-t text-right">
            <button
              onClick={resetFilters}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 text-sm"
            >
              Reset All Filters
            </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Showing {displayedRooms.length} of {Object.values(data.rooms).length} rooms.
      </p>

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