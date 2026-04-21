import { Link } from 'react-router';
import { type Car as CarType } from '../types/car';
import { Heart, Eye } from 'lucide-react';
import { formatPrice, formatMileage, getTransmissionLabel, getFuelLabel } from '../data/mockData';
import { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface CarCardProps {
  car: CarType;
}

export function CarCard({ car }: CarCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  return (
    <Link 
      to={`/car/${car.id}`}
      className="group block bg-white rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Изображение */}
      <div 
        className="relative aspect-[4/3] bg-secondary overflow-hidden"
        onMouseEnter={() => {
          if (car.images.length > 1) {
            const interval = setInterval(() => {
              setImageIndex(prev => (prev + 1) % car.images.length);
            }, 800);
            return () => clearInterval(interval);
          }
        }}
        onMouseLeave={() => setImageIndex(0)}
      >
        <ImageWithFallback
          src={`https://images.unsplash.com/photo-${car.id === '1' ? '1621007947622-7c9b888c6cc1' : car.id === '2' ? '1617531653332-bd46c24f2068' : car.id === '3' ? '1618843479313-40f8afb4b4d8' : car.id === '4' ? '1551972104-ec7e52e0133e' : car.id === '5' ? '1606664515524-ed2f786a0bd6' : car.id === '6' ? '1611566026373-c54afa09f44a' : car.id === '7' ? '1619405399517-d7fce0f13302' : car.id === '8' ? '1560958089-b8a1929cea89' : car.id === '9' ? '1616422285623-13ff0162193c' : car.id === '10' ? '1600705722908-bab1e61c0b4d' : car.id === '11' ? '1549927681-0b673b8243ab' : '1627454820516-b26085b8aec0'}?w=800&q=80`}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {car.isNew && (
            <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs">
              Новый
            </span>
          )}
        </div>

        {/* Избранное */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsFavorite(!isFavorite);
          }}
          className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
        >
          <Heart 
            className={`w-5 h-5 ${isFavorite ? 'fill-destructive text-destructive' : 'text-foreground'}`}
          />
        </button>
      </div>

      {/* Информация */}
      <div className="p-4">
        {/* Название */}
        <h3 className="text-lg font-semibold text-foreground mb-1">
          {car.brand} {car.model}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          {car.year} год • {formatMileage(car.mileage)}
        </p>

        {/* Характеристики */}
        <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
          <span>{car.engineVolume}л</span>
          <span>•</span>
          <span>{getTransmissionLabel(car.transmission)}</span>
          <span>•</span>
          <span>{getFuelLabel(car.fuel)}</span>
          <span>•</span>
          <span>{car.power} л.с.</span>
        </div>

        {/* Цена */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-semibold text-foreground">
              {formatPrice(car.price)}
            </p>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>
    </Link>
  );
}
