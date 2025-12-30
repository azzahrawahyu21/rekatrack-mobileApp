import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { 
  ActivityIndicator, 
  FlatList, 
  Image, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
} from 'react-native';

import { apiFetch } from '@/utils/api';

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

export default function ViewAllScreen() {
  const [data, setData] = useState<TravelDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const res = await apiFetch('/travel-documents');
      if (res?.data) {
        setData(res.data);
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const getStatusColor = (status: string) =>
    status === 'Belum terkirim' ? '#FFA500' : '#008000';

  const getStatusIcon = (status: string) =>
    status === 'Belum terkirim'
      ? require('@/assets/icons/pending.png')
      : require('@/assets/icons/sent.png');

  // FILTER DATA BERDASARKAN SEARCH
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;

    const keyword = search.toLowerCase();

    return data.filter(
      (item) =>
        item.project.toLowerCase().includes(keyword) ||
        item.no_travel_document.toLowerCase().includes(keyword)
    );
  }, [search, data]);

  const renderItem = ({ item }: { item: TravelDocument }) => (
    <TouchableOpacity
      style={styles.recentCard}
      activeOpacity={0.85}
      onPress={() => {
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
        });
      }}
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
        <Text style={styles.dateText}>
          {formatDate(item.date_no_travel_document)}
        </Text>
      </View>

      <View style={styles.rightContent}>
        <View style={[styles.statusBadge,{ backgroundColor: getStatusColor(item.status) },]}>
          <Text style={styles.statusText}>
            {item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      {/* HIDE HEADER BAWAAN */}
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>

          <Text style={styles.title}>Daftar Pengiriman</Text>
        </View>

        {/* SEARCH */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            placeholder="Cari dokumen atau SJN"
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Data tidak ditemukan
              </Text>
            }
          />
        )}
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
  },
  /* HEADER */
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
    paddingBottom: 16,
    marginHorizontal: -16,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    bottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  /* SEARCH */
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#999',
  },
  /* CARD */
  recentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  middleContent: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  docNumber: {
    fontSize: 14,
    color: '#666',
  },
  sendTo: {
    fontSize: 12,
    color: '#777',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  rightContent: {
    alignItems: 'flex-end',
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
});
