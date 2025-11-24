import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ChevronDown, 
  Check, 
  X, 
  MinusCircle, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon,
  RotateCcw,
  Settings,
  Download,
  Upload,
  Database,
  MonitorDown
} from 'lucide-react';

// --- Type Definitions ---
type TaskStatus = 'pending' | 'completed' | 'failed' | 'given_up';

interface Task {
  id: string;
  dateStr: string; // YYYY-MM-DD
  text: string;
  status: TaskStatus;
  slogan?: string;
  sticker?: string;
  createdAt: number;
}

// --- Data Constants ---

const SLOGANS = {
  completed: [
    "今天的你闪闪发光！", 
    "积跬步，至千里。", 
    "干得漂亮，奖励你一朵小红花。", 
    "每一份努力都算数。", 
    "星光不问赶路人。"
  ],
  failed: [
    "没关系，遗憾也是生活的一部分。", 
    "允许自己休息，明天再战。", 
    "拥抱不完美。", 
    "裂痕是光照进来的地方。", 
    "慢慢来，比较快。"
  ],
  given_up: [
    "放下也是一种智慧。", 
    "与自己和解，精力留给更重要的事。", 
    "听从内心的声音。", 
    "学会拒绝，也是成长。", 
    "退一步海阔天空。"
  ]
};

const STICKERS = {
  completed: ['🐱', '☕', '☀️', '⭐', '🌸'],
  failed: ['🍂', '🌧️', '💭', '🩹'],
  given_up: ['💨', '🍃', '🕊️']
};

// --- Helper Functions ---

const generateId = () => Math.random().toString(36).substr(2, 9);

// [FIX] 核心修复：安全格式化日期（避免UTC时区导致的日期错位）
// 始终使用本地时间的 年、月、日 进行拼接，确保“所见即所得”
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

// --- Components ---

/**
 * Database Manager Component
 */
const DatabaseManager = ({ 
  isOpen, 
  onClose, 
  tasks, 
  onImport 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  tasks: Task[]; 
  onImport: (tasks: Task[]) => void; 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flowlog_backup_${formatDate(new Date())}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedTasks = JSON.parse(event.target?.result as string);
        if (Array.isArray(importedTasks)) {
          onImport(importedTasks);
          alert("数据恢复成功！");
          onClose();
        } else {
          alert("文件格式不正确");
        }
      } catch (err) {
        alert("无法解析文件，请确保是正确的备份文件");
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="neu-flat p-6 w-full max-w-sm relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
        
        <h2 className="text-xl font-bold text-gray-700 mb-2 flex items-center gap-2">
          <Database size={20} className="text-orange-400" />
          数据管家
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          数据存储在本地。为防止丢失，请定期备份文件。
        </p>

        <div className="space-y-4">
          <button 
            onClick={handleExport}
            className="neu-btn w-full py-3 rounded-xl flex items-center justify-center gap-2 text-gray-700 hover:text-orange-500"
          >
            <Download size={18} />
            <span>备份数据 (下载 .json)</span>
          </button>

          <button 
            onClick={handleImportClick}
            className="neu-btn w-full py-3 rounded-xl flex items-center justify-center gap-2 text-gray-700 hover:text-green-500"
          >
            <Upload size={18} />
            <span>恢复数据 (导入 .json)</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
           <h3 className="text-sm font-bold text-gray-600 mb-2 flex items-center gap-2">
             <MonitorDown size={16} />
             安装到桌面
           </h3>
           <p className="text-xs text-gray-500">
             点击浏览器地址栏右侧的 <span className="font-bold">安装图标</span> 或菜单中的 <span className="font-bold">"安装 FlowLog"</span>，即可像原生APP一样使用。
           </p>
        </div>
      </div>
    </div>
  );
};


/**
 * 1. Time Travel Navigation (Header)
 */
