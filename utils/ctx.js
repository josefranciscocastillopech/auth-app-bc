import { useContext, createContext } from 'react';
import { useStorageState } from './useStorageState';

const AuthContext = createContext({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

const USER_CREDENTIALS = {
  email: 'usuario@ejemplo.com',
  password: 'password1234',
};

export function useSession() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useSession debe estar dentro de un <SessionProvider />');
  }
  return value;
}

export function SessionProvider({ children }) {
  const [[isLoading, session], setSession] = useStorageState('session');

  const signIn = (email, password) => {
    if (email === USER_CREDENTIALS.email && password === USER_CREDENTIALS.password) {
      setSession({ email });
      return true; 
    }
    return false; 
  };

  const signOut = () => {
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ signIn, signOut, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}