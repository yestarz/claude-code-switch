import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

export interface ProfileSettings {
  [key: string]: any;
}

export class ProfileStore {
  private readonly settingsPath: string;

  constructor() {
    const homeDir = os.homedir();
    this.settingsPath = path.join(homeDir, '.claude', 'profiles-settings.json');
  }

  async ensureFile(): Promise<void> {
    const dir = path.dirname(this.settingsPath);
    await fs.ensureDir(dir);
    
    if (!await fs.pathExists(this.settingsPath)) {
      await fs.writeJson(this.settingsPath, {}, { spaces: 2 });
    }
  }

  async getProfiles(): Promise<ProfileSettings> {
    await this.ensureFile();
    return await fs.readJson(this.settingsPath);
  }

  async listKeys(): Promise<string[]> {
    const profiles = await this.getProfiles();
    return Object.keys(profiles);
  }

  getSettingsPath(): string {
    return this.settingsPath;
  }
}