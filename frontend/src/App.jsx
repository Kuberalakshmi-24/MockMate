import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Editor from "@monaco-editor/react";
import { 
  LayoutDashboard, MessageSquare, LogOut, Upload, Mic, Send, 
  User, ChevronRight, PieChart, Sparkles, FileText, Menu, X, 
  Code, Timer, Volume2, VolumeX, FileCheck, Award
} from 'lucide-react';

// 🌎 BACKEND URL (Orey idathula maathuna podhum)
const API_URL = "https://mockmate-backend-nxzo.onrender.com";

// 🎤 VOICE INPUT SETUP
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;

// --- SIDEBAR COMPONENT ---
function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: MessageSquare, label: 'Interview Room', path: '/interview' },
  ];

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 border-r border-slate-800 transition-transform duration-300 md:relative md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-6 py-8 border-b border-slate-800">
            <div className="p-2 bg-blue-600 rounded-lg"><Sparkles size={20} className="text-white" /></div>
            <h1 className="text-xl font-bold text-white tracking-tight">MockMate Pro</h1>
          </div>
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${location.pathname === item.path ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                <item.icon size={20} /><span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-800">
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><LogOut size={20} /><span className="font-medium">Sign Out</span></button>
          </div>
        </div>
      </div>
    </>
  );
}

// --- DASHBOARD COMPONENT ---
function Dashboard() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, avgScore: 0 });

  useEffect(() => {
    // ✅ CORRECTED LINK: /dashboard
    axios.get(`${API_URL}/dashboard`)
      .then(res => {
        if (Array.isArray(res.data)) {
            setHistory(res.data);
            const scores = res.data.map(i => parseInt(i.score) || 0).filter(s => s > 0);
            const avg = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;
            setStats({ total: res.data.length, avgScore: avg });
        }
      })
      .catch(err => console.error("Dashboard Error:", err));
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="mb-8"><h1 className="text-3xl font-bold text-white mb-2">Welcome Back, Engineer! 👋</h1></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl"><h3 className="text-3xl font-bold text-white">{stats.total}</h3><p className="text-slate-400">Total Interviews</p></div>
        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl"><h3 className="text-3xl font-bold text-white">{stats.avgScore}/10</h3><p className="text-slate-400">Avg Score</p></div>
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white"><Link to="/interview" className="block mt-4 bg-white text-blue-700 text-center py-2 rounded-lg font-bold">Launch Interview 🚀</Link></div>
      </div>
    </div>
  );
}

