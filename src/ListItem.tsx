import { FC, useCallback, useEffect, useRef, useState } from "react";

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
  task: TaskItem,
  sticky: boolean,
  timestamps: boolean,
  timestampChangeOnly: boolean,
  canDropOnSelf: boolean
}> = ({
  task,
  sticky,
  timestamps,
  timestampChangeOnly,
  canDropOnSelf
}) => {

    const ref = useRef<HTMLLIElement>(null);
    const [state, setState] = useState<State>(IDLE);
    const [message, setMessageReal] = useState('');

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
          onDragStart: () => {
            setMessage('draggable.onDragStart');
            setState(DRAGGING)
          },
          onDrop: (args) => {
            const [target] = args.location.current.dropTargets;
            let id: string | number = 'nothing';
            let dropEffect: string = '';
            let edge: string = 'nothing';
            if (target && target.data) {
              dropEffect = target.dropEffect;
              edge = extractClosestEdge(target.data) ?? 'nothing';
              if (isDndTask(target.data)) {
                id = target.data.id;
              }
            }
            setMessage(`draggable.onDrop ${dropEffect} ${edge} of ${id}`);
            setState(IDLE)
          }
        }),
        dropTargetForElements({
          element,
          canDrop: ({ source }) =>
            isDndTask(source.data) && (canDropOnSelf || source.element !== element)
          ,
          getData: ({ input }) => attachClosestEdge(
            asDndTask(task),
            {
              element,
              input,
              allowedEdges: ['top', 'bottom']
            }
          ),
          getIsSticky: () => sticky,
          onDragEnter: ({ self }) => {
            const closestEdge = extractClosestEdge(self.data);
            setMessage(`dropTarget.onDragEnter ${closestEdge}`);
            setState({
              type: 'dragging over',
              closestEdge
            })
          },
          onDrag: ({ self, source }) => {
            let id: string | number = 'nothing'
            if (isDndTask(source.data)) {
              id = source.data.id;
            }
            const closestEdge = extractClosestEdge(self.data);
            setMessage(`dropTarget.onDrag ${id} near ${closestEdge}`);
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
            setMessage('dropTarget.onDragLeave');
            setState(IDLE)
          },
          onDrop: ({ self, source }) => {
            let id: string | number = 'nothing'
            let edge = extractClosestEdge(self.data) ?? 'nothing';
            if (isDndTask(source.data)) {
              id = source.data.id;
            }
            setMessage(`dropTarget.onDrop ${self.dropEffect} ${id} on ${edge}`);
            setState(IDLE);
          }
        })
      )
    }, [task, sticky, canDropOnSelf, ref.current, setState, setMessage]);

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
        {message}
        {state.type === 'preview' ? createPortal(<DragPreview task={task} />, state.container) : null}
      </li>)
  }


const DragPreview: FC<{ task: TaskItem }> = ({ task }) => (
  <div className="drag-preview-item">{task.name}</div>
)