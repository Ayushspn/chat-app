import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../config';

let sharedSocket = null;

function createSocket() {
  if (sharedSocket) return sharedSocket;
  sharedSocket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 500,
    reconnectionDelayMax: 5000,
  });

  sharedSocket.on('connect_error', (err) => {
    // keep minimal logging here; UI can subscribe to 'connect'/'disconnect'
    // console.warn('socket connect_error', err);
  });

  return sharedSocket;
}

export default function useSocket() {
  const socketRef = useRef(createSocket());
  const [connected, setConnected] = useState(socketRef.current.connected);

  useEffect(() => {
    const s = socketRef.current;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, []);

  const on = (event, cb) => socketRef.current.on(event, cb);
  const off = (event, cb) => socketRef.current.off(event, cb);
  const emit = (event, data) => socketRef.current.emit(event, data);

  const emitWithAck = (event, data, timeout = 5000) =>
    new Promise((resolve, reject) => {
      let settled = false;
      try {
        socketRef.current.emit(event, data, (response) => {
          if (settled) return;
          settled = true;
          resolve(response);
        });
      } catch (err) {
        if (!settled) {
          settled = true;
          reject(err);
        }
      }
      setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error('ack timeout'));
        }
      }, timeout);
    });

  const joinRoom = (roomId, userId) => emit('join_room', { roomId, userId });
  const leaveRoom = (roomId, userId) => emit('leave_room', { roomId, userId });

  return {
    socket: socketRef.current,
    connected,
    on,
    off,
    emit,
    emitWithAck,
    joinRoom,
    leaveRoom,
  };
}
