import React, { useState, useEffect } from 'react';
import { AppData, List } from './types';
import ListDetail from './components/ListDetail';
import { PlusIcon, LayoutGridIcon, ListIcon, ChevronRightIcon, TrashIcon } from './components/Icons';
import { api } from './services/api';

const EMOJIS = ['🏠', '🏢', '🛒', '✈️', '💪', '📚', '💡', '🎉'];
const COLORS = ['bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500', 'bg-purple-500'];
const LOCAL_STORAGE_KEY = 'tasknote-ai-data';

const DEFAULT_OFFLINE_DATA: AppData = {
  lists: [
    {
      id: 'local-1',
      name: 'Offline List',
      icon: '📂',
      color: 'bg-indigo-500',
      tasks: [{ id: 't1', text: 'This data is saved locally', completed: false, createdAt: Date.now() }],
      notes: [{ id: 'n1', title: 'Offline Mode', content: 'This content is stored in your browser because the server could not be reached.', createdAt: Date.now(), updatedAt: Date.now() }],
      createdAt: Date.now()
    }
  ]
};

const App: React.FC = () => {
  const [data, setData] = useState<AppData>({ lists: [] });
  const [activeListId, setActiveListId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useOffline, setUseOffline] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  // Fetch Data on Mount
  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const lists = await api.getLists();
      setData({ lists });
      setUseOffline(false);
      if (lists.length > 0 && !activeListId) {
        setActiveListId(lists[0].id);
      }
    } catch (err) {
      console.error(err);
      setError("Could not connect to the json-server.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchToOfflineMode = () => {
    setUseOffline(true);
    setError(null);
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setData(parsed);
      if (parsed.lists.length > 0) setActiveListId(parsed.lists[0].id);
    } else {
      setData(DEFAULT_OFFLINE_DATA);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_OFFLINE_DATA));
      setActiveListId(DEFAULT_OFFLINE_DATA.lists[0].id);
    }
  };

  const saveToLocalStorage = (newData: AppData) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
  };

  // CRUD for Lists

  const createList = async () => {
    if (!newListName.trim()) return;
    
    const newList: List = {
      id: Math.random().toString(36).substr(2, 9),
      name: newListName.trim(),
      icon: selectedEmoji,
      color: selectedColor,
      tasks: [],
      notes: [],
      createdAt: Date.now()
    };

    if (useOffline) {
      const newData = { lists: [...data.lists, newList] };
      setData(newData);
      saveToLocalStorage(newData);
      setActiveListId(newList.id);
      setIsCreatingList(false);
      setNewListName('');
      return;
    }

    try {
      const createdList = await api.createList(newList);
      setData(prev => ({ lists: [...prev.lists, createdList] }));
      setActiveListId(createdList.id);
      setIsCreatingList(false);
      setNewListName('');
    } catch (err) {
      alert("Failed to create list on server.");
    }
  };

  const updateList = async (updatedList: List) => {
    // Optimistic Update
    const newData = {
      lists: data.lists.map(l => l.id === updatedList.id ? updatedList : l)
    };
    setData(newData);

    if (useOffline) {
      saveToLocalStorage(newData);
      return;
    }

    try {
      await api.updateList(updatedList);
    } catch (err) {
      console.error("Failed to sync update", err);
      alert("Failed to save changes to server.");
    }
  };

  const deleteList = async (id: string) => {
    const listToDelete = data.lists.find(l => l.id === id);
    if (!listToDelete) return;

    // Optimistic Update
    const remaining = data.lists.filter(l => l.id !== id);
    const newData = { lists: remaining };
    setData(newData);
    
    if (activeListId === id) {
      setActiveListId(remaining.length > 0 ? remaining[0].id : '');
    }

    if (useOffline) {
      saveToLocalStorage(newData);
      return;
    }

    try {
      await api.deleteList(id);
    } catch (err) {
      console.error("Failed to delete", err);
      alert("Failed to delete list from server.");
      // Revert if failed
      setData(prev => ({ lists: [...prev.lists, listToDelete] }));
    }
  };

  const activeList = data.lists.find(l => l.id === activeListId);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-400 flex-col gap-4">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm font-medium">Loading your workspace...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-600 p-8 text-center">
        <div className="max-w-md bg-white p-8 rounded-2xl shadow-lg border border-red-100">
           <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
               <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
             </svg>
           </div>
           <h2 className="text-xl font-bold text-slate-800 mb-2">Server Not Found</h2>
           <p className="mb-6 text-sm leading-relaxed text-slate-500">
             We couldn't connect to the backend database at <code>localhost:3001</code>. 
           </p>
           
           <div className="bg-slate-100 p-3 rounded text-xs font-mono text-slate-500 mb-6 text-left border border-slate-200">
             <div className="font-semibold mb-1 text-slate-700">Option 1: Start the server</div>
             npx json-server db.json --port 3001
           </div>

           <div className="flex flex-col gap-3">
              <button onClick={fetchLists} className="w-full bg-slate-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-900 transition-colors">
                Retry Connection
              </button>
              <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-2 text-xs text-slate-400">OR</span>
                  <div className="flex-grow border-t border-slate-200"></div>
              </div>
              <button onClick={switchToOfflineMode} className="w-full bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                Continue in Offline Mode
              </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-800 font-sans selection:bg-indigo-100">
      
      {/* --- SIDEBAR --- */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} md:w-72 bg-white flex-shrink-0 flex flex-col border-r border-slate-200 transition-all duration-300 ease-in-out relative z-20`}>
        <div className="p-5 flex items-center justify-between border-b border-slate-100">
           <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md transition-colors ${useOffline ? 'bg-slate-500' : 'bg-gradient-to-br from-primary to-secondary'}`}>
              <LayoutGridIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-800 leading-tight">TaskNote</h1>
              <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-sm ${useOffline ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-600'}`}>
                {useOffline ? 'Offline' : 'Connected'}
              </span>
            </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">My Lists</p>
          
          {data.lists.map(list => (
            <button
              key={list.id}
              onClick={() => setActiveListId(list.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                activeListId === list.id 
                  ? 'bg-slate-100 text-slate-900 font-medium shadow-sm ring-1 ring-slate-200' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="text-xl">{list.icon}</span>
              <span className="truncate flex-1 text-left">{list.name}</span>
              <div className="flex gap-2 text-xs text-slate-400">
                 {list.tasks.filter(t => !t.completed).length > 0 && (
                   <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
                     {list.tasks.filter(t => !t.completed).length}
                   </span>
                 )}
              </div>
            </button>
          ))}

          {/* New List Creator Inline */}
          {isCreatingList ? (
            <div className="mt-4 p-3 bg-white border border-indigo-100 rounded-xl shadow-lg animate-in fade-in zoom-in-95 duration-200">
              <input 
                autoFocus
                type="text" 
                placeholder="List Name" 
                className="w-full text-sm font-medium border-b border-slate-200 pb-1 mb-3 outline-none focus:border-primary placeholder:text-slate-300"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
              />
              <div className="flex gap-1 mb-3 overflow-x-auto pb-1 no-scrollbar">
                {EMOJIS.map(e => (
                   <button key={e} onClick={() => setSelectedEmoji(e)} className={`p-1 rounded hover:bg-slate-100 ${selectedEmoji === e ? 'bg-slate-100 ring-1 ring-slate-300' : ''}`}>{e}</button>
                ))}
              </div>
              <div className="flex gap-1 mb-4">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setSelectedColor(c)} className={`w-4 h-4 rounded-full ${c} ${selectedColor === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`} />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={createList} className="flex-1 bg-primary text-white text-xs font-bold py-1.5 rounded-md hover:bg-indigo-600">Create</button>
                <button onClick={() => setIsCreatingList(false)} className="flex-1 bg-slate-100 text-slate-500 text-xs font-bold py-1.5 rounded-md hover:bg-slate-200">Cancel</button>
              </div>
            </div>
          ) : (
             <button 
               onClick={() => setIsCreatingList(true)}
               className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-primary hover:bg-indigo-50 border border-dashed border-slate-300 hover:border-indigo-200 transition-all mt-4"
             >
               <div className="w-6 h-6 rounded bg-slate-200 flex items-center justify-center group-hover:bg-indigo-100">
                 <PlusIcon className="w-4 h-4" />
               </div>
               <span className="text-sm font-medium">New List</span>
             </button>
          )}
        </div>
        
        {/* User / Footer */}
        <div className="p-4 border-t border-slate-100">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-400 to-pink-400 border-2 border-white shadow-sm"></div>
             <div className="flex flex-col">
               <span className="text-xs font-bold text-slate-700">Guest User</span>
               <span className="text-[10px] text-slate-400">{useOffline ? 'Local Storage' : 'JSON Server Connected'}</span>
             </div>
           </div>
        </div>
      </div>
      
      {/* Mobile Overlay for Sidebar */}
      {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden absolute top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md text-slate-600"
          >
            <ListIcon className="w-5 h-5" />
          </button>
      )}

      {/* --- MAIN CONTENT --- */}
      <div 
        className="flex-1 h-full relative" 
        onClick={() => { if(window.innerWidth < 768 && isSidebarOpen) setIsSidebarOpen(false); }}
      > 
        {activeList ? (
          <ListDetail 
            list={activeList} 
            onUpdateList={updateList} 
            onDeleteList={deleteList}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50">
             <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6 text-4xl shadow-inner">
               👋
             </div>
             <h2 className="text-xl font-bold text-slate-600 mb-2">Welcome to TaskNote AI</h2>
             <p className="max-w-xs text-center">Select a list from the sidebar or create a new one to get started.</p>
          </div>
        )}
      </div>

    </div>
  );
}

export default App;