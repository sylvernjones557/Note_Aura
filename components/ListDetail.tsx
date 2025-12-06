import React, { useState, useEffect } from 'react';
import { List, Task, Note, ViewMode } from '../types';
import { PlusIcon, TrashIcon, CheckIcon, SparklesIcon, EditIcon, ListIcon, NotesIcon } from './Icons';
import { suggestTasksWithAI, improveNoteWithAI } from '../services/geminiService';

interface ListDetailProps {
  list: List;
  onUpdateList: (updatedList: List) => void;
  onDeleteList: (id: string) => void;
}

const ListDetail: React.FC<ListDetailProps> = ({ list, onUpdateList, onDeleteList }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.BOTH);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);

  // --- TASK OPERATIONS ---

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      text: newTaskText.trim(),
      completed: false,
      createdAt: Date.now(),
    };
    onUpdateList({ ...list, tasks: [...list.tasks, newTask] });
    setNewTaskText('');
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = list.tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onUpdateList({ ...list, tasks: updatedTasks });
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = list.tasks.filter(t => t.id !== taskId);
    onUpdateList({ ...list, tasks: updatedTasks });
  };

  const handleGenerateTasks = async () => {
    setIsGenerating(true);
    try {
      const existingTaskTexts = list.tasks.map(t => t.text);
      const suggestedTasks = await suggestTasksWithAI(list.name, existingTaskTexts);
      if (suggestedTasks.length > 0) {
        onUpdateList({ ...list, tasks: [...list.tasks, ...suggestedTasks] });
      }
    } catch (e) {
      alert("Failed to generate tasks. Check API Key.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- NOTE OPERATIONS ---

  const addNote = () => {
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Note',
      content: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    onUpdateList({ ...list, notes: [newNote, ...list.notes] }); // Add to top
    startEditingNote(newNote);
  };

  const deleteNote = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedNotes = list.notes.filter(n => n.id !== noteId);
    onUpdateList({ ...list, notes: updatedNotes });
    if (editingNoteId === noteId) setEditingNoteId(null);
  };

  const startEditingNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingTitle(note.title);
    setEditingContent(note.content);
  };

  const saveNote = () => {
    if (!editingNoteId) return;
    const updatedNotes = list.notes.map(n =>
      n.id === editingNoteId ? { ...n, title: editingTitle, content: editingContent, updatedAt: Date.now() } : n
    );
    onUpdateList({ ...list, notes: updatedNotes });
    setEditingNoteId(null);
  };

  const handleImproveNote = async () => {
    if (!editingContent.trim()) return;
    setIsGenerating(true);
    try {
      const improved = await improveNoteWithAI(editingContent, aiPrompt || "Refine this note to be clearer and more concise.");
      setEditingContent(improved);
      setShowAiModal(false);
      setAiPrompt('');
    } catch (e) {
      alert("Failed to improve note.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- RENDER HELPERS ---

  const sortedTasks = [...list.tasks].sort((a, b) => {
    if (a.completed === b.completed) return b.createdAt - a.createdAt;
    return a.completed ? 1 : -1;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{list.icon}</span>
          <h1 className="text-2xl font-bold text-slate-800">{list.name}</h1>
        </div>
        <div className="flex items-center gap-2">
           <div className="bg-slate-100 p-1 rounded-lg flex text-slate-500 mr-4">
             <button onClick={() => setViewMode(ViewMode.BOTH)} className={`p-1.5 rounded-md transition-colors ${viewMode === ViewMode.BOTH ? 'bg-white shadow text-primary' : 'hover:bg-slate-200'}`} title="Split View">
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M12 3v18"/></svg>
             </button>
             <button onClick={() => setViewMode(ViewMode.TASKS)} className={`p-1.5 rounded-md transition-colors ${viewMode === ViewMode.TASKS ? 'bg-white shadow text-primary' : 'hover:bg-slate-200'}`} title="Tasks Only">
               <ListIcon className="w-4 h-4" />
             </button>
             <button onClick={() => setViewMode(ViewMode.NOTES)} className={`p-1.5 rounded-md transition-colors ${viewMode === ViewMode.NOTES ? 'bg-white shadow text-primary' : 'hover:bg-slate-200'}`} title="Notes Only">
               <NotesIcon className="w-4 h-4" />
             </button>
           </div>
          <button 
            onClick={() => {
                if(confirm("Are you sure you want to delete this list?")) onDeleteList(list.id);
            }} 
            className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 overflow-hidden flex flex-col md:flex-row ${viewMode === ViewMode.BOTH ? '' : 'justify-center'}`}>
        
        {/* --- TASKS SECTION --- */}
        {(viewMode === ViewMode.BOTH || viewMode === ViewMode.TASKS) && (
          <div className={`flex flex-col ${viewMode === ViewMode.BOTH ? 'w-full md:w-1/2 border-b md:border-b-0 md:border-r border-slate-200' : 'w-full max-w-3xl mx-auto'}`}>
            <div className="p-4 bg-slate-50/50 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center border-b border-slate-100">
               <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                 <ListIcon className="w-4 h-4" /> Tasks
               </h2>
               <button 
                 onClick={handleGenerateTasks} 
                 disabled={isGenerating}
                 className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-full transition-colors disabled:opacity-50"
               >
                 <SparklesIcon className="w-3.5 h-3.5" />
                 {isGenerating ? 'Thinking...' : 'AI Suggest'}
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Add Task Input */}
              <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <div className="p-2 text-slate-400"><PlusIcon className="w-5 h-5" /></div>
                <input 
                  type="text" 
                  value={newTaskText} 
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTask()}
                  placeholder="Add a new task..." 
                  className="flex-1 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
                />
                <button 
                  onClick={addTask} 
                  disabled={!newTaskText.trim()}
                  className="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Task List */}
              <div className="space-y-2 mt-4">
                {sortedTasks.map(task => (
                  <div key={task.id} className="group flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 hover:shadow-md transition-all hover:border-slate-200">
                    <button 
                      onClick={() => toggleTask(task.id)}
                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.completed ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-primary'}`}
                    >
                      {task.completed && <CheckIcon className="w-3.5 h-3.5" />}
                    </button>
                    <span className={`flex-1 text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {task.text}
                    </span>
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1 transition-all"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {list.tasks.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-sm">
                    No tasks yet. Add one or ask AI!
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- NOTES SECTION --- */}
        {(viewMode === ViewMode.BOTH || viewMode === ViewMode.NOTES) && (
          <div className={`flex flex-col ${viewMode === ViewMode.BOTH ? 'w-full md:w-1/2' : 'w-full max-w-3xl mx-auto'}`}>
             <div className="p-4 bg-slate-50/50 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center border-b border-slate-100">
               <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                 <NotesIcon className="w-4 h-4" /> Notes
               </h2>
               <button 
                 onClick={addNote}
                 className="flex items-center gap-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full transition-colors shadow-sm"
               >
                 <PlusIcon className="w-3.5 h-3.5" /> New Note
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 gap-4 content-start">
              {list.notes.map(note => (
                <div 
                  key={note.id} 
                  onClick={() => startEditingNote(note)}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-secondary/50" />
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-800 truncate pr-6">{note.title || 'Untitled'}</h3>
                    <button 
                      onClick={(e) => deleteNote(note.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity absolute top-3 right-3"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-slate-600 text-sm line-clamp-3 h-14">
                    {note.content || <span className="text-slate-400 italic">Empty note...</span>}
                  </p>
                  <div className="mt-3 text-xs text-slate-400">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
               {list.notes.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-sm col-span-1">
                    No notes yet. Start writing!
                  </div>
                )}
            </div>
          </div>
        )}
      </div>

      {/* Note Edit Modal / Overlay */}
      {editingNoteId && (
        <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white shadow-sm">
            <button onClick={saveNote} className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">
              Close & Save
            </button>
            <div className="flex gap-2">
               <button 
                 onClick={() => setShowAiModal(!showAiModal)}
                 className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showAiModal ? 'bg-secondary text-white' : 'text-secondary bg-secondary/10 hover:bg-secondary/20'}`}
               >
                 <SparklesIcon className="w-4 h-4" /> AI Assist
               </button>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-6 md:p-10 overflow-hidden">
             {showAiModal && (
               <div className="mb-6 p-4 bg-secondary/5 border border-secondary/20 rounded-xl animate-in fade-in slide-in-from-top-4">
                 <label className="block text-xs font-bold text-secondary uppercase mb-2">AI Instruction</label>
                 <div className="flex gap-2">
                   <input 
                    type="text" 
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. 'Summarize this', 'Make it a bulleted list', 'Fix grammar'..."
                    className="flex-1 bg-white border border-secondary/20 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-secondary/50 outline-none"
                   />
                   <button 
                    onClick={handleImproveNote}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 disabled:opacity-50"
                   >
                     {isGenerating ? 'Working...' : 'Apply'}
                   </button>
                 </div>
               </div>
             )}

             <input 
               type="text" 
               value={editingTitle} 
               onChange={(e) => setEditingTitle(e.target.value)} 
               placeholder="Note Title" 
               className="text-4xl font-bold text-slate-800 bg-transparent outline-none placeholder:text-slate-300 mb-6"
             />
             <textarea 
               value={editingContent}
               onChange={(e) => setEditingContent(e.target.value)}
               placeholder="Start typing your note here..."
               className="flex-1 resize-none bg-transparent outline-none text-lg text-slate-600 leading-relaxed placeholder:text-slate-300"
             />
          </div>
        </div>
      )}
    </div>
  );
};

export default ListDetail;