import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Spacing, BorderRadius } from '@/constants/typography';

interface ListSectionProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
}

export function ListSection({ title, footer, children }: ListSectionProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {title && (
        <Text style={[styles.title, { color: theme.textSecondary }]}>
          {title}
        </Text>
      )}
      <View
        style={[
          styles.content,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          },
        ]}
      >
        {React.Children.map(children, (child, index) => (
          <>
            {child}
            {index < React.Children.count(children) - 1 && (
              <View
                style={[styles.separator, { backgroundColor: theme.separator }]}
              />
            )}
          </>
        ))}
      </View>
      {footer && (
        <Text style={[styles.footer, { color: theme.textSecondary }]}>
          {footer}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '400',
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.lg,
  },
  content: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 54,
  },
  footer: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.sm,
    marginLeft: Spacing.lg,
    marginRight: Spacing.lg,
    lineHeight: Typography.lineHeight.sm,
  },
});
