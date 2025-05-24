import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import ImageDisplay from '../components/ImageDisplay';
import type { RoomID, HallID } from '../types';

const RoomPage: React.FC = () => {
  const { id } = useParams<{ id: RoomID }>();
  const { data, loading, error } = useData();

  if (loading) return <p className="text-center py-10">Loading room details...</p>;
  if (error) return <p className="text-center py-10 text-red-500">Error loading data: {error.message}</p>;
  if (!data || !id || !data.rooms[id]) return <p className="text-center py-10">Room not found.</p>;

  const room = data.rooms[id];
  const hall = data.halls[room.relations.hall as HallID];

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
      <div className="md:flex md:space-x-8">
        <div className="md:w-1/2">
          <ImageDisplay image={room.image} className="w-full h-auto rounded-lg mb-4 md:mb-0" />
        </div>
        <div className="md:w-1/2">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-blue-700">{room.name}</h1>
          <p className="text-gray-600 text-lg mb-4">{room.description}</p>
          
          <div className="mb-4">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${room.available ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
              {room.available ? 'Available' : 'Unavailable'}
            </span>
            <span className="ml-4 text-2xl font-bold text-blue-600">${room.price}/night</span>
          </div>

          <div className="mb-4 p-4 bg-gray-50 rounded">
            <h3 className="text-xl font-semibold mb-2">Layout Details:</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-1">
              <li>Bedrooms: {room.layout.bedrooms}</li>
              <li>Bathrooms: {room.layout.bathrooms}</li>
              {room.layout.has_kitchen && <li>Kitchen Included</li>}
              {room.layout.has_balcony && <li>Balcony Access</li>}
              {room.layout.has_window && <li>Has Window(s)</li>}
            </ul>
          </div>

          {hall && (
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-1">Location:</h3>
              <p>In Hall: <Link to={`/halls/${hall.id}`} className="text-blue-600 hover:underline">{hall.name}</Link></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomPage;