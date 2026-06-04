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

const GET_API_URL = 'https://api.tvmaze.com/shows';
const POST_API_URL = 'https://jsonplaceholder.typicode.com/posts';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('home'); 

  const [shows, setShows] = useState([]);
  
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedShow, setSelectedShow] = useState(null); 

  const [postSearch, setPostSearch] = useState('');
  const [reviewTarget, setReviewTarget] = useState(null); 
  const [reviewerName, setReviewerName] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  useEffect(() => {
    fetchShows();
  }, []);

  const fetchShows = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(GET_API_URL);
      if (!response.ok) throw new Error('Streaming database unreachable');
      
      const data = await response.json();
      setShows(data.slice(0, 40)); 
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

  const cleanSummary = (htmlText) => {
    if (!htmlText) return "No synopsis available.";
    return htmlText.replace(/<[^>]*>?/gm, '');
  };


  const submitReview = async () => {
    if (!reviewTarget || !reviewerName.trim() || !reviewContent.trim()) {
      Alert.alert("Validation Error", "Please select a show, enter your name, and write a review.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(POST_API_URL, {
        method: 'POST',
        headers: { 'Content-type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({
          title: reviewTarget.name,
          body: reviewContent,
          userId: reviewerName, 
        }),
      });

      if (!response.ok) throw new Error('Failed to submit review.');

      const json = await response.json();
      
 
      Alert.alert(
        "Review Published! 🎉", 
        `Your review for "${json.title}" was submitted successfully (Database ID: ${json.id}).`
      );

      
      setReviewTarget(null);
      setReviewerName('');
      setReviewContent('');
      setPostSearch('');
      setCurrentScreen('home'); 
      
    } catch (err) {
      Alert.alert("Submission Failed", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (currentScreen === 'home') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#09090B" />
        <View style={styles.homeContainer}>
          <Text style={styles.appTitle}>CINEVERSE</Text>
          <Text style={styles.appSubtitle}>Entertainment Database</Text>

          <View style={styles.menuBox}>
            <Pressable style={styles.primaryButton} onPress={() => setCurrentScreen('browse')}>
              <Text style={styles.buttonText}>🎬 Browse Shows (GET)</Text>
            </Pressable>

            <Pressable style={[styles.primaryButton, styles.secondaryButton]} onPress={() => setCurrentScreen('post')}>
              <Text style={styles.buttonText}>✍️ Write a Review (POST)</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (currentScreen === 'browse') {
    const filteredShows = shows.filter(show => 
      show.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setCurrentScreen('home')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by title..."
              placeholderTextColor="#71717A"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
          </View>
        </View>

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
                  <Text style={styles.genreText}>{item.genres?.join(', ')}</Text>
                </View>
              </Pressable>
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        )}

        <Modal visible={selectedShow !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedShow(null)}>
          <View style={styles.modalContainer}>
            {selectedShow && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Pressable style={styles.closeButton} onPress={() => setSelectedShow(null)}>
                  <Text style={styles.closeButtonText}>✕ Close</Text>
                </Pressable>
                <Image source={{ uri: selectedShow.image?.original || selectedShow.image?.medium || 'https://via.placeholder.com/600x900/18181B/EAB308?text=No+Image' }} style={styles.modalHeroImage} />
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{selectedShow.name}</Text>
                  <View style={styles.modalMetaRow}>
                    <Text style={styles.modalMetaText}>⭐ {selectedShow.rating?.average || 'N/A'}</Text>
                    <Text style={styles.modalMetaText}>⏳ {selectedShow.averageRuntime || selectedShow.runtime} min</Text>
                    <Text style={styles.modalMetaText}>📺 {selectedShow.network?.name || selectedShow.webChannel?.name || 'Unknown'}</Text>
                  </View>
                  <View style={styles.divider} />
                  <Text style={styles.sectionTitle}>Synopsis</Text>
                  <Text style={styles.modalDescription}>{cleanSummary(selectedShow.summary)}</Text>
                </View>
              </ScrollView>
            )}
          </View>
        </Modal>
      </SafeAreaView>
    );
  }


  if (currentScreen === 'post') {
    const postFilteredShows = shows.filter(show => 
      show.name.toLowerCase().includes(postSearch.toLowerCase())
    );

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setCurrentScreen('home')} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Submit a Review</Text>
        </View>

        <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.formInstruction}>Select a movie from the database and write your review below.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>1. Select a Show *</Text>
            
            {!reviewTarget ? (
              <View>
                <TextInput
                  style={styles.inputField}
                  placeholder="Type to search for a movie..."
                  placeholderTextColor="#71717A"
                  value={postSearch}
                  onChangeText={setPostSearch}
                  autoCorrect={false}
                />
                <FlatList
                  horizontal
                  data={postFilteredShows}
                  keyExtractor={(item) => item.id.toString()}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 10 }}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <Pressable style={styles.miniCard} onPress={() => setReviewTarget(item)}>
                      <Image source={{ uri: item.image?.medium }} style={styles.miniPoster} />
                      <Text style={styles.miniTitle} numberOfLines={1}>{item.name}</Text>
                    </Pressable>
                  )}
                  ListEmptyComponent={<Text style={styles.statusText}>No shows match your search.</Text>}
                />
              </View>
            ) : (
              <View style={styles.selectedTargetBox}>
                <Text style={styles.selectedTargetText}>🎬 {reviewTarget.name}</Text>
                <Pressable onPress={() => { setReviewTarget(null); setPostSearch(''); }}>
                  <Text style={styles.changeTargetText}>✕ Change</Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>2. Your Name *</Text>
            <TextInput
              style={styles.inputField}
              placeholder="e.g., Sujay Dyksrra"
              placeholderTextColor="#71717A"
              value={reviewerName}
              onChangeText={setReviewerName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>3. Your Review *</Text>
            <TextInput
              style={[styles.inputField, styles.textArea]}
              placeholder="What did you think of the show?..."
              placeholderTextColor="#71717A"
              multiline={true}
              numberOfLines={5}
              value={reviewContent}
              onChangeText={setReviewContent}
            />
          </View>

          {isSubmitting ? (
            <View style={styles.submittingBox}>
              <ActivityIndicator size="large" color="#EAB308" />
              <Text style={styles.statusText}>Publishing Review...</Text>
            </View>
          ) : (
            <Pressable style={styles.submitButton} onPress={submitReview}>
              <Text style={styles.submitButtonText}>Publish Review (POST)</Text>
            </Pressable>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090B', paddingTop: StatusBar.currentHeight || 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#09090B' },
  
  homeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  appTitle: { fontSize: 42, fontWeight: '900', color: '#FAFAFA', letterSpacing: 2 },
  appSubtitle: { fontSize: 14, color: '#EAB308', fontWeight: '700', marginTop: 4, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 50 },
  menuBox: { width: '100%', paddingHorizontal: 20 },
  primaryButton: { backgroundColor: '#27272A', paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#3F3F46' },
  secondaryButton: { backgroundColor: '#EAB308', borderColor: '#EAB308' },
  buttonText: { color: '#FAFAFA', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
  
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, backgroundColor: '#09090B', borderBottomWidth: 1, borderBottomColor: '#27272A' },
  backButton: { paddingRight: 16 },
  backButtonText: { color: '#EAB308', fontSize: 16, fontWeight: 'bold' },
  headerTitle: { color: '#FAFAFA', fontSize: 20, fontWeight: 'bold' },
  
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#18181B', borderRadius: 12, paddingHorizontal: 12, height: 45, borderWidth: 1, borderColor: '#27272A' },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, color: '#FAFAFA', fontSize: 15 },

  listContainer: { paddingBottom: 30, paddingHorizontal: 16, paddingTop: 16 },
  movieCard: { flexDirection: 'row', backgroundColor: '#18181B', marginBottom: 12, borderRadius: 12, borderWidth: 1, borderColor: '#27272A', overflow: 'hidden' },
  cardPressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  posterImage: { width: 90, height: 130, backgroundColor: '#27272A' },
  movieInfo: { flex: 1, padding: 14, justifyContent: 'center' },
  movieTitle: { fontSize: 16, fontWeight: 'bold', color: '#FAFAFA', marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  starIcon: { color: '#EAB308', fontSize: 14, marginRight: 4 },
  ratingText: { color: '#FAFAFA', fontWeight: 'bold', fontSize: 13 },
  yearText: { color: '#A1A1AA', fontSize: 13 },
  genreText: { color: '#EAB308', fontSize: 12, fontWeight: '600' },

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

  formContainer: { padding: 20, paddingBottom: 60 },
  formInstruction: { color: '#A1A1AA', fontSize: 15, marginBottom: 24, lineHeight: 22 },
  inputGroup: { marginBottom: 20 },
  inputLabel: { color: '#FAFAFA', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputField: { backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A', borderRadius: 10, padding: 14, color: '#FAFAFA', fontSize: 15 },
  textArea: { height: 120, textAlignVertical: 'top' },
  submitButton: { backgroundColor: '#EAB308', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: '#09090B', fontWeight: 'bold', fontSize: 16 },
  submittingBox: { alignItems: 'center', marginTop: 20 },

  miniCard: { marginRight: 12, width: 80 },
  miniPoster: { width: 80, height: 110, borderRadius: 8, backgroundColor: '#27272A', marginBottom: 6 },
  miniTitle: { color: '#FAFAFA', fontSize: 12, textAlign: 'center', fontWeight: '500' },
  selectedTargetBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(234, 179, 8, 0.1)', padding: 16, borderRadius: 10, borderWidth: 1, borderColor: '#EAB308' },
  selectedTargetText: { color: '#EAB308', fontSize: 16, fontWeight: 'bold', flex: 1 },
  changeTargetText: { color: '#FAFAFA', fontSize: 14, fontWeight: 'bold', paddingLeft: 10 },

  statusText: { marginTop: 16, color: '#A1A1AA', fontSize: 15, fontWeight: '500' },
  errorText: { color: '#EF4444', fontWeight: 'bold', fontSize: 16 }
});