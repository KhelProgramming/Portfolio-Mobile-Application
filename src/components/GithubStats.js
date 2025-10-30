import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getGitHubRepos, getGitHubStats } from '../services/github';

const { width, height } = Dimensions.get('window');

const StatCard = ({ label, value, icon }) => (
  <View style={styles.statCard}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const RepoCard = ({ repo }) => {
  const handleOpenRepo = () => {
    Linking.openURL(repo.url).catch((err) =>
      console.error('Failed to open URL:', err)
    );
  };

  return (
    <TouchableOpacity style={styles.repoCard} onPress={handleOpenRepo}>
      <Text style={styles.repoName}>{repo.name}</Text>
      <Text style={styles.repoDescription} numberOfLines={2}>
        {repo.description}
      </Text>
      <View style={styles.repoStats}>
        {repo.language && (
          <View style={styles.repoStat}>
            <Text style={styles.repoStatText}>💻 {repo.language}</Text>
          </View>
        )}
        <View style={styles.repoStat}>
          <Text style={styles.repoStatText}>⭐ {repo.stars}</Text>
        </View>
        <View style={styles.repoStat}>
          <Text style={styles.repoStatText}>🔱 {repo.forks}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const GitHubStats = ({ visible, onClose }) => {
  const [stats, setStats] = useState(null);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const slideAnim = React.useRef(new Animated.Value(width)).current;

  useEffect(() => {
    if (visible) {
      loadGitHubData();
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const loadGitHubData = async () => {
    setLoading(true);
    try {
      const [statsData, reposData] = await Promise.all([
        getGitHubStats(),
        getGitHubRepos(10),
      ]);
      setStats(statsData);
      setRepos(reposData);
    } catch (error) {
      console.error('Error loading GitHub data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProfile = () => {
    if (stats?.profileUrl) {
      Linking.openURL(stats.profileUrl).catch((err) =>
        console.error('Failed to open URL:', err)
      );
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        {
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GitHub Profile</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a9eff" />
          <Text style={styles.loadingText}>Loading GitHub data...</Text>
        </View>
      ) : stats ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.profileSection}>
            {stats.avatarUrl && (
              <Image
                source={{ uri: stats.avatarUrl }}
                style={styles.avatar}
              />
            )}
            <Text style={styles.profileName}>{stats.name}</Text>
            {stats.bio && <Text style={styles.profileBio}>{stats.bio}</Text>}
            {stats.location && (
              <Text style={styles.profileInfo}>📍 {stats.location}</Text>
            )}
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleOpenProfile}
            >
              <Text style={styles.profileButtonText}>View on GitHub</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsSection}>
            <StatCard
              label="Repositories"
              value={stats.publicRepos}
              icon="📦"
            />
            <StatCard label="Followers" value={stats.followers} icon="👥" />
            <StatCard label="Following" value={stats.following} icon="➕" />
          </View>

          <View style={styles.reposSection}>
            <Text style={styles.sectionTitle}>Recent Repositories</Text>
            {repos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </View>
        </ScrollView>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load GitHub data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadGitHubData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: width * 0.85,
    height: height,
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
    marginTop: 12,
    fontSize: 16,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#4a9eff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  profileInfo: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  profileButton: {
    backgroundColor: '#4a9eff',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  profileButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  reposSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  repoCard: {
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  repoName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a9eff',
    marginBottom: 8,
  },
  repoDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 12,
    lineHeight: 20,
  },
  repoStats: {
    flexDirection: 'row',
    gap: 12,
  },
  repoStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repoStatText: {
    fontSize: 12,
    color: '#888',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4a9eff',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default GitHubStats;