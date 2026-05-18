# Nested Task & Todo System Documentation

## Overview

The application now supports a complete hierarchical task management system with nested tasks and todos. This allows users to break down complex projects into manageable subtasks and organize their quick todos in a tree structure.

## Features

### 🎯 Nested Tasks

#### Key Features:
- **Hierarchical Structure**: Create parent tasks with multiple levels of subtasks
- **Expand/Collapse**: Toggle visibility of subtasks with smooth animations
- **Task Status**: Track completion status (pending, in-progress, completed)
- **Priority Levels**: Set priority for tasks (low, medium, high)
- **Progress Tracking**: Monitor task progress with visual progress bars
- **Inline Editing**: Double-click task titles to edit them inline
- **Bulk Operations**: Delete parent task and all its subtasks at once

#### Components:
1. **NestedTaskTree.jsx** - Main tree component that renders all tasks
2. **TaskTreeNode.jsx** - Individual task node with expand/collapse and actions
3. **AddSubtaskForm.jsx** - Form to create subtasks for any task
4. **NestedTasksView.jsx** - Complete view with task management interface

#### Usage Example:
```
Project: Website Redesign (Parent Task)
├── Planning (Subtask)
│   ├── Create wireframes
│   └── Design color scheme
├── Development (Subtask)
│   ├── Set up project structure
│   ├── Implement features
│   │   ├── Header component
│   │   ├── Navigation
│   │   └── Footer component
│   └── Testing
└── Deployment (Subtask)
    ├── Build production version
    └── Deploy to server
```

### 📋 Nested Todos

#### Key Features:
- **Tree Structure**: Organize todos hierarchically like tasks
- **Quick Add**: Add todos and subtodos with a single click
- **Local Storage**: All todos are saved in browser localStorage (no backend required)
- **Expand/Collapse**: Toggle subtodo visibility
- **Inline Editing**: Double-click todo text to edit
- **Batch Clear**: Clear completed items or all todos at once
- **Progress Tracking**: View total and completed count across all levels
- **Persistent State**: Todos and expand/collapse state saved automatically

#### Components:
1. **TodoCanvas.jsx** - Main todo canvas with tree support
2. **TodoItem.jsx** - Individual todo item component (nested within TodoCanvas)

#### Usage Example:
```
Daily Tasks
├── Morning Routine (Expandable)
│   ├── Breakfast ✓
│   ├── Exercise
│   └── Shower ✓
├── Work Tasks
│   ├── Email review
│   ├── Team meeting
│   └── Code review
│       ├── PR #123
│       ├── PR #124
│       └── PR #125
└── Evening Tasks
    ├── Dinner
    └── Relaxation
```

## Database Schema

### Tasks Table (with parent_id for nesting)
```sql
CREATE TABLE tasks (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority ENUM('low','medium','high') DEFAULT 'medium',
  status ENUM('pending','in-progress','completed') DEFAULT 'pending',
  progress TINYINT UNSIGNED DEFAULT 0,
  due_date DATETIME NULL,
  created_by_ai BOOLEAN DEFAULT FALSE,
  parent_id CHAR(36) NULL,  -- NEW: For nested tasks
  user_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (parent_id) REFERENCES tasks(id)  -- NEW: Self-referencing
);
```

## API Endpoints

### New Nested Task Endpoints

#### Get All Tasks (Nested/Hierarchical)
```
GET /task/nested/all
Authorization: Bearer {token}
Response: Array of tasks with children array
```

#### Get Subtasks for a Task
```
GET /task/:id/subtasks
Authorization: Bearer {token}
Response: Array of subtasks for the parent task
```

#### Create Task (with optional parent_id)
```
POST /task/
Authorization: Bearer {token}
Body: {
  title: string,
  description: string,
  priority: 'low' | 'medium' | 'high',
  status: 'pending' | 'in-progress' | 'completed',
  progress: number (0-100),
  parent_id: string (optional) // UUID of parent task
}
Response: { message: string, task: TaskObject }
```

#### Update Task
```
PUT /task/:id
Authorization: Bearer {token}
Body: {
  title?: string,
  description?: string,
  priority?: 'low' | 'medium' | 'high',
  status?: 'pending' | 'in-progress' | 'completed',
  progress?: number,
  parent_id?: string (optional)
}
Response: { message: string }
```

#### Delete Task (and all subtasks)
```
DELETE /task/:id
Authorization: Bearer {token}
Response: { message: string }
```

## Frontend Service Methods

### TaskService.js - New Methods

```javascript
// Fetch all tasks in nested/hierarchical structure
getAllTasksNested() → Promise<Task[]>

// Fetch subtasks for a parent task
getSubtasks(parentId: string) → Promise<Task[]>

// Create task with optional parent_id
createTask(taskData: TaskData) → Promise<Task>

// Update task (including parent_id)
updateTaskById(id: string, updateData: TaskData) → Promise<Response>

// Delete task and all subtasks
deleteTaskById(id: string) → Promise<Response>
```

## UI/UX Features

### Modern Design Elements

