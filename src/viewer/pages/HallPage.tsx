import React, { useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useRoute, type RouteItem } from '../contexts/RouteContext';
import ImageDisplay from '../components/ImageDisplay';
import type { HallID, BuildingID, RoomID, ConnectionID, PointOfInterestID, Hall, Room, PointOfInterest, Connection } from '../types';
import AddIcon from '../icons/AddIcon';
import RemoveIcon from '../icons/RemoveIcon';
import RoomCard from '../components/RoomCard';
import PoiCard from '../components/PoiCard';
import ArrowsRightLeftIcon from '../icons/ArrowsRightLeftIcon';
import ArrowLongRightIcon from '../icons/ArrowLongRightIcon';
import ArrowLongLeftIcon from '../icons/ArrowLongLeftIcon';

const HallActions: React.FC<{ hall: Hall }> = ({ hall }) => {
  const { addItemToRoute, removeItemFromRoute, isItemInRoute } = useRoute();
  if (!hall) return null;
  const routeItem: RouteItem = { id: hall.id, type: 'hall' };
  const itemInRoute = isItemInRoute(routeItem);

  const handleToggleRoute = () => {
    if (itemInRoute) {
      removeItemFromRoute(routeItem);
    } else {
      addItemToRoute(routeItem);
    }
  };

  return (
    <div className="mb-6 text-right">
      <button
        onClick={handleToggleRoute}
        className={`px-4 py-2 rounded-md font-semibold text-white inline-flex items-center
                    ${itemInRoute ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}
                    transition-colors shadow hover:shadow-md`}
      >
        {itemInRoute ? <RemoveIcon /> : <AddIcon />}
        <span className="ml-2">{itemInRoute ? 'Remove from Route' : 'Add to Route'}</span>
      </button>
    </div>
  );
};

