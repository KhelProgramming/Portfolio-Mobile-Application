// Mapping between Blender object names and tech stack names
export const TECH_STACK_MAP = {
  'Key_C': 'C',
  'Key_Python': 'Python',
  'Key_CSS': 'CSS',
  'Key_TypeScript': 'TypeScript',
  'Key_React': 'React',
  'Key_Java': 'Java',
  'Key_HTML5': 'HTML5',
  'Key_Unity': 'Unity',
  'Key_CSharp': 'C#',
  'Key_JavaScript': 'JavaScript',
  'Key_GitHub': 'GitHub',
};

// List of all tech stack options for admin panel
export const TECH_STACKS = [
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

// Check if a key is the GitHub special key
export const isGitHubKey = (keyName) => keyName === 'Key_GitHub';

// Get tech stack name from key name
export const getTechStackName = (keyName) => {
  return TECH_STACK_MAP[keyName] || null;
};