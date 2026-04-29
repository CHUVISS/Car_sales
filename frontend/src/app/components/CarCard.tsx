import { Link } from 'react-router';
import { Heart, Eye } from 'lucide-react';
import { useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  transmission: 'automatic' | 'manual';
  fuel: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  color: string;
  engineVolume: number;
  drive: 'front' | 'rear' | 'all';
  body: 'sedan' | 'suv' | 'hatchback' | 'wagon' | 'coupe' | 'minivan';
  power: number;
  images: string[];
  description: string;
  isNew: boolean;
  createdAt: string;
  vin?: string;
}

interface CarCardProps { car: Car; }

function formatPrice(price: number): string {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);
}
function formatMileage(m: number): string {
  return `${new Intl.NumberFormat('ru-RU').format(m)} км`;
}
const TRANSMISSION_LABELS: Record<string, string> = { automatic: 'Автомат', manual: 'Механика' };
const FUEL_LABELS: Record<string, string> = { petrol: 'Бензин', diesel: 'Дизель', electric: 'Электро', hybrid: 'Гибрид' };

function getImageSrc(img: string, carId: string): string {
  if (img.startsWith('http') || img.startsWith('/uploads')) return img;
  const photoMap: Record<string, string> = {
    '1': '1621007947622-7c9b888c6cc1', '2': '1617531653332-bd46c24f2068',
    '3': '1618843479313-40f8afb4b4d8', '4': '1551972104-ec7e52e0133e',
    '5': '1606664515524-ed2f786a0bd6', '6': '1611566026373-c54afa09f44a',
    '7': '1619405399517-d7fce0f13302', '8': '1560958089-b8a1929cea89',
    '9': '1616422285623-13ff0162193c', '10': '1600705722908-bab1e61c0b4d',
    '11': '1549927681-0b673b8243ab',
  };
  const photoId = photoMap[carId] ?? '1627454820516-b26085b8aec0';
  return `https://images.unsplash.com/photo-${photoId}?w=800&q=80`;
}

export function CarCard({ car }: CarCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const imageSrc = getImageSrc(car.images[0] ?? '', car.id);

  return (
    <Link to={`/car/${car.id}`}
      className="group block bg-white rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-[4/3] bg-secondary overflow-hidden">
        <ImageWithFallback src={imageSrc} alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-3 left-3 flex gap-2">
          {car.isNew && (
            <span className="px-3 py-1 bg-accent text-accent-foreground rounded-full text-xs">Новый</span>
          )}
        </div>
        <button onClick={e => { e.preventDefault(); setIsFavorite(!isFavorite); }}
          className="absolute top-3 right-3 p-2 bg-white/90 rounded-full hover:bg-white transition-colors">
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-destructive text-destructive' : 'text-foreground'}`} />
        </button>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-foreground mb-1">{car.brand} {car.model}</h3>
        <p className="text-sm text-muted-foreground mb-3">{car.year} год • {formatMileage(car.mileage)}</p>
        <div className="flex flex-wrap gap-2 mb-3 text-xs text-muted-foreground">
          {car.engineVolume > 0 && <span>{car.engineVolume}л</span>}
          {car.engineVolume > 0 && <span>•</span>}
          <span>{TRANSMISSION_LABELS[car.transmission]}</span>
          <span>•</span>
          <span>{FUEL_LABELS[car.fuel]}</span>
          {car.power > 0 && <><span>•</span><span>{car.power} л.с.</span></>}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-2xl font-semibold text-foreground">{formatPrice(car.price)}</p>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-5 h-5 text-primary" />
          </div>
        </div>
      </div>
    </Link>
  );
}