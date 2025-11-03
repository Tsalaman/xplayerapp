import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../constants/theme';
import { Sport } from '../../types';
import { postService } from '../../services/api';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

const SPORTS: Sport[] = ['football', 'basketball', 'tennis', 'padel'];

export default function CreatePostScreen() {
  const [type, setType] = useState<'teammate' | 'opponent'>('teammate');
  const [sport, setSport] = useState<Sport | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!sport) {
      Alert.alert('Error', 'Please select a sport');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }
    if (!user) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    try {
      const newPost = await postService.createPost({
        userId: user.id,
        userNickname: user.nickname || 'Anonymous',
        type,
        sport: sport as Sport,
        title,
        description,
        location: location || undefined,
        date: date || undefined,
        time: time || undefined,
        createdAt: new Date().toISOString(),
        status: 'open' as const,
      });

      Alert.alert('Success', 'Post created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Error creating post:', error);
      Alert.alert('Error', error.message || 'Failed to create post');
    }
  };

  const getSportColor = (s: Sport) => {
    return theme.sports[s];
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Location permission is required to get your current location.'
        );
        setLocationLoading(false);
        return;
      }

      // Get current location
      const locationData = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocoding to get address
      const { latitude, longitude } = locationData.coords;
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        // Format address: street, city, country
        const addressParts = [];
        if (address.street) addressParts.push(address.street);
        if (address.city) addressParts.push(address.city);
        if (address.region) addressParts.push(address.region);
        if (address.country) addressParts.push(address.country);
        
        const formattedAddress = addressParts.length > 0
          ? addressParts.join(', ')
          : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        
        setLocation(formattedAddress);
      } else {
        // Fallback to coordinates if no address found
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch (error: any) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        error.message || 'Failed to get your location. Please try again.'
      );
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Create Post</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.label}>Looking for</Text>
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'teammate' && styles.typeButtonSelected,
                type === 'teammate' && { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => setType('teammate')}
            >
              <Ionicons
                name="people"
                size={24}
                color={type === 'teammate' ? theme.colors.surface : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.typeText,
                  type === 'teammate' && { color: theme.colors.surface },
                ]}
              >
                Teammates
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                type === 'opponent' && styles.typeButtonSelected,
                type === 'opponent' && { backgroundColor: theme.colors.secondary },
              ]}
              onPress={() => setType('opponent')}
            >
              <Ionicons
                name="flash"
                size={24}
                color={type === 'opponent' ? theme.colors.surface : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.typeText,
                  type === 'opponent' && { color: theme.colors.surface },
                ]}
              >
                Opponents
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Sport *</Text>
          <View style={styles.sportsContainer}>
            {SPORTS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.sportButton,
                  sport === s && { backgroundColor: getSportColor(s) },
                  sport === s && styles.sportButtonSelected,
                ]}
                onPress={() => setSport(s)}
              >
                <Text
                  style={[
                    styles.sportText,
                    sport === s && { color: theme.colors.surface },
                  ]}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Need 2 players for pickup game"
            placeholderTextColor={theme.colors.textSecondary}
            value={title}
            onChangeText={setTitle}
            maxLength={100}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell us more about what you're looking for..."
            placeholderTextColor={theme.colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            maxLength={500}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <View style={styles.locationContainer}>
            <TextInput
              style={[styles.input, styles.locationInput]}
              placeholder="e.g., Central Park, NYC"
              placeholderTextColor={theme.colors.textSecondary}
              value={location}
              onChangeText={setLocation}
            />
            <TouchableOpacity
              style={[styles.locationButton, locationLoading && styles.locationButtonDisabled]}
              onPress={getCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color={theme.colors.surface} />
              ) : (
                <Ionicons name="location" size={20} color={theme.colors.surface} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2024-12-15"
            placeholderTextColor={theme.colors.textSecondary}
            value={date}
            onChangeText={setDate}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Time</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 18:00"
            placeholderTextColor={theme.colors.textSecondary}
            value={time}
            onChangeText={setTime}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Create Post</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    marginRight: theme.spacing.md,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.primary,
  },
  form: {
    width: '100%',
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  typeButton: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
  },
  typeButtonSelected: {
    borderWidth: 3,
  },
  typeText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    fontWeight: '600',
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  sportButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  sportButtonSelected: {
    borderWidth: 3,
  },
  sportText: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.text,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  submitButtonText: {
    ...theme.typography.h3,
    color: theme.colors.surface,
  },
  locationContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
  },
  locationButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationButtonDisabled: {
    opacity: 0.6,
  },
});

