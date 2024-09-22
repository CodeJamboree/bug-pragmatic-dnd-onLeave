import { FC, useEffect, useState } from "react"

import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { triggerPostMoveFlash } from '@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash';

import { ListItem } from './ListItem';
import { defaultTasks, isDndTask, TaskItem, TaskOrderChange } from "./tasks";

export const List: FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>(defaultTasks);
  const [changes, setChanges] = useState<TaskOrderChange[]>([]);
  const [dragId, setDragId] = useState<TaskItem['id'] | undefined>();

  const dragDone = (id: TaskItem['id']) => {
    const element = document.querySelector(`[data-dnd-id="${id}"]`);
    if (element instanceof HTMLElement) {
      triggerPostMoveFlash(element);
    }
  }

  useEffect(() => {
    if (changes.length === 0) return;
    const newOrder = tasks.map(task => {
      const change = changes.find(change => change.id === task.id);
      if (!change) return task;
      return {
        ...task,
        order: change.order
      }
    }).sort((a, b) => a.order - b.order);
    setTasks(newOrder);
    setChanges([]);
  }, [changes]);

  useEffect(() => {
    if (!dragId) return;
    dragDone(dragId);
    setDragId(undefined);
  }, [tasks, dragId])

  useEffect(() => {

    return monitorForElements({
      canMonitor({ source }) {
        return isDndTask(source.data);
      },
      onDrop({ location, source }) {
        const [target] = location.current.dropTargets;
        if (!target) return;
        const drag = source.data;
        const drop = target.data;
        if (!isDndTask(drag) || !isDndTask(drop)) return;
        const startIndex = tasks.findIndex(({ id }) => id === drag.id);
        const indexOfTarget = tasks.findIndex(({ id }) => id === drop.id);
        if (Math.min(startIndex, indexOfTarget) < 0) return;
        console.log(`onDrop ${tasks[startIndex].name} on ${tasks[indexOfTarget].name}`)
        const closestEdgeOfTarget = extractClosestEdge(drop);
        const changes = reorderWithEdge({
          list: tasks,
          startIndex,
          indexOfTarget,
          closestEdgeOfTarget,
          axis: 'vertical'
        })
          .map(({ id }, index) => ({ id, order: index + 1 }))
          .filter(({ id, order }, index) => {
            const old = tasks[index];
            return old.id !== id || old.order !== order;
          });
        if (changes.length !== 0) {
          setDragId(drag.id);
          setChanges(changes);
        } else {
          dragDone(drag.id);
        }
      }
    })
  }, [tasks]);

  return (
    <>
      <ul>
        {tasks.map(task => (
          <ListItem key={task.id} task={task} />
        ))}
      </ul>
    </>
  )
};