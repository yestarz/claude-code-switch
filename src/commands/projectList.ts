import { ProjectStore } from '../core/ProjectStore';
import { Logger } from '../utils/logger';

export async function projectListCommand(): Promise<void> {
  const projectStore = new ProjectStore();
  
  try {
    Logger.startSpinner('正在加载项目列表...');
    const projects = await projectStore.getProjects();
    Logger.stopSpinner();
    
    if (projects.length === 0) {
      Logger.info('暂无项目，请使用 "ccs project add" 命令添加项目');
      return;
    }
    
    Logger.success('项目列表：');
    console.log();
    
    projects.forEach((project, index) => {
      console.log(`${Logger.dim(`${index + 1}.`)} ${Logger.cyan(project.name)}`);
      console.log(`   ${Logger.dim(project.path)}`);
      console.log();
    });
    
  } catch (error) {
    Logger.stopSpinner();
    Logger.error(`加载项目列表失败: ${error instanceof Error ? error.message : '未知错误'}`);
    process.exit(1);
  }
}