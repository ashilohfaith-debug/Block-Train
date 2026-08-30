"use client";

import { useState, useEffect } from "react";
import { TrainFront, ShieldAlert, KeyRound, User } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await res.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/");
      } else {
        setError(data.error?.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Server connection failed. Is the API running?");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden">
      {/* Interactive Background Elements */}
      <div 
        className="absolute w-full h-full pointer-events-none opacity-30"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(56, 189, 248, 0.15), transparent 40%)`
        }}
      />
      
      {/* Animated Train Track Lines */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute w-full h-[2px] bg-sky-500 top-1/4 animate-pulse" />
        <div className="absolute w-full h-[2px] bg-sky-500 top-1/4 mt-4 animate-pulse delay-75" />
        <div className="absolute w-full h-[2px] bg-indigo-500 bottom-1/3 animate-pulse delay-150" />
        <div className="absolute w-full h-[2px] bg-indigo-500 bottom-1/3 mt-4 animate-pulse delay-300" />
      </div>

      <div className="z-10 bg-slate-800/80 backdrop-blur-xl p-8 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md transform transition-all hover:scale-[1.02] duration-500">
        
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="bg-sky-500/20 p-4 rounded-full mb-4 shadow-[0_0_30px_rgba(14,165,233,0.3)] border border-sky-500/30">
            <TrainFront className="w-12 h-12 text-sky-400" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-wider">BlockTrain</h1>
          <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-widest">
            Central Dispatch System
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <ShieldAlert className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Username</label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
                placeholder="Enter dispatcher ID"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">Password</label>
            <div className="relative">
              <KeyRound className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all placeholder:text-slate-600"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-lg shadow-[0_0_20px_rgba(14,165,233,0.3)] transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(14,165,233,0.5)] disabled:opacity-50"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "AUTHORIZE DISPATCH"
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center border-t border-slate-700/50 pt-4">
          <p className="text-xs text-slate-500 font-mono">
            AUTHORIZED RAILWAY PERSONNEL ONLY
          </p>
        </div>
      </div>
    </div>
  );
}
