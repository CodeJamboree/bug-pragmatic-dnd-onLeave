import { FC, useCallback, useEffect, useState } from "react"

import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { triggerPostMoveFlash } from '@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash';

import { ListItem } from './ListItem';
import { defaultTasks, isDndTask, TaskItem, TaskOrderChange } from "./tasks";

export const List: FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>(defaultTasks);
  const [snapshot, setSnapshot] = useState<TaskItem[]>(tasks);
  const [changes, setChanges] = useState<TaskOrderChange[]>([]);
  const [dragId, setDragId] = useState<TaskItem['id'] | undefined>();
  const [sticky, setSticky] = useState(true);
  const [timestamps, setTimestamps] = useState(true);
  const [timestampChangeOnly, setTimestampChangeOnly] = useState(false);
  const [message, setMessageReal] = useState('');
  const [changeMessage, setChangeMessageReal] = useState('');
  const [canDropOnSelf, setCanDropOnSelf] = useState(false);

  const dragDone = (id: TaskItem['id']) => {
    const element = document.querySelector(`[data-dnd-id="${id}"]`);
    if (element instanceof HTMLElement) {
      triggerPostMoveFlash(element);
    }
  }

  const setMessage = useCallback((newMessage: string) => {
    if (!timestamps) {
      setMessageReal(newMessage);
      return;
    }
    if (timestampChangeOnly) {
      if (message.endsWith(newMessage)) return;
    }

    const timestamp = Math.floor(performance.now())
      .toString()
      .padStart(6, '0');

    setMessageReal(`[${timestamp}] ${newMessage}`);
  }, [message, timestamps, timestampChangeOnly, setMessageReal]);

  const setChangeMessage = useCallback((newMessage: string) => {
    if (!timestamps) {
      setChangeMessageReal(newMessage);
      return;
    }
    if (timestampChangeOnly) {
      if (changeMessage.endsWith(newMessage)) return;
    }

    const timestamp = Math.floor(performance.now())
      .toString()
      .padStart(6, '0');

    setChangeMessageReal(`[${timestamp}] ${newMessage}`);
  }, [changeMessage, timestamps, timestampChangeOnly, setChangeMessageReal]);

  useEffect(() => {
    if (changes.length === 0) return;
    setChangeMessage(`changes applied: ${JSON.stringify(changes)}`)
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
  }, [changes, setMessage]);

  const undo = useCallback(
    () => {
      setTasks(snapshot)
    }
    , [setTasks, snapshot]
  );

  useEffect(() => {
    if (!dragId) return;
    dragDone(dragId);
    setDragId(undefined);
  }, [dragId])

  useEffect(() => {

    return monitorForElements({
      canMonitor({ source }) {
        return isDndTask(source.data);
      },
      onDragStart({ source }) {
        setMessage(`onDragStart ${source.data.id}`);
        setSnapshot(tasks);
      },
      onDrag({ location, source }) {
        setDragId(undefined);
        const [target] = location.current.dropTargets;
        if (!target) {
          setMessage('onDropTargetChange no target');
          return;
        }
        const drag = source.data;
        const drop = target.data;
        if (!isDndTask(drag)) {
          setMessage('onDropTargetChange dragged item is not a task');
          return;
        }
        if (!isDndTask(drop)) {
          setMessage('onDropTargetChange target item is not a task');
          return
        };
        const startIndex = tasks.findIndex(({ id }) => id === drag.id);
        const indexOfTarget = tasks.findIndex(({ id }) => id === drop.id);
        if (startIndex < 0) {
          setMessage('onDropTargetChange dragged item not in tasks[]');
          return;
        }
        if (indexOfTarget < 0) {
          setMessage('onDropTargetChange dropped item not in tasks[]');
          return;
        }
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
          setMessage(`onDropTargetChange found changes: ${JSON.stringify(changes)}`);
          setChanges(changes);
        } else {
          setMessage('onDropTargetChange no changes');
        }

      },
      onDrop({ location, source }) {
        if (source.data && 'id' in source.data && typeof source.data.id === 'number') {
          setDragId(source.data.id);
        } else {
          setDragId(undefined);
        }
        const [target] = location.current.dropTargets;
        if (!target) {
          setMessage('onDrop no target');
          undo();
          return;
        }
        const drag = source.data;
        const drop = target.data;
        if (!isDndTask(drag)) {
          setMessage('onDrop dragged item is not a task');
          undo();
          return;
        }
        if (!isDndTask(drop)) {
          setMessage('onDrop target item is not a task');
          undo();
          return
        };
        const startIndex = tasks.findIndex(({ id }) => id === drag.id);
        const indexOfTarget = tasks.findIndex(({ id }) => id === drop.id);
        if (startIndex < 0) {
          setMessage('onDrop dragged item not in tasks[]');
          undo();
          return;
        }
        if (indexOfTarget < 0) {
          setMessage('onDrop dropped item not in tasks[]');
          undo();
          return;
        }
        setMessage('onDrop looks good! keep prior changes from drag');
        return;
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
          setMessage(`onDrop found changes: ${JSON.stringify(changes)}`);
          setChanges(changes);
        } else {
          setMessage('onDrop no changes');
        }
      }
    })
  }, [tasks, undo, setMessage, setChanges, setDragId]);

  return (
    <>
      <div>List: {message}</div>
      <div>Changes: {changeMessage}</div>
      <ul>
        {tasks.map(task => (
          <ListItem key={task.id} task={task}
            sticky={sticky}
            timestamps={timestamps}
            timestampChangeOnly={timestampChangeOnly}
            canDropOnSelf={canDropOnSelf}
          />
        ))}
      </ul>
      <button onClick={() => setTasks(defaultTasks)}>Reset Tasks</button>
      <table>
        <tr>
          <td>
            <label>
              <input type="checkbox" checked={sticky} onChange={() => setSticky(!sticky)} />
              Sticky
            </label>
          </td>
          <td>
            <label>
              <input type="checkbox" checked={canDropOnSelf} onChange={() => setCanDropOnSelf(!canDropOnSelf)} />
              Can drop on self
            </label>
          </td>
          <td>
            <label>
              <input type="checkbox" checked={timestamps} onChange={() => setTimestamps(!timestamps)} />
              Timestamps
            </label>
          </td>
          <td>
            <label>
              <input type="checkbox" checked={timestampChangeOnly} onChange={() => setTimestampChangeOnly(!timestampChangeOnly)} />
              Timestamp Change Only
            </label>
          </td>
        </tr>
      </table>
    </>
  )
};