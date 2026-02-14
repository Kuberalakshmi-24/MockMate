import { useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react'; // <-- Added icons

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // <-- New state for visibility
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else navigate('/');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* Left Side - Brand Section (No Change) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 border-r border-slate-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="z-10">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Sparkles className="text-white" size={24} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">MockMate Pro</h1>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
            Master your technical interview with AI.
          </h2>
          <p className="text-slate-400 text-lg max-w-md">
            Practice with our Llama-3 powered interviewer and get real-time feedback to land your dream job.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="z-10">
          <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-400">
            "The best way to predict the future is to create it."
          </blockquote>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white">Welcome back</h2>
            <p className="mt-2 text-slate-400">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-500" size={20} />
                <input 
                  type="email" required
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none placeholder-slate-500"
                  placeholder="name@company.com"
                  onChange={(e) => setEmail(e.target.value)} 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500" size={20} />
                {/* 👇 UPDATED PASSWORD INPUT 👇 */}
                <input 
                  type={showPassword ? "text" : "password"} // Dynamic type
                  required
                  // Added 'pr-10' for right padding so text doesn't hit the icon
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none placeholder-slate-500"
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)} 
                />
                {/* 👇 EYE ICON BUTTON 👇 */}
                <button
                  type="button" // Important: prevent form submission
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2 group"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>Sign in <ArrowRight size={18} className="group-hover:translate-x-1 transition" /></>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}