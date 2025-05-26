// src/viewer/pages/EditRoomPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useRoute } from '../contexts/RouteContext';
import type { Room, RoomID, Image } from '../types';
import ImageDropzone from '../components/ImageDropzone';
import SpinnerIcon from '../icons/SpinnerIcon';
import CheckCircleIcon from '../icons/CheckCircleIcon';
import ExclamationTriangleIcon from '../icons/ExclamationTriangleIcon';
import ArrowLongLeftIcon from '../icons/ArrowLongLeftIcon';

const EditRoomPage: React.FC = () => {
  const { id } = useParams<{ id: RoomID }>();
  const { data } = useData();
  const { setBreadcrumbs } = useRoute();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<Partial<Room>>({});
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    if (id && data.rooms[id]) {
      const currentRoom = data.rooms[id];
      setRoom(currentRoom);
      // Deep copy layout to avoid direct state mutation issues
      setFormData({ ...currentRoom, layout: { ...currentRoom.layout } });
      setBreadcrumbs([
        { label: 'Home', link: '/' },
        { label: 'Rooms', link: '/rooms' },
        { label: currentRoom.name, link: `/rooms/${currentRoom.id}` },
        { label: 'Edit' }
      ]);
    } else {
      setBreadcrumbs([
        { label: 'Home', link: '/' },
        { label: 'Rooms', link: '/rooms' },
        { label: 'Edit Room' }
      ]);
    }
  }, [id, data, setBreadcrumbs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('layout.')) {
        const layoutField = name.split('.')[1];
        let parsedValue: string | number | boolean | undefined = value;
        if (type === 'number') {
            parsedValue = value === '' ? undefined : parseFloat(value);
        } else if (type === 'checkbox') {
            parsedValue = (e.target as HTMLInputElement).checked;
        }
        // @ts-ignore
        setFormData(prev => ({
            ...prev,
            layout: {
                ...(prev.layout || {}),
                [layoutField]: parsedValue,
            }
        }));
    } else {
        let parsedValue: string | number | boolean = value;
        if (type === 'number') {
            parsedValue = value === '' ? 0 : parseFloat(value); // Price cannot be undefined, default to 0 if empty
        } else if (type === 'checkbox') { // For 'available'
            parsedValue = (e.target as HTMLInputElement).checked;
        }
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
    }
  };

  const handleImageChange = useCallback((file: File | null, remove: boolean) => {
    setNewImageFile(file);
    setRemoveCurrentImage(remove);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    if (!room || !formData) {
      setStatusMessage({type: 'error', text: 'Room data not loaded correctly.'});
      setIsLoading(false);
      return;
    }

    const updatedRoomData: Room = {
      ...room, // Start with original room data to preserve relations, id
      name: formData.name || room.name,
      description: formData.description || room.description,
      price: typeof formData.price === 'number' ? formData.price : room.price,
      available: typeof formData.available === 'boolean' ? formData.available : room.available,
      layout: {
        bedrooms: formData.layout?.bedrooms ?? room.layout.bedrooms,
        bathrooms: formData.layout?.bathrooms ?? room.layout.bathrooms,
        has_kitchen: formData.layout?.has_kitchen ?? room.layout.has_kitchen,
        has_balcony: formData.layout?.has_balcony ?? room.layout.has_balcony,
        has_window: formData.layout?.has_window ?? room.layout.has_window,
        has_storage: formData.layout?.has_storage ?? room.layout.has_storage,
        square_meters: formData.layout?.square_meters ?? room.layout.square_meters,
      },
    };
    
    // Ensure all layout boolean fields are explicitly true or false if not present
    updatedRoomData.layout.has_kitchen = !!updatedRoomData.layout.has_kitchen;
    updatedRoomData.layout.has_balcony = !!updatedRoomData.layout.has_balcony;
    updatedRoomData.layout.has_window = !!updatedRoomData.layout.has_window;
    updatedRoomData.layout.has_storage = !!updatedRoomData.layout.has_storage;


    // API call
    console.log('Submitting to /api/update-room:', JSON.stringify(updatedRoomData, null, 2));
    try {
      if (newImageFile) {
        const response = await fetch("/api/image", {
          method: "PUT",
          body: newImageFile,
        });
        if(!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const data = await response.json() as Image;
        updatedRoomData.image = data;
      } else if (removeCurrentImage) {
        updatedRoomData.image = undefined;
      }

      const response = await fetch('/api/update-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRoomData),
      });
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

      setStatusMessage({type: 'success', text: 'Room updated successfully! Refresh to see global changes.'});
      // Update local form data to reflect submission
      setRoom(updatedRoomData); // If we were to stay on page.
      setFormData({...updatedRoomData, layout: {...updatedRoomData.layout}}); // Update form state to reflect saved data
      setNewImageFile(null); // Reset new file state
      setRemoveCurrentImage(false); // Reset removal flag
      
      // TODO: refetch data
      // Navigate away
      navigate(`/rooms/${id}`);

    } catch (error) {
      console.error("Failed to update room:", error);
      setStatusMessage({type: 'error', text: `Failed to update room: ${(error as Error).message}`});
    } finally {
      setIsLoading(false);
    }
  };

  if (!room || !formData) {
    return <p className="text-center py-10">Loading room data or room not found...</p>;
  }

  const inputBaseClass = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm";
  const labelBaseClass = "block text-sm font-medium text-gray-700";

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <Link to={`/rooms/${id}`} className="text-sky-600 hover:text-sky-700 inline-flex items-center">
          <ArrowLongLeftIcon className="w-5 h-5 mr-2" />
          Back to Room Details
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Room: {room.name}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 shadow-lg rounded-lg">
        <div>
          <label htmlFor="name" className={labelBaseClass}>Name</label>
          <input type="text" name="name" id="name" value={formData.name || ''} onChange={handleInputChange} className={inputBaseClass} required />
        </div>

        <div>
          <label htmlFor="description" className={labelBaseClass}>Description</label>
          <textarea name="description" id="description" value={formData.description || ''} onChange={handleInputChange} rows={4} className={inputBaseClass} required />
        </div>

        <div>
          <label className={labelBaseClass}>Image</label>
          <ImageDropzone initialImage={room.image} onImageChange={handleImageChange} className="h-64" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="price" className={labelBaseClass}>Price (per night)</label>
            <input type="number" name="price" id="price" value={formData.price || 0} onChange={handleInputChange} className={inputBaseClass} step="0.01" min="0" required />
          </div>
          <div className="flex items-center pt-6">
            <input type="checkbox" name="available" id="available" checked={formData.available || false} onChange={handleInputChange} className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500" />
            <label htmlFor="available" className="ml-2 text-sm font-medium text-gray-700">Available</label>
          </div>
        </div>

        <fieldset className="border border-gray-200 p-4 rounded-md">
          <legend className="text-lg font-medium text-gray-700 px-2">Layout</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mt-2">
            <div>
              <label htmlFor="layout.bedrooms" className={labelBaseClass}>Bedrooms</label>
              <input type="number" name="layout.bedrooms" id="layout.bedrooms" value={formData.layout?.bedrooms || 0} onChange={handleInputChange} className={inputBaseClass} min="0" required />
            </div>
            <div>
              <label htmlFor="layout.bathrooms" className={labelBaseClass}>Bathrooms</label>
              <input type="number" name="layout.bathrooms" id="layout.bathrooms" value={formData.layout?.bathrooms || 0} onChange={handleInputChange} className={inputBaseClass} min="0" required />
            </div>
            <div>
              <label htmlFor="layout.square_meters" className={labelBaseClass}>Square Meters (m²)</label>
              <input type="number" name="layout.square_meters" id="layout.square_meters" value={formData.layout?.square_meters || ''} onChange={handleInputChange} className={inputBaseClass} min="0" placeholder="Optional"/>
            </div>
            <div className="space-y-3 md:pt-6"> {/* Layout checkboxes */}
              {[
                {name: 'has_kitchen', label: 'Kitchen'},
                {name: 'has_balcony', label: 'Balcony'},
                {name: 'has_window', label: 'Window(s)'},
                {name: 'has_storage', label: 'Storage'}
              ].map(feature => (
                <div key={feature.name} className="flex items-center">
                  <input type="checkbox" name={`layout.${feature.name}`} id={`layout.${feature.name}`} checked={!!formData.layout?.[feature.name as keyof Room['layout']]} onChange={handleInputChange} className="h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500" />
                  <label htmlFor={`layout.${feature.name}`} className="ml-2 text-sm font-medium text-gray-700">{feature.label}</label>
                </div>
              ))}
            </div>
          </div>
        </fieldset>

        {statusMessage && (
          <div className={`p-3 rounded-md flex items-center text-sm ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {statusMessage.type === 'success' ? <CheckCircleIcon className="w-5 h-5 mr-2" /> : <ExclamationTriangleIcon className="w-5 h-5 mr-2" />}
            {statusMessage.text}
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => navigate(`/rooms/${id}`)}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 flex items-center justify-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <SpinnerIcon className="w-4 h-4 mr-2" /> Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditRoomPage;