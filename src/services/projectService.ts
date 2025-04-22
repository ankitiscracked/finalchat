import { addProject, getAllProjects, getProjectById, type ProjectRecord } from './indexedDB';

/**
 * Load all projects from the database
 */
export async function loadProjects(): Promise<ProjectRecord[]> {
  const projects = await getAllProjects();
  return projects;
}

/**
 * Create a new project
 */
export async function createProject(name: string): Promise<ProjectRecord> {
  const projectData = {
    name: name.trim(),
    createdAt: new Date()
  };
  
  const projectId = await addProject(projectData);
  
  return {
    ...projectData,
    id: projectId
  };
}

/**
 * Get a project by its ID
 */
export async function getProject(id: number): Promise<ProjectRecord | null> {
  return getProjectById(id);
}

/**
 * Find a project by name in a list of projects
 */
export function findProjectByName(projects: ProjectRecord[], name: string): ProjectRecord | undefined {
  return projects.find(p => p.name.toLowerCase() === name.toLowerCase());
}

/**
 * Get project name by ID from a list of projects
 */
export function getProjectName(projects: ProjectRecord[], projectId: number): string | null {
  const project = projects.find(p => p.id === projectId);
  return project ? project.name : null;
}