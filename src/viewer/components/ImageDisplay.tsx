import React from 'react';
import { Image } from '../types';

interface ImageDisplayProps {
  image: Image;
  className?: string;
}

const ImageDisplay: React.FC<ImageDisplayProps> = ({ image, className }) => {
  return (
    <img
      src={image.url}
      alt={image.alt}
      width={image.width}
      height={image.height}
      className={`object-cover ${className}`}
      loading="lazy"
    />
  );
};

export default ImageDisplay;