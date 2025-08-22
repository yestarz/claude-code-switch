import chalk from 'chalk';
import ora, { Ora } from 'ora';

export class Logger {
  private static spinner: Ora | null = null;

  static success(message: string): void {
    console.log(chalk.green('✔'), message);
  }

  static error(message: string): void {
    console.log(chalk.red('✖'), message);
  }

  static warning(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  static info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  static startSpinner(text: string): void {
    this.spinner = ora(text).start();
  }

  static stopSpinner(success: boolean = true): void {
    if (this.spinner) {
      if (success) {
        this.spinner.succeed();
      } else {
        this.spinner.fail();
      }
      this.spinner = null;
    }
  }

  static table(data: any[]): void {
    console.table(data);
  }

  static profileInfo(profile: any): void {
    console.log(chalk.cyan('配置名称:'), profile.name);
    if (profile.description) {
      console.log(chalk.cyan('描述:'), profile.description);
    }
    if (profile.tags && profile.tags.length > 0) {
      console.log(chalk.cyan('标签:'), profile.tags.join(', '));
    }
    console.log(chalk.cyan('创建时间:'), new Date(profile.createdAt).toLocaleString());
    console.log(chalk.cyan('更新时间:'), new Date(profile.updatedAt).toLocaleString());
    if (profile.secure) {
      console.log(chalk.cyan('安全存储:'), chalk.green('已启用'));
    }
    if (profile.isActive) {
      console.log(chalk.green('✔ 当前活跃配置'));
    }
  }

  static cyan(text: string): string {
    return chalk.cyan(text);
  }

  static dim(text: string): string {
    return chalk.dim(text);
  }
}