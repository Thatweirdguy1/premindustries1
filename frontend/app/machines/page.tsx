"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Machine {
  id: number;
  name: string;
  asset_tag: string;
  status: string;
  last_maintenance: string;
  next_maintenance: string;
  risk_score?: number;
}

interface HistoryLog {
  id: number;
  schedule_type: string;
  task_category: string;
  description: string;
  created_at: string;
  completed_at: string;
  time_taken_hours: number;
  technician: string;
  photos: string[];
}

interface SparePart {
  id: number;
  part_name: string;
  part_number: string;
  quantity: number;
  photo_url: string | null;
}

interface MachineReport {
  id: number;
  engineer_type: string;
  engineer_name: string;
  notes: string;
  file_url: string | null;
  created_at: string;
}

export default function MachineDirectory() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: Search state
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "inventory" | "reports">("history");
  
  const [history, setHistory] = useState<HistoryLog[]>([]);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [reports, setReports] = useState<MachineReport[]>([]); 
  const [isPanelLoading, setIsPanelLoading] = useState(false);

  const [showAddPart, setShowAddPart] = useState(false);
  const [newPartName, setNewPartName] = useState("");
  const [newPartNumber, setNewPartNumber] = useState("");
  const [newPartQuantity, setNewPartQuantity] = useState(1);
  const [newPartPhoto, setNewPartPhoto] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://168.144.81.103:5000";
  // Determine the live frontend URL for the QR code to point to
  const frontendUrl = typeof window !== "undefined" ? window.location.origin : "http://168.144.81.103:3000";

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/machines`);
      if (res.ok) {
        const data = await res.json();
        setMachines(data);
        
        // NEW: Deep Linking Logic for QR Codes
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const idParam = urlParams.get('id');
          if (idParam) {
            const linkedMachine = data.find((m: Machine) => m.id.toString() === idParam);
            if (linkedMachine) {
              openMachineDetails(linkedMachine);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch machines:", error);
    } finally {
      setLoading(false);
    }
  };

  const openMachineDetails = async (machine: Machine) => {
    setSelectedMachine(machine);
    setIsPanelLoading(true);
    setActiveTab("history"); 
    
    // Update the URL in the browser without refreshing the page
    if (typeof window !== "undefined") {
      window.history.replaceState(null, '', `?id=${machine.id}`);
    }
    
    try {
      const [historyRes, partsRes, reportsRes] = await Promise.all([
        fetch(`${baseUrl}/api/machines/${machine.id}/history`),
        fetch(`${baseUrl}/api/machines/${machine.id}/parts`),
        fetch(`${baseUrl}/api/machines/${machine.id}/reports`)
      ]);
      
      if (historyRes.ok) setHistory(await historyRes.json());
      
      if (partsRes.ok) {
        const partsData = await partsRes.json();
        setParts(partsData);
      } else {
        setParts([]); 
      }

      if (reportsRes.ok) {
        setReports(await reportsRes.json());
      } else {
        setReports([]);
      }

    } catch (error) {
      console.error("Failed to load details");
      setParts([]);
      setReports([]);
    } finally {
      setIsPanelLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setSelectedMachine(null);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const refreshParts = async () => {
    if (!selectedMachine) return;
    try {
      const res = await fetch(`${baseUrl}/api/machines/${selectedMachine.id}/parts`);
      if (res.ok) setParts(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateQuantity = async (partId: number, currentQty: number, delta: number) => {
    const newQty = Math.max(0, currentQty + delta);
    try {
      const res = await fetch(`${baseUrl}/api/parts/${partId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty })
      });
      if (res.ok) refreshParts();
    } catch (e) {
      alert("Failed to update stock");
    }
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine) return;
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append("part_name", newPartName);
      formData.append("part_number", newPartNumber);
      formData.append("quantity", newPartQuantity.toString());
      if (newPartPhoto) formData.append("photo", newPartPhoto);

      const res = await fetch(`${baseUrl}/api/machines/${selectedMachine.id}/parts`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) throw new Error("Upload failed");
      
      setShowAddPart(false);
      setNewPartName("");
      setNewPartNumber("");
      setNewPartQuantity(1);
      setNewPartPhoto(null);
      refreshParts();
    } catch (error) {
      alert("Error adding part.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // NEW: Filter logic for the search bar
  const filteredMachines = machines.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.asset_tag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4"><p className="text-sm text-zinc-400 font-medium tracking-widest uppercase animate-pulse">Loading Registry...</p></div>;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <header className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-5 sm:p-8 backdrop-blur-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <Link href="/" className="text-zinc-400 hover:text-white text-xs font-medium uppercase tracking-wider mb-4 flex items-center gap-2 transition-colors">
              <span>←</span> Dashboard Return
            </Link>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">Asset Registry</h1>
            <p className="text-zinc-500 text-sm mt-1">मशीन डायरेक्टरी</p>
          </div>

          {/* NEW: Search Bar UI */}
          {!selectedMachine && (
            <div className="relative w-full md:w-80 shrink-0">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl opacity-50">🔍</span>
              <input 
                type="text" 
                placeholder="Search name or asset tag..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600"
              />
            </div>
          )}
        </header>

        {!selectedMachine ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredMachines.length > 0 ? (
              filteredMachines.map((machine) => (
                <div 
                  key={machine.id} 
                  onClick={() => openMachineDetails(machine)}
                  className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 flex flex-col hover:bg-zinc-900/80 hover:border-zinc-700 transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide uppercase border ${machine.status === 'breakdown' ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                      {machine.status === 'breakdown' ? 'Offline' : 'Operational'}
                    </span>
                    <span className="text-zinc-500 text-xs font-mono">{machine.asset_tag}</span>
                  </div>
                  
                  <h2 className="text-lg font-medium text-zinc-100 mb-4">{machine.name}</h2>
                  
                  {machine.risk_score !== undefined && (
                    <div className="bg-zinc-950/50 rounded-xl p-3 mb-4 border border-zinc-800/50 flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Failure Risk</span>
                      <span className={`text-sm font-bold ${machine.risk_score > 75 ? 'text-red-400' : machine.risk_score > 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {machine.risk_score}% {machine.risk_score > 75 && '⚠️'}
                      </span>
                    </div>
                  )}
                  
                  <div className="mt-auto pt-4 border-t border-zinc-800/50 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Next PM</p>
                      <p className="text-zinc-300 text-xs">{machine.next_maintenance}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors">
                      →
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center text-zinc-500">
                No machines found matching "{searchTerm}"
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <button onClick={handleCloseDetails} className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium px-4 py-2.5 rounded-xl transition-all text-sm flex items-center gap-2">
                  <span>←</span> Back to Grid
                </button>
                <h2 className="text-xl font-medium text-white">{selectedMachine.name} <span className="text-zinc-500 font-mono text-sm ml-2">{selectedMachine.asset_tag}</span></h2>
              </div>

              {/* NEW: QR Code Display Card */}
              <div className="bg-white p-2 rounded-xl flex items-center gap-4 border border-zinc-800/50 shrink-0">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=70x70&data=${encodeURIComponent(`${frontendUrl}/machines?id=${selectedMachine.id}`)}`} 
                  alt="QR Code" 
                  className="rounded-lg w-[70px] h-[70px]"
                />
                <div className="pr-4 hidden sm:block">
                  <p className="text-black font-bold text-sm leading-tight">Asset Tag</p>
                  <p className="text-zinc-600 font-mono text-xs mt-1">{selectedMachine.asset_tag}</p>
                  <p className="text-zinc-400 text-[10px] uppercase mt-2">Scan for details</p>
                </div>
              </div>
            </div>

            <div className="flex border-b border-zinc-800 overflow-x-auto">
              <button onClick={() => setActiveTab("history")} className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === "history" ? "border-blue-500 text-blue-400" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}>
                📜 Service History
              </button>
              <button onClick={() => setActiveTab("reports")} className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === "reports" ? "border-blue-500 text-blue-400" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}>
                📋 Inspection Reports
              </button>
              <button onClick={() => setActiveTab("inventory")} className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === "inventory" ? "border-blue-500 text-blue-400" : "border-transparent text-zinc-400 hover:text-zinc-200"}`}>
                📦 Spare Parts
              </button>
            </div>

            {isPanelLoading ? (
              <div className="py-20 text-center text-zinc-500 text-sm animate-pulse">Loading data...</div>
            ) : (
              <div className="min-h-[400px]">
                
                {/* HISTORY TAB */}
                {activeTab === "history" && (
                  <div className="space-y-4">
                    {history.length > 0 ? history.map((log) => (
                      <div key={log.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-6">
                        <div className="sm:w-1/4 shrink-0">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide uppercase mb-3 ${log.schedule_type === 'breakdown_report' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {log.schedule_type.replace('_', ' ')}
                          </span>
                          <p className="text-zinc-500 text-xs mb-1">Completed On</p>
                          <p className="text-zinc-200 text-sm mb-4">{new Date(log.completed_at).toLocaleDateString()}</p>
                          <p className="text-zinc-500 text-xs mb-1">Downtime / Time Taken</p>
                          <p className="text-zinc-200 text-sm">{log.time_taken_hours} Hrs</p>
                        </div>
                        <div className="flex-grow border-t sm:border-t-0 sm:border-l border-zinc-800 pt-4 sm:pt-0 sm:pl-6">
                          <p className="text-zinc-400 text-[10px] uppercase tracking-wider mb-2">Technician</p>
                          <p className="text-zinc-100 font-medium mb-4">{log.technician}</p>
                          
                          <p className="text-zinc-400 text-[10px] uppercase tracking-wider mb-2">Service Notes</p>
                          <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 text-sm text-zinc-300 leading-relaxed mb-4">
                            {log.description || "No notes provided."}
                          </div>

                          {log.photos && log.photos.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto pb-2">
                              {log.photos.map((photo, i) => (
                                <a key={i} href={photo} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                  <img src={photo} alt="Record" className="h-16 w-16 object-cover rounded-lg border border-zinc-800 hover:border-blue-500 transition-colors" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-12 border border-dashed border-zinc-800 rounded-3xl text-zinc-500 text-sm">No historical records found for this machine.</div>
                    )}
                  </div>
                )}

                {/* REPORTS TAB */}
                {activeTab === "reports" && (
                  <div className="space-y-4">
                    {reports.length > 0 ? reports.map((report) => (
                      <div key={report.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-6">
                        <div className="sm:w-1/4 shrink-0">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-medium tracking-wide uppercase mb-3 ${report.engineer_type === 'internal' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'}`}>
                            {report.engineer_type} Engineer
                          </span>
                          <p className="text-zinc-500 text-xs mb-1">Date Uploaded</p>
                          <p className="text-zinc-200 text-sm mb-4">{new Date(report.created_at).toLocaleDateString()}</p>
                          <p className="text-zinc-500 text-xs mb-1">Uploaded By</p>
                          <p className="text-zinc-200 text-sm font-medium">{report.engineer_name}</p>
                        </div>
                        <div className="flex-grow border-t sm:border-t-0 sm:border-l border-zinc-800 pt-4 sm:pt-0 sm:pl-6 flex flex-col">
                          <p className="text-zinc-400 text-[10px] uppercase tracking-wider mb-2">Inspection Notes</p>
                          <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 text-sm text-zinc-300 leading-relaxed mb-4 flex-grow">
                            {report.notes || "No additional notes provided."}
                          </div>
                          
                          {report.file_url && (
                            <a 
                              href={report.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="inline-flex items-center justify-center gap-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 py-3 px-4 rounded-xl text-sm font-medium transition-colors w-full sm:w-max"
                            >
                              <span>📄</span> View Attached Document
                            </a>
                          )}
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-12 border border-dashed border-zinc-800 rounded-3xl text-zinc-500 text-sm">No inspection reports uploaded for this machine.</div>
                    )}
                  </div>
                )}

                {/* INVENTORY TAB */}
                {activeTab === "inventory" && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <p className="text-zinc-400 text-sm">Live spare parts inventory for {selectedMachine.asset_tag}</p>
                      <button onClick={() => setShowAddPart(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-xl text-sm transition-colors shadow-lg shadow-blue-900/20">
                        + Add Part
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {Array.isArray(parts) && parts.length > 0 ? (
                        parts.map((part) => (
                          <div key={part.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex gap-4 items-center hover:border-zinc-700 transition-colors">
                            <div className="h-20 w-20 shrink-0 bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800/50 flex items-center justify-center relative">
                              {part.photo_url ? (
                                <img src={part.photo_url} alt={part.part_name} className="absolute inset-0 w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl opacity-20">⚙️</span>
                              )}
                            </div>
                            <div className="flex-grow min-w-0">
                              <h3 className="text-zinc-100 font-medium truncate">{part.part_name}</h3>
                              <p className="text-zinc-500 text-xs font-mono mb-3 truncate">{part.part_number || "No Part #"}</p>
                              
                              <div className="flex items-center gap-3">
                                <button onClick={() => handleUpdateQuantity(part.id, part.quantity, -1)} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold transition-colors">-</button>
                                <span className={`text-base font-medium w-6 text-center ${part.quantity === 0 ? 'text-red-400' : 'text-white'}`}>{part.quantity}</span>
                                <button onClick={() => handleUpdateQuantity(part.id, part.quantity, 1)} className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center font-bold transition-colors">+</button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : Array.isArray(parts) && parts.length === 0 ? (
                        <div className="col-span-full text-center py-12 border border-dashed border-zinc-800 rounded-3xl text-zinc-500 text-sm">
                          Inventory is empty. Click "+ Add Part" to register a spare part.
                        </div>
                      ) : (
                        <div className="col-span-full text-center py-12 border border-dashed border-red-900/50 bg-red-500/5 rounded-3xl text-red-400 text-sm">
                          Database connection error. Please ensure table is initialized.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD PART MODAL */}
      {showAddPart && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 sm:rounded-3xl rounded-t-3xl p-6 sm:p-8 w-full max-w-md animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
            <h3 className="text-lg font-medium text-white mb-6">📦 Register New Spare Part</h3>
            <form onSubmit={handleAddPart} className="space-y-5">
              <div>
                <label className="block text-zinc-400 text-xs mb-2">Part Name / विवरण *</label>
                <input type="text" required value={newPartName} onChange={(e) => setNewPartName(e.target.value)} placeholder="e.g. Conveyor V-Belt" className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500/50 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 text-xs mb-2">Part No. (Optional)</label>
                  <input type="text" value={newPartNumber} onChange={(e) => setNewPartNumber(e.target.value)} placeholder="OEM Number" className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs mb-2">Current Stock *</label>
                  <input type="number" required min="0" value={newPartQuantity} onChange={(e) => setNewPartQuantity(parseInt(e.target.value) || 0)} className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500/50 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-zinc-400 text-xs mb-2">Part Photo (Optional)</label>
                <div className="relative border border-dashed border-zinc-700 rounded-xl p-4 text-center bg-zinc-950 hover:bg-zinc-800 transition-colors">
                  <input type="file" accept="image/*" onChange={(e) => setNewPartPhoto(e.target.files ? e.target.files[0] : null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  {newPartPhoto ? <span className="text-zinc-200 text-xs">📸 {newPartPhoto.name}</span> : <span className="text-zinc-500 text-xs uppercase tracking-wide">📷 Tap to Upload Image</span>}
                </div>
              </div>
              <div className="flex gap-3 pt-2 pb-4 sm:pb-0">
                <button type="button" onClick={() => setShowAddPart(false)} className="flex-1 bg-zinc-800 text-white rounded-xl p-3.5 text-sm font-medium hover:bg-zinc-700 transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 text-white rounded-xl p-3.5 text-sm font-medium hover:bg-blue-500 transition-colors disabled:opacity-50">Save Part</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}