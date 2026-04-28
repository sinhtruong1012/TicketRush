import { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext(null);

const STORAGE_KEY = 'ticketrush_token';

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // [FIX 6.1] Pass JWT token in socket handshake auth
    // Backend verifies this before accepting the connection
    const token = sessionStorage.getItem(STORAGE_KEY);

    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      auth: token ? { token: `Bearer ${token}` } : {},
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      // TOKEN_REVOKED / TOKEN_INVALID → don't crash the app,
      // just log — user will be redirected by AuthContext on next API call
      if (err.message === 'TOKEN_REVOKED' || err.message === 'TOKEN_INVALID') {
        console.warn('⚠️ Socket auth failed:', err.message);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
