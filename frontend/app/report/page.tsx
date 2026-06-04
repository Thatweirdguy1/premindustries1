"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";

interface Machine {
  id: number;
  name: string;
  asset_tag: string;
}

export default function MobileMachineHub() {
  const searchParams = useSearchParams();
  const machineIdParam = searchParams.get("machine_id");
  
  const [machine, setMachine] = useState<Machine | null>(null);
  const [mode, setMode] = useState<'select' | 'breakdown' | 'pm' | 'report' | 'success'>('select');
  
  // Consolidated Form State
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  
  const [category, setCategory] = useState<string | null>(null);
  const [supervisorName, setSupervisorName] = useState("");
  const [technicianName, setTechnicianName] = useState("");
  const [operatorName, setOperatorName] = useState("");
  
  const [engineerType, setEngineerType] = useState<'internal' | 'external' | null>(null);
  const [engineerName, setEngineerName] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [browserSupportsSpeech, setBrowserSupportsSpeech] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const recognitionRef = useRef<any>(null);
  
  // OPTIMIZATION: Separate refs for Camera and Document picker to prevent mobile browser confusion
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; 
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'hi-IN'; 

      recognitionRef.current.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setDescription((prev) => prev + (prev ? " " : "") + transcript);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
      setBrowserSupportsSpeech(true); 
    }
  }, []);

  useEffect(() => {
    if (!machineIdParam) {
      setError("No machine selected.");
      setLoading(false);
      return;
    }

    fetch("http://127.0.0.1:5000/api/machines")
      .then(res => res.json())
      .then(data => {
        const found = data.find((m: Machine) => m.id.toString() === machineIdParam);
        if (found) setMachine(found);
        else setError("Machine not found.");
        setLoading(false);
      })
      .catch(() => {
        setError("Cannot connect to server.");
        setLoading(false);
      });
  }, [machineIdParam]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const resetForm = () => {
    setMode('select');
    setFile(null);
    setDescription("");
    setCategory(null);
    setEngineerType(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (documentInputRef.current) documentInputRef.current.value = "";
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try { recognitionRef.current?.start(); setIsListening(true); } 
      catch (e) { console.error(e); }
    }
  };

  const submitForm = async () => {
    if (!machine) return;
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append("machine_id", machine.id.toString());
    
    let endpoint = "";

    if (mode === 'breakdown' || mode === 'pm') {
      formData.append("task_category", category!);
      formData.append("description", description || "No notes provided.");
      if (file) formData.append("photo", file);
      
      if (mode === 'pm') {
        formData.append("supervisor_name", supervisorName);
        formData.append("technician_name", technicianName);
        formData.append("operator_name", operatorName);
        endpoint = "http://127.0.0.1:5000/api/work-orders/preventive";
      } else {
        endpoint = "http://127.0.0.1:5000/api/work-orders/report";
      }
    } 
    else if (mode === 'report') {
      formData.append("engineer_type", engineerType!);
      formData.append("engineer_name", engineerName);
      formData.append("notes", description);
      if (file) formData.append("file", file);
      endpoint = "http://127.0.0.1:5000/api/reports";
    }

    try {
      const res = await fetch(endpoint, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed");
      setMode('success');
    } catch (err) {
      alert("Error submitting. Please check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validation Checks for Submit Button
  const isFormValid = () => {
    if (mode === 'breakdown') return category !== null;
    if (mode === 'pm') return category !== null && supervisorName.trim() !== "";
    if (mode === 'report') return engineerType !== null && engineerName.trim() !== "";
    return false;
  };

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><p className="text-zinc-400 animate-pulse">Loading Hub...</p></div>;
  if (mode === 'success') return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border-4 border-emerald-500/50"><span className="text-5xl">✅</span></div>
      <h1 className="text-3xl font-bold text-white mb-2">Logged Successfully</h1>
      <p className="text-zinc-400">Entry saved to the secure logbook.</p>
    </div>
  );
  if (error || !machine) return <div className="min-h-screen bg-zinc-950 p-6 text-center text-red-400 font-bold">{error}</div>;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 font-sans flex flex-col max-w-md mx-auto overflow-y-auto pb-24">
      
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center mb-6 shrink-0 shadow-lg">
        <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold mb-2">Dadri Plant • {machine.asset_tag}</p>
        <h1 className="text-2xl font-bold text-white leading-tight">{machine.name}</h1>
      </div>

      {mode === 'select' && (
        <div className="flex-grow flex flex-col justify-center space-y-4">
          <button onClick={() => setMode('breakdown')} className="w-full bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/50 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 transition-colors">
            <span className="text-4xl">🚨</span><h2 className="text-lg font-bold text-red-400">Report Breakdown</h2>
          </button>
          <button onClick={() => setMode('pm')} className="w-full bg-amber-500/10 hover:bg-amber-500/20 border-2 border-amber-500/50 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 transition-colors">
            <span className="text-4xl">🔧</span><h2 className="text-lg font-bold text-amber-400">Log Maintenance</h2>
          </button>
          <button onClick={() => setMode('report')} className="w-full bg-blue-500/10 hover:bg-blue-500/20 border-2 border-blue-500/50 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 transition-colors">
            <span className="text-4xl">📋</span><h2 className="text-lg font-bold text-blue-400">Upload Inspection Report</h2>
          </button>
        </div>
      )}

      {mode !== 'select' && (
        <div className="flex-grow flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-zinc-400 text-sm font-medium uppercase tracking-wide">
              {mode === 'breakdown' ? 'Fault Type' : mode === 'pm' ? 'Service Type' : 'Inspection Details'}
            </h2>
            <button onClick={resetForm} className="text-zinc-500 hover:text-white bg-zinc-900 px-3 py-1 rounded-full text-sm transition-colors">← Back</button>
          </div>
          
          {(mode === 'breakdown' || mode === 'pm') && (
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setCategory("mechanical")} className={`p-4 rounded-2xl border transition-colors ${category === 'mechanical' ? 'bg-zinc-700 border-zinc-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>⚙️ Mech</button>
              <button onClick={() => setCategory("electrical")} className={`p-4 rounded-2xl border transition-colors ${category === 'electrical' ? 'bg-zinc-700 border-zinc-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>⚡ Elec</button>
              <button onClick={() => setCategory("other")} className={`p-4 rounded-2xl border transition-colors ${category === 'other' ? 'bg-zinc-700 border-zinc-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>❓ Other</button>
            </div>
          )}

          {mode === 'pm' && (
             <div className="space-y-3">
               <input type="text" value={supervisorName} onChange={(e) => setSupervisorName(e.target.value)} placeholder="Supervisor Name *" className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-4 text-sm focus:outline-none focus:border-amber-500" />
               <div className="grid grid-cols-2 gap-3">
                 <input type="text" value={technicianName} onChange={(e) => setTechnicianName(e.target.value)} placeholder="Tech (Opt)" className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-4 text-sm focus:outline-none focus:border-amber-500" />
                 <input type="text" value={operatorName} onChange={(e) => setOperatorName(e.target.value)} placeholder="Operator (Opt)" className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-4 text-sm focus:outline-none focus:border-amber-500" />
               </div>
             </div>
          )}

          {mode === 'report' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setEngineerType('internal')} className={`p-3 rounded-xl border font-bold transition-colors ${engineerType === 'internal' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>Internal Team</button>
                <button onClick={() => setEngineerType('external')} className={`p-3 rounded-xl border font-bold transition-colors ${engineerType === 'external' ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>External Vendor</button>
              </div>
              <input type="text" value={engineerName} onChange={(e) => setEngineerName(e.target.value)} placeholder="Engineer/Company Name *" className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl p-4 text-sm focus:outline-none focus:border-blue-500" />
            </div>
          )}

          <div className="flex gap-2">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes / विवरण..." className="flex-grow bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-4 resize-none h-20 text-sm focus:outline-none focus:border-zinc-600"/>
            {browserSupportsSpeech && (
              <button onClick={toggleListen} type="button" className={`w-20 rounded-2xl border transition-colors ${isListening ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}>🎤</button>
            )}
          </div>

          <div className="pt-2">
            {/* OPTIMIZATION: Two entirely separate hidden inputs to guarantee mobile compatibility */}
            <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleFileChange} className="hidden" />
            <input type="file" accept=".pdf,.doc,.docx,image/*" ref={documentInputRef} onChange={handleFileChange} className="hidden" />
            
            {!file ? (
              <button 
                onClick={() => mode === 'report' ? documentInputRef.current?.click() : cameraInputRef.current?.click()} 
                type="button" 
                className="w-full bg-zinc-900 border border-zinc-800 border-dashed text-zinc-400 hover:text-white hover:border-zinc-600 rounded-2xl p-4 transition-colors"
              >
                {mode === 'report' ? '📎 Attach File (PDF, DOC, JPG)' : '📸 Add Photo (Optional)'}
              </button>
            ) : (
              <div className="w-full bg-zinc-900 rounded-2xl border border-zinc-800 p-4 flex justify-between items-center">
                <span className="text-sm truncate text-white max-w-[200px]">{file.name}</span>
                <button onClick={() => setFile(null)} className="bg-zinc-800 hover:bg-red-600 w-8 h-8 rounded-full text-zinc-400 hover:text-white transition-colors">✕</button>
              </div>
            )}
          </div>
          
          <button 
            onClick={submitForm}
            disabled={isSubmitting || !isFormValid()}
            className="w-full text-white font-bold text-lg py-4 rounded-2xl shadow-lg mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Submit Entry'}
          </button>
        </div>
      )}
    </main>
  );
}