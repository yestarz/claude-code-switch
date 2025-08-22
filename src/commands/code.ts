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
      // 首先尝试检测可用的终端
      const terminals = [
        { name: 'gnome-terminal', cmd: 'gnome-terminal -- bash -c "{command}; exec bash"' },
        { name: 'xterm', cmd: 'xterm -e "{command}"' },
        { name: 'konsole', cmd: 'konsole -e "{command}"' },
        { name: 'xfce4-terminal', cmd: 'xfce4-terminal -e "{command}"' },
        { name: 'mate-terminal', cmd: 'mate-terminal -e "{command}"' },
        { name: 'lxterminal', cmd: 'lxterminal -e "{command}"' },
      ];
      
      const shellCommand = `cd '${project.path}' && echo 当前目录: \\$(pwd) && echo 正在启动 Claude... && claude`;
      
      // 尝试使用默认终端，如果失败则提供手动执行方案
      command = `which gnome-terminal > /dev/null 2>&1 && gnome-terminal -- bash -c "${shellCommand}; exec bash" || \
which xterm > /dev/null 2>&1 && xterm -e "${shellCommand}" || \
which konsole > /dev/null 2>&1 && konsole -e "${shellCommand}" || \
which xfce4-terminal > /dev/null 2>&1 && xfce4-terminal -e "${shellCommand}" || \
which mate-terminal > /dev/null 2>&1 && mate-terminal -e "${shellCommand}" || \
which lxterminal > /dev/null 2>&1 && lxterminal -e "${shellCommand}" || \
(echo "未找到支持的终端模拟器" && false)`;
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