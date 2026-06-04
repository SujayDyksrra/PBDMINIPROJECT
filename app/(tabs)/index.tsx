import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  FlatList, 
  ActivityIndicator, 
  StyleSheet, 
  StatusBar, 
  TextInput,
  Image,
  RefreshControl,
  Pressable,
  Modal,
  ScrollView,
  Alert
} from 'react-native';

const API_URL = 'https://api.tvmaze.com/shows';

export default function App() {
  const [shows, setShows] = useState([]);
  const [search, setSearch] = useState(''); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedShow, setSelectedShow] = useState(null);

  useEffect(() => {
    fetchShows();
  }, []);

  const fetchShows = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Streaming database unreachable');
      
      const data = await response.json();
      setShows(data.slice(0, 50)); 
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchShows();
  };

  const filteredShows = shows.filter(show => 
    show.name.toLowerCase().includes(search.toLowerCase()) ||
    (show.genres && show.genres.some(g => g.toLowerCase().includes(search.toLowerCase())))
  );

  const cleanSummary = (htmlText) => {
    if (!htmlText) return "No summary available.";
    return htmlText.replace(/<[^>]*>?/gm, '');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" />
      
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#EAB308" />
          <Text style={styles.statusText}>Loading Catalog...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Network Error: {error}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredShows}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={
            <View style={styles.headerContainer}>
              <Text style={styles.appTitle}>CINEVERSE</Text>
              <Text style={styles.appSubtitle}>Database Engine by Sujay Dyksrra</Text>
              
              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>🎬</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search by title or genre..."
                  placeholderTextColor="#71717A"
                  value={search}
                  onChangeText={setSearch} 
                  autoCorrect={false}
                />
              </View>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#EAB308" />
          }
          renderItem={({ item }) => (
            <Pressable 
              style={({ pressed }) => [styles.movieCard, pressed && styles.cardPressed]}
              onPress={() => setSelectedShow(item)}
            >
              <Image 
                source={{ uri: item.image?.medium || 'https://via.placeholder.com/210x295/18181B/EAB308?text=No+Poster' }} 
                style={styles.posterImage} 
              />
              <View style={styles.movieInfo}>
                <Text style={styles.movieTitle} numberOfLines={2}>{item.name}</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.starIcon}>★</Text>
                  <Text style={styles.ratingText}>{item.rating?.average || 'N/A'}</Text>
                  <Text style={styles.yearText}> • {item.premiered ? item.premiered.substring(0, 4) : 'TBA'}</Text>
                </View>
                <View style={styles.genreContainer}>
                  {item.genres?.slice(0, 2).map((genre, index) => (
                    <View key={index} style={styles.genreBadge}>
                      <Text style={styles.genreText}>{genre}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No titles found matching "{search}"</Text>
          }
        />
      )}

      <Modal
        visible={selectedShow !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedShow(null)}
      >
        <View style={styles.modalContainer}>
          {selectedShow && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Pressable style={styles.closeButton} onPress={() => setSelectedShow(null)}>
                <Text style={styles.closeButtonText}>✕ Close</Text>
              </Pressable>

              <Image 
                source={{ uri: selectedShow.image?.original || selectedShow.image?.medium || 'https://via.placeholder.com/600x900/18181B/EAB308?text=No+Image' }} 
                style={styles.modalHeroImage} 
              />
              
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{selectedShow.name}</Text>
                
                <View style={styles.modalMetaRow}>
                  <Text style={styles.modalMetaText}>⭐ {selectedShow.rating?.average || 'N/A'}</Text>
                  <Text style={styles.modalMetaText}>⏳ {selectedShow.averageRuntime || selectedShow.runtime} min</Text>
                  <Text style={styles.modalMetaText}>📺 {selectedShow.network?.name || selectedShow.webChannel?.name || 'Unknown'}</Text>
                </View>
                
                <View style={styles.divider} />
                
                <Text style={styles.sectionTitle}>Synopsis</Text>
                <Text style={styles.modalDescription}>
                  {cleanSummary(selectedShow.summary)}
                </Text>

                <Pressable 
                  style={({ pressed }) => [styles.actionButton, pressed && { opacity: 0.8 }]}
                  onPress={() => Alert.alert("Success", `${selectedShow.name} has been added to your Watchlist.`)}
                >
                  <Text style={styles.actionButtonText}>+ Add to Watchlist</Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B', paddingTop: StatusBar.currentHeight || 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090B' },
  listContainer: { paddingBottom: 30 },
  
  headerContainer: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 },
  appTitle: { fontSize: 34, fontWeight: '900', color: '#FAFAFA', letterSpacing: 2 },
  appSubtitle: { fontSize: 12, color: '#EAB308', fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 },
  
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B', borderRadius: 12, paddingHorizontal: 16, height: 52, borderWidth: 1, borderColor: '#27272A' },
  searchIcon: { fontSize: 18, marginRight: 12 },
  searchInput: { flex: 1, color: '#FAFAFA', fontSize: 16 },

  movieCard: { flexDirection: 'row', backgroundColor: '#18181B', marginHorizontal: 16, marginVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#27272A', overflow: 'hidden' },
  cardPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  posterImage: { width: 100, height: 150, backgroundColor: '#27272A' },
  movieInfo: { flex: 1, padding: 16, justifyContent: 'center' },
  movieTitle: { fontSize: 18, fontWeight: 'bold', color: '#FAFAFA', marginBottom: 6 },
  
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  starIcon: { color: '#EAB308', fontSize: 16, marginRight: 4 },
  ratingText: { color: '#FAFAFA', fontWeight: 'bold', fontSize: 14 },
  yearText: { color: '#A1A1AA', fontSize: 14 },
  
  genreContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genreBadge: { backgroundColor: 'rgba(234, 179, 8, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(234, 179, 8, 0.3)' },
  genreText: { color: '#EAB308', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },

  modalContainer: { flex: 1, backgroundColor: '#09090B' },
  closeButton: { position: 'absolute', top: 20, right: 20, zIndex: 10, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 20 },
  closeButtonText: { color: '#FAFAFA', fontWeight: 'bold', fontSize: 14 },
  modalHeroImage: { width: '100%', height: 450, resizeMode: 'cover', backgroundColor: '#18181B' },
  modalContent: { padding: 24, marginTop: -20, backgroundColor: '#09090B', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalTitle: { fontSize: 32, fontWeight: '900', color: '#FAFAFA', marginBottom: 12 },
  
  modalMetaRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  modalMetaText: { fontSize: 14, color: '#A1A1AA', fontWeight: '600', backgroundColor: '#18181B', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, overflow: 'hidden' },
  
  divider: { height: 1, backgroundColor: '#27272A', marginVertical: 24 },
  sectionTitle: { fontSize: 14, color: '#EAB308', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, fontWeight: 'bold' },
  modalDescription: { fontSize: 16, color: '#D4D4D8', lineHeight: 26, marginBottom: 30 },
  
  actionButton: { backgroundColor: '#EAB308', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  actionButtonText: { color: '#09090B', fontWeight: 'bold', fontSize: 16 },

  statusText: { marginTop: 16, color: '#A1A1AA', fontSize: 15, fontWeight: '500' },
  errorText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 },
  emptyText: { color: '#71717A', textAlign: 'center', marginTop: 40, fontStyle: 'italic', fontSize: 15 }
});