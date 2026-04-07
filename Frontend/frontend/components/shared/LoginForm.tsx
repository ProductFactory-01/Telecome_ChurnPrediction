"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function LoginForm() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { full_name: formData.fullName, email: formData.email, password: formData.password };
      
      const response = await api.post(endpoint, payload);
      const { access_token, user } = response.data;

      localStorage.setItem("authToken", access_token);
      localStorage.setItem("user", JSON.stringify(user));
      
      router.push("/");
    } catch (error: any) {
      console.error("Auth error:", error);
      setErrorMessage(
        error.response?.data?.detail || 
        "Authentication failed. Please check your credentials or ensure the server is online."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 relative overflow-hidden font-inter selection:bg-emerald-100 selection:text-emerald-900">
      {/* Subtle Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#1fac72]/5 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[460px] px-6"
      >
        <div className="bg-white border border-stone-200 rounded-[1.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.06)] p-8 sm:p-14 overflow-hidden relative">
          
          {/* Top Brand Stripe */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-[#1fac72]" />

          {/* Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-8">
              <img src="/corp_logo.svg" alt="CenturyLink Logo" className="h-10 w-auto" />
            </div>
            
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              {isLogin ? "Churn Prediction" : "Join Intelligence Base"}
            </h1>
            <p className="text-stone-500 text-[14px] mt-2 font-medium">
              {isLogin ? "Secured Portal for CenturyLink Retention Agents" : "Request access to the multi-agent prediction system."}
            </p>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mb-8"
              >
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-semibold leading-relaxed">
                  <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-red-500" />
                  {errorMessage}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">Agent Full Name</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Samuel Green"
                      className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-11 py-3.5 rounded-xl focus:ring-4 focus:ring-[#1fac72]/10 focus:border-[#1fac72] outline-none transition-all placeholder:text-stone-400 text-[15px] font-medium" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-[#1fac72] transition-colors">
                      <Lock size={18} strokeWidth={2.5} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest ml-1">Company Email</label>
              <div className="relative group">
                <input 
                  type="email" 
                  required
                  placeholder="name@centurylink.com"
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-11 py-3.5 rounded-xl focus:ring-4 focus:ring-[#1fac72]/10 focus:border-[#1fac72] outline-none transition-all placeholder:text-stone-400 text-[15px] font-medium" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-[#1fac72] transition-colors">
                  <Mail size={18} strokeWidth={2.5} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">Password</label>
                {isLogin && (
                  <button type="button" className="text-[11px] font-bold text-[#1fac72] hover:text-[#178558] transition-colors">
                    Reset credentials
                  </button>
                )}
              </div>
              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  placeholder="••••••••"
                  className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-11 py-3.5 rounded-xl focus:ring-4 focus:ring-[#1fac72]/10 focus:border-[#1fac72] outline-none transition-all placeholder:text-stone-400 text-[15px] font-medium" 
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-[#1fac72] transition-colors">
                  <Lock size={18} strokeWidth={2.5} />
                </div>
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              disabled={isLoading}
              className={`
                w-full relative overflow-hidden flex items-center justify-center gap-3 py-4 rounded-xl font-bold tracking-wide transition-all group mt-2
                ${isLoading 
                  ? "bg-stone-300 cursor-not-allowed" 
                  : "bg-stone-900 hover:bg-[#1fac72] text-white active:transform active:scale-[0.98] shadow-lg shadow-stone-900/10"
                }
              `}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-stone-500 border-t-stone-200 rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-[15px]">{isLogin ? "Sign In to Platform" : "Request Intelligence Access"}</span>
                  <ArrowRight size={18} className="opacity-70 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Toggle Login/Sign-up */}
        <p className="mt-8 text-center text-stone-500 text-sm font-medium">
          {isLogin ? "Need access to the agent?" : "Already possess valid credentials?"}{" "}
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMessage("");
            }}
            className="text-[#1fac72] hover:text-[#178558] font-bold transition-all decoration-[#1fac72]/30 underline underline-offset-4"
          >
            {isLogin ? "Create an account" : "Log in here"}
          </button>
        </p>
      </motion.div>

      {/* Footer Text */}
      <div className="absolute bottom-8 left-0 w-full text-center">
        <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-stone-300">
          © 2026 CenturyLink. Proprietary Retention Infrastructure.
        </span>
      </div>
    </div>
  );
}
