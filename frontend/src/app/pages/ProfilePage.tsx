import { useState } from 'react';
import { User, Heart, Eye, FileText, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router';
import { api } from '../api/client';

type TabType = 'profile' | 'viewings';

export function ProfilePage() {
  const { user, login, register, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Форма входа/регистрации
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Форма профиля
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (isRegister) {
        await register(email, password, fullName);
        toast.success('Регистрация прошла успешно!');
      } else {
        await login(email, password);
        toast.success('Добро пожаловать!');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка';
      toast.error(message === 'Incorrect email or password' ? 'Неверный email или пароль' : message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Вы вышли из системы');
    navigate('/');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch('/user/profile', {
        full_name: editName || undefined,
        phone: editPhone || undefined,
      });
      toast.success('Изменения сохранены!');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-semibold mb-2 text-center">
            {isRegister ? 'Регистрация' : 'Войти в аккаунт'}
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            {isRegister ? 'Создайте аккаунт для записи на просмотр' : 'Войдите чтобы управлять записями'}
          </p>

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegister && (
              <input type="text" placeholder="Ваше имя" required value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary" />
            )}
            <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary" />
            <input type="password" placeholder="Пароль" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary" />
            <button type="submit" disabled={authLoading}
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {authLoading ? 'Загрузка...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={() => setIsRegister(!isRegister)} className="text-primary hover:underline text-sm">
              {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile' as TabType, label: 'Профиль', icon: User },
    { id: 'viewings' as TabType, label: 'Мои записи', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-semibold mb-8">Личный кабинет</h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-border p-4 space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary text-foreground'
                    }`}>
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors">
                <LogOut className="w-5 h-5" />
                <span>Выйти</span>
              </button>
            </div>
          </aside>

          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl">
                    {user.full_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">{user.full_name}</h2>
                    <p className="text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">Роль: {user.role}</p>
                  </div>
                </div>

                <form className="space-y-4" onSubmit={handleSaveProfile}>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Имя</label>
                    <input type="text" placeholder={user.full_name}
                      value={editName} onChange={e => setEditName(e.target.value)}
                      className="w-full px-4 py-3 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Телефон</label>
                    <input type="tel" placeholder={user.phone ?? '+7 (___) ___-__-__'}
                      value={editPhone} onChange={e => setEditPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-secondary rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <button type="submit" disabled={saving}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                    {saving ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'viewings' && (
              <ViewingsList />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewingsList() {
  const [viewings, setViewings] = useState<Array<{
    id: string; viewing_date: string; viewing_time: string | null;
    result: string; car_id: string; comment: string | null;
  }>>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<{ data: typeof viewings; count: number }>('/user/viewings');
      setViewings(data.data);
    } catch {
      // нет записей или не авторизован
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  if (!loaded && !loading) { load(); }

  const RESULT_LABELS: Record<string, string> = {
    scheduled: 'Запланирован', confirmed: 'Подтверждён', completed: 'Завершён',
    cancelled_user: 'Отменён', cancelled_manager: 'Отменён менеджером', no_show: 'Не явился',
  };

  const handleCancel = async (id: string) => {
    try {
      await api.patch(`/user/viewings/${id}/cancel`, {});
      toast.success('Запись отменена');
      load();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ошибка';
      toast.error(message);
    }
  };

  if (loading) return <div className="bg-white rounded-lg p-12 text-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>;

  if (viewings.length === 0) {
    return (
      <div className="bg-white rounded-lg p-12 text-center">
        <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Нет записей на просмотр</h3>
        <p className="text-muted-foreground mb-4">Перейдите в каталог и запишитесь на просмотр понравившегося авто</p>
        <Link to="/catalog" className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold mb-6">Мои записи на просмотр</h2>
      {viewings.map(v => (
        <div key={v.id} className="bg-white rounded-lg p-6 border border-border">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="font-semibold">Просмотр авто</p>
              <p className="text-sm text-muted-foreground">
                {new Date(v.viewing_date).toLocaleDateString('ru-RU')}
                {v.viewing_time ? ` в ${v.viewing_time}` : ''}
              </p>
              {v.comment && <p className="text-sm text-muted-foreground mt-1">{v.comment}</p>}
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              v.result === 'scheduled' || v.result === 'confirmed' ? 'bg-accent text-accent-foreground' :
              v.result === 'completed' ? 'bg-muted text-muted-foreground' : 'bg-secondary text-muted-foreground'
            }`}>
              {RESULT_LABELS[v.result] ?? v.result}
            </span>
          </div>
          {(v.result === 'scheduled' || v.result === 'confirmed') && (
            <button onClick={() => handleCancel(v.id)}
              className="mt-3 px-4 py-2 text-sm text-destructive border border-destructive rounded-lg hover:bg-destructive/10 transition-colors">
              Отменить запись
            </button>
          )}
        </div>
      ))}
    </div>
  );
}