1. **Visual Hierarchy**
   - Indentation and border lines show nesting levels
   - Color-coded priority badges
   - Progress bars with color transitions

2. **Smooth Animations**
   - Expand/collapse transitions (90° rotation of arrow)
   - Slide-in animations for new subtask forms
   - Fade transitions for status changes

3. **Responsive Layout**
   - Mobile-optimized with reduced indentation on small screens
   - Stacked layouts on phones
   - Touch-friendly button sizes

4. **Accessibility**
   - Proper ARIA labels for interactive elements
   - Keyboard navigation support
   - High contrast color schemes
   - Clear visual feedback on interactions

### Interactive Features

1. **Task Management**
   - ✎ Edit button - Inline edit task title and description
   - ➕ Add subtask - Create subtask for current task
   - ✕ Delete button - Remove task and subtasks
   - Status indicator - Click to toggle completion

2. **Todo Management**
   - Double-click to edit todo text
   - Hover for action buttons
   - Checkbox for completion
   - One-click subtodo creation

## Code Architecture

### Component Hierarchy

```
NestedTasksView (Container)
├── Form (Create new task)
└── NestedTaskTree (Task tree renderer)
    └── TaskTreeNode (Individual task)
        ├── TaskInfo Display
        └── Actions (Edit, Add Subtask, Delete)
        └── AddSubtaskForm (Collapsed form)
        └── Children Container
            └── TaskTreeNode (Recursive)

TodoCanvas (Container)
├── Form (Add todo)
├── Actions (Clear)
└── List
    └── TodoItem (Recursive)
        ├── Checkbox & Text
        ├── Actions
        ├── AddSubtodoForm
        └── Subtodos Container
```

### State Management

**Nested Tasks**: React Query (TanStack Query)
- Caching: Automatic caching with refetch intervals
- Mutations: Optimistic updates on create/update/delete
- Query Keys: `['tasksNested']` and `['tasks']`

**Todos**: Local React State + localStorage
- Storage: Browser localStorage with keys
  - `quick-todo-items` - Todo tree structure
  - `quick-todo-canvas-expanded` - Canvas visibility state
- Persistence: Automatic on every state change
- Expanded state: `Set<string>` tracking expanded node IDs

## Usage Guide

### Creating Nested Tasks

1. **From NestedTasksView:**
   ```
   Click "➕ Create New Task"
   Fill in title and description
   Select priority (optional)
   Click "Create Task"
   Click "➕" on task to add subtask
   ```

2. **From API:**
   ```javascript
   // Create parent task
   const parent = await createTask({
     title: "Main Project",
     description: "My project"
   });
   
   // Create subtask
   const subtask = await createTask({
     title: "Sub-item",
     description: "Part of main project",
     parent_id: parent.id
   });
   ```

### Managing Todo Tree

1. **Add Todo:**
   ```
   Type in input field
   Click "Add"
   ```

2. **Add Subtodo:**
   ```
   Click "➕" on todo
   Type subtodo text
   Click "Add"
   ```

3. **Edit Todo:**
   ```
   Double-click todo text
   Make changes
   Press Enter or click away
   ```

4. **Expand/Collapse:**
   ```
   Click "▶" arrow on todo with subtodos
   Arrow rotates and subtodos show/hide
   ```

## Performance Considerations

- **Lazy Rendering**: Subtasks only rendered when parent is expanded
- **Memoization**: Components memoized to prevent unnecessary re-renders
- **LocalStorage**: Used for todos to avoid backend calls
- **Query Caching**: Tasks cached and refetched every 60 seconds
- **Recursive Rendering**: Efficient recursive component structure

## Browser Compatibility

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers
- ⚠️ IE 11 (not supported)

## LocalStorage Keys (Todos)

```javascript
{
  "quick-todo-items": [
    {
      id: "uuid-1",
      text: "Learn React",
      completed: false,
      subtodos: [
        {
          id: "uuid-2",
          text: "Hooks",
          completed: true,
          subtodos: []
        }
      ]
    }
  ],
  "quick-todo-canvas-expanded": "true"
}
```

## Error Handling

- Task operations show user-friendly error messages
- Network errors trigger retry buttons
- Form validation prevents invalid data submission
- Delete confirmations prevent accidental removals
- Proper error boundaries for component failures

## Future Enhancements

- [ ] Drag-and-drop to reorder tasks
- [ ] Bulk operations (move, copy, delete)
- [ ] Task templates
- [ ] Recurring tasks
- [ ] Task sharing with team members
- [ ] Time tracking for tasks
- [ ] Calendar view of tasks
- [ ] Export tasks as PDF

## Troubleshooting

### Tasks not showing in nested view
- Clear browser cache
- Check if parent_id is set correctly in database
- Verify user_id matches logged-in user

### Todos not persisting
- Check browser localStorage is enabled
- Clear problematic localStorage entries
- Check browser console for errors

### Performance issues with many tasks
- Consider archiving old tasks
- Limit visible subtasks per parent
- Enable virtualization for large lists

## References

- React Query Docs: https://tanstack.com/query
- Framer Motion: https://www.framer.com/motion/
- Web Storage API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
