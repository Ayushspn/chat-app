import { useEffect, useState } from 'react';
import parseJwt from '../utils/parseJwt';

let authState = { isLoggedIn: false, user: null };
const subscribers = new Set();

function publish(next) {
  authState = { ...authState, ...next };
  subscribers.forEach((cb) => cb(authState));
}

// initialize from localStorage
try {
  const token = localStorage.getItem('token');
  if (token) authState = { isLoggedIn: true, user: parseJwt(token) };
} catch (e) {
  // ignore
}

export function login(token) {
  try { localStorage.setItem('token', token); } catch (e) {}
  publish({ isLoggedIn: true, user: parseJwt(token) });
}

export function logout() {
  try { localStorage.removeItem('token'); } catch (e) {}
  publish({ isLoggedIn: false, user: null });
}

export default function useAuth() {
  const [state, setState] = useState(authState);

  useEffect(() => {
    const cb = (s) => setState(s);
    subscribers.add(cb);
    setState(authState);
    return () => subscribers.delete(cb);
  }, []);

  return { ...state, login, logout };
}
