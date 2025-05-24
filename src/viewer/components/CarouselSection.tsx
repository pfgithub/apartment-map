// src/viewer/components/CarouselSection.tsx
import React from 'react';
import { Link } from 'react-router-dom';

export interface CarouselSectionProps<T> {
  title: string;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  viewAllLink: string;
  viewAllText: string;
  itemWidthClass?: string;
  emptyMessage?: string;
}

export function CarouselSection<T>({ title, items, renderItem, viewAllLink, viewAllText, itemWidthClass = "w-72", emptyMessage }: CarouselSectionProps<T>) {
  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-700">{title}</h2>
        {items.length > 0 && ( // Show "View All" only if there are items
           <Link to={viewAllLink} className="text-sky-600 hover:text-sky-800 transition-colors font-medium">
            {viewAllText} →
          </Link>
        )}
      </div>
      {items.length === 0 && emptyMessage ? (
        <p className="text-gray-500 italic">{emptyMessage}</p>
      ) : items.length === 0 ? null : (
        <div className="flex overflow-x-auto space-x-4 pb-4 -mb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {items.map((item, index) => (
            <div key={index} className={`flex-shrink-0 ${itemWidthClass}`}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default CarouselSection;