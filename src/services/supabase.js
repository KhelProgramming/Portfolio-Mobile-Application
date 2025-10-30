import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase credentials
const SUPABASE_URL = 'https://agfgzbfzjvgnqzjaefww.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZmd6YmZ6anZnbnF6amFlZnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MzA0MDYsImV4cCI6MjA3NzEwNjQwNn0.HRR8MzqAfq-qDkPZDtFB-83cRkJ7wIfnAam2M0Pwfes';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Get projects by tech stack
export const getProjectsByTech = async (techStack) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('tech_stack', techStack)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

// Get all projects
export const getAllProjects = async () => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching all projects:', error);
    return [];
  }
};

// Add new project
export const addProject = async (project) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        ...project,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding project:', error);
    throw error;
  }
};

// Update project
export const updateProject = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// Delete project
export const deleteProject = async (id) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Admin login
export const adminLogin = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Admin logout
export const adminLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Check if user is authenticated
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};