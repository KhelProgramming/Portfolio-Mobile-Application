const GITHUB_USERNAME = 'KhelProgramming';
const GITHUB_API_BASE = 'https://api.github.com';

// Get GitHub user profile stats
export const getGitHubStats = async () => {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/users/${GITHUB_USERNAME}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch GitHub stats');
    }
    
    const data = await response.json();
    
    return {
      name: data.name || GITHUB_USERNAME,
      bio: data.bio || 'No bio available',
      followers: data.followers || 0,
      following: data.following || 0,
      publicRepos: data.public_repos || 0,
      avatarUrl: data.avatar_url,
      profileUrl: data.html_url,
      location: data.location,
      company: data.company,
      blog: data.blog,
      twitter: data.twitter_username,
    };
  } catch (error) {
    console.error('GitHub API Error:', error);
    return null;
  }
};

// Get GitHub repositories
export const getGitHubRepos = async (limit = 10) => {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=${limit}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch GitHub repos');
    }
    
    const repos = await response.json();
    
    return repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      description: repo.description || 'No description',
      url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      updatedAt: repo.updated_at,
    }));
  } catch (error) {
    console.error('GitHub Repos Error:', error);
    return [];
  }
};