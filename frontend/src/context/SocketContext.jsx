import { createContext, useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const { token } = useContext(AuthContext); // Re-run when token changes

  useEffect(() => {
    // Backend verifies this before accepting the connection
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      auth: token ? { token: `Bearer ${token}` } : {},
    });

    newSocket.on('connect', () => {
      console.log('🔌 Socket connected:', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      // TOKEN_REVOKED / TOKEN_INVALID
      if (err.message === 'TOKEN_REVOKED' || err.message === 'TOKEN_INVALID') {
        console.warn('⚠️ Socket auth failed:', err.message);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]); // Re-connect if token changes

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
