import { ProjectStore, Project } from '../core/ProjectStore';
import { Logger } from '../utils/logger';
import inquirer from 'inquirer';
import * as path from 'path';
import * as fs from 'fs-extra';

export async function projectAddCommand(): Promise<void> {
  const projectStore = new ProjectStore();
  
  try {
    // 首先获取所有现有项目，用于检查重复
    const existingProjects = await projectStore.getProjects();
    const existingPaths = existingProjects.map(p => p.path);
    const existingNames = existingProjects.map(p => p.name);
    
    // 第一步：输入项目路径
    const pathAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectPath',
        message: '请输入项目路径（例如：D://code//my-project）：',
        validate: async (input: string) => {
          if (!input.trim()) {
            return '项目路径不能为空';
          }
          
          // 解析路径为绝对路径
          const resolvedPath = path.resolve(input.trim());
          
          // 验证路径是否存在
          const exists = await fs.pathExists(resolvedPath);
          if (!exists) {
            return '项目路径不存在，请检查路径是否正确';
          }
          
          // 验证是否为目录
          const stats = await fs.stat(resolvedPath);
          if (!stats.isDirectory()) {
            return '项目路径必须是目录';
          }
          
          // 检查路径是否已经添加过
          if (existingPaths.includes(resolvedPath)) {
            return '该路径已经添加到项目列表中，请选择其他路径';
          }
          
          return true;
        }
      }
    ]);
    
    const resolvedPath = path.resolve(pathAnswer.projectPath.trim());
    
    // 从路径中提取项目名作为默认值
    const pathParts = resolvedPath.split(path.sep);
    const defaultProjectName = pathParts[pathParts.length - 1] || '未命名项目';
    
    // 第二步：输入项目名称
    const nameAnswer = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '请输入项目名称：',
        default: defaultProjectName,
        validate: (input: string) => {
          if (!input.trim()) {
            return '项目名称不能为空';
          }
          
          // 检查项目名称是否已经存在
          if (existingNames.includes(input.trim())) {
            return '该项目名称已经存在，请选择其他名称';
          }
          
          return true;
        }
      }
    ]);
    
    const project: Project = {
      name: nameAnswer.name.trim(),
      path: resolvedPath
    };
    
    await projectStore.addProject(project);
    Logger.success(`项目 "${project.name}" 添加成功！`);
    
  } catch (error) {
    if (error instanceof Error) {
      Logger.error(`添加项目失败: ${error.message}`);
    } else {
      Logger.error('添加项目失败: 未知错误');
    }
    process.exit(1);
  }
}