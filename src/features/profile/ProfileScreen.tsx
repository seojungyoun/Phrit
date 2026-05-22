import { Pressable } from 'react-native';
import { Screen } from '@/src/components/Screen';
import { Body, Heading } from '@/src/components/Typography';
import { supabase } from '@/src/lib/supabase';

export function ProfileScreen() {
  return (
    <Screen>
      <Heading>Profile</Heading>
      <Body>Your PHRIT history, saved moments, and reactions.</Body>
      <Pressable onPress={() => supabase.auth.signOut()}><Body>Logout</Body></Pressable>
    </Screen>
  );
}
