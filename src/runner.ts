class Runner {
  shouldWait: boolean;
  done: boolean;
  backupTables: string[];
  backupPrefix: string;
  backupsToKeep: number;
  backupArns: Set<string>;
  remainingTasks: string[];
  rawEvent: any;
  task: string;

  splitCSV(value) {
    if (!value) {
      return value;
    }

    return value.split(',').map((val) => val.trim());
  }

  isEmptyArray(value) {
    return !value || value.length === 0;
  }

  constructor(event) {
    if (!event.tasks) {
      throw new TypeError('tasks array cannot be undefined');
    }

    const backupTables = this.splitCSV(event.backup_tables);
    const backupPrefix = event.backup_prefix;

    if (this.isEmptyArray(backupTables)) {
      throw new TypeError('backup_tables option cannot be empty');
    }

    this.shouldWait = false;
    this.done = false;
    this.backupTables = backupTables;
    this.backupPrefix = backupPrefix;
    this.backupsToKeep = event.per_table_backups_to_keep || 7;
    this.backupArns = new Set(event.backup_arns || []);

    if (this.isEmptyArray(event.tasks)) {
      this.remainingTasks = [];
      this.done = true;
      return;
    }

    const taskName = event.tasks[0];
    const tasks = [].concat(event.tasks);
    const remainingTasks = tasks.splice(1);

    if (!event.backup_prefix) {
      throw new TypeError('backup_prefix option cannot be empty');
    }

    this.rawEvent = event;
    this.task = taskName;
    this.remainingTasks = remainingTasks;
  }

  toJSON() {
    if (this.remainingTasks.length === 0) {
      this.done = true;
    }

    return {
      tasks: this.remainingTasks,
      done: this.done,
      wait: this.shouldWait,
      backup_tables: this.backupTables.join(','),
      backup_prefix: this.backupPrefix,
      backup_arns: Array.from(this.backupArns),
      per_table_backups_to_keep: this.backupsToKeep,
    };
  }
}

module.exports = Runner;
