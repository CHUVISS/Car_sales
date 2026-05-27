import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { mockUser } from '../../test/mocks/fixtures';

// Mock useAuth
vi.mock('../../app/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../app/hooks/useAuth';
import { Header } from '../../app/components/Header';

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );
}

describe('Header — logged out', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('shows "Войти" button when not authenticated', () => {
    renderHeader();
    expect(screen.getAllByText('Войти').length).toBeGreaterThan(0);
  });

  it('does NOT show notification bell when logged out', () => {
    renderHeader();
    // Bell should not be rendered for unauthenticated users on desktop (hidden md:flex)
    // The mobile section also checks user && <NotificationBell />
    const bells = screen.queryAllByLabelText('Уведомления');
    expect(bells.length).toBe(0);
  });
});

describe('Header — logged in', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('shows user first name when authenticated', () => {
    renderHeader();
    // "Иван Иванов" → first word is "Иван"
    expect(screen.getByText('Иван')).toBeInTheDocument();
  });

  it('shows notification bell when authenticated', async () => {
    renderHeader();
    // Header renders two NotificationBell instances (desktop + mobile)
    await waitFor(() => {
      const bells = screen.getAllByLabelText('Уведомления');
      expect(bells.length).toBeGreaterThan(0);
    });
  });

  it('shows unread count badge on bell', async () => {
    renderHeader();
    // mockNotifications has 2 unread (notif-1 and notif-3 have read_at=null)
    await waitFor(() => {
      // Multiple "2" badges may appear (one per bell)
      const badges = screen.queryAllByText('2');
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  it('opens notification dropdown on bell click', async () => {
    renderHeader();
    // Wait for bells to appear with notifications loaded
    await waitFor(() => {
      const bells = screen.getAllByLabelText('Уведомления');
      expect(bells.length).toBeGreaterThan(0);
    });
    // Click the first bell
    const bells = screen.getAllByLabelText('Уведомления');
    fireEvent.click(bells[0]);
    await waitFor(() => {
      // The dropdown header says "Уведомления"
      expect(screen.getByText('Уведомления', { selector: 'span' })).toBeInTheDocument();
    });
  });

  it('shows "Прочитать все" button when there are unread notifications', async () => {
    renderHeader();
    await waitFor(() => {
      const bells = screen.getAllByLabelText('Уведомления');
      expect(bells.length).toBeGreaterThan(0);
    });
    const bells = screen.getAllByLabelText('Уведомления');
    fireEvent.click(bells[0]);
    await waitFor(() => {
      expect(screen.getByText('Прочитать все')).toBeInTheDocument();
    });
  });

  it('shows navigation element', () => {
    renderHeader();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('shows Admin link for admin role', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { ...mockUser, role: 'admin' },
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
    renderHeader();
    expect(screen.getByText('Админ')).toBeInTheDocument();
  });

  it('does NOT show Admin link for regular user', () => {
    renderHeader();
    expect(screen.queryByText('Админ')).not.toBeInTheDocument();
  });
});
