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
import { ServerErrorPage } from './pages/ServerErrorPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    // Catches unhandled errors thrown during rendering or data loading
    errorElement: <ServerErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'catalog', element: <CatalogPage /> },
      { path: 'car/:id', element: <CarDetailPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'admin', element: <AdminPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'ai', element: <AiPage /> },
      { path: 'sell', element: <CreateListingPage /> },
      { path: 'listing/:id/edit', element: <CreateListingPage /> },
      // Explicit 500-level error routes for programmatic navigation
      { path: '500', element: <ServerErrorPage status={500} /> },
      { path: '502', element: <ServerErrorPage status={502} /> },
      { path: '503', element: <ServerErrorPage status={503} /> },
      { path: '504', element: <ServerErrorPage status={504} /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);