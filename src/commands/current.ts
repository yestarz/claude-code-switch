import { ProfileStore } from '../core/ProfileStore';
import { Logger } from '../utils/logger';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';

export async function currentCommand(): Promise<void> {
  const store = new ProfileStore();
  
  try {
    // 读取当前的 settings.json
    const claudeDir = path.join(os.homedir(), '.claude');
    const settingsPath = path.join(claudeDir, 'settings.json');
    
    if (!await fs.pathExists(settingsPath)) {
      Logger.warning('没有找到 settings.json 文件');
      Logger.info('Claude Code 可能还未配置');
      return;
    }
    
    const currentSettings = await fs.readJson(settingsPath);
    const profiles = await store.getProfiles();
    
    // 查找匹配的配置
    let matchedProfile: string | null = null;
    
    for (const [key, profile] of Object.entries(profiles)) {
      // 比较主要字段来判断是否匹配
      const isMatch = JSON.stringify(profile) === JSON.stringify(currentSettings);
      
      if (isMatch) {
        matchedProfile = key;
        break;
      }
      
      // 如果完全匹配失败，尝试比较关键字段
      if (!matchedProfile && profile.env) {
        const sameToken = profile.env.ANTHROPIC_AUTH_TOKEN === currentSettings.env?.ANTHROPIC_AUTH_TOKEN;
        const sameUrl = profile.env.ANTHROPIC_BASE_URL === currentSettings.env?.ANTHROPIC_BASE_URL;
        const sameModel = profile.model === currentSettings.model;
        
        if (sameToken && sameUrl && sameModel) {
          matchedProfile = key;
          break;
        }
      }
    }
    
    console.log('');
    if (matchedProfile) {
      console.log(chalk.cyan('当前使用的配置:'), chalk.green.bold(matchedProfile));
      
      const profile = profiles[matchedProfile];
      if (profile.description) {
        console.log(chalk.gray('描述:'), profile.description);
      }
    } else {
      console.log(chalk.cyan('当前使用的配置:'), chalk.yellow('自定义配置'));
      console.log(chalk.gray('(不匹配 profiles-settings.json 中的任何配置)'));
    }
    
    // 显示当前配置的关键信息
    console.log('');
    console.log(chalk.cyan('配置详情:'));
    
    if (currentSettings.model) {
      console.log('  模型:', chalk.yellow(currentSettings.model));
    }
    
    if (currentSettings.env?.ANTHROPIC_BASE_URL) {
      console.log('  API 地址:', chalk.yellow(currentSettings.env.ANTHROPIC_BASE_URL));
    }
    
    if (currentSettings.env?.ANTHROPIC_AUTH_TOKEN) {
      const token = currentSettings.env.ANTHROPIC_AUTH_TOKEN;
      const maskedToken = token.substring(0, 10) + '...' + token.substring(token.length - 4);
      console.log('  API Key:', chalk.gray(maskedToken));
    }
    
    if (currentSettings.env?.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC) {
      console.log('  禁用非必要流量:', chalk.yellow('是'));
    }
    
    console.log('');
    console.log(chalk.gray(`配置文件: ${settingsPath}`));
    console.log('');
    
  } catch (error: any) {
    Logger.error(`获取当前配置失败: ${error.message}`);
    process.exit(1);
  }
}