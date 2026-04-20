import { useState } from 'react';
import { Plus, Edit, Trash2, Car, Users, FileText, BarChart3 } from 'lucide-react';
import { getCars, formatPrice, formatMileage } from '../data/mockData';
import { toast } from 'sonner';

type TabType = 'cars' | 'leads' | 'users' | 'stats';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('cars');
  const cars = getCars();
  const [showAddCarModal, setShowAddCarModal] = useState(false);

  const tabs = [
    { id: 'cars' as TabType, label: 'Автомобили', icon: Car },
    { id: 'leads' as TabType, label: 'Заявки', icon: FileText },
    { id: 'users' as TabType, label: 'Пользователи', icon: Users },
    { id: 'stats' as TabType, label: 'Статистика', icon: BarChart3 },
  ];

  const mockLeads = [
    { id: '1', name: 'Иван Иванов', phone: '+7 (900) 123-45-67', car: 'Toyota Camry', status: 'Новая', date: '2026-03-30' },
    { id: '2', name: 'Петр Петров', phone: '+7 (901) 234-56-78', car: 'BMW X5', status: 'В обработке', date: '2026-03-29' },
    { id: '3', name: 'Мария Сидорова', phone: '+7 (902) 345-67-89', car: 'Mercedes-Benz E-Class', status: 'Завершена', date: '2026-03-28' },
  ];

  const mockUsers = [
    { id: '1', name: 'Иван Петров', email: 'ivan@example.com', role: 'Клиент', registered: '2026-03-15' },
    { id: '2', name: 'Алексей Иванов', email: 'alexey@example.com', role: 'Менеджер', registered: '2026-01-10' },
    { id: '3', name: 'Ольга Смирнова', email: 'olga@example.com', role: 'Клиент', registered: '2026-03-20' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold">Панель управления</h1>
        </div>

        {/* Вкладки */}
        <div className="flex gap-2 mb-6 border-b border-border overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Контент */}
        {activeTab === 'cars' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Управление автомобилями</h2>
              <button
                onClick={() => setShowAddCarModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus className="w-5 h-5" />
                <span>Добавить автомобиль</span>
              </button>
            </div>

            <div className="bg-white rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Марка/Модель</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Год</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Цена</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Пробег</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Статус</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {cars.slice(0, 10).map(car => (
                      <tr key={car.id} className="hover:bg-secondary/50">
                        <td className="px-6 py-4 text-sm">{car.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold">{car.brand} {car.model}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">{car.year}</td>
                        <td className="px-6 py-4 text-sm">{formatPrice(car.price)}</td>
                        <td className="px-6 py-4 text-sm">{formatMileage(car.mileage)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            car.isNew ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            {car.isNew ? 'Новый' : 'С пробегом'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                              <Edit className="w-4 h-4 text-primary" />
                            </button>
                            <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leads' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Заявки от клиентов</h2>
            <div className="bg-white rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Клиент</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Телефон</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Автомобиль</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Дата</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Статус</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mockLeads.map(lead => (
                      <tr key={lead.id} className="hover:bg-secondary/50">
                        <td className="px-6 py-4 text-sm">{lead.id}</td>
                        <td className="px-6 py-4 font-semibold">{lead.name}</td>
                        <td className="px-6 py-4 text-sm">{lead.phone}</td>
                        <td className="px-6 py-4 text-sm">{lead.car}</td>
                        <td className="px-6 py-4 text-sm">{new Date(lead.date).toLocaleDateString('ru-RU')}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            lead.status === 'Новая' ? 'bg-accent text-accent-foreground' :
                            lead.status === 'В обработке' ? 'bg-primary/10 text-primary' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:opacity-90">
                            Обработать
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Управление пользователями</h2>
            <div className="bg-white rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold">ID</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Имя</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Роль</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Дата регистрации</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {mockUsers.map(user => (
                      <tr key={user.id} className="hover:bg-secondary/50">
                        <td className="px-6 py-4 text-sm">{user.id}</td>
                        <td className="px-6 py-4 font-semibold">{user.name}</td>
                        <td className="px-6 py-4 text-sm">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.role === 'Менеджер' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">{new Date(user.registered).toLocaleDateString('ru-RU')}</td>
                        <td className="px-6 py-4">
                          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
                            <Edit className="w-4 h-4 text-primary" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Статистика</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-muted-foreground">Всего автомобилей</h3>
                  <Car className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-semibold">{cars.length}</p>
                <p className="text-sm text-accent mt-1">+2 за эту неделю</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-muted-foreground">Активные заявки</h3>
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-semibold">15</p>
                <p className="text-sm text-accent mt-1">+5 за сегодня</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-muted-foreground">Пользователей</h3>
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-semibold">142</p>
                <p className="text-sm text-accent mt-1">+8 за месяц</p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm text-muted-foreground">Продано авто</h3>
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-semibold">28</p>
                <p className="text-sm text-accent mt-1">+3 за неделю</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 border border-border">
              <h3 className="text-lg font-semibold mb-4">Популярные марки</h3>
              <div className="space-y-3">
                {['Toyota', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen'].map((brand, index) => (
                  <div key={brand}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{brand}</span>
                      <span className="text-sm text-muted-foreground">{45 - index * 5}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${45 - index * 5}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно добавления автомобиля */}
      {showAddCarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddCarModal(false)} />
          <div className="relative bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-6">Добавить автомобиль</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Марка</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Модель</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Год</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Цена</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCarModal(false)}
                  className="flex-1 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault();
                    toast.success('Автомобиль успешно добавлен!');
                    setShowAddCarModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}