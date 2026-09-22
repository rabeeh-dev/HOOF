import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api$/, '')
      : 'http://localhost:8080';

    const socketInstance = io(backendUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketInstance.on('connect', () => {
      // If user is authenticated, join their room
      if (user?.id) {
        socketInstance.emit('join_user', user.id);
      }
      // If user is admin, join admin channel
      if (user?.role === 'admin') {
        socketInstance.emit('join_admin');
      }
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  // Update room subscriptions on user login/logout
  useEffect(() => {
    if (!socket || !socket.connected) return;

    if (user?.id) {
      socket.emit('join_user', user.id);
    }
    if (user?.role === 'admin') {
      socket.emit('join_admin');
    } else {
      socket.emit('leave_admin');
    }
  }, [user, socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
