// src/viewer/components/ImageDropzone.tsx
import React, { useState, useCallback, useRef } from 'react'; // Removed useEffect, Added useRef
import type { Image } from '../types';
import ImageDisplay from './ImageDisplay';
import UploadIcon from '../icons/UploadIcon';

interface ImageDropzoneProps {
  initialImage?: Image;
  onImageChange: (file: File | null, removeExisting: boolean) => void; // file is new, removeExisting indicates explicit removal
  className?: string;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({ initialImage, onImageChange, className = '' }) => {
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  // Tracks if the user has interacted (dropped or removed) to differentiate from initial state
  const [imageManuallySet, setImageManuallySet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref for the hidden file input

  // Centralized function to process a file (from drop or select)
  const processAndSetImage = useCallback((file: File) => {
    if (file.type.startsWith('image/')) {
      onImageChange(file, false); // A new image is provided
      const reader = new FileReader();
      reader.onloadend = () => {
        setCurrentPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setImageManuallySet(true); // User has interacted
    } else {
      alert('Please select an image file.');
    }
  }, [onImageChange]); // onImageChange is a prop, setters from useState are stable

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Necessary to allow drop
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      processAndSetImage(file);
    }
  }, [processAndSetImage]); // setDragging is stable

  const handleRemoveImage = () => {
    setCurrentPreviewUrl(null);
    setImageManuallySet(true);
    onImageChange(null, true); // Signal that any existing/initial image should be removed
    // Reset file input if an image was selected through it and then removed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handler for file input change (after user selects a file via dialog)
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      processAndSetImage(file);
    }
    // Reset the input value to allow selecting the same file again if needed
    if (e.target) {
      e.target.value = '';
    }
  }, [processAndSetImage]);

  // Handler for clicking the dropzone area to trigger file input
  const handleAreaClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []); // fileInputRef is stable

  const hasImage = currentPreviewUrl || (initialImage && !imageManuallySet);

  return (
    <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${dragging ? 'border-sky-500 bg-sky-50' : 'border-gray-300 hover:border-gray-400'} ${className}`}>
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*" // Suggest to the browser to filter for image files
        style={{ display: 'none' }}
      />
      {/* Clickable and Draggable Area */}
      <div
        role="button" // Accessibility: indicates this div is interactive like a button
        tabIndex={0}  // Accessibility: makes the div focusable
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleAreaClick} // Trigger file input on click
        onKeyDown={(e) => { // Accessibility: allow space/enter to trigger click
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleAreaClick();
          }
        }}
        className="w-full h-full flex flex-col items-center justify-center cursor-pointer" // Added cursor-pointer
      >
        {currentPreviewUrl ? (
          <img src={currentPreviewUrl} alt="Preview" className="max-h-48 w-auto object-contain rounded mb-2" />
        ) : initialImage && !imageManuallySet ? (
          <ImageDisplay image={initialImage} className="max-h-48 w-auto object-contain rounded mb-2" />
        ) : (
          <>
            <UploadIcon className="w-12 h-12 text-gray-400 mb-2" />
            {/* Updated text */}
            <p className="text-gray-500">Drag & drop an image here, or click to select a file</p>
            <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB (not enforced)</p>
          </>
        )}
      </div>
      {hasImage && (
        <button
          type="button"
          onClick={handleRemoveImage}
          className="mt-2 px-3 py-1 bg-red-500 text-white text-xs font-semibold rounded hover:bg-red-600 transition-colors"
        >
          Remove Image
        </button>
      )}
    </div>
  );
};

export default ImageDropzone;