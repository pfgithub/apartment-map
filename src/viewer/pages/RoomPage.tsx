import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useRoute, type RouteItem } from '../contexts/RouteContext';
import ImageDisplay from '../components/ImageDisplay';
import type { RoomID, HallID, Room } from '../types';

// Icons for room layout
const BedIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10.5 18.75a.75.75 0 001.5 0v-3a.75.75 0 00-1.5 0v3zM12 18.75h.008v.008H12v-.008zm0-3h.008v.008H12v-.008zm0-3h.008v.008H12v-.008zm0-3h.008v.008H12V9zm-4.5 6.75a.75.75 0 001.5 0v-3a.75.75 0 00-1.5 0v3zm0-3a.75.75 0 001.5 0v-3a.75.75 0 00-1.5 0v3z" />
  </svg>
);
const BathIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75H5.625v1.875a3.375 3.375 0 003.375 3.375h4.125a3.375 3.375 0 003.375-3.375V15.75h3.375V12.375M2.25 12.375V9C2.25 7.484 3.484 6.25 5 6.25H19c1.516 0 2.75 1.234 2.75 2.75v3.375m-19.5 0a3.375 3.375 0 003.375 3.375h12.75a3.375 3.375 0 003.375-3.375m0 0V9M5 9l.75-3.375M19 9l-.75-3.375" />
  </svg>
);
const KitchenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 4.5c-1.847 0-3.556.444-5.015 1.229M18.303 7.381a3.757 3.757 0 01-3.642 0M5.697 7.381a3.757 3.757 0 003.642 0" />
 </svg>
);
const BalconyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
     <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21H3.75m9 0L3.75 3M20.25 3.75H15M16.5 21l3.75-18" />
  </svg>
);
const WindowIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 12H20.25m-16.5 0V6.75c0-1.24 1.01-2.25 2.25-2.25h12c1.24 0 2.25 1.01 2.25 2.25v5.25m0 0V21M12 3v18" />
  </svg>
);

// Actions Component for Room Page
const RoomActions: React.FC<{ room: Room }> = ({ room }) => {
  const { addItemToRoute, removeItemFromRoute, isItemInRoute } = useRoute();
  if (!room) return null;

  const routeItem: RouteItem = { id: room.id, type: 'room' };
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


const RoomPage: React.FC = () => {
  const { id } = useParams<{ id: RoomID }>();
  const { data, loading, error } = useData();
  const { setBreadcrumbs } = useRoute();

  const room = data && id ? data.rooms[id] : null;
  const hall = room ? data?.halls[room.relations.hall as HallID] : null;
  const building = hall ? data?.buildings[hall.relations.building] : null;

  useEffect(() => {
    if (room && hall && building) {
      setBreadcrumbs([
        { label: 'Home', link: '/' },
        { label: 'Buildings', link: `/all-buildings` }, // Updated link
        { label: building.name, link: `/buildings/${building.id}` },
        { label: hall.name, link: `/halls/${hall.id}` },
        { label: room.name }
      ]);
    } else if (room && hall) {
      setBreadcrumbs([
        { label: 'Home', link: '/' },
        { label: 'Halls', link: `/all-halls` }, 
        { label: hall.name, link: `/halls/${hall.id}` },
        { label: room.name }
      ]);
    } else if (room) {
      setBreadcrumbs([
        { label: 'Home', link: '/' },
        { label: 'Rooms', link: '/all-available-rooms' },
        { label: room.name }
      ]);
    } else {
      setBreadcrumbs([{ label: 'Home', link: '/' }]);
    }
  }, [setBreadcrumbs, room, hall, building]);


  if (loading) return <p className="text-center py-10">Loading room details...</p>;
  if (error) return <p className="text-center py-10 text-red-500">Error loading data: {error.message}</p>;
  if (!room) return <p className="text-center py-10">Room not found.</p>;

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
      <RoomActions room={room} />
      <div className="md:flex md:space-x-8">
        <div className="md:w-1/2 mb-6 md:mb-0">
          <ImageDisplay image={room.image} className="w-full h-auto rounded-lg shadow-md" />
        </div>
        <div className="md:w-1/2">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-sky-700">{room.name}</h1>
          <p className="text-gray-700 text-lg leading-relaxed mb-4">{room.description}</p>
          
          <div className="flex items-center justify-between mb-6 p-3 bg-sky-50 rounded-md border border-sky-200">
            <div>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${room.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {room.available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            <span className="text-2xl font-bold text-sky-600">${room.price}<span className="text-sm font-normal text-gray-500">/night</span></span>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
            <h3 className="text-xl font-semibold mb-3 text-gray-700">Room Features</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center"><BedIcon className="mr-2 text-sky-600" /> Bedrooms: {room.layout.bedrooms}</li>
              <li className="flex items-center"><BathIcon className="mr-2 text-sky-600" /> Bathrooms: {room.layout.bathrooms}</li>
              {room.layout.has_kitchen && <li className="flex items-center"><KitchenIcon className="mr-2 text-sky-600" /> Kitchen Included</li>}
              {room.layout.has_balcony && <li className="flex items-center"><BalconyIcon className="mr-2 text-sky-600" /> Balcony Access</li>}
              {room.layout.has_window && <li className="flex items-center"><WindowIcon className="mr-2 text-sky-600" /> Has Window(s)</li>}
              {room.layout.has_storage && <li className="flex items-center"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-sky-600"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10.5 18.75v.008M13.5 18.75v.008m-6.75-3.75h13.5" /></svg> Storage Space</li>}
            </ul>
          </div>

          {hall && (
            <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
              <h3 className="text-xl font-semibold mb-1 text-gray-700">Location</h3>
              <p className="text-gray-600">
                In Hall: <Link to={`/halls/${hall.id}`} className="text-sky-600 hover:underline font-medium">{hall.name}</Link>
                {building && (
                    <>, Building: <Link to={`/buildings/${building.id}`} className="text-sky-600 hover:underline font-medium">{building.name}</Link></>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomPage;