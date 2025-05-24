import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import type { HallID, Root } from '../types';
import { findShortestPath, type PathResult } from '../utils/pathfinding';
import { Link } from 'react-router-dom';

const NavigationPage: React.FC = () => {
  const { data, loading, error } = useData();
  const [fromHall, setFromHall] = useState<HallID | ''>('');
  const [toHall, setToHall] = useState<HallID | ''>('');
  const [pathResult, setPathResult] = useState<PathResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const hallOptions = useMemo(() => {
    if (!data) return [];
    return Object.values(data.halls).map(hall => ({
      value: hall.id,
      label: hall.name,
    }));
  }, [data]);

  const handleFindPath = () => {
    if (!data || !fromHall || !toHall) {
      setSearchError("Please select both a starting and ending hall.");
      setPathResult(null);
      return;
    }
    if (fromHall === toHall) {
      setSearchError("Starting and ending halls cannot be the same.");
      setPathResult(null);
      return;
    }
    setSearchError(null);
    const result = findShortestPath(data as Root, fromHall, toHall);
    setPathResult(result);
  };

  if (loading) return <p className="text-center py-10">Loading navigation data...</p>;
  if (error) return <p className="text-center py-10 text-red-500">Error loading data: {error.message}</p>;
  if (!data) return <p className="text-center py-10">No data available for navigation.</p>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-6 text-gray-700 text-center">Find Directions</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="fromHall" className="block text-sm font-medium text-gray-700 mb-1">From Hall:</label>
          <select
            id="fromHall"
            value={fromHall}
            onChange={(e) => setFromHall(e.target.value as HallID)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select starting hall</option>
            {hallOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="toHall" className="block text-sm font-medium text-gray-700 mb-1">To Hall:</label>
          <select
            id="toHall"
            value={toHall}
            onChange={(e) => setToHall(e.target.value as HallID)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select destination hall</option>
            {hallOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
      </div>

      <button
        onClick={handleFindPath}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition duration-150 ease-in-out"
      >
        Find Path
      </button>

      {searchError && <p className="mt-4 text-red-500 text-center">{searchError}</p>}

      {pathResult && (
        <div className="mt-8 p-4 border border-gray-200 rounded-md bg-gray-50">
          <h2 className="text-xl font-semibold mb-3 text-blue-700">Route Found:</h2>
          <p className="mb-1">Total time: <span className="font-bold">{(pathResult.totalSeconds / 60).toFixed(1)} minutes</span> ({pathResult.totalSeconds} seconds)</p>
          <ol className="list-decimal list-inside space-y-1">
            {pathResult.path.map((hallId, index) => {
              const hall = data.halls[hallId];
              return (
                <li key={hallId}>
                  {index > 0 && "Go to "}
                  <Link to={`/halls/${hallId}`} className="text-blue-600 hover:underline">{hall?.name || 'Unknown Hall'}</Link>
                  {index === 0 && " (Start)"}
                  {index === pathResult.path.length - 1 && index !== 0 && " (Destination)"}
                </li>
              );
            })}
          </ol>
        </div>
      )}
      {pathResult === null && fromHall && toHall && !searchError && (
         <p className="mt-4 text-orange-600 text-center">No path found between the selected halls.</p>
      )}
    </div>
  );
};

export default NavigationPage;