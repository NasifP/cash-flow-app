import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { hasSettings } from '../src/utils/storage';
import { useRouter, useSegments } from 'expo-router';

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if onboarding is needed
    const onboardingComplete = hasSettings();
    const inOnboardingGroup = segments[0] === 'onboarding';

    if (!onboardingComplete && !inOnboardingGroup) {
      // Redirect to onboarding if not done
      router.replace('/onboarding');
    }

    setIsReady(true);
  }, [segments]);

  if (!isReady) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
    </Stack>
  );
}
