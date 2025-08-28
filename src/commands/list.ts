import { ProfileStore } from '../core/ProfileStore';
import { Logger } from '../utils/logger';
import chalk from 'chalk';

export async function listCommand(): Promise<void> {
  const store = new ProfileStore();
  
  try {
    const keys = await store.listKeys();
    
    if (keys.length === 0) {
      Logger.info('没有找到配置');
      Logger.info(`配置文件位置: ${store.getSettingsPath()}`);
      Logger.info('使用 "ccs open" 打开配置文件进行编辑');
      Logger.info('使用 "ccs ui" 打开Web UI进行编辑');
      return;
    }
    
    console.log(chalk.cyan('\n配置列表:'));
    console.log(chalk.cyan('─'.repeat(30)));
    
    keys.forEach((key, index) => {
      console.log(`  ${chalk.green(`${index + 1}.`)} ${chalk.yellow(key)}`);
    });
    
    console.log(chalk.cyan('─'.repeat(30)));
    console.log(chalk.gray(`\n配置文件: ${store.getSettingsPath()}`));
    console.log(chalk.gray('使用 "ccs open" 编辑配置\n'));
    
  } catch (error: any) {
    Logger.error(`列出配置失败: ${error.message}`);
    process.exit(1);
  }
}