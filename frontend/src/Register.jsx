import { useState } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, Sparkles, CheckCircle, Eye, EyeOff } from 'lucide-react'; // <-- Added icons

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // <-- New state
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else {
      alert("Registration Successful!");
      navigate('/login');
    }
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
          <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
            Join thousands of engineers clearing interviews.
          </h2>
          <div className="space-y-4">
            {['Unlimited AI Mock Interviews', 'Real-time Resume Parsing', 'Detailed Performance Analytics'].map((feat, i) => (
              <div key={i} className="flex items-center gap-3 text-slate-300">
                <CheckCircle className="text-blue-500" size={20} />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 w-full h-full bg-blue-900/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      {/* Right Side - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white">Create an account</h2>
            <p className="mt-2 text-slate-400">Start your journey to your dream job today.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-6">
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
              <label className="block text-sm font-medium text-slate-300 mb-2">Create Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-500" size={20} />
                {/* 👇 UPDATED PASSWORD INPUT 👇 */}
                <input 
                  type={showPassword ? "text" : "password"} // Dynamic type
                  required
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl py-3 pl-10 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition outline-none placeholder-slate-500"
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)} 
                />
                {/* 👇 EYE ICON BUTTON 👇 */}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-white transition cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">Must be at least 6 characters.</p>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Sign Up for Free"}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}