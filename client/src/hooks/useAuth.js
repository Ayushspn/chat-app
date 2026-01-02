import { useEffect, useState } from 'react';
import parseJwt from '../utils/parseJwt';

let authState = { isLoggedIn: false, user: null };
const subscribers = new Set();

function notify() {
  subscribers.forEach((cb) => cb(authState));
}

function setAuth(next) {
  authState = { ...authState, ...next };
  notify();
}

// initialize from localStorage
const _initToken = (() => {
  try {
    const t = localStorage.getItem('token');
    if (t) {
      authState = { isLoggedIn: true, user: parseJwt(t) };
    }
  } catch (e) {
    // ignore
  }
})();

export function login(token) {
  localStorage.setItem('token', token);
  setAuth({ isLoggedIn: true, user: parseJwt(token) });
}

export function logout() {
  localStorage.removeItem('token');
  setAuth({ isLoggedIn: false, user: null });
}

export default function useAuth() {
  const [state, setState] = useState(authState);

  useEffect(() => {
    const cb = (s) => setState(s);
    subscribers.add(cb);
    // sync immediately
    setState(authState);
    return () => subscribers.delete(cb);
  }, []);

  return { ...state, login, logout };
}
