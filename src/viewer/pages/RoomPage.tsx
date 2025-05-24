import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useRoute, type RouteItem } from '../contexts/RouteContext';
import ImageDisplay from '../components/ImageDisplay';
import type { RoomID, HallID, Room } from '../types';
import AddIcon from '../icons/AddIcon';
import RemoveIcon from '../icons/RemoveIcon';
import { KitchenIcon } from '../icons/KitchenIcon';
import { BalconyIcon } from '../icons/BalconyIcon';
import { WindowIcon } from '../icons/WindowIcon';
import { BathIcon } from '../icons/BathIcon';
import { BedIcon } from '../icons/BedIcon';
import { StorageIcon } from '../icons/StorageIcon';

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
        {itemInRoute ? <RemoveIcon /> : <AddIcon />}
        {itemInRoute ? 'Remove from Route' : 'Add to Route'}
      </button>
    </div>
  );
};


const RoomPage: React.FC = () => {
  const { id } = useParams<{ id: RoomID }>();
  const { data } = useData();
  const { setBreadcrumbs } = useRoute();

  const room = id ? data.rooms[id] : null;
  const hall = room ? data.halls[room.relations.hall as HallID] : null;
  const building = hall ? data.buildings[hall.relations.building] : null;

  useEffect(() => {
    if (room && hall && building) {
      setBreadcrumbs([
        { label: 'Home', link: '/' },
        { label: 'Buildings', link: `/buildings` }, 
        { label: building.name, link: `/buildings/${building.id}` },
        { label: hall.name, link: `/halls/${hall.id}` },
        { label: room.name }
      ]);
    } else if (room && hall) {
      setBreadcrumbs([
        { label: 'Home', link: '/' },
        { label: 'Halls', link: `/halls` }, 
        { label: hall.name, link: `/halls/${hall.id}` },
        { label: room.name }
      ]);
    } else if (room) {
      setBreadcrumbs([
        { label: 'Home', link: '/' },
        { label: 'Rooms', link: '/rooms' }, // Path changed
        { label: room.name }
      ]);
    } else {
      setBreadcrumbs([{ label: 'Home', link: '/' }]);
    }
  }, [setBreadcrumbs, room, hall, building]);

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
              {room.layout.has_storage && <li className="flex items-center"><StorageIcon className="w-5 h-5 mr-2 text-sky-600" />Storage Space</li>}
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