import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../services/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  relatedServiceId: string | null;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const tokens = localStorage.getItem('auth_tokens');
    const user = localStorage.getItem('user');
    if (!tokens || !user) return;

    const { accessToken } = JSON.parse(tokens);
    const { id, role } = JSON.parse(user);

    const socket = io('/', {
      path: '/api/v1/ws',
      auth: { token: accessToken },
      query: { userId: id, role },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[WS] Connected');
    });

    socket.on('notification', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    socket.on('disconnect', () => {
      console.log('[WS] Disconnected');
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    api.notifications.unreadCount()
      .then((res) => setUnreadCount(res.count ?? res ?? 0))
      .catch(() => {});

    api.notifications.list(1, 50)
      .then((res) => setNotifications(res.data ?? res ?? []))
      .catch(() => {});
  }, []);

  const togglePanel = useCallback(() => setIsOpen((o) => !o), []);
  const closePanel = useCallback(() => setIsOpen(false), []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  }, []);

  return {
    notifications,
    unreadCount,
    isOpen,
    togglePanel,
    closePanel,
    markAsRead,
    markAllAsRead,
  };
}
