import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

/**
 * A component that displays an indicator when the user is chatting with Gemini AI
 */
const GeminiIndicator = () => {
  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: 'https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini_1.width-1000.format-webp.webp' }} 
        style={styles.icon} 
      />
      <Text style={styles.text}>Gemini AI Assistant</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>AI</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4ff',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  icon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a73e8',
  },
  badge: {
    backgroundColor: '#1a73e8',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default GeminiIndicator;
