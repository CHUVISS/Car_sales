import { useState } from 'react';
import { User, Heart, Eye, Settings, Clock, FileText, LogOut } from 'lucide-react';
import { getCars } from '../data/mockData';
import { CarCard } from '../components/CarCard';
import { toast } from 'sonner';

type TabType = 'profile' | 'favorites' | 'history' | 'leads';

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const favoriteCars = getCars().slice(0, 3);
  const historyCards = getCars().slice(3, 6);

  const tabs = [
    { id: 'profile' as TabType, label: 'Профиль', icon: User },
    { id: 'favorites' as TabType, label: 'Избранное', icon: Heart },
    { id: 'history' as TabType, label: 'История просмотров', icon: Eye },
    { id: 'leads' as TabType, label: 'Мои заявки', icon: FileText },
  ];

  const mockLeads = [
    { id: '1', carName: 'Toyota Camry', date: '2026-03-29', status: 'Новая' },
    { id: '2', carName: 'BMW X5', date: '2026-03-28', status: 'В обработке' },
    { id: '3', carName: 'Mercedes-Benz E-Class', date: '2026-03-27', status: 'Завершена' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-semibold mb-8">Личный кабинет</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Боковое меню */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-border p-4 space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-secondary text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                <LogOut className="w-5 h-5" />
                <span>Выйти</span>
              </button>
            </div>
          </aside>

          {/* Основной контент */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl">
                    ИП
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">Иван Петров</h2>
                    <p className="text-muted-foreground">ivan.petrov@example.com</p>
                  </div>
                </div>

                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Имя</label>
                    <input
                      type="text"
                      defaultValue="Иван"
                      className="w-full px-4 py-3 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Фамилия</label>
                    <input
                      type="text"
                      defaultValue="Петров"
                      className="w-full px-4 py-3 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue="ivan.petrov@example.com"
                      className="w-full px-4 py-3 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Телефон</label>
                    <input
                      type="tel"
                      defaultValue="+7 (900) 123-45-67"
                      className="w-full px-4 py-3 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="submit"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.success('Изменения успешно сохранены!');
                    }}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Сохранить изменения
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Избранные автомобили</h2>
                {favoriteCars.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {favoriteCars.map(car => (
                      <CarCard key={car.id} car={car} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-12 text-center">
                    <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Нет избранных автомобилей</h3>
                    <p className="text-muted-foreground">
                      Добавляйте понравившиеся автомобили в избранное
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">История просмотров</h2>
                {historyCards.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {historyCards.map(car => (
                      <CarCard key={car.id} car={car} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-12 text-center">
                    <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">История пуста</h3>
                    <p className="text-muted-foreground">
                      Здесь будут отображаться просмотренные автомобили
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'leads' && (
              <div>
                <h2 className="text-2xl font-semibold mb-6">Мои заявки</h2>
                <div className="space-y-4">
                  {mockLeads.map(lead => (
                    <div key={lead.id} className="bg-white rounded-lg p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">{lead.carName}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          lead.status === 'Новая' ? 'bg-accent text-accent-foreground' :
                          lead.status === 'В обработке' ? 'bg-primary/10 text-primary' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {lead.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(lead.date).toLocaleDateString('ru-RU')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}