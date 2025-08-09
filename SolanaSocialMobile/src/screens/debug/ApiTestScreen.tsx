import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {API_CONFIG} from '../../config/api';

export default function ApiTestScreen() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}: ${result}`,
    ]);
  };

  const testApiConnection = async () => {
    setTesting(true);
    setTestResults([]);

    addResult(`Testing API connection to: ${API_CONFIG.BASE_URL}`);

    try {
      // Test basic connectivity
      const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      addResult(
        `Health check response: ${response.status} ${response.statusText}`,

      if (response.ok) {
        const data = await response.text();
        addResult(`Health check data: ${data}`);
      }
    } catch (error) {
      addResult(`Health check failed: ${error}`);
    }

    // Test auth status endpoint
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/auth/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      addResult(
        `Auth status response: ${response.status} ${response.statusText}`,

      if (response.status === 401) {
        addResult(
          '✅ Auth endpoint responding correctly (401 expected for unauthenticated)',
        );
      } else {
        const data = await response.text();
        addResult(`Auth status data: ${data}`);
      }
    } catch (error) {
      addResult(`Auth status failed: ${error}`);
    }

    setTesting(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>API Connection Test</Text>
        <Text style={styles.subtitle}>Base URL: {API_CONFIG.BASE_URL}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, testing && styles.buttonDisabled]}
          onPress={testApiConnection}
          disabled={testing}>
          <Text style={styles.buttonText}>
            {testing ? 'Testing...' : 'Test API Connection'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}>
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.results}>
        {Array.isArray(testResults) && testResults.map((result, index) => (
          <Text key={index} style={styles.resultText}>
            {result}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  clearButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
  },
  results: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
  },
  resultText: {
    color: '#d1d5db',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
