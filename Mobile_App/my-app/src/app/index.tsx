import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import * as Location from 'expo-location';
import mqtt, { MqttClient } from 'mqtt';

// CONFIGURATION
const MQTT_BROKER_URL = 'ws://10.0.2.2:9001'; 
const TOPIC_NAME = 'v1/vehicles/location';
const INTERVAL_MS = 30000; 

// Define an interface for our location payload type safety
interface LocationPayload {
  vehicleId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

export default function HomeScreen() {
  const [statusMessage, setStatusMessage] = useState<string>('Initializing...');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [lastLocation, setLastLocation] = useState<LocationPayload | null>(null);
  
  const mqttClientRef = useRef<MqttClient | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initialize MQTT Connection
  useEffect(() => {
    setStatusMessage('Connecting to Mosquitto Broker...');
    
    const client = mqtt.connect(MQTT_BROKER_URL, {
      clientId: `android_tracker_${Math.random().toString(16).substring(2, 10)}`,
      clean: true,
      connectTimeout: 4000,
    });

    client.on('connect', () => {
      setIsConnected(true);
      setStatusMessage('Connected to MQTT Broker successfully.');
    });

    client.on('error', (err) => {
      console.error('MQTT Error: ', err);
      setStatusMessage(`Connection Error: ${err.message}`);
    });

    client.on('close', () => {
      setIsConnected(false);
      setStatusMessage('Disconnected from broker.');
    });

    mqttClientRef.current = client;

    return () => {
      if (client) client.end();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // 2. Core function to fetch location and publish
  const fetchAndPublishLocation = async () => {
    if (!mqttClientRef.current || !mqttClientRef.current.connected) {
      console.log('Cannot send data: MQTT client not connected.');
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const payload: LocationPayload = {
        vehicleId: "VEHICLE_001",
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date(location.timestamp).toISOString(),
      };

      setLastLocation(payload);

      mqttClientRef.current.publish(TOPIC_NAME, JSON.stringify(payload), { qos: 1 }, (error) => {
        if (error) {
          console.error('Publish failed:', error);
        } else {
          console.log('Location published successfully:', payload);
        }
      });

    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // 3. Start / Stop Tracking Logic
  const toggleTracking = async () => {
    if (isTracking) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsTracking(false);
      setStatusMessage('Tracking stopped.');
    } else {
      setStatusMessage('Requesting location permissions...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setStatusMessage('Permission to access location was denied.');
        return;
      }

      setStatusMessage('Tracking active. Sending updates every 30 seconds.');
      setIsTracking(true);

      fetchAndPublishLocation();
      intervalRef.current = setInterval(fetchAndPublishLocation, INTERVAL_MS);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehicle Tracker Base</Text>
      
      <View style={styles.statusCard}>
        <Text style={styles.statusText}>Broker Status: {isConnected ? '🟢 Online' : '🔴 Offline'}</Text>
        <Text style={styles.infoText}>{statusMessage}</Text>
      </View>

      {lastLocation && (
        <View style={styles.dataCard}>
          <Text style={styles.cardTitle}>Last Sent Payload:</Text>
          <Text style={styles.codeText}>Lat: {lastLocation.latitude}</Text>
          <Text style={styles.codeText}>Lng: {lastLocation.longitude}</Text>
          <Text style={styles.codeText}>Time: {lastLocation.timestamp}</Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Button 
          title={isTracking ? "Stop Tracking" : "Start Tracking"} 
          onPress={toggleTracking} 
          disabled={!isConnected}
          color={isTracking ? "#d9534f" : "#5cb85c"}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  statusCard: {
    width: '100%',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  dataCard: {
    width: '100%',
    padding: 15,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    marginBottom: 20,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  codeText: {
    color: '#a9ffaf',
    fontFamily: 'monospace',
    fontSize: 13,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
});