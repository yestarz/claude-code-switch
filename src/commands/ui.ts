import express from 'express';
import cors from 'cors';
import open from 'open';
import { ProfileStore, ProfileSettings } from '../core/ProfileStore';
import { Logger } from '../utils/logger';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

const PORT = 3456;

export async function uiCommand(): Promise<void> {
  const store = new ProfileStore();
  const app = express();

  app.use(cors());
  app.use(express.json());

  // API 接口
  // 获取所有配置
  app.get('/api/profiles', async (req, res) => {
    try {
      const profiles = await store.getProfiles();
      res.json(profiles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 获取当前配置
  app.get('/api/current', async (req, res) => {
    try {
      const claudeDir = path.join(os.homedir(), '.claude');
      const settingsPath = path.join(claudeDir, 'settings.json');
      
      if (await fs.pathExists(settingsPath)) {
        const currentSettings = await fs.readJson(settingsPath);
        
        // 通过比较找到匹配的配置
        const profiles = await store.getProfiles();
        let currentProfile = '';
        
        for (const [key, profile] of Object.entries(profiles)) {
          if (JSON.stringify(profile) === JSON.stringify(currentSettings)) {
            currentProfile = key;
            break;
          }
        }
        
        res.json({ 
          current: currentProfile,
          settings: currentSettings 
        });
      } else {
        res.json({ current: '', settings: {} });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 切换配置
  app.post('/api/switch/:profileKey', async (req, res) => {
    try {
      const { profileKey } = req.params;
      const profiles = await store.getProfiles();
      
      if (!profiles[profileKey]) {
        return res.status(404).json({ error: `配置 "${profileKey}" 不存在` });
      }
      
      const selectedProfile = profiles[profileKey];
      const claudeDir = path.join(os.homedir(), '.claude');
      const settingsPath = path.join(claudeDir, 'settings.json');
      
      await fs.writeJson(settingsPath, selectedProfile, { spaces: 2 });
      
      // 如果有 env 配置，同时更新 providers.json
      if (selectedProfile.env?.ANTHROPIC_BASE_URL || selectedProfile.env?.ANTHROPIC_AUTH_TOKEN) {
        const providersPath = path.join(claudeDir, 'providers.json');
        
        if (await fs.pathExists(providersPath)) {
          const providers = await fs.readJson(providersPath);
          
          providers.anthropic = {
            base_url: selectedProfile.env.ANTHROPIC_BASE_URL || providers.anthropic?.base_url,
            api_key: selectedProfile.env.ANTHROPIC_AUTH_TOKEN || providers.anthropic?.api_key
          };
          
          await fs.writeJson(providersPath, providers, { spaces: 2 });
        }
      }
      
      res.json({ success: true, message: `已切换到配置: ${profileKey}` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 保存配置
  app.post('/api/profiles', async (req, res) => {
    try {
      const profiles = req.body;
      const settingsPath = store.getSettingsPath();
      await fs.writeJson(settingsPath, profiles, { spaces: 2 });
      res.json({ success: true, message: '配置已保存' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 删除配置
  app.delete('/api/profiles/:profileKey', async (req, res) => {
    try {
      const { profileKey } = req.params;
      const profiles = await store.getProfiles();
      
      if (!profiles[profileKey]) {
        return res.status(404).json({ error: `配置 "${profileKey}" 不存在` });
      }
      
      delete profiles[profileKey];
      const settingsPath = store.getSettingsPath();
      await fs.writeJson(settingsPath, profiles, { spaces: 2 });
      
      res.json({ success: true, message: `已删除配置: ${profileKey}` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 静态文件 - HTML 界面
  app.get('/', async (req, res) => {
    try {
      const htmlPath = path.join(__dirname, '..', 'ui', 'index.html');
      const htmlContent = await fs.readFile(htmlPath, 'utf-8');
      res.send(htmlContent);
    } catch (error: any) {
      res.status(500).send(`读取 HTML 文件失败: ${error.message}`);
    }
  });

  // 启动服务器
  const server = app.listen(PORT, () => {
    Logger.success(`Web UI 已启动: http://localhost:${PORT}`);
    Logger.info('按 Ctrl+C 停止服务器');
    
    // 自动打开浏览器
    open(`http://localhost:${PORT}`);
  });

  // 优雅关闭
  process.on('SIGINT', () => {
    Logger.info('\n正在关闭服务器...');
    server.close(() => {
      Logger.success('服务器已关闭');
      process.exit(0);
    });
  });
}