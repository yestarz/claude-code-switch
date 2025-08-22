import { ProjectStore } from '../core/ProjectStore';
import { Logger } from '../utils/logger';
import inquirer from 'inquirer';

export async function projectRemoveCommand(): Promise<void> {
  const projectStore = new ProjectStore();
  
  try {
    Logger.startSpinner('正在加载项目列表...');
    const projects = await projectStore.getProjects();
    Logger.stopSpinner();
    
    if (projects.length === 0) {
      Logger.info('暂无项目，请使用 "ccs project add" 命令添加项目');
      return;
    }
    
    const { projectName } = await inquirer.prompt([
      {
        type: 'list',
        name: 'projectName',
        message: '请选择要删除的项目：',
        choices: projects.map(p => ({
          name: `${p.name} (${p.path})`,
          value: p.name
        }))
      }
    ]);
    
    // 确认删除
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `确定要删除项目 "${projectName}" 吗？`,
        default: false
      }
    ]);
    
    if (!confirm) {
      Logger.info('取消删除操作');
      return;
    }
    
    await projectStore.removeProject(projectName);
    Logger.success(`项目 "${projectName}" 删除成功！`);
    
  } catch (error) {
    Logger.stopSpinner();
    if (error instanceof Error) {
      Logger.error(`删除项目失败: ${error.message}`);
    } else {
      Logger.error('删除项目失败: 未知错误');
    }
    process.exit(1);
  }
}