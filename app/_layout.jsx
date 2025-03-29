import { Slot } from 'expo-router';
import { SessionProvider } from '../utils/ctx'; 

export default function Root() {
  return (
    <SessionProvider>
      <Slot />
    </SessionProvider>
  );
}