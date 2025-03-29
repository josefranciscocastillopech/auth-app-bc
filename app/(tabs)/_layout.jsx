import { Text, View, ActivityIndicator } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useSession } from '../../utils/ctx';

export default function AppLayout() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Cargando...</Text>
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return <Stack />;
}