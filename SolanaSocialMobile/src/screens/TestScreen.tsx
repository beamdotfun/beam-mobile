import React from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {useThemeStore} from '../store/themeStore';

export default function TestScreen() {
  const {colors} = useThemeStore();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 24,
    },
    title: {
      fontSize: 30,
      fontWeight: 'bold',
      color: colors.foreground,
      marginBottom: 24,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.foreground,
      marginBottom: 8,
    },
    cardText: {
      fontSize: 14,
      color: colors.mutedForeground,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    buttonText: {
      color: colors.primaryForeground,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
    successCard: {
      backgroundColor: colors.success + '20',
      borderWidth: 1,
      borderColor: colors.success,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    successText: {
      color: colors.success,
      fontWeight: '500',
    },
    errorCard: {
      backgroundColor: colors.destructive + '20',
      borderWidth: 1,
      borderColor: colors.destructive,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    errorText: {
      color: colors.destructive,
      fontWeight: '500',
    },
    flexRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.secondary,
      padding: 16,
      borderRadius: 12,
    },
    flexText: {
      color: colors.secondaryForeground,
      fontWeight: '500',
    },
    circle: {
      width: 16,
      height: 16,
      backgroundColor: colors.accent,
      borderRadius: 8,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Beautiful Beam App</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Card Component</Text>
        <Text style={styles.cardText}>
          This is a card with shadow and rounded corners using the app's theme
          system
        </Text>
      </View>

      <View style={styles.button}>
        <Text style={styles.buttonText}>Primary Button</Text>
      </View>

      <View style={styles.successCard}>
        <Text style={styles.successText}>Success Message Style</Text>
      </View>

      <View style={styles.errorCard}>
        <Text style={styles.errorText}>Error Message Style</Text>
      </View>

      <View style={styles.flexRow}>
        <Text style={styles.flexText}>Flex Row Layout</Text>
        <View style={styles.circle} />
      </View>
    </ScrollView>
  );
}
