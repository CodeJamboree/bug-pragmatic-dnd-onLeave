# Bug: Pragmatic Drag & Drop: onDragLeave

This project was initially a way to isolate and report a bug. 
The cause of the behavior was discovered to be intentional.
This code is now used for experimenting with the library.

# Origin

An exaple of how to setup Drag & Drop was followed, and the 
use, purpose, and effect of `getSticky` was overlooked in 
the following code:

https://github.com/alexreardon/pdnd-react-tailwind/blob/main/src/task.tsx

As a result, the `onDragLeave` event wouldn't always fire, 
`onDrag` was still reporting for the last valid item, and 
`onDrop` was reporting that the last valid item received the 
dragged item.

| Drag | Over | Moves To | onDragLeave | onDrag | onDrop |
| --- | --- | --- | --- | --- | --- |
| Item 1 | Item 1 | Item 2 | No | No | Item 2 |
| Item 1 | Item 1 | Non Drop Area | No | No | No |
| Item 1 | Item 2 | Item 3 | Item 2 | Item 3 | Item 3 |
| Item 1 | Item 2 | Item 1 | Bug: No | Bug: Item 2 | Bug: Item 2 |
| Item 1 | Item 2 | Non Drop Area | Bug: No | Bug: Item 2 | Bug: Item 2 |

As a result, this project was made to isolate the behavior
and an issue was opened at atlassian/pragmatic-drag-and-drop#127

https://github.com/atlassian/pragmatic-drag-and-drop/issues/127

Once the cause was discovered after a good nights sleep, the 
issue was closed.
