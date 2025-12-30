// app/hasil_scan/index.tsx

import { apiFetch } from '@/utils/api'; // asumsikan sudah ada
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location'; // ← untuk GPS
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type DetailPengiriman = {
  id: number;
  no_travel_document: string;
  send_to: string;
  status: string;
  // tambah field lain kalau perlu
};

export default function HasilScanScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [id, setId] = useState<number | null>(null);
  const [detail, setDetail] = useState<DetailPengiriman | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('non active');
  const [tracerActive, setTracerActive] = useState(false);

  // Ekstrak ID dari code (misal SJNID:123 → 123)
  useEffect(() => {
    if (code && code.startsWith('SJNID:')) {
      const extractedId = parseInt(code.substring(6), 10);
      if (!isNaN(extractedId)) {
        setId(extractedId);
      } else {
        Alert.alert('Error', 'Format code tidak valid');
        router.back();
      }
    } else {
      Alert.alert('Error', 'Data scan tidak valid');
      router.back();
    }
  }, [code]);

  // Fetch detail pengiriman berdasarkan ID
  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const fetchDetail = async () => {
    try {
      const response = await apiFetch(`/travel-document/${id}`);
      if (response?.data) {
        setDetail(response.data);
        setStatus(response.data.status || 'non active');
      } else {
        Alert.alert('Error', 'Gagal memuat detail pengiriman');
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  // Fungsi ambil lokasi GPS
  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'Izin lokasi diperlukan');
      return null;
    }

    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  };

  // Klik "Hidupkan Tracer"
  const handleHidupkanTracer = async () => {
    if (id) {
      const location = await getLocation();
      if (!location) return;

      try {
        await apiFetch('/send-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, // tambah ini kalau apiFetch tidak otomatis
            body: JSON.stringify({
                travel_document_id: [id], // ← array dengan number ID
                latitude: location.latitude,
                longitude: location.longitude,
            }),
        });
        setStatus('active');
        setTracerActive(true);
        Alert.alert('Sukses', 'Tracer dihidupkan dan lokasi dikirim');
      } catch (error) {
        Alert.alert('Error', 'Gagal menghidupkan tracer');
      }
    }
  };

  // Klik "Selesaikan Pengiriman"
  const handleSelesaikanPengiriman = async () => {
    if (id) {
      const location = await getLocation();
      if (!location) return;

      try {
        await apiFetch('/complete-tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                travel_document_id: [id],
                latitude: location.latitude,
                longitude: location.longitude,
            }),
        });
        setStatus('terkirim');
        Alert.alert('Sukses', 'Pengiriman selesai dan lokasi akhir dikirim');
        router.back(); // kembali ke scan setelah selesai
      } catch (error) {
        Alert.alert('Error', 'Gagal menyelesaikan pengiriman');
      }
    }
  };

  if (loading) {
    return <View style={styles.center}><Text>Memuat...</Text></View>;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Hasil Scan</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.resultCard}>
            <Ionicons name="checkmark-circle" size={48} color="#4CAF50" style={styles.icon} />
            <Text style={styles.successText}>Scan berhasil</Text>

            <Text style={styles.sectionTitle}>Data Pengiriman</Text>
            <Text style={styles.dataText}>{detail?.no_travel_document || '-'}</Text>

            <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
            <Text style={styles.dataText}>{detail?.send_to || '-'}</Text>

            <Text style={styles.sectionTitle}>Status Pengiriman</Text>
            <Text style={styles.statusText}>{status}</Text>

            <TouchableOpacity
                style={[
                    styles.button,
                    tracerActive && styles.buttonActive, // ← ganti jadi conditional seperti ini
                ]}
                onPress={handleHidupkanTracer}
                disabled={tracerActive}
                >
                <Text style={styles.buttonText}>
                    {tracerActive ? 'Tracer Hidup' : 'Hidupkan Tracer'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={handleSelesaikanPengiriman}
            >
              <Text style={styles.buttonTextSecondary}>Selesaikan Pengiriman</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f9f9f9' 
},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: { 
    padding: 8 
},
  title: { fontSize: 18, fontWeight: '600', marginLeft: 16 },
  content: { padding: 20, alignItems: 'center' },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  icon: { marginBottom: 8 },
  successText: { fontSize: 16, color: '#4CAF50', marginBottom: 24 },
  sectionTitle: { fontSize: 14, color: '#666', marginBottom: 4, alignSelf: 'flex-start' },
  dataText: { fontSize: 16, color: '#333', marginBottom: 24, backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, width: '100%' },
  statusText: { fontSize: 16, color: '#333', marginBottom: 24, backgroundColor: '#f0f0f0', padding: 12, borderRadius: 8, width: '100%' },
    button: {
    backgroundColor: '#2196F3', // biru untuk "Hidupkan Tracer"
    padding: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    },
    buttonActive: {
    backgroundColor: '#4CAF50', // hijau saat tracer hidup
    },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  buttonSecondary: { backgroundColor: '#e0e0e0', padding: 16, borderRadius: 8, width: '100%', alignItems: 'center' },
  buttonTextSecondary: { color: '#666', fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});