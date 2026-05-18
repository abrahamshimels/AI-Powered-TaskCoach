# 🔗 Integration Guide - Adding Nested Tasks to Your App

## Where to Add Nested Tasks View

### Option 1: As a Dedicated Page/Route

#### Step 1: Update Routes.jsx
```jsx
// src/routes/Routes.jsx
import NestedTasksView from '../components/tasks/NestedTasksView';

const Routes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... existing routes ... */}
        
        {/* Add this new route */}
        <Route
          path="/tasks/nested"
          element={<PrivateRoute><NestedTasksView /></PrivateRoute>}
        />
        
        {/* ... more routes ... */}
      </Routes>
    </BrowserRouter>
  );
};

export default Routes;
```

#### Step 2: Add Navigation Link
```jsx
// Add to Header or Navigation
<NavLink to="/tasks/nested" className="nav-link">
  📊 Task Hierarchy
</NavLink>
```

### Option 2: In Dashboard as a Widget

#### Step 1: Update Dashboard.jsx
```jsx
// src/pages/Dashboard/Dashboard.jsx
import NestedTasksView from '../../components/tasks/NestedTasksView';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <Header />
      
      <section className="dashboard-main">
        {/* Existing widgets */}
        <TodoCanvas />
        
        {/* Add Nested Tasks View */}
        <div className="dashboard-nested-tasks">
          <NestedTasksView />
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
```

#### Step 2: Add CSS (Dashboard.css)
```css
.dashboard-nested-tasks {
  width: 100%;
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--surface-soft);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

@media (max-width: 1024px) {
  .dashboard-nested-tasks {
    padding: 1rem;
    margin-top: 1.5rem;
  }
}

@media (max-width: 768px) {
  .dashboard-nested-tasks {
    padding: 0.75rem;
    margin-top: 1rem;
  }
}
```

### Option 3: In Task Details Page

#### Step 1: In Task Details Component
```jsx
// src/components/tasks/task-details/TaskDetails.jsx
import AddSubtaskForm from '../nested/AddSubtaskForm';
import { getSubtasks } from '../../../services/TaskService';

const TaskDetails = ({ taskId }) => {
  const [subtasks, setSubtasks] = useState([]);
  
  useEffect(() => {
    loadSubtasks();
  }, [taskId]);
  
  const loadSubtasks = async () => {
    try {
      const subs = await getSubtasks(taskId);
      setSubtasks(subs);
    } catch (error) {
      console.error('Failed to load subtasks:', error);
    }
  };
  
  return (
    <div className="task-details">
      {/* Existing task details */}
      
      <section className="subtasks-section">
        <h3>Subtasks</h3>
        <AddSubtaskForm
          parentId={taskId}
          onAddSubtask={() => loadSubtasks()}
        />
        <ul className="subtasks-list">
          {subtasks.map(sub => (
            <li key={sub.id} className="subtask-item">
              {/* Subtask item JSX */}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default TaskDetails;
```

---

## Installation Checklist

### Backend Setup

- [ ] **Database**: Run migration to add `parent_id` column
  ```bash
  # Migrations run automatically on server start
  # Or manually verify in database:
  SHOW COLUMNS FROM tasks;  # Check for parent_id
  ```

- [ ] **Update package.json**: Already has required dependencies
  ```bash
  npm install  # Just in case
  ```

- [ ] **API Endpoints**: Already available at:
  - `GET /task/nested/all`
  - `GET /task/:id/subtasks`
  - `POST /task/` (with parent_id support)
  - `PUT /task/:id`
  - `DELETE /task/:id`

- [ ] **Test Backend**:
  ```bash
  curl -X GET http://localhost:5000/api/task/nested/all \
    -H "Authorization: Bearer YOUR_TOKEN"
  ```

### Frontend Setup

- [ ] **Component Files**: All created in `src/components/tasks/nested/`
- [ ] **Service Methods**: Added to `TaskService.js`
- [ ] **CSS Files**: All created with responsive design
- [ ] **Test Components**:
  ```bash
  npm start  # Start dev server
  # Navigate to nested tasks view
  # Create a test task and subtask
  ```

### Integration Steps

- [ ] Choose integration option (route, dashboard, or task details)
- [ ] Add necessary imports
- [ ] Add navigation if needed
- [ ] Update CSS if needed
- [ ] Test functionality
- [ ] Verify responsive design

---

## Environment Setup

### Required Environment Variables
```env
# .env file
VITE_API_BASE_URL=http://localhost:5000/api
```

### Browser Requirements
- localStorage enabled
- Modern JavaScript support
- CSS Grid/Flexbox support

---

## Testing the Implementation

### Unit Testing Example
```javascript
// src/components/tasks/nested/__tests__/NestedTaskTree.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import NestedTaskTree from '../NestedTaskTree';

describe('NestedTaskTree', () => {
  const mockTasks = [
    {
      id: '1',
      title: 'Parent Task',
      children: [
        {
          id: '2',
          title: 'Child Task',
          children: []
        }
      ]
    }
  ];

  it('renders parent task', () => {
    render(
      <NestedTaskTree
        tasks={mockTasks}
        onTaskUpdate={() => {}}
        onTaskDelete={() => {}}
        onTaskCreate={() => {}}
      />
    );
    expect(screen.getByText('Parent Task')).toBeInTheDocument();
  });

  it('expands and collapses subtasks', () => {
    render(
      <NestedTaskTree
        tasks={mockTasks}
        onTaskUpdate={() => {}}
        onTaskDelete={() => {}}
        onTaskCreate={() => {}}
      />
    );
    
    const expandButton = screen.getByLabelText('Toggle subtasks');
    fireEvent.click(expandButton);
    expect(screen.getByText('Child Task')).toBeVisible();
  });
});
```

