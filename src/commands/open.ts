import { ProfileStore } from '../core/ProfileStore';
import { Logger } from '../utils/logger';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';

const execAsync = promisify(exec);

export async function openCommand(): Promise<void> {
  const store = new ProfileStore();
  
  try {
    await store.ensureFile();
    const settingsPath = store.getSettingsPath();
    
    // 确保文件存在且有默认内容
    if (!await fs.pathExists(settingsPath)) {
      await fs.writeJson(settingsPath, {
        "example": {
          "env": {
            "ANTHROPIC_AUTH_TOKEN": "your-api-key",
            "ANTHROPIC_BASE_URL": "https://api.anthropic.com"
          },
          "model": "opus"
        }
      }, { spaces: 2 });
    }
    
    Logger.info(`打开配置文件: ${settingsPath}`);
    
    // 根据操作系统选择编辑器
    let command: string;
    
    if (process.platform === 'darwin') {
      // macOS - 尝试使用默认编辑器，失败则用 open 命令
      const editor = process.env.EDITOR || process.env.VISUAL;
      if (editor) {
        command = `${editor} "${settingsPath}"`;
      } else {
        command = `open -t "${settingsPath}"`;
      }
    } else if (process.platform === 'win32') {
      // Windows
      command = `notepad "${settingsPath}"`;
    } else {
      // Linux
      const editor = process.env.EDITOR || process.env.VISUAL || 'nano';
      command = `${editor} "${settingsPath}"`;
    }
    
    // 执行打开命令
    await execAsync(command);
    
    Logger.success('配置文件已打开');
    Logger.info('编辑完成后保存文件即可');
    
  } catch (error: any) {
    Logger.error(`打开配置文件失败: ${error.message}`);
    
    // 如果打开失败，显示文件路径让用户手动打开
    Logger.info(`请手动打开文件: ${store.getSettingsPath()}`);
    process.exit(1);
  }
}