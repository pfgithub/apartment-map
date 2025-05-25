// src/viewer/icons/AreaIcon.tsx
import React from 'react';

export const AreaIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 ${className}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25V15.75a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15.75V8.25M3 15.75V8.25m0 7.5h18M3 8.25h18M9 3v2.25m6-2.25v2.25m0 15.75V21m-6-2.25V21" />
  </svg>
);

export default AreaIcon;