// --- INTERVIEW COMPONENT ---
function Interview() {
  const [chat, setChat] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false); 
  const [timeLeft, setTimeLeft] = useState(120); 
  const [voiceEnabled, setVoiceEnabled] = useState(true); 
  const [atsData, setAtsData] = useState(null); 
  const [showReport, setShowReport] = useState(false); 
  const [reportData, setReportData] = useState(null);

  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), [chat, loading]);

  useEffect(() => {
    if (timeLeft > 0 && chat.length > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, chat]);

  const speak = (text) => {
    if (!voiceEnabled) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1; 
    window.speechSynthesis.speak(utterance);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const formData = new FormData();
    formData.append("file", file);
    
    // Show loading state
    setChat([...chat, { role: "system", text: "⏳ Analyzing Resume... (This takes 30s on free server)" }]);

    try {
      // ✅ CORRECTED LINK: /upload
      const res = await axios.post(`${API_URL}/upload`, formData);
      setAtsData(res.data.ats_report); 
      setChat(prev => [...prev, { role: "system", text: "✅ Resume Parsed! Check your ATS Score above. Type 'start' to begin." }]);
    } catch (err) { 
        console.error(err);
        setChat(prev => [...prev, { role: "system", text: "❌ Upload Failed. Server might be sleeping. Try again in 1 min." }]);
    }
  };

  const sendMsg = async () => {
    if (!msg.trim()) return;
    window.speechSynthesis.cancel();
    const newChat = [...chat, { role: "user", text: msg }];
    setChat(newChat);
    setMsg("");
    setLoading(true);
    setTimeLeft(120);

    const formData = new FormData();
    formData.append("question", msg);

    try {
      // ✅ CORRECTED LINK: /chat
      const res = await axios.post(`${API_URL}/chat`, formData);
      const aiResponse = res.data.response;
      setChat([...newChat, { role: "ai", text: aiResponse }]);
      speak(aiResponse);
    } catch (err) { 
        console.error(err);
        setChat([...newChat, { role: "system", text: "❌ Error: Server error or timeout." }]);
    }
    setLoading(false);
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      // ✅ CORRECTED LINK: /generate_report
      const res = await axios.get(`${API_URL}/generate_report`);
      setReportData(res.data);
      setShowReport(true);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <div className={`flex-1 flex flex-col transition-all ${showCode ? 'w-1/2' : 'w-full'}`}>
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-white">MockMate AI</h2>
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold ${timeLeft < 30 ? 'bg-red-900 text-red-400 animate-pulse' : 'bg-slate-800 text-green-400'}`}>
              <Timer size={14} /> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <div className="flex gap-2">
             <button onClick={() => setVoiceEnabled(!voiceEnabled)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white">
               {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
             </button>
             <button onClick={() => setShowCode(!showCode)} className={`p-2 rounded-lg ${showCode ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
               <Code size={18} />
             </button>
             <button onClick={generateReport} className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-bold">End Interview</button>
          </div>
        </div>

        {atsData && (
          <div className="bg-slate-900 border-b border-slate-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold flex items-center gap-2"><FileCheck size={18} className="text-blue-400"/> ATS Resume Score</h3>
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-sm font-bold">{atsData.score || "N/A"}</span>
            </div>
            {atsData.missing_keywords && (
              <p className="text-xs text-red-400">Missing Keywords: {atsData.missing_keywords.join(", ")}</p>
            )}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {chat.length === 0 && (
             <div className="text-center mt-20">
               <button onClick={() => fileInputRef.current.click()} className="bg-blue-600 px-6 py-3 rounded-full text-white font-bold animate-bounce cursor-pointer">Upload Resume & Start</button>
               <input type="file" ref={fileInputRef} hidden onChange={handleUpload} />
             </div>
          )}
          {chat.map((c, i) => (
            <div key={i} className={`flex gap-4 ${c.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${c.role === "user" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-100"}`}>
                <p className="whitespace-pre-wrap text-sm">{c.text}</p>
              </div>
            </div>
          ))}
          {loading && <div className="text-slate-400 text-xs text-center animate-pulse">AI is thinking...</div>}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-3">
          <input className="flex-1 bg-slate-800 text-white rounded-xl px-5 py-3 focus:outline-none" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type your answer..." onKeyPress={(e) => e.key === 'Enter' && sendMsg()} />
          <button onClick={sendMsg} className="p-3 bg-blue-600 text-white rounded-xl"><Send size={20} /></button>
        </div>
      </div>

      {showCode && (
        <div className="w-1/2 bg-[#1e1e1e] border-l border-slate-800 flex flex-col">
          <div className="p-2 bg-[#2d2d2d] text-slate-400 text-xs font-mono border-b border-black">JavaScript / Python Editor</div>
          <Editor height="100%" defaultLanguage="javascript" theme="vs-dark" defaultValue="// Write your code here..." />
        </div>
      )}

      {showReport && reportData && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl max-w-2xl w-full relative">
            <button onClick={() => setShowReport(false)} className="absolute top-4 right-4 text-slate-400"><X size={24}/></button>
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-2"><Award className="text-yellow-400"/> Interview Report Card</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-slate-800 p-4 rounded-xl text-center"><div className="text-2xl font-bold text-blue-400">{reportData.communication}</div><div className="text-xs text-slate-400">Communication</div></div>
              <div className="bg-slate-800 p-4 rounded-xl text-center"><div className="text-2xl font-bold text-green-400">{reportData.technical}</div><div className="text-xs text-slate-400">Technical</div></div>
              <div className="bg-slate-800 p-4 rounded-xl text-center"><div className="text-2xl font-bold text-purple-400">{reportData.confidence}</div><div className="text-xs text-slate-400">Confidence</div></div>
            </div>
            <div className="space-y-4">
              <div className="bg-green-900/20 border border-green-800 p-4 rounded-xl"><h4 className="font-bold text-green-400 mb-1">Feedback Summary</h4><p className="text-slate-300 text-sm">{reportData.feedback}</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800"><span className="font-bold text-white">MockMate Pro</span><button onClick={() => setMobileOpen(true)} className="text-slate-400"><Menu size={24} /></button></div>
        <main className="flex-1 overflow-auto bg-slate-950"><Routes><Route path="/" element={<Dashboard />} /><Route path="/interview" element={<Interview />} /></Routes></main>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);
  if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  if (!session) return <Navigate to="/login" />;
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={<ProtectedRoute><Layout /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}
import Login from './Login';
import Register from './Register';