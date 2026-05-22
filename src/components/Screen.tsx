import { PropsWithChildren } from 'react';
import { ComponentProps } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useThemeColors } from '@/src/theme/useThemeColors';

type ScreenProps = PropsWithChildren<ComponentProps<typeof SafeAreaView>>;

export function Screen({ children, style, ...props }: ScreenProps) {
  const colors = useThemeColors();
  return (
    <SafeAreaView {...props} style={[styles.container, { backgroundColor: colors.background }, style]}>
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, paddingHorizontal: 20 } });
