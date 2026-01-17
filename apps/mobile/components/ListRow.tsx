import React from 'react';
import { View, Text, Pressable, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing } from '@/constants/typography';

interface ListRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  destructive?: boolean;
  // Switch mode
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
}

export function ListRow({
  icon,
  iconColor,
  title,
  subtitle,
  value,
  onPress,
  showChevron = true,
  destructive = false,
  switchValue,
  onSwitchChange,
}: ListRowProps) {
  const { theme } = useTheme();
  const isSwitch = switchValue !== undefined;
  const titleColor = destructive ? theme.danger : theme.text;

  const content = (
    <View style={styles.container}>
      {icon && (
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: iconColor || theme.primary },
          ]}
        >
          <Ionicons name={icon} size={18} color="#FFFFFF" />
        </View>
      )}
      <View style={styles.content}>
        <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {value && (
        <Text style={[styles.value, { color: theme.textSecondary }]}>
          {value}
        </Text>
      )}
      {isSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: theme.separator, true: theme.primary }}
          thumbColor="#FFFFFF"
        />
      )}
      {!isSwitch && showChevron && onPress && (
        <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
      )}
    </View>
  );

  if (onPress && !isSwitch) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && { backgroundColor: theme.surfaceSecondary },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.pressable}>{content}</View>;
}

const styles = StyleSheet.create({
  pressable: {
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 44,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.base,
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  value: {
    fontSize: Typography.fontSize.base,
    marginRight: Spacing.sm,
  },
});
