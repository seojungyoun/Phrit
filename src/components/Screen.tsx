import { PropsWithChildren } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useThemeColors } from '@/src/theme/useThemeColors';

export function Screen({ children }: PropsWithChildren) {
  const colors = useThemeColors();
  return <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({ container: { flex: 1, paddingHorizontal: 20 } });
