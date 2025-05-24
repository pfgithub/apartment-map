import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import ImageDisplay from '../components/ImageDisplay';
import { HallID, BuildingID, RoomID, PointOfInterestID, ConnectionID } from '../types';

const HallPage: React.FC = () => {
  const { id } = useParams<{ id: HallID }>();
  const { data, loading, error } = useData();

  if (loading) return <p className="text-center py-10">Loading hall details...</p>;
  if (error) return <p className="text-center py-10 text-red-500">Error loading data: {error.message}</p>;
  if (!data || !id || !data.halls[id]) return <p className="text-center py-10">Hall not found.</p>;

  const hall = data.halls[id];
  const building = data.buildings[hall.relations.building as BuildingID];

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
      <div className="md:flex md:space-x-8">
        <div className="md:w-1/3">
          <ImageDisplay image={hall.image} className="w-full h-auto rounded-lg mb-4 md:mb-0" />
        </div>
        <div className="md:w-2/3">
          <h1 className="text-3xl md:text-4xl font-bold mb-1 text-blue-700">{hall.name}</h1>
          {building && (
            <p className="text-md text-gray-500 mb-3">
              Part of <Link to={`/buildings/${building.id}`} className="text-blue-500 hover:underline">{building.description.split('.')[0]}</Link>
            </p>
          )}
          <p className="text-gray-600 text-lg mb-6">{hall.description}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-3 text-gray-700">Rooms in this Hall</h2>
          {hall.relations.rooms.length > 0 ? (
            <ul className="space-y-2">
              {hall.relations.rooms.map(roomId => {
                const room = data.rooms[roomId as RoomID];
                return room ? (
                  <li key={roomId} className="p-3 bg-gray-50 rounded hover:bg-gray-100">
                    <Link to={`/rooms/${room.id}`} className="text-blue-600 hover:underline font-medium">{room.name}</Link>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${room.available ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'}`}>
                      {room.available ? 'Available' : 'Unavailable'}
                    </span>
                  </li>
                ) : null;
              })}
            </ul>
          ) : <p>No rooms listed for this hall.</p>}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3 text-gray-700">Points of Interest</h2>
          {Object.values(data.points_of_interest).filter(poi => poi.relations.hall === id).length > 0 ? (
             <ul className="space-y-2">
              {Object.values(data.points_of_interest)
                .filter(poi => poi.relations.hall === id)
                .map(poi => (
                  <li key={poi.id} className="p-3 bg-gray-50 rounded hover:bg-gray-100">
                    <Link to={`/pois/${poi.id}`} className="text-blue-600 hover:underline font-medium">{poi.name}</Link>
                  </li>
                ))}
            </ul>
          ) : <p>No points of interest in this hall.</p>}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-3 text-gray-700">Connections from this Hall</h2>
        {hall.relations.connections.length > 0 ? (
          <ul className="space-y-2">
            {hall.relations.connections.map(connId => {
              const connection = data.connections[connId as ConnectionID];
              if (!connection || connection.relations.from !== id) return null; // Only show outgoing
              const toHall = data.halls[connection.relations.to as HallID];
              return toHall ? (
                <li key={connId} className="p-3 bg-gray-50 rounded hover:bg-gray-100">
                  Leads to <Link to={`/halls/${toHall.id}`} className="text-blue-600 hover:underline font-medium">{toHall.name}</Link>
                  <span className="text-sm text-gray-500"> ({connection.seconds} seconds)</span> - <span className="italic text-sm">{connection.name}</span>
                </li>
              ) : null;
            })}
          </ul>
        ) : <p>No outgoing connections listed for this hall.</p>}
      </div>
    </div>
  );
};

export default HallPage;