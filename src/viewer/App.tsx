import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import Layout from './components/Layout.tsx';
import HomePage from './pages/HomePage.tsx';
import BuildingPage from './pages/BuildingPage.tsx';
import HallPage from './pages/HallPage.tsx';
import RoomPage from './pages/RoomPage';
import PointOfInterestPage from './pages/PointOfInterestPage.tsx';
import SearchPage from './pages/SearchPage.tsx';
import NavigationPage from './pages/NavigationPage.tsx';

const App: React.FC = () => {
  return (
    <DataProvider>
      <BrowserRouter basename='/viewer'>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="buildings/:id" element={<BuildingPage />} />
            <Route path="halls/:id" element={<HallPage />} />
            <Route path="rooms/:id" element={<RoomPage />} />
            <Route path="pois/:id" element={<PointOfInterestPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="navigate" element={<NavigationPage />} />
            <Route path="*" element={<div className="text-center py-10"><h2>404: Page Not Found</h2></div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
};

export default App;