const HallPage: React.FC = () => {
  const { id } = useParams<{ id: HallID }>();
  const { data } = useData();
  const { setBreadcrumbs } = useRoute();

  const hall = id ? data.halls[id] : null;
  const building = hall ? data.buildings[hall.relations.building as BuildingID] : null;

  useEffect(() => {
    if (hall && building) {
      setBreadcrumbs([
        { label: 'Home', link: '/' },
        { label: 'Buildings', link: '/buildings'},
        { label: building.name, link: `/buildings/${building.id}` },
        { label: hall.name }
      ]);
    } else if (hall) {
       setBreadcrumbs([
        { label: 'Home', link: '/' },
        { label: 'Halls', link: '/halls' },
        { label: hall.name }
      ]);
    } else {
      setBreadcrumbs([{ label: 'Home', link: '/' }]);
    }
  }, [setBreadcrumbs, hall, building]);

  const { twoWayRoutes, oneWayOutRoutes, oneWayInRoutes } = useMemo(() => {
    if (!hall || !data) {
      return { twoWayRoutes: [], oneWayOutRoutes: [], oneWayInRoutes: [] };
    }

    const currentHallId = hall.id;
    const categorizedTwoWayRoutes: Array<{ hall: Hall, connectionTo: Connection }> = [];
    const categorizedOneWayOutRoutes: Array<{ hall: Hall, connectionTo: Connection }> = [];
    const categorizedOneWayInRoutes: Array<{ hall: Hall, connectionFrom: Connection }> = [];
    const handledTwoWayTargets = new Set<HallID>();

    // Process outgoing connections from the current hall
    for (const connId of hall.relations.connections) {
      const outgoingConn = data.connections[connId];
      if (!outgoingConn || outgoingConn.relations.from !== currentHallId) continue;

      const targetHall = data.halls[outgoingConn.relations.to];
      if (!targetHall) continue;

      // Check if there's a connection from targetHall back to currentHallId
      const isReverseConnectionPresent = targetHall.relations.connections.some(targetConnId => {
        const c = data.connections[targetConnId];
        return c && c.relations.from === targetHall.id && c.relations.to === currentHallId;
      });

      if (isReverseConnectionPresent) {
        if (!handledTwoWayTargets.has(targetHall.id)) {
          categorizedTwoWayRoutes.push({ hall: targetHall, connectionTo: outgoingConn });
          handledTwoWayTargets.add(targetHall.id);
        }
      } else {
        categorizedOneWayOutRoutes.push({ hall: targetHall, connectionTo: outgoingConn });
      }
    }

    // Process incoming connections to the current hall
    for (const connId of hall.relations.reverse_connections) {
      const incomingConn = data.connections[connId];
      if (!incomingConn || incomingConn.relations.to !== currentHallId) continue;

      const sourceHall = data.halls[incomingConn.relations.from];
      if (!sourceHall) continue;

      if (!handledTwoWayTargets.has(sourceHall.id)) {
        categorizedOneWayInRoutes.push({ hall: sourceHall, connectionFrom: incomingConn });
      }
    }
    return { 
      twoWayRoutes: categorizedTwoWayRoutes, 
      oneWayOutRoutes: categorizedOneWayOutRoutes, 
      oneWayInRoutes: categorizedOneWayInRoutes 
    };
  }, [hall, data]);


  if (!hall) return <p className="text-center py-10">Hall not found.</p>;

  const roomsInHall: Room[] = hall.relations.rooms
    .map(roomId => data.rooms[roomId as RoomID])
    .filter((room): room is Room => !!room);
  
  const poisInHall: PointOfInterest[] = Object.values(data.points_of_interest)
    .filter(poi => poi.relations.hall === id)
    .filter((poi): poi is PointOfInterest => !!poi);

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
      <HallActions hall={hall} />
      <div className="md:flex md:space-x-8 mb-8">
        <div className="md:w-1/3 mb-6 md:mb-0">
          <ImageDisplay image={hall.image} className="w-full aspect-16/9 rounded-lg shadow-md" />
        </div>
        <div className="md:w-2/3">
          <h1 className="text-3xl md:text-4xl font-bold mb-1 text-sky-700">{hall.name}</h1>
          {building && (
            <p className="text-md text-gray-500 mb-3">
              Part of <Link to={`/buildings/${building.id}`} className="text-sky-600 hover:underline font-medium">{building.name}</Link>
            </p>
          )}
          <p className="text-gray-700 text-lg leading-relaxed mb-6">{hall.description}</p>
        </div>
      </div>

      {/* Connections Section - Updated */}
      <div className="mb-8 pt-6 border-t border-gray-200">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Connections from this Hall</h2>
        {(twoWayRoutes.length + oneWayOutRoutes.length + oneWayInRoutes.length) === 0 ? (
          <p className="text-gray-500 italic">No connections listed for this hall.</p>
        ) : (
          <div className="space-y-8">
            {twoWayRoutes.length > 0 && (
              <div>
                <h3 className="text-xl font-medium mb-3 text-gray-700 flex items-center">
                  <ArrowsRightLeftIcon className="w-5 h-5 mr-2 text-green-600 flex-shrink-0" />
                  Two-Way Routes
                </h3>
                <ul className="space-y-3">
                  {twoWayRoutes.map(({ hall: connectedHall, connectionTo }) => (
                    <li key={`tw-${connectionTo.id}`} className="p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150">
                      <Link to={`/halls/${connectedHall.id}`} className="font-semibold text-green-700 hover:text-green-800 hover:underline">
                        {connectedHall.name}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        {connectionTo.name} <span className="text-gray-500">({connectionTo.seconds}s travel)</span>
                      </p>
                       <p className="text-xs text-green-600 mt-1 italic">You can travel to and from this hall.</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {oneWayOutRoutes.length > 0 && (
              <div>
                <h3 className="text-xl font-medium mb-3 text-gray-700 flex items-center">
                  <ArrowLongRightIcon className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
                  One-Way Routes (Leaving this Hall)
                </h3>
                <ul className="space-y-3">
                  {oneWayOutRoutes.map(({ hall: connectedHall, connectionTo }) => (
                    <li key={`owo-${connectionTo.id}`} className="p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150">
                      <Link to={`/halls/${connectedHall.id}`} className="font-semibold text-blue-700 hover:text-blue-800 hover:underline">
                        {connectedHall.name}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">
                        {connectionTo.name} <span className="text-gray-500">({connectionTo.seconds}s travel)</span>
                      </p>
                      <p className="text-xs text-blue-600 mt-1 italic">You can use this route to leave.</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {oneWayInRoutes.length > 0 && (
              <div>
                <h3 className="text-xl font-medium mb-3 text-gray-700 flex items-center">
                  <ArrowLongLeftIcon className="w-5 h-5 mr-2 text-orange-600 flex-shrink-0" />
                  One-Way Routes (Into this Hall)
                </h3>
                <ul className="space-y-3">
                  {oneWayInRoutes.map(({ hall: connectedHall, connectionFrom }) => (
                    <li key={`owi-${connectionFrom.id}`} className="p-4 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
                      <span className="font-semibold text-orange-700">{connectedHall.name}</span>
                      <p className="text-sm text-gray-600 mt-1">
                        Via: {connectionFrom.name} <span className="text-gray-500">({connectionFrom.seconds}s travel from {connectedHall.name})</span>
                      </p>
                      <p className="text-xs text-orange-600 mt-1 italic">This route leads into this hall; you cannot use it to leave via this specific path.</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-8 pt-6 border-t border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Rooms in this Hall</h2>
        {roomsInHall.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {roomsInHall.map(room => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : <p className="text-gray-500 italic">No rooms listed for this hall.</p>}
      </div>

      <div className="pt-6 border-t border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Points of Interest in this Hall</h2>
        {poisInHall.length > 0 ? (
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {poisInHall.map(poi => (
                <PoiCard key={poi.id} poi={poi} />
              ))}
          </div>
        ) : <p className="text-gray-500 italic">No points of interest in this hall.</p>}
      </div>
    </div>
  );
};

export default HallPage;