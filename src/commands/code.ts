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
    
    const currentPlatform = platform();
    let command: string;
    
    if (currentPlatform === 'win32') {
      // Windows 平台
      command = `start cmd.exe /k "cd /d "${project.path}" && echo 当前目录: %cd% && echo 正在启动 Claude... && claude"`;
    } else if (currentPlatform === 'darwin') {
      // macOS 平台
      command = `osascript -e 'tell app "Terminal" to do script "cd \\"${project.path}\\" && echo 当前目录: \\$(pwd) && echo 正在启动 Claude... && claude"'`;
    } else {
      // Linux 和其他 Unix-like 平台
      command = `gnome-terminal -- bash -c "cd '${project.path}' && echo 当前目录: \\$(pwd) && echo 正在启动 Claude... && claude; exec bash" || \
xterm -e "cd '${project.path}' && echo 当前目录: \\$(pwd) && echo 正在启动 Claude... && claude" || \
konsole -e "cd '${project.path}' && echo 当前目录: \\$(pwd) && echo 正在启动 Claude... && claude"`;
    }
    
    exec(command, (error) => {
      if (error) {
        Logger.error(`启动失败: ${error.message}`);
        Logger.info('请手动在终端中执行以下命令：');
        Logger.info(`cd "${project.path}" && claude`);
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