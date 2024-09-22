
export interface TaskItem {
  id: number,
  name: string,
  order: number
}
export interface TaskOrderChange {
  id: number,
  order: number
}

export const defaultTasks: TaskItem[] = [
  { id: 1, name: 'Item 1', order: 1 },
  { id: 2, name: 'Item 2', order: 2 },
  { id: 3, name: 'Item 3', order: 3 },
  { id: 4, name: 'Item 4', order: 4 },
]

type dndTask = {
  type: 'task',
  id: number
}
export const isDndTask = (data: Record<string, unknown>): data is dndTask => {
  return data.type === 'task';
}

export const asDndTask = (task: TaskItem): dndTask => ({
  type: 'task',
  id: task.id
})