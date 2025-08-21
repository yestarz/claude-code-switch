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
  app.get('/', (req, res) => {
    res.send(getHTMLTemplate());
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

function getHTMLTemplate(): string {
  return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Code Switch - 配置管理</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        :root {
            --primary-color: #6366f1;
            --primary-dark: #4f46e5;
            --secondary-color: #f43f5e;
            --success-color: #10b981;
            --warning-color: #f59e0b;
            --danger-color: #ef4444;
            --background: #0f0f23;
            --surface: #1a1a2e;
            --surface-light: #16213e;
            --text-primary: #ffffff;
            --text-secondary: #94a3b8;
            --border-color: #334155;
            --shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            --shadow-lg: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
            color: var(--text-primary);
            line-height: 1.6;
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 80% 80%, rgba(244, 63, 94, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 40% 60%, rgba(16, 185, 129, 0.05) 0%, transparent 50%);
            pointer-events: none;
            z-index: -1;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
            position: relative;
            z-index: 1;
        }
        
        .header {
            text-align: center;
            margin-bottom: 3rem;
            padding: 2.5rem;
            background: rgba(26, 26, 46, 0.8);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            border: 1px solid rgba(99, 102, 241, 0.2);
            box-shadow: var(--shadow-lg);
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 200%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.1), transparent);
            animation: shimmer 3s infinite;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .header h1 {
            font-size: 3rem;
            font-weight: 700;
            background: linear-gradient(135deg, #6366f1, #f43f5e, #10b981);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: gradient-shift 4s ease-in-out infinite;
            margin-bottom: 1rem;
            position: relative;
            z-index: 1;
        }
        
        @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }
        
        .header p {
            font-size: 1.2rem;
            color: var(--text-secondary);
            margin-bottom: 1.5rem;
            position: relative;
            z-index: 1;
        }
        
        .current-profile {
            background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1));
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 12px;
            padding: 1rem 1.5rem;
            margin: 1rem 0;
            display: inline-block;
            position: relative;
            z-index: 1;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
        }
        
        .current-profile:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(16, 185, 129, 0.2);
        }
        
        .profiles-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }
        
        .profile-card {
            background: rgba(26, 26, 46, 0.8);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            padding: 2rem;
            border: 1px solid var(--border-color);
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        
        .profile-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(244, 63, 94, 0.1));
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }
        
        .profile-card:hover::before {
            opacity: 1;
        }
        
        .profile-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: var(--shadow-lg);
            border-color: var(--primary-color);
        }
        
        .profile-card.current {
            border-color: var(--success-color);
            box-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
            animation: pulse-glow 2s infinite;
        }
        
        @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.3); }
            50% { box-shadow: 0 0 40px rgba(16, 185, 129, 0.5); }
        }
        
        .profile-card h3 {
            color: var(--text-primary);
            margin-bottom: 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 600;
            font-size: 1.3rem;
            position: relative;
            z-index: 1;
        }
        
        .profile-details {
            background: rgba(15, 15, 35, 0.8);
            padding: 1.5rem;
            border-radius: 12px;
            margin: 1rem 0;
            font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
            font-size: 0.85rem;
            white-space: pre-wrap;
            overflow-x: auto;
            border: 1px solid rgba(99, 102, 241, 0.2);
            color: var(--text-secondary);
            position: relative;
            z-index: 1;
        }
        
        .actions {
            display: flex;
            gap: 0.75rem;
            margin-top: 1.5rem;
            position: relative;
            z-index: 1;
        }
        
        .btn {
            background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 0.9rem;
            font-weight: 500;
            position: relative;
            overflow: hidden;
            min-width: 80px;
        }
        
        .btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        
        .btn:hover::before {
            left: 100%;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
        }
        
        .btn:active {
            transform: translateY(0);
        }
        
        .btn.success {
            background: linear-gradient(135deg, var(--success-color), #059669);
        }
        
        .btn.success:hover {
            box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
        }
        
        .btn.danger {
            background: linear-gradient(135deg, var(--danger-color), #dc2626);
        }
        
        .btn.danger:hover {
            box-shadow: 0 10px 25px rgba(239, 68, 68, 0.4);
        }
        
        .btn.secondary {
            background: linear-gradient(135deg, #64748b, #475569);
        }
        
        .btn.secondary:hover {
            box-shadow: 0 10px 25px rgba(100, 116, 139, 0.4);
        }
        
        .btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
        }
        
        .add-profile {
            background: rgba(26, 26, 46, 0.6);
            backdrop-filter: blur(20px);
            border: 2px dashed rgba(99, 102, 241, 0.4);
            border-radius: 20px;
            padding: 3rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        
        .add-profile::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(244, 63, 94, 0.1));
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .add-profile:hover::before {
            opacity: 1;
        }
        
        .add-profile:hover {
            border-color: var(--primary-color);
            transform: translateY(-4px);
            box-shadow: var(--shadow);
        }
        
        .add-profile h3 {
            font-size: 1.5rem;
            margin-bottom: 0.5rem;
            position: relative;
            z-index: 1;
        }
        
        .add-profile p {
            color: var(--text-secondary);
            position: relative;
            z-index: 1;
        }
        
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .modal-content {
            background: var(--surface);
            margin: 5% auto;
            padding: 2.5rem;
            border-radius: 20px;
            width: 90%;
            max-width: 700px;
            max-height: 85vh;
            overflow-y: auto;
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow-lg);
            animation: slideIn 0.3s ease;
            position: relative;
        }
        
        @keyframes slideIn {
            from { transform: translateY(-50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .form-group {
            margin-bottom: 1.5rem;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: var(--text-primary);
        }
        
        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 1rem 1.25rem;
            background: rgba(15, 15, 35, 0.8);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            font-size: 0.95rem;
            color: var(--text-primary);
            transition: all 0.3s ease;
        }
        
        .form-group input:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        
        .form-group textarea {
            min-height: 250px;
            font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
            line-height: 1.4;
        }
        
        .message {
            padding: 1rem 1.25rem;
            margin: 1rem 0;
            border-radius: 12px;
            display: none;
            border: 1px solid;
            animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
            from { transform: translateY(-10px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .message.success {
            background: rgba(16, 185, 129, 0.1);
            color: var(--success-color);
            border-color: rgba(16, 185, 129, 0.3);
        }
        
        .message.error {
            background: rgba(239, 68, 68, 0.1);
            color: var(--danger-color);
            border-color: rgba(239, 68, 68, 0.3);
        }
        
        .loading {
            text-align: center;
            padding: 3rem;
            color: var(--text-secondary);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .close {
            color: var(--text-secondary);
            float: right;
            font-size: 2rem;
            font-weight: bold;
            cursor: pointer;
            line-height: 1;
            transition: all 0.3s ease;
        }
        
        .close:hover {
            color: var(--danger-color);
            transform: rotate(90deg);
        }
        
        /* 滚动条样式 */
        ::-webkit-scrollbar {
            width: 8px;
        }
        
        ::-webkit-scrollbar-track {
            background: rgba(15, 15, 35, 0.5);
        }
        
        ::-webkit-scrollbar-thumb {
            background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
            border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(135deg, var(--primary-dark), var(--secondary-color));
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            .header {
                padding: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .profiles-container {
                grid-template-columns: 1fr;
                gap: 1.5rem;
            }
            
            .profile-card {
                padding: 1.5rem;
            }
            
            .actions {
                flex-wrap: wrap;
            }
            
            .modal-content {
                width: 95%;
                margin: 10% auto;
                padding: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎛️ Claude Code Switch</h1>
            <p>炫酷的配置管理界面</p>
            <div id="currentProfile" class="current-profile">
                当前配置: <span id="currentName">加载中...</span>
            </div>
        </div>
        
        <div id="message" class="message"></div>
        
        <div id="profilesContainer" class="profiles-container">
            <div class="loading">正在加载配置...</div>
        </div>
        
        <div class="add-profile" onclick="openAddModal()">
            <h3>✨ 添加新配置</h3>
            <p>点击创建炫酷的新配置</p>
        </div>
    </div>
    
    <!-- 编辑/添加配置的模态框 -->
    <div id="editModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <h2 id="modalTitle">编辑配置</h2>
            <form id="profileForm">
                <div class="form-group">
                    <label for="profileKey">配置名称:</label>
                    <input type="text" id="profileKey" required>
                </div>
                <div class="form-group">
                    <label for="profileData">配置内容 (JSON 格式):</label>
                    <textarea id="profileData" placeholder='{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "your-api-key"
  },
  "model": "sonnet"
}'></textarea>
                </div>
                <div class="actions">
                    <button type="submit" class="btn success">💾 保存</button>
                    <button type="button" class="btn secondary" onclick="closeModal()">❌ 取消</button>
                </div>
            </form>
        </div>
    </div>
    
    <script>
        let profiles = {};
        let currentProfile = '';
        let editingKey = null;
        
        // 加载数据
        async function loadData() {
            try {
                await Promise.all([loadProfiles(), loadCurrent()]);
                renderProfiles();
            } catch (error) {
                showMessage('加载数据失败: ' + error.message, 'error');
            }
        }
        
        async function loadProfiles() {
            const response = await fetch('/api/profiles');
            if (!response.ok) throw new Error('获取配置失败');
            profiles = await response.json();
        }
        
        async function loadCurrent() {
            const response = await fetch('/api/current');
            if (!response.ok) throw new Error('获取当前配置失败');
            const data = await response.json();
            currentProfile = data.current;
            document.getElementById('currentName').textContent = currentProfile || '无';
        }
        
        function renderProfiles() {
            const container = document.getElementById('profilesContainer');
            
            if (Object.keys(profiles).length === 0) {
                container.innerHTML = '<div class="loading">暂无配置，请添加新配置 ✨</div>';
                return;
            }
            
            container.innerHTML = Object.entries(profiles).map(([key, profile]) => {
                const isCurrent = key === currentProfile;
                return \`
                    <div class="profile-card \${isCurrent ? 'current' : ''}">
                        <h3>
                            \${key} \${isCurrent ? '🟢' : '⚪'}
                            <span style="font-size: 0.8rem; color: var(--text-secondary);">
                                \${isCurrent ? '(当前使用)' : ''}
                            </span>
                        </h3>
                        <div class="profile-details">\${JSON.stringify(profile, null, 2)}</div>
                        <div class="actions">
                            <button class="btn success" onclick="switchProfile('\${key}')" \${isCurrent ? 'disabled' : ''}>
                                \${isCurrent ? '✅ 已选中' : '🚀 切换'}
                            </button>
                            <button class="btn" onclick="editProfile('\${key}')">✏️ 编辑</button>
                            <button class="btn danger" onclick="deleteProfile('\${key}')">🗑️ 删除</button>
                        </div>
                    </div>
                \`;
            }).join('');
        }
        
        async function switchProfile(key) {
            try {
                const response = await fetch(\`/api/switch/\${key}\`, {
                    method: 'POST'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error);
                }
                
                const result = await response.json();
                showMessage(result.message, 'success');
                await loadCurrent();
                renderProfiles();
            } catch (error) {
                showMessage('切换失败: ' + error.message, 'error');
            }
        }
        
        async function deleteProfile(key) {
            if (!confirm(\`确定要删除配置 "\${key}" 吗？\`)) return;
            
            try {
                const response = await fetch(\`/api/profiles/\${key}\`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error);
                }
                
                const result = await response.json();
                showMessage(result.message, 'success');
                await loadProfiles();
                renderProfiles();
            } catch (error) {
                showMessage('删除失败: ' + error.message, 'error');
            }
        }
        
        function editProfile(key) {
            editingKey = key;
            document.getElementById('modalTitle').textContent = '✏️ 编辑配置';
            document.getElementById('profileKey').value = key;
            document.getElementById('profileKey').disabled = true;
            document.getElementById('profileData').value = JSON.stringify(profiles[key], null, 2);
            document.getElementById('editModal').style.display = 'block';
        }
        
        function openAddModal() {
            editingKey = null;
            document.getElementById('modalTitle').textContent = '✨ 添加新配置';
            document.getElementById('profileKey').value = '';
            document.getElementById('profileKey').disabled = false;
            document.getElementById('profileData').value = JSON.stringify({
                env: {
                    ANTHROPIC_AUTH_TOKEN: "your-api-key"
                },
                model: "sonnet"
            }, null, 2);
            document.getElementById('editModal').style.display = 'block';
        }
        
        function closeModal() {
            document.getElementById('editModal').style.display = 'none';
        }
        
        async function saveProfile(event) {
            event.preventDefault();
            
            const key = document.getElementById('profileKey').value.trim();
            const dataText = document.getElementById('profileData').value.trim();
            
            if (!key) {
                showMessage('请输入配置名称', 'error');
                return;
            }
            
            try {
                const profileData = JSON.parse(dataText);
                
                // 更新本地数据
                profiles[key] = profileData;
                
                // 保存到服务器
                const response = await fetch('/api/profiles', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(profiles)
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error);
                }
                
                const result = await response.json();
                showMessage(result.message, 'success');
                closeModal();
                renderProfiles();
            } catch (error) {
                if (error instanceof SyntaxError) {
                    showMessage('JSON 格式错误，请检查配置内容', 'error');
                } else {
                    showMessage('保存失败: ' + error.message, 'error');
                }
            }
        }
        
        function showMessage(text, type) {
            const messageEl = document.getElementById('message');
            messageEl.textContent = text;
            messageEl.className = 'message ' + type;
            messageEl.style.display = 'block';
            
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 5000);
        }
        
        // 事件监听
        document.getElementById('profileForm').addEventListener('submit', saveProfile);
        
        // 点击模态框外部关闭
        window.onclick = function(event) {
            const modal = document.getElementById('editModal');
            if (event.target === modal) {
                closeModal();
            }
        }
        
        // 页面加载时获取数据
        loadData();
        
        // 每10秒刷新一次当前配置状态
        setInterval(loadCurrent, 10000);
    </script>
</body>
</html>`;
}