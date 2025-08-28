import { ProjectStore } from '../core/ProjectStore';
import { Logger } from '../utils/logger';
import inquirer from 'inquirer';
import * as process from 'process';

export async function projectCdCommand(): Promise<void> {
  const projectStore = new ProjectStore();
  
  try {
    Logger.startSpinner('正在加载项目列表...');
    const projects = await projectStore.getProjects();
    Logger.stopSpinner();
    
    if (projects.length === 0) {
      Logger.info('暂无项目，请使用 "ccs project add" 命令添加项目');
      return;
    }
    
    // 使用 inquirer 选择项目
    const choices = projects.map((project, index) => ({
      name: `${project.name} (${project.path})`,
      value: project.path,
      short: project.name
    }));
    
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedPath',
        message: '请选择要切换到的项目目录：',
        choices: choices,
        pageSize: Math.min(10, choices.length)
      }
    ]);
    
    // 生成切换目录的命令
    const selectedPath = answer.selectedPath;
    const selectedProject = projects.find(p => p.path === selectedPath);
    
    try {
      // 检查目录是否存在
      const fs = require('fs-extra');
      const pathExists = await fs.pathExists(selectedPath);
      if (!pathExists) {
        Logger.error(`项目目录不存在: ${selectedPath}`);
        return;
      }
      
      Logger.success(`选择的项目: ${selectedProject?.name || ''}`);
      Logger.info(`项目路径: ${selectedPath}`);
      
      // 显示目录内容
      console.log();
      Logger.info('目录内容：');
      const { execSync } = require('child_process');
      
      try {
        // Windows 和 Unix 系统使用不同的命令
        const isWindows = process.platform === 'win32';
        const listCommand = isWindows ? 'dir /b' : 'ls -la';
        const output = execSync(listCommand, { 
          cwd: selectedPath, 
          encoding: 'utf8',
          maxBuffer: 1024 * 1024 
        });
        
        if (output.trim()) {
          console.log(Logger.dim(output.trim()));
        } else {
          console.log(Logger.dim('目录为空'));
        }
      } catch (dirError) {
        Logger.warning('无法列出目录内容');
      }
      
      // 提供切换目录的方法
      console.log();
      
      const isWindows = process.platform === 'win32';
      
      if (isWindows) {
        // Windows 系统
        Logger.info('要切换到此目录，请执行以下命令：');
        console.log(Logger.cyan(`cd /d "${selectedPath}"`));
        
        // 提供直接执行选项
        const executeNow = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: '选择操作：',
            choices: [
              { name: '在新的 CMD 窗口中打开此目录', value: 'new_shell' },
              { name: '在文件管理器中打开', value: 'explorer' },
              { name: '显示切换命令', value: 'show_command' }
            ]
          }
        ]);
        
        if (executeNow.action === 'new_shell') {
          try {
            // 在新的 CMD 窗口中打开指定目录
            execSync(`start cmd /k "cd /d "${selectedPath}" && echo 已切换到项目目录: ${selectedProject?.name || ''}"`, { stdio: 'ignore' });
            Logger.success('已在新的 CMD 窗口中打开项目目录');
          } catch (error) {
            Logger.warning('无法打开新的 CMD 窗口');
          }
        } else if (executeNow.action === 'explorer') {
          try {
            execSync(`explorer "${selectedPath}"`, { stdio: 'ignore' });
            Logger.success('已在文件管理器中打开项目目录');
          } catch (error) {
            Logger.warning('无法打开文件管理器');
          }
        } else {
          console.log();
          Logger.info('复制并执行以下命令来切换目录：');
          console.log(Logger.cyan(`cd /d "${selectedPath}"`));
        }
      } else {
        // Unix/Linux 系统
        Logger.info('要切换到此目录，请执行以下命令：');
        console.log(Logger.cyan(`cd "${selectedPath}"`));
        
        // 提供多种选项
        const executeNow = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: '选择操作：',
            choices: [
              { name: '在新的终端窗口中打开此目录', value: 'new_terminal' },
              { name: '复制路径到剪贴板 (需要 xclip)', value: 'copy_path' },
              { name: '显示切换命令', value: 'show_command' }
            ]
          }
        ]);
        
        if (executeNow.action === 'new_terminal') {
          try {
            // 尝试不同的终端程序
            const terminals = [
              { cmd: 'gnome-terminal', args: `--working-directory="${selectedPath}"` },
              { cmd: 'konsole', args: `--workdir "${selectedPath}"` },
              { cmd: 'xfce4-terminal', args: `--working-directory="${selectedPath}"` },
              { cmd: 'mate-terminal', args: `--working-directory="${selectedPath}"` },
              { cmd: 'terminator', args: `--working-directory="${selectedPath}"` },
              { cmd: 'xterm', args: `-e "cd '${selectedPath}' && bash"` }
            ];
            
            let terminalOpened = false;
            for (const terminal of terminals) {
              try {
                execSync(`which ${terminal.cmd}`, { stdio: 'ignore' });
                execSync(`${terminal.cmd} ${terminal.args} &`, { stdio: 'ignore' });
                Logger.success(`已在新的 ${terminal.cmd} 窗口中打开项目目录`);
                terminalOpened = true;
                break;
              } catch (e) {
                // 尝试下一个终端
                continue;
              }
            }
            
            if (!terminalOpened) {
              Logger.warning('未找到支持的终端程序，请手动执行命令');
              console.log(Logger.cyan(`cd "${selectedPath}"`));
            }
          } catch (error) {
            Logger.warning('无法打开新终端窗口');
          }
        } else if (executeNow.action === 'copy_path') {
          try {
            execSync(`echo "${selectedPath}" | xclip -selection clipboard`, { stdio: 'ignore' });
            Logger.success('路径已复制到剪贴板');
            Logger.info('现在可以执行: cd <Ctrl+V>');
          } catch (error) {
            try {
              // 尝试使用 xsel
              execSync(`echo "${selectedPath}" | xsel --clipboard --input`, { stdio: 'ignore' });
              Logger.success('路径已复制到剪贴板 (使用 xsel)');
              Logger.info('现在可以执行: cd <Ctrl+V>');
            } catch (error2) {
              Logger.warning('无法复制到剪贴板，需要安装 xclip 或 xsel');
              Logger.info('路径：');
              console.log(Logger.cyan(selectedPath));
            }
          }
        } else {
          console.log();
          Logger.info('复制并执行以下命令来切换目录：');
          console.log(Logger.cyan(`cd "${selectedPath}"`));
        }
      }
      
    } catch (error) {
      if (error instanceof Error) {
        Logger.error(`操作失败: ${error.message}`);
      } else {
        Logger.error('操作失败: 未知错误');
      }
      process.exit(1);
    }
    
  } catch (error) {
    Logger.stopSpinner();
    if (error instanceof Error) {
      Logger.error(`操作失败: ${error.message}`);
    } else {
      Logger.error('操作失败: 未知错误');
    }
    process.exit(1);
  }
}
