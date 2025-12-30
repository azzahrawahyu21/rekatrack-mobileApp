// app/(tabs)/index.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  FlatList, 
  Image, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
} from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { apiFetch } from '@/utils/api';
import { router } from 'expo-router';

type TravelDocument = {
  id: number;
  no_travel_document: string;
  date_no_travel_document: string;
  send_to: string;
  project: string;
  status: string;
  po_number?: string;
  reference_number?: string;
  items?: any[];
};

export default function HomeScreen() {
  const [allDocuments, setAllDocuments] = useState<TravelDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [recentItems, setRecentItems] = useState<TravelDocument[]>([]);
  const [userName, setUserName] = useState<string>('User'); // untuk nama user

  const [stats, setStats] = useState({
    belumTerkirim: 0,
    terkirim: 0,
    history: 0,
  });

  // Ambil nama user dari AsyncStorage saat komponen dimuat
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          setUserName(user.name || 'User');
        }
      } catch (e) {
        console.warn('Gagal memuat data user:', e);
      }
    };

    loadUserData();
  }, []);

  const fetchTravelDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch('/travel-documents');

      if (response && Array.isArray(response.data)) {
        const sorted = [...response.data].sort((a, b) =>
          new Date(b.date_no_travel_document).getTime() -
          new Date(a.date_no_travel_document).getTime()
        );

        setAllDocuments(sorted);

        const belumTerkirim = sorted.filter(d => d.status === 'Belum terkirim').length;
        const terkirim = sorted.filter(d => d.status === 'Terkirim').length;

        setStats({
          belumTerkirim,
          terkirim,
          history: sorted.length,
        });

        setRecentItems(sorted.slice(0, 3));
      } else {
        setError('Format data tidak valid');
      }
    } catch (err: any) {
      console.error('Fetch error:', err);
      const errorMsg = err?.raw?.message || 'Gagal memuat data';

      if (err?.status === 401) {
        Alert.alert('Sesi Habis', 'Silakan login ulang.', [
          {
            text: 'OK',
            onPress: () => {
              AsyncStorage.removeItem('token');
              AsyncStorage.removeItem('user');
              // Jika Anda punya router:
              // router.replace('/login');
            },
          },
        ]);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTravelDocuments();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Belum terkirim':
        return '#FFA500';
      case 'Terkirim':
        return '#008000';
      default:
        return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Belum terkirim':
        return require('@/assets/icons/pending.png'); // pending
      case 'Terkirim':
        return require('@/assets/icons/sent.png'); // sent
      default:
        return null;
    }
  };

  const renderRecentItem = ({ item }: { item: TravelDocument }) => (
    <TouchableOpacity 
      style={styles.recentCard}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: '/detail',
          params: {
            id: item.id,
            no: item.no_travel_document,
            send_to: item.send_to,
            project: item.project,
            status: item.status,
            date: item.date_no_travel_document ? String(item.date_no_travel_document) : '',
            po_number: item.po_number ? String(item.po_number) : '',
            reference_number: item.reference_number ? String(item.reference_number) : '',
            items: JSON.stringify(item.items || []),
          },
        })
      }
    >
      <View style={styles.recentIconWrapper}>
        <Image
          source={getStatusIcon(item.status)}
          style={styles.recentStatusIcon}
        />
      </View>

      <View style={styles.middleContent}>
        <Text style={styles.projectTitle}>{item.project}</Text>
        <Text style={styles.docNumber}>{item.no_travel_document}</Text>
        <Text style={styles.sendTo}>{item.send_to}</Text>
        <Text style={styles.dateText}>{formatDate(item.date_no_travel_document)}</Text>        
      </View>

      <View style={styles.rightContent}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) },]}>
          <Text style={styles.statusText}>
            {item.status}
          </Text>
        </View>
      </View>

    </TouchableOpacity>
  );

  const handleTrack = () => {
    if (!trackingInput.trim()) {
      Alert.alert('Error', 'Masukkan nomor SJN');
      return;
    }
    Alert.alert('Track', `Mencari: ${trackingInput}`);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#1E3A8A" />
        <Text style={styles.loadingText}>Memuat dashboard...</Text>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.container}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity onPress={fetchTravelDocuments}>
          <Text style={styles.retryText}>Coba lagi</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>      
      {/* Header: Logo dikiri | profile dikanan | Halo, {nama} dibawah logo */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('@/assets/images/logo-rekatrack.png')}
            style={styles.logo}
          />
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Image
            source={require('@/assets/icons/profile.png')} // icon profile
            style={styles.profileIcon}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.headerTextRow}>
        <Text style={styles.welcomeText}>Halo, {userName}</Text>
      </View>

      <Text style={styles.subtitle}>Pantau dan kelola pengiriman Anda</Text>

      {/* Stats Cards */}      <View style={styles.statsContainer}>
        <View style={[styles.statCard]}>
          <View style={styles.iconWrapper}>
            <Image
              source={require('@/assets/icons/belum-terkirim.png')}
              style={styles.statIcon}
            />
          </View>
          <Text style={styles.statNumber}>{stats.belumTerkirim}</Text>
          {/* <Text style={styles.statLabel}>Belum Terkirim</Text> */}
          <Text style={styles.statLabel}>Belum terkirim</Text>
        </View>

        <View style={[styles.statCard]}>
          <View style={styles.iconWrapper}>
            <Image
              source={require('@/assets/icons/terkirim.png')}
              style={styles.statIcon}
            />
          </View>
          <Text style={styles.statNumber}>{stats.terkirim}</Text>
          {/* <Text style={styles.statLabel}>Terkirim</Text> */}
          <Text style={styles.statLabel}>Terkirim</Text>
        </View>

        <View style={[styles.statCard]}>
          <View style={styles.iconWrapper}>
            <Image
              source={require('@/assets/icons/history.png')}
              style={styles.statIcon}
            />
          </View>
          <Text style={styles.statNumber}>{stats.history}</Text>
          <Text style={styles.statLabel}>Histori</Text>
        </View>
      </View>

      {/* Quick Track */}
      <View style={styles.quickTrack}>
        <Text style={styles.quickTrackTitle}>Lacak Cepat</Text>
        <Text style={styles.quickTrackSubtitle}>Masukkan Nomor SJN</Text>
        <View style={styles.trackInputContainer}>
          <TextInput
            style={styles.trackInput}
            // placeholder="Masukkan Nomor SJN"
            placeholder="Nomor Surat Jalan (SJN)"
            value={trackingInput}
            onChangeText={setTrackingInput}
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.trackButton} onPress={handleTrack}>
            <Text style={styles.trackButtonText}>Track</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Tracking */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Pengiriman Terbaru</Text>
        <TouchableOpacity onPress={ () => router.push('/detail/viewall')}>
          <Text style={styles.viewAll}>Lihat Semua</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={recentItems}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderRecentItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 30,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A8A',
    paddingBottom: 5,
  },
  logo: {
    width: 70,
    height: 30,
    resizeMode: 'contain',
    marginRight: 2,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,

    backgroundColor: '#FFFFFF',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',

    color: '#666666',
    fontWeight: 'bold',
  },
  quickTrack: {
    backgroundColor: '#364981',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  quickTrackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  quickTrackSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 12,
  },
  trackInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    color: '#333',
  },
  trackButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trackButtonText: {
    color: '#1E3A8A',
    fontWeight: 'bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAll: {
    color: '#1E3A8A',
    fontWeight: 'bold',
  },
  recentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recentContent: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  docNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    minWidth: 90,
    marginLeft: 8,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  arrow: {
    fontSize: 18,
    color: '#888',
  },
  listContainer: {
    paddingBottom: 16,
  },
  loadingText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#666',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  retryText: {
    color: '#1E3A8A',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: 'bold',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  welcomeTextBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  welcomeSmall: {
    fontSize: 12,
    color: '#555',
  },
  profileButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },
  iconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#2B7FFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    shadowColor: "#2B7FFF",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  statIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginBottom: 6,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentIconWrapper: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  recentStatusIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  middleContent: {
    flex: 1,
  },
  rightContent: {
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  sendTo: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  sendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
});