### Manual Testing Checklist
- [ ] Create new task
- [ ] Create subtask on task
- [ ] Expand/collapse subtasks
- [ ] Edit task title
- [ ] Update task status
- [ ] Update task progress
- [ ] Delete task
- [ ] Create multi-level nesting (3+ levels)
- [ ] Test on mobile
- [ ] Test on tablet
- [ ] Test on desktop

---

## Common Integration Patterns

### Pattern 1: Side-by-Side with Original Tasks View
```jsx
<div className="dashboard-tasks-section">
  <div className="tasks-grid">
    <div className="tasks-original">
      <Tasks /> {/* Existing flat task view */}
    </div>
    <div className="tasks-nested">
      <NestedTasksView /> {/* New tree view */}
    </div>
  </div>
</div>
```

### Pattern 2: Tabbed View
```jsx
const [activeTab, setActiveTab] = useState('flat');

<div className="tasks-tabs">
  <button onClick={() => setActiveTab('flat')}>Flat View</button>
  <button onClick={() => setActiveTab('nested')}>Hierarchical</button>
  
  {activeTab === 'flat' && <Tasks />}
  {activeTab === 'nested' && <NestedTasksView />}
</div>
```

### Pattern 3: Modal/Drawer
```jsx
const [showNested, setShowNested] = useState(false);

<>
  <button onClick={() => setShowNested(true)}>
    View Hierarchical Tasks
  </button>
  
  {showNested && (
    <Modal onClose={() => setShowNested(false)}>
      <NestedTasksView />
    </Modal>
  )}
</>
```

---

## Customization Guide

### Change Primary Color
```css
/* In NestedTaskTree.css */
.nested-task-tree {
  --primary-color: #your-color;
}
```

### Adjust Indentation
```css
/* In NestedTaskTree.css */
.children-container {
  margin-left: 2rem; /* Change from 1.5rem */
  padding-left: 1rem; /* Adjust as needed */
}
```

### Hide Buttons on Desktop
```css
.action-btn {
  display: none; /* Hidden by default */
}

.node-header:hover .action-btn {
  display: flex; /* Show only on hover */
}
```

### Max Nesting Depth
```javascript
// In TaskTreeNode.jsx
const MAX_DEPTH = 4;

const canAddSubtask = depth < MAX_DEPTH;

{canAddSubtask && (
  <button onClick={onAddSubtask}>➕</button>
)}
```

---

## Performance Optimization

### Lazy Loading Subtasks
```javascript
const TaskTreeNode = ({ task, depth, ...props }) => {
  const [subtasks, setSubtasks] = useState(null);
  
  const handleExpand = async () => {
    if (!subtasks && task.children?.length > 0) {
      // Load from API instead of passing all data
      const subs = await getSubtasks(task.id);
      setSubtasks(subs);
    }
  };
};
```

### Memoization
```javascript
const NestedTaskTree = React.memo(({ tasks, ...props }) => {
  // Component only re-renders when tasks prop changes
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.tasks) === 
         JSON.stringify(nextProps.tasks);
});
```

### Virtualization for Large Lists
```javascript
// For 1000+ tasks, consider:
import { FixedSizeList } from 'react-window';

// Virtualize long lists
<FixedSizeList
  height={600}
  itemCount={tasks.length}
  itemSize={50}
>
  {({ index, style }) => (
    <TaskTreeNode task={tasks[index]} style={style} />
  )}
</FixedSizeList>
```

---

## Debugging Tips

### Enable Debug Logs
```javascript
// In NestedTaskTree.jsx
const DEBUG = true;

const log = (message, data) => {
  if (DEBUG) {
    console.log(`[NestedTaskTree] ${message}`, data);
  }
};
```

### Check Data Structure
```javascript
// In browser console
// Check if tasks are in correct format
console.log(JSON.stringify(tasks, null, 2));

// Check localStorage
console.log(JSON.parse(localStorage.getItem('quick-todo-items')));
```

### Network Monitoring
```javascript
// Check API responses
fetch('/api/task/nested/all')
  .then(r => r.json())
  .then(data => console.log('Tasks:', data));
```

---

## Common Issues & Solutions

### Issue: Tasks not loading
**Solution**: Check network tab, verify API endpoint, check auth token

### Issue: Styling not applied
**Solution**: Clear cache, check CSS import, verify CSS path

### Issue: Performance is slow
**Solution**: Check task count, reduce nesting levels, use lazy loading

### Issue: Subtasks not showing
**Solution**: Verify parent_id in database, check API response structure

---

## Rollback Instructions

If you need to revert:

```bash
# Undo database changes
ALTER TABLE tasks DROP COLUMN parent_id;
ALTER TABLE tasks DROP CONSTRAINT fk_parent_task;

# Remove files
rm -rf src/components/tasks/nested/
rm src/components/tasks/NestedTasksView.*

# Revert service changes
# Manually remove new methods from TaskService.js
```

---

## Next Steps After Integration

1. ✅ Test full functionality
2. ✅ Gather user feedback
3. ✅ Optimize performance if needed
4. ✅ Add user training/documentation
5. ✅ Monitor for issues
6. ✅ Plan future enhancements

---

## Support & Resources

- 📖 Full Docs: `NESTED_FEATURES.md`
- 🚀 Quick Start: `QUICK_START.md`
- 📝 Implementation: `IMPLEMENTATION_SUMMARY.md`
- 💬 Component Comments: JSDoc in each file
- 🔗 API Docs: See backend route definitions

---

**Integration Complete! 🎉**

Need help? Refer to the documentation files or check the component source code for detailed comments.
