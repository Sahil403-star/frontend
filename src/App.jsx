import { useState, useEffect, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// ─── Palette & Tokens ─────────────────────────────────────────────────────────
const C = {
  bg: '#0f1117',
  surface: '#181c27',
  surfaceHover: '#1e2235',
  border: '#252a3a',
  accent: '#6c8eff',
  accentDim: '#3a4f99',
  green: '#3ecf8e',
  orange: '#f5a623',
  red: '#ff5c5c',
  text: '#e8eaf2',
  muted: '#7b82a0',
  white: '#ffffff',
};

const STATUS_META = {
  pending:     { label: 'Pending',     color: C.orange, bg: '#2a1f0d' },
  'in-progress':{ label: 'In Progress', color: C.accent,  bg: '#131a30' },
  done:        { label: 'Done',        color: C.green,  bg: '#0d2119' },
};

// ─── Tiny CSS-in-JS helper ────────────────────────────────────────────────────
const s = (base, extra = {}) => ({ ...base, ...extra });

// ─── Global Styles ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${C.bg}; color: ${C.text}; font-family: 'DM Sans', sans-serif; min-height: 100vh; }
    input, select, textarea, button { font-family: inherit; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: ${C.surface}; }
    ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    .fade-up { animation: fadeUp 0.35s ease both; }
  `}</style>
);

// ─── Components ───────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', padding:'40px' }}>
      <div style={{
        width:28, height:28, borderRadius:'50%',
        border:`3px solid ${C.border}`, borderTopColor: C.accent,
        animation:'spin 0.7s linear infinite'
      }}/>
    </div>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const color = type === 'error' ? C.red : C.green;
  return (
    <div style={{
      position:'fixed', bottom:24, right:24, zIndex:9999,
      background: C.surface, border:`1px solid ${color}`,
      borderLeft:`4px solid ${color}`, borderRadius:10,
      padding:'14px 20px', maxWidth:340,
      boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
      animation:'fadeUp 0.3s ease',
      color: C.text, fontSize:14,
    }}>
      {msg}
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={{ display:'block', fontSize:12, fontWeight:600, color:C.muted, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6 }}>{label}</label>}
      <input {...props} style={{
        width:'100%', padding:'11px 14px',
        background: C.bg, border:`1px solid ${C.border}`,
        borderRadius:8, color:C.text, fontSize:14,
        outline:'none', transition:'border 0.2s',
        ...(props.style||{}),
      }}
        onFocus={e => e.target.style.borderColor = C.accent}
        onBlur={e => e.target.style.borderColor = C.border}
      />
    </div>
  );
}

function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom:16 }}>
      {label && <label style={{ display:'block', fontSize:12, fontWeight:600, color:C.muted, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6 }}>{label}</label>}
      <select {...props} style={{
        width:'100%', padding:'11px 14px',
        background: C.bg, border:`1px solid ${C.border}`,
        borderRadius:8, color:C.text, fontSize:14,
        outline:'none', cursor:'pointer',
        appearance:'none',
        backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237b82a0' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat:'no-repeat', backgroundPosition:'right 14px center',
        ...(props.style||{}),
      }}>
        {children}
      </select>
    </div>
  );
}

function Btn({ children, variant='primary', loading, ...props }) {
  const styles = {
    primary: { background: C.accent, color: C.white, border:'none' },
    ghost:   { background:'transparent', color:C.muted, border:`1px solid ${C.border}` },
    danger:  { background:'transparent', color:C.red, border:`1px solid ${C.red}` },
  };
  return (
    <button {...props} style={{
      ...styles[variant],
      padding:'10px 20px', borderRadius:8, fontSize:14, fontWeight:600,
      cursor: props.disabled ? 'not-allowed' : 'pointer',
      opacity: props.disabled ? 0.5 : 1,
      transition:'all 0.2s', whiteSpace:'nowrap',
      ...(props.style||{}),
    }}
      onMouseEnter={e => { if(!props.disabled) e.currentTarget.style.opacity='0.85'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity='1'; }}
    >
      {loading ? '…' : children}
    </button>
  );
}

function Badge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'3px 10px', borderRadius:20,
      background: m.bg, color: m.color,
      fontSize:11, fontWeight:700, letterSpacing:'0.04em', textTransform:'uppercase',
    }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:m.color, display:'inline-block' }}/>
      {m.label}
    </span>
  );
}

function TaskCard({ task, user, onStatusChange }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
  const isAssignee = task.assignedTo === user.id;

  return (
    <div className="fade-up" style={{
      background: C.surface, border:`1px solid ${isOverdue ? C.red+'55' : C.border}`,
      borderRadius:12, padding:'18px 20px',
      transition:'border 0.2s, box-shadow 0.2s',
      boxShadow: isOverdue ? `0 0 0 1px ${C.red}33` : 'none',
    }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow=`0 4px 24px rgba(0,0,0,0.3)`; e.currentTarget.style.borderColor=C.accentDim; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow=isOverdue?`0 0 0 1px ${C.red}33`:'none'; e.currentTarget.style.borderColor=isOverdue?C.red+'55':C.border; }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:8 }}>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
            <h3 style={{ fontSize:15, fontWeight:600, fontFamily:'Syne, sans-serif', color:C.text }}>{task.title}</h3>
            {isOverdue && <span style={{ fontSize:11, fontWeight:700, color:C.red, background:'#2a0d0d', padding:'2px 8px', borderRadius:4, letterSpacing:'0.05em' }}>OVERDUE</span>}
          </div>
          {task.description && <p style={{ fontSize:13, color:C.muted, lineHeight:1.5 }}>{task.description}</p>}
        </div>
        <Badge status={task.status}/>
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:16, alignItems:'center', marginTop:12, paddingTop:12, borderTop:`1px solid ${C.border}` }}>
        <span style={{ fontSize:12, color:C.muted }}>
          <span style={{ color:C.accent, fontWeight:600 }}>@{task.assigneeName}</span>
        </span>
        {task.dueDate && (
          <span style={{ fontSize:12, color: isOverdue ? C.red : C.muted }}>
            Due {task.dueDate}
          </span>
        )}

        {(user.role === 'admin' || isAssignee) && (
          <div style={{ marginLeft:'auto', display:'flex', gap:6, flexWrap:'wrap' }}>
            {['pending','in-progress','done'].filter(s => s !== task.status).map(s => (
              <Btn key={s} variant="ghost" style={{ padding:'5px 12px', fontSize:12 }}
                onClick={() => onStatusChange(task.id, s)}>
                → {STATUS_META[s].label}
              </Btn>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Auth Page ────────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'member' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/${mode}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');
      if (mode === 'signup') { setMode('login'); setForm(f => ({ ...f, password:'' })); return; }
      onLogin(data.user);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:420 }} className="fade-up">
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:52, height:52, borderRadius:14, background:`linear-gradient(135deg, ${C.accent}, ${C.accentDim})`, marginBottom:16 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          <h1 style={{ fontFamily:'Syne, sans-serif', fontSize:26, fontWeight:800, letterSpacing:'-0.02em', color:C.text }}>Team Task Manager</h1>
          <p style={{ color:C.muted, fontSize:14, marginTop:4 }}>Collaborative task tracking for teams</p>
        </div>

        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:32 }}>
          {/* Tabs */}
          <div style={{ display:'flex', gap:4, background:C.bg, borderRadius:10, padding:4, marginBottom:24 }}>
            {['login','signup'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex:1, padding:'8px', borderRadius:7, border:'none', cursor:'pointer',
                background: mode===m ? C.accent : 'transparent',
                color: mode===m ? C.white : C.muted,
                fontWeight:600, fontSize:13, transition:'all 0.2s',
                fontFamily:'inherit',
              }}>{m === 'login' ? 'Sign In' : 'Sign Up'}</button>
            ))}
          </div>

          {mode === 'signup' && <Input label="Full Name" value={form.name} onChange={set('name')} placeholder="Jane Smith"/>}
          <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="you@company.com"/>
          <Input label="Password" type="password" value={form.password} onChange={set('password')} placeholder="••••••••"/>
          {mode === 'signup' && (
            <Select label="Role" value={form.role} onChange={set('role')}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </Select>
          )}

          {error && <p style={{ color:C.red, fontSize:13, marginBottom:16, padding:'10px 14px', background:'#2a0d0d', borderRadius:8 }}>{error}</p>}

          <Btn onClick={submit} loading={loading} disabled={loading} style={{ width:'100%', padding:'12px' }}>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </Btn>

          <p style={{ textAlign:'center', marginTop:16, fontSize:12, color:C.muted }}>
            Demo: <code style={{ background:C.bg, padding:'2px 6px', borderRadius:4, color:C.accent }}>admin@demo.com / admin123</code>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Create Task Modal ────────────────────────────────────────────────────────
function CreateTaskModal({ user, users, onClose, onCreate }) {
  const [form, setForm] = useState({ title:'', description:'', assignedTo:'', dueDate:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/tasks`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ...form, createdBy: user.id, role: user.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreate(data); onClose();
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fade-up" style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:32, width:'100%', maxWidth:480 }}>
        <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:20, fontWeight:700, marginBottom:24 }}>New Task</h2>
        <Input label="Title" value={form.title} onChange={set('title')} placeholder="Task title"/>
        <div style={{ marginBottom:16 }}>
          <label style={{ display:'block', fontSize:12, fontWeight:600, color:C.muted, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:6 }}>Description</label>
          <textarea value={form.description} onChange={set('description')} placeholder="Optional description…" rows={3} style={{
            width:'100%', padding:'11px 14px', background:C.bg, border:`1px solid ${C.border}`,
            borderRadius:8, color:C.text, fontSize:14, outline:'none', resize:'vertical',
          }}
            onFocus={e => e.target.style.borderColor=C.accent}
            onBlur={e => e.target.style.borderColor=C.border}
          />
        </div>
        <Select label="Assign To" value={form.assignedTo} onChange={set('assignedTo')}>
          <option value="">— Select member —</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
        </Select>
        <Input label="Due Date" type="date" value={form.dueDate} onChange={set('dueDate')}/>
        {error && <p style={{ color:C.red, fontSize:13, marginBottom:16, padding:'10px 14px', background:'#2a0d0d', borderRadius:8 }}>{error}</p>}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={submit} loading={loading} disabled={loading}>Create Task</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const notify = (msg, type='success') => setToast({ msg, type });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, uRes] = await Promise.all([
        fetch(`${API}/tasks?userId=${user.id}&role=${user.role}`),
        fetch(`${API}/users`),
      ]);
      setTasks(await tRes.json());
      setUsers(await uRes.json());
    } catch { notify('Failed to load data', 'error'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStatusChange = async (id, status) => {
    try {
      const res = await fetch(`${API}/tasks/${id}`, {
        method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ status, userId:user.id, role:user.role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks(ts => ts.map(t => t.id === id ? data : t));
      notify('Status updated');
    } catch(e) { notify(e.message, 'error'); }
  };

  const filtered = tasks.filter(t => filter === 'all' || t.status === filter);
  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => t.status==='pending').length,
    'in-progress': tasks.filter(t => t.status==='in-progress').length,
    done: tasks.filter(t => t.status==='done').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status!=='done').length,
  };

  return (
    <div style={{ minHeight:'100vh' }}>
      {/* Navbar */}
      <header style={{ background:C.surface, borderBottom:`1px solid ${C.border}`, padding:'0 24px', height:60, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:32, height:32, borderRadius:8, background:`linear-gradient(135deg, ${C.accent}, ${C.accentDim})`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          <span style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:16, color:C.text }}>TaskManager</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ textAlign:'right' }}>
            <p style={{ fontSize:13, fontWeight:600, color:C.text }}>{user.name}</p>
            <p style={{ fontSize:11, color: user.role==='admin' ? C.accent : C.muted, textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:700 }}>{user.role}</p>
          </div>
          <Btn variant="ghost" style={{ padding:'6px 14px', fontSize:13 }} onClick={onLogout}>Sign Out</Btn>
        </div>
      </header>

      <main style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px' }}>
        {/* Stats Row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))', gap:12, marginBottom:28 }}>
          {[
            { label:'Total', value:counts.all, color:C.muted },
            { label:'Pending', value:counts.pending, color:C.orange },
            { label:'In Progress', value:counts['in-progress'], color:C.accent },
            { label:'Done', value:counts.done, color:C.green },
            { label:'Overdue', value:counts.overdue, color:C.red },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:12, padding:'16px 18px' }}>
              <p style={{ fontSize:26, fontWeight:800, fontFamily:'Syne, sans-serif', color }}>{value}</p>
              <p style={{ fontSize:12, color:C.muted, marginTop:2, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {['all','pending','in-progress','done'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding:'6px 14px', borderRadius:20, border:`1px solid ${filter===f ? C.accent : C.border}`,
                background: filter===f ? C.accentDim : 'transparent',
                color: filter===f ? C.white : C.muted, fontSize:13, fontWeight:600, cursor:'pointer',
                transition:'all 0.2s', fontFamily:'inherit',
              }}>
                {f === 'all' ? 'All' : STATUS_META[f].label}
              </button>
            ))}
          </div>
          {user.role === 'admin' && (
            <Btn onClick={() => setShowModal(true)} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:18, lineHeight:1 }}>+</span> New Task
            </Btn>
          )}
        </div>

        {/* Task List */}
        {loading ? <Spinner/> : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'60px 0', color:C.muted }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom:16, opacity:0.4 }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6M9 12h6M9 15h4"/>
            </svg>
            <p style={{ fontSize:16, fontWeight:600 }}>No tasks found</p>
            <p style={{ fontSize:13, marginTop:4 }}>{user.role==='admin' ? 'Create your first task above.' : 'No tasks assigned to you yet.'}</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map(task => (
              <TaskCard key={task.id} task={task} user={user} onStatusChange={handleStatusChange}/>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <CreateTaskModal
          user={user} users={users}
          onClose={() => setShowModal(false)}
          onCreate={task => { setTasks(ts => [task, ...ts]); notify('Task created!'); }}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)}/>}
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ttm_user')); } catch { return null; }
  });

  const handleLogin = (u) => {
    localStorage.setItem('ttm_user', JSON.stringify(u));
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem('ttm_user');
    setUser(null);
  };

  return (
    <>
      <GlobalStyle/>
      {user ? <Dashboard user={user} onLogout={handleLogout}/> : <AuthPage onLogin={handleLogin}/>}
    </>
  );
}
