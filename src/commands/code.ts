import { ProjectStore } from '../core/ProjectStore';
import { Logger } from '../utils/logger';
import inquirer from 'inquirer';
import { exec } from 'child_process';
import { platform } from 'os';

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
    
    // 直接切换到目标目录并启动 Claude
    process.chdir(project.path);
    
    Logger.info(`已切换到项目目录: ${process.cwd()}`);
    Logger.info('正在启动 Claude...');
    
    // 使用 spawn 启动 Claude，这样会替换当前进程
    const { spawn } = require('child_process');
    const claude = spawn('claude', [], { 
      stdio: 'inherit',
      shell: true
    });
    
    claude.on('error', (error: any) => {
      Logger.error(`启动 Claude 失败: ${error.message}`);
      Logger.info('请确保已正确安装 Claude CLI 工具');
      process.exit(1);
    });
    
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