"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

interface Machine {
  id: number;
  name: string;
  asset_tag: string;
  status: string;
}

export default function MobileMachineApp() {
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal States
  const [activeView, setActiveView] = useState<"home" | "fault" | "pm" | "report">("home");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("mechanical");
  const [supervisor, setSupervisor] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://168.144.81.103:5000";

  useEffect(() => {
    const fetchMachine = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      
      if (!id) {
        setError("Invalid QR Code / अमान्य क्यूआर कोड");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${baseUrl}/api/machines`);
        const data = await res.json();
        const found = data.find((m: Machine) => m.id.toString() === id);
        
        if (found) {
          setMachine(found);
        } else {
          setError("Machine Not Found / मशीन नहीं मिली");
        }
      } catch (err) {
        setError("Connection Error / कनेक्शन त्रुटि");
      }
      setLoading(false);
    };
    
    fetchMachine();
  }, []);

  const resetForm = () => {
    setDescription("");
    setSupervisor("");
    setPhotos([]);
    setActiveView("home");
  };

  const handleFaultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machine) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("machine_id", machine.id.toString());
      formData.append("task_category", category);
      formData.append("description", description);
      photos.forEach(file => formData.append("photos", file));

      const res = await fetch(`${baseUrl}/api/work-orders/report`, { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      alert("✅ Fault Reported / खराबी दर्ज हो गई");
      resetForm();
    } catch (err) {
      alert("❌ Error / त्रुटि");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePMSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machine) return;
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("machine_id", machine.id.toString());
      formData.append("task_category", category);
      formData.append("description", description);
      formData.append("supervisor_name", supervisor);
      photos.forEach(file => formData.append("photos", file));

      const res = await fetch(`${baseUrl}/api/work-orders/preventive`, { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      alert("✅ Service Logged / सर्विस दर्ज हो गई");
      resetForm();
    } catch (err) {
      alert("❌ Error / त्रुटि");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center text-xl animate-pulse">Loading...</div>;
  if (error || !machine) return <div className="min-h-screen bg-zinc-950 text-red-500 flex items-center justify-center text-xl font-bold p-8 text-center">{error}</div>;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-10">
      
      {/* HEADER (Always visible) */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-6 shadow-lg sticky top-0 z-10">
        <div className="flex justify-between items-start mb-2">
          <span className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase border ${machine.status === 'breakdown' ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'}`}>
            {machine.status === 'breakdown' ? 'OFFLINE / बंद' : 'ONLINE / चालू'}
          </span>
          <span className="text-zinc-500 text-xs font-mono bg-zinc-950 px-2 py-1 rounded">ID: {machine.id}</span>
        </div>
        <h1 className="text-2xl font-black text-white leading-tight">{machine.name}</h1>
        <p className="text-zinc-400 font-mono text-sm mt-1">{machine.asset_tag}</p>
      </div>

      {/* HOME VIEW (The Action Buttons) */}
      {activeView === "home" && (
        <div className="p-4 space-y-4 mt-4">
          <button onClick={() => setActiveView("fault")} className="w-full bg-red-600 hover:bg-red-500 text-white p-6 rounded-3xl shadow-xl shadow-red-900/20 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
            <span className="text-4xl mb-1">🚨</span>
            <span className="text-2xl font-black tracking-tight">Report Fault</span>
            <span className="text-sm font-medium opacity-90">खराबी दर्ज करें</span>
          </button>

          <button onClick={() => setActiveView("pm")} className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 p-6 rounded-3xl shadow-xl shadow-amber-900/20 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform mt-6">
            <span className="text-4xl mb-1">🔧</span>
            <span className="text-2xl font-black tracking-tight">Log Service</span>
            <span className="text-sm font-medium opacity-90">सर्विस / पीएम दर्ज करें</span>
          </button>
          
          <Link href={`/machines?id=${machine.id}`} className="w-full bg-zinc-800 hover:bg-zinc-700 text-white p-6 rounded-3xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform mt-6 border border-zinc-700">
            <span className="text-3xl mb-1">📊</span>
            <span className="text-xl font-bold tracking-tight">Full Dashboard</span>
            <span className="text-xs font-medium text-zinc-400">पूरा डैशबोर्ड देखें</span>
          </Link>
        </div>
      )}

      {/* FAULT VIEW */}
      {activeView === "fault" && (
        <div className="p-4 animate-in slide-in-from-right-4">
          <button onClick={resetForm} className="text-zinc-400 mb-6 flex items-center gap-2 font-bold p-2 bg-zinc-900 rounded-xl w-max">← Back / वापस</button>
          <h2 className="text-3xl font-black text-red-500 mb-6">Report Fault</h2>
          
          <form onSubmit={handleFaultSubmit} className="space-y-6">
            <div className="flex gap-2 bg-zinc-900 p-1 rounded-2xl">
              <button type="button" onClick={() => setCategory('mechanical')} className={`flex-1 py-4 rounded-xl font-bold text-sm transition-colors ${category === 'mechanical' ? 'bg-red-600 text-white' : 'text-zinc-500'}`}>Mechanical</button>
              <button type="button" onClick={() => setCategory('electrical')} className={`flex-1 py-4 rounded-xl font-bold text-sm transition-colors ${category === 'electrical' ? 'bg-red-600 text-white' : 'text-zinc-500'}`}>Electrical</button>
            </div>

            <div>
              <label className="block text-zinc-400 font-bold mb-2 text-sm uppercase">Details / विवरण *</label>
              <textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 outline-none focus:border-red-500 text-lg" placeholder="What is broken? / क्या टूटा है?" />
            </div>

            <div>
              <label className="block text-zinc-400 font-bold mb-2 text-sm uppercase">Photos / फोटो</label>
              <input type="file" multiple accept="image/*" onChange={e => setPhotos(Array.from(e.target.files || []))} className="w-full bg-zinc-900 border-2 border-dashed border-zinc-700 rounded-2xl p-6 text-center file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-red-600 file:text-white file:font-bold" />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 text-white font-black text-xl py-6 rounded-2xl mt-4 active:scale-95 transition-transform shadow-lg shadow-red-900/50 disabled:opacity-50">
              {isSubmitting ? "Sending..." : "Submit Alert / जमा करें"}
            </button>
          </form>
        </div>
      )}

      {/* PM VIEW */}
      {activeView === "pm" && (
        <div className="p-4 animate-in slide-in-from-right-4">
          <button onClick={resetForm} className="text-zinc-400 mb-6 flex items-center gap-2 font-bold p-2 bg-zinc-900 rounded-xl w-max">← Back / वापस</button>
          <h2 className="text-3xl font-black text-amber-500 mb-6">Log Service</h2>
          
          <form onSubmit={handlePMSubmit} className="space-y-6">
            <div>
              <label className="block text-zinc-400 font-bold mb-2 text-sm uppercase">Supervisor / सुपरवाइजर *</label>
              <input type="text" required value={supervisor} onChange={e => setSupervisor(e.target.value)} className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 outline-none focus:border-amber-500 text-lg" placeholder="Name / नाम" />
            </div>

            <div>
              <label className="block text-zinc-400 font-bold mb-2 text-sm uppercase">Details / विवरण *</label>
              <textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-zinc-900 border-2 border-zinc-800 rounded-2xl p-4 outline-none focus:border-amber-500 text-lg" placeholder="What was serviced? / क्या सर्विस हुई?" />
            </div>
            
            <button type="submit" disabled={isSubmitting} className="w-full bg-amber-500 text-zinc-950 font-black text-xl py-6 rounded-2xl mt-4 active:scale-95 transition-transform shadow-lg shadow-amber-900/50 disabled:opacity-50">
              {isSubmitting ? "Saving..." : "Submit Log / जमा करें"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}