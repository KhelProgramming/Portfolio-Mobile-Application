import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    addProject,
    adminLogout,
    deleteProject,
    getAllProjects,
    updateProject,
} from '../src/services/supabase';

const TECH_STACKS = [
  'C',
  'Python',
  'CSS',
  'TypeScript',
  'React',
  'Java',
  'HTML5',
  'Unity',
  'C#',
  'JavaScript',
];

export default function AdminScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tech_stack: 'C',
    project_link: '',
    github_link: '',
    image_url: '',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await getAllProjects();
      setProjects(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await adminLogout();
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  const openAddModal = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      description: '',
      tech_stack: 'C',
      project_link: '',
      github_link: '',
      image_url: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || '',
      tech_stack: project.tech_stack,
      project_link: project.project_link || '',
      github_link: project.github_link || '',
      image_url: project.image_url || '',
    });
    setModalVisible(true);
  };

  const handleSaveProject = async () => {
    if (!formData.title || !formData.tech_stack) {
      Alert.alert('Error', 'Title and Tech Stack are required');
      return;
    }

    try {
      if (editingProject) {
        await updateProject(editingProject.id, formData);
        Alert.alert('Success', 'Project updated successfully');
      } else {
        await addProject(formData);
        Alert.alert('Success', 'Project added successfully');
      }
      setModalVisible(false);
      loadProjects();
    } catch (error) {
      Alert.alert('Error', 'Failed to save project');
    }
  };

  const handleDeleteProject = (project) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${project.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProject(project.id);
              Alert.alert('Success', 'Project deleted successfully');
              loadProjects();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete project');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
        <Text style={styles.addButtonText}>+ Add New Project</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a9eff" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {projects.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No projects yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add your first project to get started
              </Text>
            </View>
          ) : (
            projects.map((project) => (
              <View key={project.id} style={styles.projectCard}>
                <View style={styles.projectHeader}>
                  <View style={styles.projectInfo}>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <Text style={styles.projectTech}>{project.tech_stack}</Text>
                  </View>
                  <View style={styles.projectActions}>
                    <TouchableOpacity
                      onPress={() => openEditModal(project)}
                      style={styles.editButton}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteProject(project)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {project.description && (
                  <Text style={styles.projectDescription} numberOfLines={2}>
                    {project.description}
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingProject ? 'Edit Project' : 'Add New Project'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="Project Title *"
                placeholderTextColor="#666"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                placeholderTextColor="#666"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Tech Stack *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.techStackScroll}>
                {TECH_STACKS.map((tech) => (
                  <TouchableOpacity
                    key={tech}
                    style={[
                      styles.techButton,
                      formData.tech_stack === tech && styles.techButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, tech_stack: tech })}
                  >
                    <Text
                      style={[
                        styles.techButtonText,
                        formData.tech_stack === tech && styles.techButtonTextActive,
                      ]}
                    >
                      {tech}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.input}
                placeholder="Project Link (URL)"
                placeholderTextColor="#666"
                value={formData.project_link}
                onChangeText={(text) => setFormData({ ...formData, project_link: text })}
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="GitHub Link (URL)"
                placeholderTextColor="#666"
                value={formData.github_link}
                onChangeText={(text) => setFormData({ ...formData, github_link: text })}
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Image URL"
                placeholderTextColor="#666"
                value={formData.image_url}
                onChangeText={(text) => setFormData({ ...formData, image_url: text })}
                autoCapitalize="none"
              />
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveProject}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#333' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  logoutButton: { backgroundColor: '#ff6b6b', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  logoutButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  addButton: { backgroundColor: '#4a9eff', margin: 20, paddingVertical: 16, borderRadius: 8, alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyStateText: { fontSize: 18, color: '#fff', marginBottom: 8 },
  emptyStateSubtext: { fontSize: 14, color: '#666' },
  projectCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  projectHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  projectInfo: { flex: 1 },
  projectTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  projectTech: { fontSize: 14, color: '#4a9eff', fontWeight: '600' },
  projectDescription: { fontSize: 14, color: '#aaa', lineHeight: 20 },
  projectActions: { flexDirection: 'row', gap: 8 },
  editButton: { backgroundColor: '#4a9eff', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  editButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  deleteButton: { backgroundColor: '#ff6b6b', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  deleteButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 24, width: '90%', maxHeight: '80%' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  input: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#333', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, fontSize: 16, color: '#fff', marginBottom: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  label: { fontSize: 14, color: '#aaa', marginBottom: 8, fontWeight: '600' },
  techStackScroll: { marginBottom: 16 },
  techButton: { backgroundColor: '#0a0a0a', borderWidth: 1, borderColor: '#333', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, marginRight: 8 },
  techButtonActive: { backgroundColor: '#4a9eff', borderColor: '#4a9eff' },
  techButtonText: { color: '#aaa', fontSize: 14, fontWeight: '600' },
  techButtonTextActive: { color: '#fff' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#333' },
  cancelButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  saveButton: { backgroundColor: '#4a9eff' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});