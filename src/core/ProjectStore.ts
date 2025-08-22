import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

export interface Project {
  name: string;
  path: string;
}

export class ProjectStore {
  private readonly projectsPath: string;

  constructor() {
    const homeDir = os.homedir();
    this.projectsPath = path.join(homeDir, '.claude', 'ccs-project.json');
  }

  async ensureFile(): Promise<void> {
    const dir = path.dirname(this.projectsPath);
    await fs.ensureDir(dir);
    
    if (!await fs.pathExists(this.projectsPath)) {
      await fs.writeJson(this.projectsPath, [], { spaces: 2 });
    }
  }

  async getProjects(): Promise<Project[]> {
    await this.ensureFile();
    return await fs.readJson(this.projectsPath);
  }

  async addProject(project: Project): Promise<void> {
    const projects = await this.getProjects();
    
    // 检查是否已存在同名项目
    if (projects.some(p => p.name === project.name)) {
      throw new Error(`项目名称 "${project.name}" 已存在`);
    }
    
    // 检查路径是否已存在
    if (projects.some(p => p.path === project.path)) {
      throw new Error(`项目路径 "${project.path}" 已存在`);
    }
    
    projects.push(project);
    await fs.writeJson(this.projectsPath, projects, { spaces: 2 });
  }

  async removeProject(name: string): Promise<void> {
    const projects = await this.getProjects();
    const filteredProjects = projects.filter(p => p.name !== name);
    
    if (filteredProjects.length === projects.length) {
      throw new Error(`项目 "${name}" 不存在`);
    }
    
    await fs.writeJson(this.projectsPath, filteredProjects, { spaces: 2 });
  }

  async getProjectPath(name: string): Promise<string | null> {
    const projects = await this.getProjects();
    const project = projects.find(p => p.name === name);
    return project ? project.path : null;
  }

  getProjectsPath(): string {
    return this.projectsPath;
  }
}