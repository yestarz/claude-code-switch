#!/usr/bin/env node

import { Command } from 'commander';
import { listCommand } from './commands/list';
import { openCommand } from './commands/open';
import { switchCommand } from './commands/switch';
import { currentCommand } from './commands/current';
import { uiCommand } from './commands/ui';
import chalk from 'chalk';

const program = new Command();

program
  .name('ccs')
  .description('Claude Code 配置管理工具 - 管理多个配置文件')
  .version('2.4.0', '-v, --version', '显示版本号');

// list 命令 - 列出所有配置
program
  .command('list')
  .alias('ls')
  .description('列出所有配置名称')
  .action(async () => {
    await listCommand();
  });

// open 命令 - 打开配置文件
program
  .command('open')
  .description('打开配置文件进行编辑')
  .action(async () => {
    await openCommand();
  });

// switch 命令 - 切换配置
program
  .command('switch [profile]')
  .alias('use')
  .description('切换到指定配置（不指定则显示选择列表）')
  .action(async (profile?: string) => {
    await switchCommand(profile);
  });

// current 命令 - 显示当前配置
program
  .command('current')
  .alias('now')
  .description('显示当前使用的配置')
  .action(async () => {
    await currentCommand();
  });

// ui 命令 - 打开 Web UI 界面
program
  .command('ui')
  .description('打开 Web UI 配置管理界面')
  .action(async () => {
    await uiCommand();
  });

// 默认命令 - 显示帮助
program
  .action(() => {
    program.help();
  });

// 错误处理
program.on('command:*', () => {
  console.error(chalk.red(`无效命令: ${program.args.join(' ')}`));
  console.log(chalk.yellow('使用 "ccs --help" 查看可用命令'));
  process.exit(1);
});

// 主函数
async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (error: any) {
    console.error(chalk.red(`错误: ${error.message}`));
    process.exit(1);
  }
}

// 运行
main().catch((error) => {
  console.error(chalk.red(`未捕获的错误: ${error.message}`));
  process.exit(1);
});