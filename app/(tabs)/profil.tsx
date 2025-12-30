// app/(tabs)/profil.tsx

import { apiFetch } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Stack, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type User = {
  nip: string;
  name: string;
  email: string;
  phone_number: string | null;
  avatar: string | null;
  role_id: number;
};

export default function ProfileScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
        setName(parsed.name || '');
        setEmail(parsed.email || '');
        setPhone(parsed.phone_number || '');
        setAvatarUri(parsed.avatar || null);
      }

      await fetchLatestProfile();
    } catch (error) {
      console.error('Gagal load user:', error);
      Alert.alert('Error', 'Gagal memuat data profil');
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestProfile = async () => {
    try {
      const response = await apiFetch('/user');
      if (response && response.data) {
        const updatedUser = response.data;
        setUser(updatedUser);
        setName(updatedUser.name || '');
        setEmail(updatedUser.email || '');
        setPhone(updatedUser.phone_number || '');
        setAvatarUri(updatedUser.avatar || null);

        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.warn('Gagal sync profil dari server:', error);
    }
  };

  const pickImage = async () => {
    // Minta izin akses galeri
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Izin Ditolak', 'Izinkan akses galeri untuk mengganti foto profil');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],  // ← Ini yang benar sekarang! Hilangkan warning
      allowsEditing: true,
      aspect: [1, 1],          // Crop persegi untuk avatar
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0].uri;  // Di versi baru, uri ada di assets[0]
      setAvatarUri(selectedImage);
      Alert.alert('Sukses', 'Foto profil berhasil diganti!');
    }
  };

  const handleSave = async () => {
  if (!name.trim() || !email.trim()) {
    Alert.alert('Error', 'Nama dan email wajib diisi');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Masukkan format email yang valid (contoh: nama@email.com)');
      return;
    }

    setSaving(true);
    try {
      const response = await apiFetch('/user/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(), // sudah ditrim
          phone_number: phone.trim() || null,
        }),
      });

      if (response && response.success) {
        const updatedUser = {
          ...user!,
          name: name.trim(),
          email: email.trim(),
          phone_number: phone.trim() || null,
        };
        setUser(updatedUser);
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        Alert.alert('Sukses', response.message || 'Profil berhasil diperbarui');
      } else {
        Alert.alert('Gagal', response?.message || 'Gagal menyimpan');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#386BF6" />
        <Text style={styles.loadingText}>Memuat profil...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* CUSTOM HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Profil</Text>
        </View>

        {/* KONTEN PROFIL */}
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Foto Profil */}
          {/* <View style={styles.profileSection}>
            <View style={styles.photoWrapper}>
              <Image
                source={{
                  uri: avatarUri || user?.avatar || 'https://via.placeholder.com/150?text=User',
                }}
                style={styles.profileImage}
              />
              <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View> */}
          <View style={styles.profileSection}>
            <View style={styles.photoWrapper}>
              {avatarUri || user?.avatar ? (
              <Image
                source={{
                  uri: avatarUri || user?.avatar || 'https://via.placeholder.com/150?text=User',
                }}
                style={styles.profileImage}
              />
              ) : (
                <View style={[styles.profileImage, styles.placeholderImage]}>
                  <Ionicons name="person" size={60} color="#999" />
                </View>
              )}

              <TouchableOpacity style={styles.cameraButton} onPress={pickImage}>
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.changePhotoText}>Ubah Foto Profil</Text>
          </View>
          
          {/* Form Profil */}
          <View style={styles.formCard}>
            <Text style={styles.label}>NIP</Text>
            <Text style={styles.readOnlyText}>{user?.nip || '-'}</Text>

            <Text style={styles.label}>Nama</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholder="Masukkan nama lengkap"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              placeholder="Masukkan email"
            />

            <Text style={styles.label}>Nomor Telepon</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
              placeholder="Masukkan nomor telepon"
            />
          </View>

          {/* Tombol Simpan */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
  flex: 1, 
    backgroundColor: '#f9f9f9', 
    paddingHorizontal: 16, 
    paddingTop: 30, 
    paddingBottom: 50,
  },
  header: {
    backgroundColor: '#FFFFFF', 
    paddingTop: 24, 
    paddingBottom: 16, 
    marginHorizontal: -16, 
    marginBottom: 12, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  backButton: {
    position: 'absolute', 
    left: 16, 
    bottom: 16 
  },
  title: {
    fontSize: 18, 
    fontWeight: '600' 
  },
  scrollContainer: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 32,
    marginTop: 15,
  },
  photoWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#e0e0e0',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#386BF6',
    padding: 10,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#fff',
  },
  changePhotoText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  formCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  saveButton: {
    marginHorizontal: 16,
    backgroundColor: '#386BF6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#386BF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
});