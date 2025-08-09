import { ProfileStore } from '../core/ProfileStore';
import { Logger } from '../utils/logger';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import inquirer from 'inquirer';
import chalk from 'chalk';

export async function switchCommand(profileKey?: string): Promise<void> {
  const store = new ProfileStore();
  
  try {
    const profiles = await store.getProfiles();
    const keys = Object.keys(profiles);
    
    if (keys.length === 0) {
      Logger.warning('没有找到任何配置');
      Logger.info('请先在配置文件中添加配置');
      Logger.info(`配置文件: ${store.getSettingsPath()}`);
      return;
    }
    
    // 如果没有指定配置，显示交互式选择
    let selectedKey = profileKey;
    
    if (!selectedKey) {
      const choices = keys.map(key => {
        const profile = profiles[key];
        let description = '';
        
        // 尝试获取描述信息
        if (profile.description) {
          description = ` - ${profile.description}`;
        } else if (profile.env?.ANTHROPIC_BASE_URL) {
          description = ` - ${profile.env.ANTHROPIC_BASE_URL}`;
        } else if (profile.model) {
          description = ` - ${profile.model}`;
        }
        
        return {
          name: `${chalk.yellow(key)}${chalk.gray(description)}`,
          value: key
        };
      });
      
      const { selected } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selected',
          message: '请选择要切换的配置:',
          choices,
          pageSize: 10
        }
      ]);
      
      selectedKey = selected;
    }
    
    // 验证配置是否存在
    if (!selectedKey || !profiles[selectedKey]) {
      Logger.error(`配置 "${selectedKey}" 不存在`);
      Logger.info('可用的配置:');
      keys.forEach(key => {
        Logger.info(`  - ${key}`);
      });
      return;
    }
    
    // 获取选中的配置
    const selectedProfile = profiles[selectedKey];
    
    // 更新 settings.json
    const claudeDir = path.join(os.homedir(), '.claude');
    const settingsPath = path.join(claudeDir, 'settings.json');
    
    Logger.startSpinner(`切换到配置 "${selectedKey}"...`);
    
    // 写入 settings.json
    await fs.writeJson(settingsPath, selectedProfile, { spaces: 2 });
    
    // 如果有 env 配置，同时更新 providers.json
    if (selectedProfile.env?.ANTHROPIC_BASE_URL || selectedProfile.env?.ANTHROPIC_AUTH_TOKEN) {
      const providersPath = path.join(claudeDir, 'providers.json');
      
      if (await fs.pathExists(providersPath)) {
        const providers = await fs.readJson(providersPath);
        
        // 更新 anthropic 配置
        providers.anthropic = {
          base_url: selectedProfile.env.ANTHROPIC_BASE_URL || providers.anthropic?.base_url,
          api_key: selectedProfile.env.ANTHROPIC_AUTH_TOKEN || providers.anthropic?.api_key
        };
        
        await fs.writeJson(providersPath, providers, { spaces: 2 });
      }
    }
    
    Logger.stopSpinner();
    Logger.success(`已切换到配置: ${chalk.green(selectedKey)}`);
    
    // 显示配置信息
    if (selectedProfile.model) {
      Logger.info(`模型: ${selectedProfile.model}`);
    }
    if (selectedProfile.env?.ANTHROPIC_BASE_URL) {
      Logger.info(`API 地址: ${selectedProfile.env.ANTHROPIC_BASE_URL}`);
    }
    
  } catch (error: any) {
    Logger.stopSpinner(false);
    Logger.error(`切换配置失败: ${error.message}`);
    process.exit(1);
  }
}