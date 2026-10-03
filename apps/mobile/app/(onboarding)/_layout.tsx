import { Stack } from 'expo-router';
import tokens from '@/theme/tokens.json';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: tokens.colors.dawn },
      }}
    />
  );
}
