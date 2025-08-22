import { ProjectStore, Project } from '../core/ProjectStore';
import { Logger } from '../utils/logger';
import inquirer from 'inquirer';
import * as path from 'path';
import * as fs from 'fs-extra';

export async function projectAddCommand(): Promise<void> {
  const projectStore = new ProjectStore();
  
  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '请输入项目名称：',
        validate: (input: string) => {
          if (!input.trim()) {
            return '项目名称不能为空';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'projectPath',
        message: '请输入项目路径：',
        validate: async (input: string) => {
          if (!input.trim()) {
            return '项目路径不能为空';
          }
          
          // 验证路径是否存在
          const exists = await fs.pathExists(input);
          if (!exists) {
            return '项目路径不存在，请检查路径是否正确';
          }
          
          // 验证是否为目录
          const stats = await fs.stat(input);
          if (!stats.isDirectory()) {
            return '项目路径必须是目录';
          }
          
          return true;
        }
      }
    ]);
    
    const project: Project = {
      name: answers.name.trim(),
      path: path.resolve(answers.projectPath.trim())
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