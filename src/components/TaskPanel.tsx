import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  GripVertical, 
  Clock, 
  CheckCircle, 
  Circle,
  CheckSquare,
  Calendar
} from 'lucide-react';
import { Task, Team, UserProfile } from '../types';

interface TaskPanelProps {
  tasks: Task[];
  folders: string[];
  onAddTask: (task: any) => void;
  onUpdateTask: (id: string, updates: any) => void;
  onDeleteTask: (id: string) => void;
  onAddFolder: (name: string, teamId?: string | null) => void;
  onRenameFolder: (oldName: string, newName: string, teamId?: string | null) => void;
  onDeleteFolder: (name: string, teamId?: string | null) => void;
  onReorderFolders: (newFolders: string[], teamId?: string | null) => Promise<boolean>;
  activeTeam: Team | null;
  userTeams: Team[];
  userProfile: UserProfile;
}

export default function TaskPanel({
  tasks,
  folders,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onReorderFolders,
  activeTeam,
  userProfile
}: TaskPanelProps) {
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingList, setEditingList] = useState<string | null>(null);
  const [editingListValue, setEditingListValue] = useState('');
  
  // Drag and drop state for folders (lists)
  const [draggedFolderIdx, setDraggedFolderIdx] = useState<number | null>(null);
  
  // Drag and drop state for tasks
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  // New task creation modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTaskListName, setCreateTaskListName] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState(30);
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState('');
  const [newTaskAssignedToName, setNewTaskAssignedToName] = useState('');
  const [newTaskScheduledDate, setNewTaskScheduledDate] = useState('');
  const [newTaskScheduledTime, setNewTaskScheduledTime] = useState('');

  // Task editing modal states
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDuration, setEditDuration] = useState(30);
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [editAssignedToName, setEditAssignedToName] = useState('');
  const [editScheduledDate, setEditScheduledDate] = useState('');
  const [editScheduledTime, setEditScheduledTime] = useState('');

  // Filter tasks based on team context
  const filteredTasks = tasks.filter(t => {
    if (activeTeam) {
      return t.teamId === activeTeam.id;
    } else {
      return !t.teamId; // personal tasks
    }
  });

  // Handle list creation
  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      onAddFolder(newListName.trim(), activeTeam ? activeTeam.id : null);
      setNewListName('');
      setShowAddList(false);
    }
  };

  // Handle list rename
  const handleSaveRenameList = (oldName: string) => {
    if (editingListValue.trim() && editingListValue.trim() !== oldName) {
      onRenameFolder(oldName, editingListValue.trim(), activeTeam ? activeTeam.id : null);
    }
    setEditingList(null);
  };

  // Drag-and-drop lists
  const handleListDragStart = (e: React.DragEvent, index: number) => {
    // Only allow drag-start if dragging from the column header drag handle
    const target = e.target as HTMLElement;
    if (!target.closest('.handle-drag')) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    setDraggedFolderIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleListDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedFolderIdx === null || draggedFolderIdx === index) return;
    
    const reordered = [...folders];
    const [draggedItem] = reordered.splice(draggedFolderIdx, 1);
    reordered.splice(index, 0, draggedItem);
    
    onReorderFolders(reordered, activeTeam ? activeTeam.id : null);
    setDraggedFolderIdx(index);
  };

  const handleListDragEnd = () => {
    setDraggedFolderIdx(null);
  };

  // Drag-and-drop tasks
  const handleTaskDragStart = (e: React.DragEvent, taskId: string) => {
    e.stopPropagation();
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleTaskDragOverColumn = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTaskDropOnColumn = (e: React.DragEvent, targetListName: string) => {
    e.preventDefault();
    const taskId = draggedTaskId || e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    // Verify we are moving a task, not reordering a column
    if (draggedFolderIdx !== null) return;

    const taskToMove = tasks.find(t => t.id === taskId);
    if (taskToMove && taskToMove.folder !== targetListName) {
      onUpdateTask(taskId, { folder: targetListName });
    }
    setDraggedTaskId(null);
  };

  return (
    <div id="task-panel-root" className="h-full flex flex-col space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#ECE0D2]">
            {activeTeam ? `${activeTeam.name} Planner Board` : 'Personal Planner Board'}
          </h2>
          <p className="text-xs font-mono text-[#9E9CA3] mt-1">
            Organize tasks and drag columns to reorder your lists
          </p>
        </div>

        <button
          onClick={() => setShowAddList(!showAddList)}
          className="flex items-center space-x-2 bg-[#ECE0D2] text-[#1E2024] px-4 py-2 text-sm font-semibold hover:bg-[#D9CDBF] transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>New List</span>
        </button>
      </div>

      {/* Inline list creation form */}
      {showAddList && (
        <form onSubmit={handleCreateList} className="bg-[#292B30] border border-[#3E424B] p-4 flex items-center space-x-4 animate-fade-in">
          <input
            type="text"
            required
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Enter list name..."
            className="flex-1 bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-sm text-[#ECE0D2] placeholder-[#7E7C83] focus:outline-none focus:border-[#ECE0D2]"
          />
          <button
            type="submit"
            className="bg-[#ECE0D2] text-[#1E2024] px-4 py-2 text-xs font-bold hover:bg-[#D9CDBF] cursor-pointer"
          >
            Create List
          </button>
        </form>
      )}

      {/* Kanban Board Container */}
      <div className="flex-1 flex overflow-x-auto pb-4 gap-6 items-start min-h-[480px]">
        {folders.map((folder, folderIdx) => {
          const listTasks = filteredTasks.filter(t => t.folder === folder);

          return (
            <div
              key={folder}
              draggable
              onDragStart={(e) => handleListDragStart(e, folderIdx)}
              onDragOver={(e) => handleListDragOver(e, folderIdx)}
              onDragEnd={handleListDragEnd}
              onDragLeave={handleTaskDragOverColumn}
              onDrop={(e) => handleTaskDropOnColumn(e, folder)}
              className="w-80 bg-[#25272B] border border-[#33353B] flex flex-col max-h-[600px] flex-shrink-0"
            >
              {/* List Column Header */}
              <div className="p-3 border-b border-[#33353B] bg-[#292B30] flex items-center justify-between handle-drag cursor-grab active:cursor-grabbing">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <GripVertical size={16} className="text-[#6E727A] flex-shrink-0" />
                  {editingList === folder ? (
                    <input
                      type="text"
                      autoFocus
                      value={editingListValue}
                      onChange={(e) => setEditingListValue(e.target.value)}
                      onBlur={() => handleSaveRenameList(folder)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveRenameList(folder);
                        if (e.key === 'Escape') setEditingList(null);
                      }}
                      className="bg-[#1E2024] border border-[#ECE0D2] text-xs text-[#ECE0D2] px-2 py-0.5 rounded focus:outline-none w-full"
                    />
                  ) : (
                    <span 
                      onClick={() => {
                        setEditingList(folder);
                        setEditingListValue(folder);
                      }}
                      className="text-sm font-bold truncate text-[#ECE0D2] cursor-pointer hover:underline"
                    >
                      {folder}
                    </span>
                  )}
                  <span className="text-xs font-mono bg-[#33353B] text-[#9E9CA3] px-1.5 py-0.5 rounded-full">
                    {listTasks.length}
                  </span>
                </div>

                <button
                  disabled={folders.length <= 1}
                  onClick={() => onDeleteFolder(folder, activeTeam ? activeTeam.id : null)}
                  className="text-[#6E727A] hover:text-[#EF4444] p-1 disabled:opacity-30 disabled:hover:text-[#6E727A] cursor-pointer"
                  title="Delete List"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Tasks List Container */}
              <div 
                onDragOver={handleTaskDragOverColumn}
                className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[150px] bg-[#1E2024]/40"
              >
                {listTasks.map(task => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleTaskDragStart(e, task.id || '')}
                    className="bg-[#292B30] border border-[#3E424B] p-3 hover:border-[#9E9CA3] transition-all cursor-grab active:cursor-grabbing flex flex-col space-y-3"
                  >
                    <div className="flex items-start justify-between space-x-2">
                      <div className="flex items-start space-x-2">
                        <button
                          onClick={() => onUpdateTask(task.id || '', { 
                            status: task.status === 'completed' ? 'todo' : 'completed' 
                          })}
                          className="mt-0.5 text-[#9E9CA3] hover:text-[#ECE0D2] transition-colors cursor-pointer"
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle size={15} className="text-[#A3E635]" />
                          ) : (
                            <Circle size={15} />
                          )}
                        </button>
                        <div className="flex flex-col space-y-1">
                          <span className={`text-xs font-medium leading-relaxed ${
                            task.status === 'completed' ? 'line-through text-[#6E727A]' : 'text-[#ECE0D2]'
                          }`}>
                            {task.title}
                          </span>
                          {task.description && (
                            <p className="text-[10px] text-[#9E9CA3] leading-normal line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          {task.scheduledDate && (
                            <div className="text-[9px] font-mono text-[#F59E0B] flex items-center space-x-1 mt-1 bg-[#F59E0B]/5 px-1.5 py-0.5 rounded border border-[#F59E0B]/20 w-fit">
                              <Calendar size={10} />
                              <span>{task.scheduledDate}{task.scheduledTime ? ` @ ${task.scheduledTime}` : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setEditTitle(task.title);
                            setEditDescription(task.description || '');
                            setEditDuration(task.duration);
                            setEditPriority(task.priority);
                            setEditAssignedTo(task.assignedTo || '');
                            setEditAssignedToName(task.assignedToName || '');
                            setEditScheduledDate(task.scheduledDate || '');
                            setEditScheduledTime(task.scheduledTime || '');
                          }}
                          className="text-[#6E727A] hover:text-[#ECE0D2] p-0.5 cursor-pointer"
                          title="Edit Task"
                        >
                          <Edit size={12} />
                        </button>
                        <button
                          onClick={() => onDeleteTask(task.id || '')}
                          className="text-[#6E727A] hover:text-[#EF4444] p-0.5 cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Task Metadata */}
                    <div className="flex items-center justify-between border-t border-[#3E424B]/40 pt-2 text-[10px] font-mono text-[#9E9CA3]">
                      <div className="flex items-center space-x-2">
                        <span className="flex items-center space-x-1">
                          <Clock size={10} />
                          <span>{task.duration}m</span>
                        </span>
                        <span className={`px-1.5 py-0.2 rounded-sm text-[8px] font-bold uppercase tracking-wider ${
                          task.priority === 'high' 
                            ? 'bg-[#EF4444]/20 text-[#EF4444]' 
                            : task.priority === 'low' 
                              ? 'bg-[#22C55E]/20 text-[#22C55E]' 
                              : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                        }`}>
                          {task.priority}
                        </span>
                      </div>

                      {task.assignedToName && (
                        <span className="bg-[#3E424B] px-1 rounded text-[#ECE0D2] max-w-[80px] truncate" title={`Assigned to ${task.assignedToName}`}>
                          @{task.assignedToName.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                 {listTasks.length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center border border-dashed border-[#3E424B] rounded text-center p-4">
                    <p className="text-xs text-[#6E727A]">No tasks</p>
                    <button
                      onClick={() => {
                        setCreateTaskListName(folder);
                        setNewTaskTitle('');
                        setNewTaskDescription('');
                        setNewTaskDuration(30);
                        setNewTaskPriority('medium');
                        setNewTaskScheduledDate('');
                        setNewTaskScheduledTime('');
                        if (activeTeam) {
                          setNewTaskAssignedTo(userProfile.id);
                          setNewTaskAssignedToName(userProfile.displayName);
                        } else {
                          setNewTaskAssignedTo('');
                          setNewTaskAssignedToName('');
                        }
                        setIsCreateModalOpen(true);
                      }}
                      className="text-[10px] text-[#ECE0D2] hover:underline mt-2 flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus size={10} />
                      <span>Add Task</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Add Task Button at bottom of list */}
              <div className="p-2 border-t border-[#33353B] bg-[#292B30]">
                <button
                  onClick={() => {
                    setCreateTaskListName(folder);
                    setNewTaskTitle('');
                    setNewTaskDescription('');
                    setNewTaskDuration(30);
                    setNewTaskPriority('medium');
                    setNewTaskScheduledDate('');
                    setNewTaskScheduledTime('');
                    if (activeTeam) {
                      setNewTaskAssignedTo(userProfile.id);
                      setNewTaskAssignedToName(userProfile.displayName);
                    } else {
                      setNewTaskAssignedTo('');
                      setNewTaskAssignedToName('');
                    }
                    setIsCreateModalOpen(true);
                  }}
                  className="w-full py-1.5 flex items-center justify-center space-x-2 text-xs text-[#9E9CA3] hover:text-[#ECE0D2] hover:bg-[#1E2024]/40 transition-all font-semibold cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Task</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && createTaskListName && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in select-text">
          <div className="bg-[#25272B] border border-[#3E424B] w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#ECE0D2] flex items-center space-x-2">
              <CheckSquare size={16} />
              <span>Create Task in "{createTaskListName}"</span>
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newTaskTitle.trim()) {
                  onAddTask({
                    title: newTaskTitle.trim(),
                    folder: createTaskListName,
                    duration: newTaskDuration,
                    priority: newTaskPriority,
                    description: newTaskDescription.trim(),
                    teamId: activeTeam ? activeTeam.id : null,
                    assignedTo: activeTeam && newTaskAssignedTo ? newTaskAssignedTo : undefined,
                    assignedToName: activeTeam && newTaskAssignedTo ? newTaskAssignedToName : undefined,
                    scheduledDate: newTaskScheduledDate || undefined,
                    scheduledTime: newTaskScheduledTime || undefined,
                  });
                  setIsCreateModalOpen(false);
                  setCreateTaskListName(null);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase tracking-wider mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Write report, Fix UI bug..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-sm text-[#ECE0D2] focus:outline-none focus:border-[#ECE0D2]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Enter detailed description..."
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-sm text-[#ECE0D2] focus:outline-none focus:border-[#ECE0D2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase tracking-wider mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    required
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                    className="w-full bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-sm text-[#ECE0D2] focus:outline-none focus:border-[#ECE0D2]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-sm text-[#ECE0D2] focus:outline-none focus:border-[#ECE0D2]"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase tracking-wider mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={newTaskScheduledDate}
                    onChange={(e) => setNewTaskScheduledDate(e.target.value)}
                    className="w-full bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-xs text-[#ECE0D2] focus:outline-none focus:border-[#ECE0D2]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase tracking-wider mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    value={newTaskScheduledTime}
                    onChange={(e) => setNewTaskScheduledTime(e.target.value)}
                    className="w-full bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-xs text-[#ECE0D2] focus:outline-none focus:border-[#ECE0D2]"
                  />
                </div>
              </div>

              {activeTeam && (
                <div>
                  <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase tracking-wider mb-1">
                    Assignee
                  </label>
                  <select
                    value={newTaskAssignedTo}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewTaskAssignedTo(val);
                      const name = activeTeam.memberNames?.[val] || '';
                      setNewTaskAssignedToName(name);
                    }}
                    className="w-full bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-sm text-[#ECE0D2] focus:outline-none focus:border-[#ECE0D2]"
                  >
                    <option value="">Unassigned</option>
                    {activeTeam.members.map(memberId => (
                      <option key={memberId} value={memberId}>
                        {activeTeam.memberNames?.[memberId] || 'Unknown Teammate'} {memberId === userProfile.id ? '(You)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setCreateTaskListName(null);
                  }}
                  className="text-xs font-mono text-[#9E9CA3] hover:text-[#ECE0D2] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#ECE0D2] text-[#1E2024] px-4 py-2 text-xs font-bold hover:bg-[#D9CDBF] cursor-pointer"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in select-text">
          <div className="bg-[#25272B] border border-[#3E424B] w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#ECE0D2] flex items-center space-x-2">
              <Edit size={16} />
              <span>Edit Task Details</span>
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (editTitle.trim()) {
                  onUpdateTask(editingTask.id || '', {
                    title: editTitle.trim(),
                    description: editDescription.trim(),
                    duration: editDuration,
                    priority: editPriority,
                    assignedTo: activeTeam && editAssignedTo ? editAssignedTo : undefined,
                    assignedToName: activeTeam && editAssignedTo ? editAssignedToName : undefined,
                    scheduledDate: editScheduledDate || undefined,
                    scheduledTime: editScheduledTime || undefined,
                  });
                  setEditingTask(null);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase tracking-wider mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-sm text-[#ECE0D2] focus:outline-none focus:border-[#ECE0D2]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Enter detailed description..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-sm text-[#ECE0D2] focus:outline-none focus:border-[#ECE0D2]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase tracking-wider mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="5"
                    required
                    value={editDuration}
                    onChange={(e) => setEditDuration(Number(e.target.value))}
                    className="w-full bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-sm text-[#ECE0D2] focus:outline-none focus:border-[#ECE0D2]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as any)}
                    className="w-full bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-sm text-[#ECE0D2] focus:outline-none focus:border-[#ECE0D2]"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase tracking-wider mb-1">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={editScheduledDate}
                    onChange={(e) => setEditScheduledDate(e.target.value)}
                    className="w-full bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-xs text-[#ECE0D2] focus:outline-none focus:border-[#ECE0D2]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase tracking-wider mb-1">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    value={editScheduledTime}
                    onChange={(e) => setEditScheduledTime(e.target.value)}
                    className="w-full bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-xs text-[#ECE0D2] focus:outline-none focus:border-[#ECE0D2]"
                  />
                </div>
              </div>

              {activeTeam && (
                <div>
                  <label className="block text-[10px] font-mono text-[#9E9CA3] uppercase tracking-wider mb-1">
                    Assignee
                  </label>
                  <select
                    value={editAssignedTo}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditAssignedTo(val);
                      const name = activeTeam.memberNames?.[val] || '';
                      setEditAssignedToName(name);
                    }}
                    className="w-full bg-[#1E2024] border border-[#3E424B] px-3 py-2 text-sm text-[#ECE0D2] focus:outline-none focus:border-[#ECE0D2]"
                  >
                    <option value="">Unassigned</option>
                    {activeTeam.members.map(memberId => (
                      <option key={memberId} value={memberId}>
                        {activeTeam.memberNames?.[memberId] || 'Unknown Teammate'} {memberId === userProfile.id ? '(You)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="text-xs font-mono text-[#9E9CA3] hover:text-[#ECE0D2] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#ECE0D2] text-[#1E2024] px-4 py-2 text-xs font-bold hover:bg-[#D9CDBF] cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
