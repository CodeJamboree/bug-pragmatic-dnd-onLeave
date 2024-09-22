import { FC, useEffect, useRef, useState } from "react";

import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { draggable, dropTargetForElements } from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import {
  attachClosestEdge,
  type Edge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';

import { createPortal } from "react-dom";
import { asDndTask, isDndTask, TaskItem } from "./tasks";

type State =
  { type: 'idle' } |
  { type: 'preview', container: HTMLElement } |
  { type: 'dragging' } |
  { type: 'dragging over', closestEdge: Edge | null }

const IDLE: State = { type: 'idle' };
const DRAGGING: State = { type: 'dragging' };
const classNames: Record<State['type'], string> = {
  'idle': 'drag-ready',
  'preview': 'drag-preview',
  'dragging': 'drag',
  'dragging over': 'drag-over'
};

export const ListItem: FC<{
  task: TaskItem
}> = ({
  task
}) => {

    const ref = useRef<HTMLLIElement>(null);
    const [state, setState] = useState<State>(IDLE);

    useEffect(() => {
      const element = ref.current;
      if (!element) throw 'Element missing';
      return combine(
        draggable({
          element,
          getInitialData: () => asDndTask(task),
          onGenerateDragPreview: ({ nativeSetDragImage }) => {
            setCustomNativeDragPreview({
              nativeSetDragImage,
              getOffset: pointerOutsideOfPreview({ x: '16px', y: '0px' }),
              render: ({ container }) => setState({ type: 'preview', container })
            })
          },
          onDragStart: () => setState(DRAGGING),
          onDrop: () => setState(IDLE)
        }),
        dropTargetForElements({
          element,
          canDrop: ({ source }) =>
            source.element !== element &&
            isDndTask(source.data)
          ,
          getData: ({ input }) => attachClosestEdge(
            asDndTask(task),
            {
              element,
              input,
              allowedEdges: ['top', 'bottom']
            }
          ),
          getIsSticky: () => true,
          onDragEnter: ({ self }) => setState({
            type: 'dragging over',
            closestEdge: extractClosestEdge(self.data)
          }),
          onDrag: ({ self }) => {
            console.log(`onDrag ${task.name}`)
            const closestEdge = extractClosestEdge(self.data);
            setState(current => {
              if (
                current.type === 'dragging over' &&
                current.closestEdge == closestEdge
              )
                return current;
              return { type: 'dragging over', closestEdge };
            })
          },
          onDragLeave: () => {
            console.log(`onDragLeave ${task.name}`);
            setState(IDLE)
          },
          onDrop: () => setState(IDLE)
        })
      )
    }, [task, ref.current, setState]);

    const isDragging = state !== IDLE;

    const onClick = () => {
      console.log(`onClick ${task.id}=${task.name}`);
    }

    return (
      <li ref={ref} data-dnd-id={task.id} className={classNames[state.type]}>
        <button
          disabled={isDragging}
          onClick={onClick} >
          {task.name}
        </button>
        {state.type === 'preview' ? createPortal(<DragPreview task={task} />, state.container) : null}
      </li>)
  }


const DragPreview: FC<{ task: TaskItem }> = ({ task }) => (
  <div>{task.name}</div>
)