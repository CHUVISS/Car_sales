import { createBrowserRouter } from 'react-router';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { CarDetailPage } from './pages/CarDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { AboutPage } from './pages/AboutPage';
import { AiPage } from './pages/AiPage';
import { CreateListingPage } from './pages/CreateListingPage';
import { Layout } from './components/Layout';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'catalog', element: <CatalogPage /> },
      { path: 'car/:id', element: <CarDetailPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'ai', element: <AiPage /> },
      { path: 'sell', element: <CreateListingPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);