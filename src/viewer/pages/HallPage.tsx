import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useRoute, type RouteItem } from '../contexts/RouteContext';
import ImageDisplay from '../components/ImageDisplay';
import type { HallID, BuildingID, RoomID, ConnectionID, PointOfInterestID, Hall } from '../types';

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
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
          {itemInRoute ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          )}
        </svg>
        {itemInRoute ? 'Remove from Route' : 'Add to Route'}
      </button>
    </div>
  );
};

const HallPage: React.FC = () => {
  const { id } = useParams<{ id: HallID }>();
  const { data, loading, error } = useData();
  const { setBreadcrumbs } = useRoute();

  const hall = data && id ? data.halls[id] : null;
  const building = hall ? data?.buildings[hall.relations.building as BuildingID] : null;

  useEffect(() => {
    if (hall && building) {
      setBreadcrumbs([
        { label: 'Home', link: '/' },
        { label: 'Buildings', link: '/all-buildings'}, // Or relevant link
        { label: building.name, link: `/buildings/${building.id}` },
        { label: hall.name }
      ]);
    } else if (hall) {
       setBreadcrumbs([
        { label: 'Home', link: '/' },
        { label: 'Halls', link: '/all-halls' },
        { label: hall.name }
      ]);
    } else {
      setBreadcrumbs([{ label: 'Home', link: '/' }]);
    }
  }, [setBreadcrumbs, hall, building]);

  if (loading) return <p className="text-center py-10">Loading hall details...</p>;
  if (error) return <p className="text-center py-10 text-red-500">Error loading data: {error.message}</p>;
  if (!hall) return <p className="text-center py-10">Hall not found.</p>;

  const poisInHall = data ? Object.values(data.points_of_interest).filter(poi => poi.relations.hall === id) : [];

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
      <HallActions hall={hall} />
      <div className="md:flex md:space-x-8">
        <div className="md:w-1/3 mb-6 md:mb-0">
          <ImageDisplay image={hall.image} className="w-full h-auto rounded-lg shadow-md" />
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

      <div className="mt-8 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Rooms in this Hall</h2>
          {hall.relations.rooms.length > 0 ? (
            <ul className="space-y-3">
              {hall.relations.rooms.map(roomId => {
                const room = data?.rooms[roomId as RoomID];
                return room ? (
                  <li key={roomId} className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors border border-gray-200">
                    <Link to={`/rooms/${room.id}`} className="text-sky-600 hover:underline font-medium">{room.name}</Link>
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${room.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {room.available ? 'Available' : 'Unavailable'}
                    </span>
                  </li>
                ) : null;
              })}
            </ul>
          ) : <p className="text-gray-500 italic">No rooms listed for this hall.</p>}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Points of Interest</h2>
          {poisInHall.length > 0 ? (
             <ul className="space-y-3">
              {poisInHall.map(poi => (
                  <li key={poi.id} className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors border border-gray-200">
                    <Link to={`/pois/${poi.id}`} className="text-sky-600 hover:underline font-medium">{poi.name}</Link>
                  </li>
                ))}
            </ul>
          ) : <p className="text-gray-500 italic">No points of interest in this hall.</p>}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Connections from this Hall</h2>
        {hall.relations.connections.length > 0 ? (
          <ul className="space-y-3">
            {hall.relations.connections.map(connId => {
              const connection = data?.connections[connId as ConnectionID];
              if (!connection || connection.relations.from !== id) return null;
              const toHall = data.halls[connection.relations.to as HallID];
              return toHall ? (
                <li key={connId} className="p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors border border-gray-200">
                  Leads to <Link to={`/halls/${toHall.id}`} className="text-sky-600 hover:underline font-medium">{toHall.name}</Link>
                  <span className="text-sm text-gray-500"> ({connection.seconds}s)</span> - <span className="italic text-sm text-gray-600">{connection.name}</span>
                </li>
              ) : null;
            })}
          </ul>
        ) : <p className="text-gray-500 italic">No outgoing connections listed for this hall.</p>}
      </div>
    </div>
  );
};

export default HallPage;