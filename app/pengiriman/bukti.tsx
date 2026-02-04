// app/pengiriman/bukti.tsx
import { apiFetch } from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type DeliveryConfirmation = {
  receiver_name: string;
  received_at: string;
  note?: string;
  photo_path: string;
};

export default function BuktiPengiriman() {
  const { id, no } = useLocalSearchParams();
  const [bukti, setBukti] = useState<DeliveryConfirmation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBukti = async () => {
      try {
        setLoading(true);
        // Ganti endpoint ini sesuai backend kamu
        const response = await apiFetch(`/delivery-confirmation/${id}`);

        if (response?.data) {
          setBukti(response.data);
        } else {
          setError('Data bukti pengiriman tidak ditemukan');
        }
      } catch (err: any) {
        setError(err?.message || 'Gagal memuat bukti pengiriman');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBukti();
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#158079" />
        <Text style={styles.loadingText}>Memuat bukti pengiriman...</Text>
      </View>
    );
  }

  if (error || !bukti) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>
          {error || 'Bukti pengiriman tidak tersedia'}
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: `Bukti Pengiriman - ${no || 'SJN'}`,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Bukti Penerimaan</Text>

          {/* Foto bukti */}
          {bukti.photo_path ? (
            <Image
              source={{ uri: bukti.photo_path }} // pastikan URL-nya full (misal dari storage Laravel)
              style={styles.photo}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.noPhoto}>
              <Ionicons name="image-outline" size={80} color="#ccc" />
              <Text style={styles.noPhotoText}>Tidak ada foto bukti tersedia</Text>
            </View>
          )}

          {/* Detail penerimaan */}
          <View style={styles.detailSection}>
            <Text style={styles.label}>Nama Penerima</Text>
            <Text style={styles.value}>{bukti.receiver_name || '-'}</Text>

            <Text style={styles.label}>Waktu Diterima</Text>
            <Text style={styles.value}>
              {bukti.received_at
                ? new Date(bukti.received_at).toLocaleString('id-ID', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                  })
                : '-'}
            </Text>

            {bukti.note ? (
              <>
                <Text style={styles.label}>Catatan</Text>
                <Text style={styles.value}>{bukti.note}</Text>
              </>
            ) : null}
          </View>

          {/* Tombol kembali */}
          <TouchableOpacity
            style={styles.backToDetail}
            onPress={() => router.back()}
          >
            <Text style={styles.backToDetailText}>Kembali ke Detail</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  photo: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#f3f4f6',
  },
  noPhoto: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    marginBottom: 20,
  },
  noPhotoText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  detailSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 16,
  },
  backButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  backToDetail: {
    marginTop: 20,
    padding: 14,
    backgroundColor: '#158079',
    borderRadius: 8,
    alignItems: 'center',
  },
  backToDetailText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626', // merah untuk error
    textAlign: 'center',
    marginBottom: 20,
  },
});