const TimeTraveler = ({ 
  currentDate, 
  onDateChange,
  onOpenSettings
}: { 
  currentDate: Date; 
  onDateChange: (d: Date) => void;
  onOpenSettings: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Simple Wheel Picker Logic
  const years = Array.from({ length: 11 }, (_, i) => 2020 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleYearSelect = (y: number) => {
    // [FIX] 切换年份时保持本地时间一致
    const newDate = new Date(currentDate.getTime());
    newDate.setFullYear(y);
    onDateChange(newDate);
  };

  const handleMonthSelect = (m: number) => {
    // [FIX] 切换月份时保持本地时间一致
    const newDate = new Date(currentDate.getTime());
    // 处理月份变化可能导致的天数溢出 (比如从3月31日切到2月，会自动变成3月3日)
    // 这里的逻辑是先设为1号，再设月份，避免溢出
    newDate.setDate(1); 
    newDate.setMonth(m - 1);
    // 尝试恢复原来的日，如果超过当月最大天数，则设为当月最后一天
    const originalDay = currentDate.getDate();
    const daysInNewMonth = new Date(y, m, 0).getDate();
    newDate.setDate(Math.min(originalDay, daysInNewMonth));
    
    onDateChange(newDate);
  };
  
  // 用于获取月份天数的辅助，修正 handleMonthSelect 中的 'y' 引用错误
  const y = currentDate.getFullYear();

  return (
    <div className="relative z-50">
      <div className="flex items-center justify-between p-6 pb-2">
        <h1 className="text-2xl font-bold tracking-wide text-gray-700">FlowLog</h1>
        
        <div className="flex gap-3">
           <button 
            onClick={() => setIsOpen(!isOpen)}
            className="neu-btn px-4 py-2 rounded-full flex items-center gap-2 text-gray-600 font-semibold text-sm"
          >
            <span>{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月</span>
            <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <button 
            onClick={onOpenSettings}
            className="neu-btn w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-orange-400"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Dropdown / Wheel View */}
      {isOpen && (
        <div className="absolute top-20 left-0 w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="neu-flat p-6 grid grid-cols-2 gap-4">
            <div className="h-40 overflow-y-auto snap-y scroll-smooth no-scrollbar border-r border-gray-200">
              {years.map(year => (
                <div 
                  key={year} 
                  onClick={() => handleYearSelect(year)}
                  className={`snap-center py-2 text-center cursor-pointer transition-all ${year === currentDate.getFullYear() ? 'text-xl font-bold text-orange-400 scale-110' : 'text-gray-400'}`}
                >
                  {year}
                </div>
              ))}
            </div>
            <div className="h-40 overflow-y-auto snap-y scroll-smooth no-scrollbar">
              {months.map(m => (
                <div 
                  key={m} 
                  onClick={() => handleMonthSelect(m)}
                  className={`snap-center py-2 text-center cursor-pointer transition-all ${m === currentDate.getMonth() + 1 ? 'text-xl font-bold text-orange-400 scale-110' : 'text-gray-400'}`}
                >
                  {m}月
                </div>
              ))}
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="col-span-2 mt-2 py-2 text-sm text-gray-400 hover:text-gray-600"
            >
              收起时光机
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 2. Visual Trace Calendar
 */
const TraceCalendar = ({ 
  currentDate, 
  tasks, 
  selectedDate,
  onSelectDate 
}: { 
  currentDate: Date; 
  tasks: Task[]; 
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}) => {
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  
  // Generate days array
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getTraceForDay = (day: number) => {
    // [FIX] 使用一致的 formatDate 逻辑来生成对比字符串
    // 构造一个当天的 Date 对象
    const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dateStr = formatDate(dateToCheck);
    
    const dayTasks = tasks.filter(t => t.dateStr === dateStr);
    
    if (dayTasks.length === 0) return null;

    // Logic: If any completed -> Sticker. If all failed -> Rain. If mixed/pending -> Pencil.
    const completed = dayTasks.filter(t => t.status === 'completed');
    const failed = dayTasks.filter(t => t.status === 'failed');
    const givenUp = dayTasks.filter(t => t.status === 'given_up');

    if (completed.length > 0) {
      // Use the sticker of the last completed task or a default
      return <span className="text-xl animate-bounce">{completed[0].sticker || '🐱'}</span>;
    }
    if (failed.length === dayTasks.length) {
      return <span className="text-xl">🌧️</span>;
    }
    if (givenUp.length === dayTasks.length) {
      return <span className="text-xl opacity-50">💨</span>;
    }

    // Default: Pencil Trace (Pending or Mixed)
    return (
      <svg viewBox="0 0 100 100" className="w-8 h-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
         <path d="M 50, 50 m -40, 0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0" className="pencil-trace" style={{ strokeDashoffset: '20' }} />
      </svg>
    );
  };

  return (
    <div className="px-6 mb-6">
      <div className="neu-pressed p-4">
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-gray-400 mb-2">
          {['日', '一', '二', '三', '四', '五', '六'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map(day => {
            const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth() && selectedDate.getFullYear() === currentDate.getFullYear();
            return (
              <div 
                key={day} 
                onClick={() => {
                  // [FIX] 点击切换日期时，创建一个新的 Date 对象，确保时分秒不受影响
                  const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                  onSelectDate(newDate);
                }}
                className={`
                  relative h-10 w-10 flex items-center justify-center rounded-full cursor-pointer transition-all
                  ${isSelected ? 'bg-orange-100 text-orange-600 font-bold shadow-inner' : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                <span className="relative z-10 text-sm">{day}</span>
                {getTraceForDay(day)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * 3. Emotional Task Card
 */

interface TaskCardProps {
  task: Task; 
  onUpdateStatus: (id: string, status: TaskStatus) => void; 
  onDelete: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onUpdateStatus,
  onDelete 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    setShowConfirm(false);
    setIsDeleting(true); // Trigger animation
    setTimeout(() => {
      onDelete(task.id);
    }, 800); // Wait for erase animation
  };

  if (isDeleting) {
    return (
      <div className="w-full h-32 neu-flat mb-4 flex items-center justify-center erasing text-gray-400">
        <span className="font-handwriting text-lg">正在擦除记忆...</span>
      </div>
    );
  }

  const getStatusColor = (s: TaskStatus) => {
    switch (s) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'failed': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'given_up': return 'text-slate-500 bg-slate-100 border-slate-200';
      default: return 'text-gray-700 bg-[#F7F5F0]';
    }
  };

  return (
    <div className="mb-6 relative group">
      <div className={`neu-flat p-5 transition-all duration-300 border border-transparent ${task.status !== 'pending' ? getStatusColor(task.status) : ''}`}>
        
        {/* Header: Text & Delete */}
        <div className="flex justify-between items-start mb-4">
          <p className={`text-lg font-medium ${task.status === 'given_up' ? 'line-through opacity-60' : ''}`}>
            {task.text}
          </p>
          <button 
            onClick={handleDeleteClick} 
            className="text-gray-300 hover:text-red-400 transition-colors p-1"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Action Buttons (Only visible if pending or to change status) */}
        <div className="flex gap-3 justify-between mt-2">
           <button 
             onClick={() => onUpdateStatus(task.id, 'completed')}
             className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 transition-all
               ${task.status === 'completed' ? 'neu-pressed text-green-600' : 'neu-btn text-gray-400 hover:text-green-500'}
             `}
           >
             <Check size={18} />
             <span className="text-xs">完成</span>
           </button>

           <button 
             onClick={() => onUpdateStatus(task.id, 'failed')}
             className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 transition-all
               ${task.status === 'failed' ? 'neu-pressed text-orange-500' : 'neu-btn text-gray-400 hover:text-orange-500'}
             `}
           >
             <X size={18} />
             <span className="text-xs">未完</span>
           </button>

           <button 
             onClick={() => onUpdateStatus(task.id, 'given_up')}
             className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1 transition-all
               ${task.status === 'given_up' ? 'neu-pressed text-slate-500' : 'neu-btn text-gray-400 hover:text-slate-500'}
             `}
           >
             <MinusCircle size={18} />
             <span className="text-xs">放弃</span>
           </button>
        </div>

        {/* Emotional Slogan Feedback */}
        {task.slogan && (
          <div className="mt-4 pt-3 border-t border-black/5 fade-in-up text-center">
            <p className="font-handwriting text-xl leading-relaxed opacity-80">
              {task.slogan}
            </p>
            {task.sticker && task.status === 'completed' && (
              <div className="absolute -top-4 -right-2 text-4xl animate-bounce filter drop-shadow-lg transform rotate-12">
                {task.sticker}
              </div>
            )}
            {(task.status === 'failed') && (
              <div className="absolute -top-4 -right-2 text-4xl opacity-80 filter drop-shadow-md">
                🍂
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Overlay */}
      {showConfirm && (
        <div className="absolute inset-0 bg-[#F7F5F0]/90 z-10 rounded-2xl flex flex-col items-center justify-center p-4 text-center backdrop-blur-sm">
          <p className="text-gray-600 mb-4 font-handwriting text-lg">要擦掉这个痕迹吗？</p>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowConfirm(false)}
              className="px-4 py-2 bg-white rounded-full shadow-sm text-sm"
            >
              保留
            </button>
            <button 
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-100 text-red-500 rounded-full shadow-sm text-sm"
            >
              擦除
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Application ---

const App = () => {
  // Init state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 初始化任务列表：尝试从 LocalStorage 读取，如果没有则使用初始数据
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const savedTasks = localStorage.getItem('flowlog_tasks');
      if (savedTasks) {
        return JSON.parse(savedTasks);
      }
    } catch (error) {
      console.error("Failed to load tasks from local storage", error);
    }
    
    // 默认种子数据
    const today = formatDate(new Date());
    return [
      { id: '1', dateStr: today, text: '阅读《心流》30分钟', status: 'pending', createdAt: Date.now() },
      { id: '2', dateStr: today, text: '晨跑 3 公里', status: 'completed', slogan: '今天的你闪闪发光！', sticker: '☀️', createdAt: Date.now() - 1000 }
    ];
  });

  const [newTaskText, setNewTaskText] = useState("");

  // 监听任务变化并保存到 LocalStorage（简易本地数据库）
  useEffect(() => {
    localStorage.setItem('flowlog_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const selectedDateStr = formatDate(currentDate);
  const currentTasks = tasks.filter(t => t.dateStr === selectedDateStr);

  const addTask = () => {
    if (!newTaskText.trim()) return;
    const newTask: Task = {
      id: generateId(),
      dateStr: selectedDateStr,
      text: newTaskText,
      status: 'pending',
      createdAt: Date.now()
    };
    setTasks([...tasks, newTask]);
    setNewTaskText("");
  };

  const updateTaskStatus = (id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (t.status === status) return t; // No change

      // Logic: Generate slogan & sticker if moving to a final state
      let slogan = t.slogan;
      let sticker = t.sticker;

      if (status !== 'pending') {
        slogan = getRandomItem(SLOGANS[status]);
        if (status === 'completed') {
          sticker = getRandomItem(STICKERS.completed);
        } else if (status === 'failed') {
          sticker = getRandomItem(STICKERS.failed);
        } else {
          sticker = getRandomItem(STICKERS.given_up);
        }
      } else {
        slogan = undefined;
        sticker = undefined;
      }

      return { ...t, status, slogan, sticker };
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen max-w-md mx-auto relative bg-[#F7F5F0] shadow-2xl overflow-hidden flex flex-col">
      
      {/* 1. Header & Navigation */}
      <TimeTraveler 
        currentDate={currentDate} 
        onDateChange={setCurrentDate} 
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 2. Calendar Trace System */}
      <TraceCalendar 
        currentDate={currentDate} 
        tasks={tasks} 
        selectedDate={currentDate}
        onSelectDate={setCurrentDate}
      />

      {/* 3. Task Execution Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-700">
            {currentDate.getDate()}日 
            <span className="text-sm font-normal text-gray-400 ml-2 font-handwriting">
               {currentTasks.length > 0 ? '种下的种子...' : '今天想做点什么？'}
            </span>
          </h2>
        </div>

        {currentTasks.length === 0 && (
          <div className="text-center py-10 opacity-40">
            <div className="text-6xl mb-4 grayscale">🌱</div>
            <p className="font-handwriting text-xl">静待发芽...</p>
          </div>
        )}

        {currentTasks.map(task => (
          <TaskCard 
            key={task.id} 
            task={task} 
            onUpdateStatus={updateTaskStatus}
            onDelete={deleteTask}
          />
        ))}
      </div>

      {/* 4. Add Task Input (Sticky Bottom) */}
      <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-[#F7F5F0] via-[#F7F5F0] to-transparent">
        <div className="neu-flat p-2 pl-4 flex items-center">
          <input 
            type="text" 
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="写下今天的承诺..."
            className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
          />
          <button 
            onClick={addTask}
            className="neu-btn w-10 h-10 rounded-xl flex items-center justify-center text-orange-400 hover:text-orange-500"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Database / Settings Modal */}
      <DatabaseManager 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        tasks={tasks}
        onImport={setTasks}
      />

    </div>
  );
};

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);