// src/viewer/pages/AllRoomsPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useRoute } from '../contexts/RouteContext';
import RoomCard from '../components/RoomCard';
import type { Room, BuildingID, HallID, RoomID, Root } from '../types';
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
const MAX_DISTANCE_SECONDS = 1800; // 30 minutes

const AllRoomsPage: React.FC = () => {
  const { data } = useData();
  const { setBreadcrumbs } = useRoute();

  const [minCost, maxCost] = useMemo(() => {
    const prices = Object.values(data.rooms).map(r => r.price).filter(p => p > 0);
    if (prices.length === 0) return [0, 1000]; // Default if no rooms or no prices
    return [Math.min(...prices), Math.max(...prices)];
  }, [data.rooms]);

  // Filter states
  const [filterBuilding, setFilterBuilding] = useState<BuildingID | ''>('');
  const [filterHall, setFilterHall] = useState<HallID | ''>('');
  const [filterMaxCost, setFilterMaxCost] = useState<number>(maxCost);
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'available' | 'unavailable'>('available');
  const [filterBedrooms, setFilterBedrooms] = useState<string>('');
  const [filterBathrooms, setFilterBathrooms] = useState<string>('');
  const [filterHasKitchen, setFilterHasKitchen] = useState<YesNoAny>('any');
  const [filterHasBalcony, setFilterHasBalcony] = useState<YesNoAny>('any');
  const [filterHasWindow, setFilterHasWindow] = useState<YesNoAny>('any');
  const [filterHasStorage, setFilterHasStorage] = useState<YesNoAny>('any');
  const [filterDistanceToRoom, setFilterDistanceToRoom] = useState<RoomID | ''>('');
  const [filterMaxDistance, setFilterMaxDistance] = useState<number>(MAX_DISTANCE_SECONDS);

  // Update max cost filter if data changes
  useEffect(() => {
    setFilterMaxCost(maxCost);
  }, [maxCost]);

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
        return [];
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

    // Cost filter - Filter if slider is not at max, or always filter
    roomsToFilter = roomsToFilter.filter(room => room.price <= filterMaxCost);

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
    if (filterDistanceToRoom) {
      const targetRoomData = data.rooms[filterDistanceToRoom];
      if (targetRoomData) {
        const targetHallId = targetRoomData.relations.hall;
        roomsToFilter = roomsToFilter.filter(room => {
          if (room.id === filterDistanceToRoom) return true;

          const currentRoomHallId = room.relations.hall;
          if (currentRoomHallId === targetHallId) return true;

          const path = findShortestPath(data as Root, currentRoomHallId, targetHallId);
          return path !== null && path.totalSeconds <= filterMaxDistance;
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
    filterMaxDistance,
    maxCost // Add maxCost as dependency
  ]);

  const resetFilters = () => {
    setFilterBuilding('');
    setFilterHall('');
    setFilterMaxCost(maxCost);
    setFilterAvailability('available');
    setFilterBedrooms('');
    setFilterBathrooms('');
    setFilterHasKitchen('any');
    setFilterHasBalcony('any');
    setFilterHasWindow('any');
    setFilterHasStorage('any');
    setFilterDistanceToRoom('');
    setFilterMaxDistance(MAX_DISTANCE_SECONDS);
  };

  const commonSelectClass = "w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-sky-500 focus:border-sky-500 text-sm";
  const commonLabelClass = "block text-sm font-medium text-gray-700 mb-1";
  const commonSliderClass = "w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-600 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      {/* Sidebar for Filters */}
      <aside className="w-full lg:w-72 bg-white shadow-xl p-6 border-b lg:border-r border-gray-200 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
        <h2 className="text-xl font-semibold mb-5 text-gray-700 border-b pb-3">Filter Rooms</h2>
        <div className="space-y-6"> {/* Use space-y for vertical spacing */}

          {/* Location */}
          <fieldset className="space-y-4">
            <legend className="text-lg font-medium text-gray-900 mb-2">Location</legend>
            <div>
              <label htmlFor="filterBuilding" className={commonLabelClass}>Building</label>
              <select id="filterBuilding" value={filterBuilding} onChange={(e) => { setFilterBuilding(e.target.value as BuildingID | ''); setFilterHall(''); }} className={commonSelectClass}>
                <option value="">Any Building</option>
                {buildingsList.map(building => <option key={building.id} value={building.id}>{building.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="filterHall" className={commonLabelClass}>Hall</label>
              <select id="filterHall" value={filterHall} onChange={(e) => setFilterHall(e.target.value as HallID | '')} className={commonSelectClass} disabled={hallsListForSelect.length === 0}>
                <option value="">Any Hall</option>
                {hallsListForSelect.map(hall => <option key={hall.id} value={hall.id}>{hall.name}{!filterBuilding && ` (${data.buildings[hall.relations.building]?.name || 'N/A'})`}</option>)}
              </select>
            </div>
          </fieldset>

          {/* Availability & Cost */}
          <fieldset className="space-y-4 pt-4 border-t">
             <legend className="text-lg font-medium text-gray-900 mb-2">Price & Availability</legend>
            <div>
              <label htmlFor="filterAvailability" className={commonLabelClass}>Availability</label>
              <select id="filterAvailability" value={filterAvailability} onChange={(e) => setFilterAvailability(e.target.value as 'all' | 'available' | 'unavailable')} className={commonSelectClass}>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="all">All</option>
              </select>
            </div>
            <div>
                <div className="flex justify-between items-center text-sm mb-1">
                    <label htmlFor="filterMaxCost" className="block font-medium text-gray-700">Max Cost</label>
                    <span className="font-medium text-gray-900">${filterMaxCost === maxCost ? 'Any' : filterMaxCost}</span>
                </div>
                <input type="range" id="filterMaxCost" min={minCost} max={maxCost} value={filterMaxCost} onChange={(e) => setFilterMaxCost(Number(e.target.value))} className={commonSliderClass} />
            </div>
          </fieldset>

          {/* Room Specs */}
           <fieldset className="space-y-4 pt-4 border-t">
             <legend className="text-lg font-medium text-gray-900 mb-2">Room Specs</legend>
            <div>
              <label htmlFor="filterBedrooms" className={commonLabelClass}>Bedrooms</label>
              <select id="filterBedrooms" value={filterBedrooms} onChange={(e) => setFilterBedrooms(e.target.value)} className={commonSelectClass}>
                {BEDROOM_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="filterBathrooms" className={commonLabelClass}>Bathrooms</label>
              <select id="filterBathrooms" value={filterBathrooms} onChange={(e) => setFilterBathrooms(e.target.value)} className={commonSelectClass}>
                {BATHROOM_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </fieldset>

           {/* Layout Features */}
           <fieldset className="space-y-4 pt-4 border-t">
             <legend className="text-lg font-medium text-gray-900 mb-2">Features</legend>
             <div>
                <label htmlFor="filterHasKitchen" className={commonLabelClass}>Has Kitchen?</label>
                <select id="filterHasKitchen" value={filterHasKitchen} onChange={(e) => setFilterHasKitchen(e.target.value as YesNoAny)} className={commonSelectClass}>
                    {YES_NO_ANY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="filterHasBalcony" className={commonLabelClass}>Has Balcony?</label>
                <select id="filterHasBalcony" value={filterHasBalcony} onChange={(e) => setFilterHasBalcony(e.target.value as YesNoAny)} className={commonSelectClass}>
                    {YES_NO_ANY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="filterHasWindow" className={commonLabelClass}>Has Window?</label>
                <select id="filterHasWindow" value={filterHasWindow} onChange={(e) => setFilterHasWindow(e.target.value as YesNoAny)} className={commonSelectClass}>
                    {YES_NO_ANY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="filterHasStorage" className={commonLabelClass}>Has Storage?</label>
                <select id="filterHasStorage" value={filterHasStorage} onChange={(e) => setFilterHasStorage(e.target.value as YesNoAny)} className={commonSelectClass}>
                    {YES_NO_ANY_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
            </div>
           </fieldset>

           {/* Proximity */}
            <fieldset className="space-y-4 pt-4 border-t">
                 <legend className="text-lg font-medium text-gray-900 mb-2">Proximity</legend>
                <div>
                    <label htmlFor="filterDistanceToRoom" className={commonLabelClass}>Distance To Room</label>
                    <select id="filterDistanceToRoom" value={filterDistanceToRoom} onChange={(e) => setFilterDistanceToRoom(e.target.value as RoomID | '')} className={commonSelectClass} disabled={roomsListForDistanceFilter.length === 0}>
                        <option value="">Select Target Room</option>
                        {roomsListForDistanceFilter.map(room => <option key={room.id} value={room.id}>{room.name} (Hall: {data.halls[room.relations.hall]?.name || 'N/A'})</option>)}
                    </select>
                </div>
                 <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                        <label htmlFor="filterMaxDistance" className="block font-medium text-gray-700">Max Walk (secs)</label>
                        <span className="font-medium text-gray-900">
                            {filterMaxDistance === MAX_DISTANCE_SECONDS ? 'Any' : `${filterMaxDistance}s`}
                            {filterMaxDistance !== MAX_DISTANCE_SECONDS && ` (~${Math.round(filterMaxDistance / 60)} min)`}
                        </span>
                    </div>
                    <input type="range" id="filterMaxDistance" min="0" max={MAX_DISTANCE_SECONDS} value={filterMaxDistance} onChange={(e) => setFilterMaxDistance(Number(e.target.value))} className={commonSliderClass} disabled={!filterDistanceToRoom} />
                </div>
            </fieldset>

        </div>
        <div className="mt-8 pt-6 border-t text-center">
            <button onClick={resetFilters} className="w-full px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-md shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75 text-sm">
              Reset All Filters
            </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
        <header className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">All Rooms</h1>
          <p className="text-gray-600 mt-1">Browse and filter all rooms available on campus.</p>
        </header>

        <p className="text-sm text-gray-600 mb-4">
          Showing {displayedRooms.length} of {Object.values(data.rooms).length} rooms.
        </p>

        {displayedRooms.length === 0 ? (
          <div className="text-center py-10 bg-white shadow rounded-lg mt-4">
            <WarningIcon />
            <p className="text-xl text-gray-700 mt-2">No rooms match your current filters.</p>
            <p className="text-gray-500 mt-1">Try adjusting your filter criteria or resetting them.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {displayedRooms.map((room: Room) => (
              <RoomCard
                key={room.id}
                room={room}
                hallName={data.halls[room.relations.hall]?.name}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AllRoomsPage;