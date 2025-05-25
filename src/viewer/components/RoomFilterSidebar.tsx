// src/viewer/components/RoomFilterSidebar.tsx
import React from 'react';
import type { RoomFilters } from '../pages/AllRoomsPage'; // Import type from AllRoomsPage

interface RoomFilterSidebarProps {
  filters: RoomFilters;
  setFilters: React.Dispatch<React.SetStateAction<RoomFilters>>;
  resetFilters: () => void;
  filterOptions: {
    minPrice: number;
    maxPrice: number;
    bedroomOptions: string[];
    bathroomOptions: string[];
  };
}

const RoomFilterSidebar: React.FC<RoomFilterSidebarProps> = ({
  filters,
  setFilters,
  resetFilters,
  filterOptions,
}) => {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFilters(prev => ({
        ...prev,
        features: {
          ...prev.features,
          [name]: checked,
        }
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm disabled:bg-gray-50";
  const selectClass = inputClass;
  const checkboxClass = "h-4 w-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500";
  const fieldsetBottomMargin = "mb-6";

  return (
    <aside className="w-full lg:w-72 xl:w-80 p-6 bg-white shadow-lg rounded-lg lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <div className="flex justify-between items-center pb-2 mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Filter Rooms</h2>
        <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-sky-600 hover:text-sky-800 font-medium hover:underline"
        >
            Reset All
        </button>
      </div>
      
      <form onSubmit={(e) => e.preventDefault()}>
        {/* Availability */}
        <div className={fieldsetBottomMargin}>
          <label htmlFor="availability" className={labelClass}>Availability</label>
          <select
            id="availability"
            name="availability"
            value={filters.availability}
            onChange={handleInputChange}
            className={selectClass}
          >
            <option value="any">Any</option>
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        {/* Price Range */}
        <div className={fieldsetBottomMargin}>
          <label className={labelClass}>Price Range ($)</label>
          <div className="flex space-x-2">
            <input
              type="number"
              name="priceMin"
              placeholder={`Min (${filterOptions.minPrice})`}
              value={filters.priceMin}
              onChange={handleInputChange}
              className={inputClass}
              min="0"
            />
            <input
              type="number"
              name="priceMax"
              placeholder={`Max (${filterOptions.maxPrice})`}
              value={filters.priceMax}
              onChange={handleInputChange}
              className={inputClass}
              min="0"
            />
          </div>
        </div>

        {/* Bedrooms */}
        <div className={fieldsetBottomMargin}>
          <label htmlFor="bedrooms" className={labelClass}>Bedrooms</label>
          <select
            id="bedrooms"
            name="bedrooms"
            value={filters.bedrooms}
            onChange={handleInputChange}
            className={selectClass}
            disabled={filterOptions.bedroomOptions.length <= 1}
          >
            {filterOptions.bedroomOptions.map(opt => (
              <option key={`bed-${opt}`} value={opt}>{opt === 'any' ? 'Any' : `${opt} Bed${parseInt(opt) !== 1 && opt !== 'any' ? 's' : ''}`}</option>
            ))}
          </select>
        </div>

        {/* Bathrooms */}
        <div className={fieldsetBottomMargin}>
          <label htmlFor="bathrooms" className={labelClass}>Bathrooms</label>
          <select
            id="bathrooms"
            name="bathrooms"
            value={filters.bathrooms}
            onChange={handleInputChange}
            className={selectClass}
            disabled={filterOptions.bathroomOptions.length <= 1}
          >
            {filterOptions.bathroomOptions.map(opt => (
              <option key={`bath-${opt}`} value={opt}>{opt === 'any' ? 'Any' : `${opt} Bath${parseInt(opt) !== 1 && opt !== 'any' ? 's' : ''}`}</option>
            ))}
          </select>
        </div>

        {/* Features */}
        <div className={fieldsetBottomMargin}>
          <label className={labelClass}>Features</label>
          <div className="space-y-2 pt-1">
            {(Object.keys(filters.features) as Array<keyof RoomFilters['features']>).map(featureKey => (
              <div key={featureKey} className="flex items-center">
                <input
                  id={`feature-${featureKey}`}
                  name={featureKey}
                  type="checkbox"
                  checked={filters.features[featureKey]}
                  onChange={handleInputChange}
                  className={checkboxClass}
                />
                <label htmlFor={`feature-${featureKey}`} className="ml-2 text-sm text-gray-700 capitalize">
                  {featureKey.replace(/_/g, ' ')}
                </label>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="w-full mt-2 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 transition-colors lg:hidden"
        >
          Reset Filters (Mobile)
        </button>
      </form>
    </aside>
  );
};

export default RoomFilterSidebar;