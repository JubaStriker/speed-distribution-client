import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { authApi, getToken, saveToken, clearToken } from '../api';

// ─── State ────────────────────────────────────────────────────────────────────

interface AppState {
  user: User | null;
  isInitializing: boolean; // true while restoring session from localStorage token
  restockCount: number;    // low-stock item count for sidebar badge
}

const initialState: AppState = {
  user: null,
  isInitializing: true,
  restockCount: 0,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'INIT_DONE' }
  | { type: 'SET_RESTOCK_COUNT'; payload: number };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload, isInitializing: false };
    case 'LOGOUT':
      return { ...state, user: null, isInitializing: false, restockCount: 0 };
    case 'INIT_DONE':
      return { ...state, isInitializing: false };
    case 'SET_RESTOCK_COUNT':
      return { ...state, restockCount: action.payload };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Restore session from localStorage token on mount
  useEffect(() => {
    const token = getToken();
    if (!token) {
      dispatch({ type: 'INIT_DONE' });
      return;
    }
    authApi.me()
      .then(user => dispatch({ type: 'LOGIN', payload: user }))
      .catch(() => {
        clearToken();
        dispatch({ type: 'INIT_DONE' });
      });
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const { token, user } = await authApi.login(email, password);
    saveToken(token);
    dispatch({ type: 'LOGIN', payload: user });
  }

  async function signup(firstName: string, lastName: string, email: string, password: string): Promise<void> {
    const { token, user } = await authApi.signup(firstName, lastName, email, password);
    if (token) saveToken(token);
    dispatch({ type: 'LOGIN', payload: user });
  }

  function logout(): void {
    clearToken();
    dispatch({ type: 'LOGOUT' });
  }

  return (
    <AppContext.Provider value={{ state, dispatch, login, signup, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
