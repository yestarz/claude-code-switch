import { ProjectStore } from '../core/ProjectStore';
import { Logger } from '../utils/logger';
import inquirer from 'inquirer';
import { exec } from 'child_process';

export async function codeCommand(): Promise<void> {
  const projectStore = new ProjectStore();
  Logger.startSpinner('正在加载项目列表...');
  try {
    const projects = await projectStore.getProjects();
    Logger.stopSpinner();
    
    if (projects.length === 0) {
      Logger.info('暂无项目，请使用 "ccs project add" 命令添加项目');
      return;
    }
    
    const { projectName } = await inquirer.prompt([
      {
        type: 'list',
        name: 'projectName',
        message: '请选择要启动的项目：',
        choices: projects.map(p => ({
          name: `${p.name} (${p.path})`,
          value: p.name
        }))
      }
    ]);
    
    const project = projects.find(p => p.name === projectName);
    if (!project) {
      Logger.error('项目不存在');
      process.exit(1);
    }
    
    Logger.info(`正在启动项目 "${projectName}"...`);
    Logger.info(`项目路径: ${project.path}`);
    
    // 使用 start cmd.exe 在新窗口中打开项目目录并启动 Claude
    // 这样可以在新的终端窗口中保持正确的工作目录
    exec(`start cmd.exe /k "cd /d "${project.path}" && echo 当前目录: %cd% && echo 正在启动 Claude... && claude"`, (error) => {
      if (error) {
        Logger.error(`启动失败: ${error.message}`);
        process.exit(1);
      }
    });
    
    Logger.info('已在新窗口中启动 Claude，当前窗口将保持不变');
    
  } catch (error) {
    Logger.stopSpinner();
    if (error instanceof Error) {
      Logger.error(`启动项目失败: ${error.message}`);
    } else {
      Logger.error('启动项目失败: 未知错误');
    }
    process.exit(1);
  }
}