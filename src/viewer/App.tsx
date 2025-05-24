import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import { RouteProvider } from './contexts/RouteContext';
import Layout from './components/Layout.tsx';
import HomePage from './pages/HomePage.tsx';
import BuildingPage from './pages/BuildingPage.tsx';
import HallPage from './pages/HallPage.tsx';
import RoomPage from './pages/RoomPage';
import PointOfInterestPage from './pages/PointOfInterestPage.tsx';
import SearchPage from './pages/SearchPage.tsx';

import AllRoomsPage from './pages/AllRoomsPage.tsx';
import AllHallsPage from './pages/AllHallsPage.tsx';
import AllPoisPage from './pages/AllPoisPage.tsx';
import AllBuildingsPage from './pages/AllBuildingsPage.tsx';
import MapPage from './pages/MapPage.tsx';

const App: React.FC = () => {
  return (
    <DataProvider>
      <RouteProvider>
        <BrowserRouter basename='/viewer'>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="buildings/:id" element={<BuildingPage />} />
              <Route path="halls/:id" element={<HallPage />} />
              <Route path="rooms/:id" element={<RoomPage />} />
              <Route path="pois/:id" element={<PointOfInterestPage />} />
              <Route path="search" element={<SearchPage />} />

              <Route path="rooms" element={<AllRoomsPage />} />
              <Route path="halls" element={<AllHallsPage />} />
              <Route path="pois" element={<AllPoisPage />} />
              <Route path="buildings" element={<AllBuildingsPage />} />
              <Route path="map" element={<MapPage />} />
              
              <Route path="*" element={<div className="text-center py-10"><h2>404: Page Not Found</h2></div>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </RouteProvider>
    </DataProvider>
  );
};

export default App;