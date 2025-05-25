// src/viewer/components/ImageDisplay.tsx
import React, { useState, useEffect } from 'react';
import { thumbHashToDataURL } from 'thumbhash'; // Assuming 'thumbhash' is resolvable as a module
import type { Image } from '../types';

// Helper function to decode a base64 string to a Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  try {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    console.error("Failed to decode base64 thumbhash:", e);
    return new Uint8Array(); // Return empty array on error
  }
}

interface ImageDisplayProps {
  image?: Image;
  className?: string; // Expected to contain sizing and object-fit, e.g., "w-full aspect-16/9 object-cover"
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ image, className = '' }) => {
  const [thumbhashDataUrl, setThumbhashDataUrl] = useState<string | undefined>(undefined);
  const [isActualImageLoaded, setIsActualImageLoaded] = useState<boolean>(false);

  // Extract object-fit utility (e.g., "object-cover") from className for images.
  // The remaining part of className (e.g., "w-full aspect-16/9") is for the container's dimensions.
  const objectFitClass = (className.match(/object-\w+/) || ['object-cover'])[0];
  const containerSizingClass = className.replace(/object-\w+/g, '').trim();

  useEffect(() => {
    // Reset states when the image prop changes
    setThumbhashDataUrl(undefined);
    setIsActualImageLoaded(false);

    if (image?.thumbhash) {
      try {
        const thumbhashBytes = base64ToUint8Array(image.thumbhash);
        if (thumbhashBytes.length > 0) {
          const dataUrl = thumbHashToDataURL(thumbhashBytes);
          setThumbhashDataUrl(dataUrl);
        }
      } catch (error) {
        console.error('Error processing thumbhash:', error);
        // If thumbhash processing fails, thumbhashDataUrl will remain undefined.
        // The component will then show the basic loading placeholder.
      }
    }
  }, [image]); // Re-run this effect if the image object itself changes

  const handleActualImageLoad = () => {
    setIsActualImageLoaded(true);
  };

  const handleActualImageError = () => {
    // If the actual image fails to load, we still consider the loading process "finished"
    // to hide any placeholders (thumbhash or basic loader) and let the browser show its broken image icon.
    setIsActualImageLoaded(true); 
  };

  if (!image) {
    // Display placeholder if no image is provided
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center text-gray-400 ${containerSizingClass}`}
        role="img"
        aria-label={"Placeholder image"}
      >
        {/* Generic placeholder icon (SVG) */}
        <svg className="w-1/3 h-1/3 opacity-50" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zm0 16H5V5h14v14zm-4.879-5.495L12.707 12l-2.121 2.121-2.122-2.121L7 13.414l3.535 3.536L12 18.364l1.465-1.414L17 13.414l-2.879-1.909zM10.5 10c.828 0 1.5-.672 1.5-1.5S11.328 7 10.5 7 9 7.672 9 8.5s.672 1.5 1.5 1.5z" />
        </svg>
      </div>
    );
  }

  // Determine if the thumbhash layer should be visible
  const showThumbhashLayer = !!thumbhashDataUrl && !isActualImageLoaded;
  // Determine if the basic loading placeholder (if no thumbhash) should be visible
  const showBasicLoadingPlaceholder = !thumbhashDataUrl && !isActualImageLoaded;

  return (
    // Container div gets sizing classes (e.g., w-full aspect-16/9) and establishes a relative context
    <div className={`relative overflow-hidden ${containerSizingClass}`}>
      {/* Basic Loading Placeholder: Shown if no thumbhash is available and actual image is still loading. */}
      {showBasicLoadingPlaceholder && (
        <div 
          className={`absolute top-0 left-0 w-full h-full bg-gray-200 ${objectFitClass} flex items-center justify-center transition-opacity duration-300 ease-in-out ${isActualImageLoaded ? 'opacity-0' : 'opacity-100'}`}
          style={{ willChange: 'opacity' }} 
          aria-hidden="true"
        >
            {/* Pulsing icon as a visual cue */}
            <svg className="w-1/4 h-1/4 text-gray-400 opacity-50 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                 <path d="M19 3H5c-1.103 0-2 .897-2 2v14c0 1.103.897 2 2 2h14c1.103 0 2-.897 2-2V5c0-1.103-.897-2-2-2zm0 16H5V5h14v14zm-4.879-5.495L12.707 12l-2.121 2.121-2.122-2.121L7 13.414l3.535 3.536L12 18.364l1.465-1.414L17 13.414l-2.879-1.909zM10.5 10c.828 0 1.5-.672 1.5-1.5S11.328 7 10.5 7 9 7.672 9 8.5s.672 1.5 1.5 1.5z" />
            </svg>
        </div>
      )}

      {/* Thumbhash Image Layer: Displayed if thumbhash is available and actual image hasn't loaded. */}
      {thumbhashDataUrl && (
        <img
          src={thumbhashDataUrl}
          alt={""} // not needed because the real dom element has alt text
          className={`absolute top-0 left-0 w-full h-full ${objectFitClass} transition-opacity duration-300 ease-in-out ${showThumbhashLayer ? 'opacity-100' : 'opacity-0'}`}
          style={{ willChange: 'opacity' }}
          aria-hidden="true" // This is a decorative placeholder
        />
      )}

      {/* Actual Image: Always in the DOM. Opacity controls its visibility. */}
      <img
        key={image.uuid} // Ensures onLoad triggers correctly if the image URL changes
        src={"https://lfs.pfg.pw/source/"+image.uuid+".png"}
        alt={image.alt}
        className={`absolute top-0 left-0 w-full h-full ${objectFitClass} transition-opacity duration-300 ease-in-out ${isActualImageLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ willChange: 'opacity' }} // Performance hint for opacity transitions
        onLoad={handleActualImageLoad}
        onError={handleActualImageError}
        loading="lazy" // Leverage browser's lazy loading for the main image
      />
    </div>
  );
};

export default ImageDisplay;