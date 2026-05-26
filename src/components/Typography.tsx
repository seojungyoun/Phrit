import { Text, TextProps } from 'react-native';
import { useThemeColors } from '@/src/theme/useThemeColors';

export function Heading(props: TextProps) {
  const colors = useThemeColors();
  return <Text {...props} style={[{ color: colors.text, fontSize: 34, fontWeight: '300' }, props.style]} />;
}
export function Body(props: TextProps) {
  const colors = useThemeColors();
  return <Text {...props} style={[{ color: colors.text, fontSize: 15, fontWeight: '400' }, props.style]} />;
}
