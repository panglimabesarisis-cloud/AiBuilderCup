import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  BookOpen,
  Sliders,
  CheckCircle,
  RotateCcw,
  Plus,
  Trash2,
  Search,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  FileText,
  AlertCircle,
  Database,
  Save,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  content: string;
  lastUpdated: string;
}

interface AIInstructionKnowledgePanelProps {
  agentKey: string;
  agentTitle: string;
  agentRole: string;
  defaultInstruction: string;
  defaultKnowledgeList?: KnowledgeItem[];
  accentColor?: 'purple' | 'amber' | 'blue' | 'rose' | 'emerald' | 'cyan';
}

export const AIInstructionKnowledgePanel: React.FC<AIInstructionKnowledgePanelProps> = ({
  agentKey,
  agentTitle,
  agentRole,
  defaultInstruction,
  defaultKnowledgeList = [],
  accentColor = 'purple',
}) => {
  const { t, language } = useLanguage();
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'instruction' | 'knowledge'>('instruction');

  // Load from localStorage if present
  const storageKeyPrompt = `riskcart_ai_instruction_${agentKey}`;
  const storageKeyKnowledge = `riskcart_ai_knowledge_${agentKey}`;

  const [instruction, setInstruction] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(storageKeyPrompt);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return defaultInstruction;
  });

  const [knowledgeList, setKnowledgeList] = useState<KnowledgeItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeyKnowledge);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return defaultKnowledgeList;
  });

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [searchKnowledge, setSearchKnowledge] = useState('');
  const [isAddingKnowledge, setIsAddingKnowledge] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('SOP & Aturan');
  const [newContent, setNewContent] = useState('');

  // Persist instructions
  const handleSaveInstruction = () => {
    try {
      localStorage.setItem(storageKeyPrompt, instruction);
    } catch {
      // ignore
    }
    setSaveSuccessMsg(t('instruction_saved', 'Instruksi berhasil disimpan dan disinkronkan ke AI!'));
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleResetInstruction = () => {
    setInstruction(defaultInstruction);
    try {
      localStorage.setItem(storageKeyPrompt, defaultInstruction);
    } catch {
      // ignore
    }
    setSaveSuccessMsg('Instruksi dikembalikan ke standar SOP bawaan.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleAddKnowledge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newItem: KnowledgeItem = {
      id: `kn_${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      content: newContent.trim(),
      lastUpdated: new Date().toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };

    const updated = [newItem, ...knowledgeList];
    setKnowledgeList(updated);
    try {
      localStorage.setItem(storageKeyKnowledge, JSON.stringify(updated));
    } catch {
      // ignore
    }

    setNewTitle('');
    setNewContent('');
    setIsAddingKnowledge(false);
    setSaveSuccessMsg(t('knowledge_added', 'Dokumen berhasil ditambahkan ke knowledge base!'));
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleDeleteKnowledge = (id: string) => {
    const updated = knowledgeList.filter((k) => k.id !== id);
    setKnowledgeList(updated);
    try {
      localStorage.setItem(storageKeyKnowledge, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const colorStyles = {
    purple: {
      border: 'border-purple-800/60',
      badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      tabActive: 'bg-purple-600 text-white',
      btn: 'bg-purple-600 hover:bg-purple-500',
      glow: 'shadow-purple-900/20',
      icon: 'text-purple-400',
    },
    amber: {
      border: 'border-amber-800/60',
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      tabActive: 'bg-amber-600 text-white',
      btn: 'bg-amber-600 hover:bg-amber-500',
      glow: 'shadow-amber-900/20',
      icon: 'text-amber-400',
    },
    blue: {
      border: 'border-blue-800/60',
      badge: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
      tabActive: 'bg-blue-600 text-white',
      btn: 'bg-blue-600 hover:bg-blue-500',
      glow: 'shadow-blue-900/20',
      icon: 'text-blue-400',
    },
    rose: {
      border: 'border-rose-800/60',
      badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
      tabActive: 'bg-rose-600 text-white',
      btn: 'bg-rose-600 hover:bg-rose-500',
      glow: 'shadow-rose-900/20',
      icon: 'text-rose-400',
    },
    emerald: {
      border: 'border-emerald-800/60',
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      tabActive: 'bg-emerald-600 text-white',
      btn: 'bg-emerald-600 hover:bg-emerald-500',
      glow: 'shadow-emerald-900/20',
      icon: 'text-emerald-400',
    },
    cyan: {
      border: 'border-cyan-800/60',
      badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      tabActive: 'bg-cyan-600 text-white',
      btn: 'bg-cyan-600 hover:bg-cyan-500',
      glow: 'shadow-cyan-900/20',
      icon: 'text-cyan-400',
    },
  }[accentColor];

  const filteredKnowledge = knowledgeList.filter(
    (k) =>
      k.title.toLowerCase().includes(searchKnowledge.toLowerCase()) ||
      k.content.toLowerCase().includes(searchKnowledge.toLowerCase()) ||
      k.category.toLowerCase().includes(searchKnowledge.toLowerCase())
  );

  return (
    <div className={`rounded-2xl bg-zinc-900/90 border ${colorStyles.border} shadow-lg ${colorStyles.glow} overflow-hidden transition-all mb-6`}>
      {/* Top Header Collapsible Bar */}
      <div className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-850 border border-zinc-700/60 flex items-center justify-center shrink-0">
            <Brain className={`w-5 h-5 ${colorStyles.icon}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                {t('instruction_knowledge_title', 'Kolom Instruksi & Knowledge')} &bull; {agentTitle}
              </h2>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colorStyles.badge}`}>
                AI Grounding Active
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {agentRole} &bull; <span className="font-mono text-zinc-300">Gemini 3.8 Flash Model Isolation</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {saveSuccessMsg && (
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded-lg animate-pulse flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {saveSuccessMsg}
            </span>
          )}

          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
          >
            <span>{isOpen ? (language === 'id' ? 'Ciutkan Panel' : 'Collapse Panel') : (language === 'id' ? 'Buka Panel' : 'Expand Panel')}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Body */}
      {isOpen && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Sub-Tabs: Instruksi vs Knowledge */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                onClick={() => setActiveTab('instruction')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'instruction'
                    ? colorStyles.tabActive
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{t('system_instruction', 'Instruksi Prompt Sistem')}</span>
              </button>
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'knowledge'
                    ? colorStyles.tabActive
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {t('knowledge_base', 'Basis Pengetahuan (Knowledge)')} ({knowledgeList.length})
                </span>
              </button>
            </div>

            <div className="text-[11px] text-zinc-500 font-mono">
              Auto-Injected Context &bull; Strict Tenant Scope
            </div>
          </div>

          {/* TAB 1: INSTRUCTION DIRECTIVES */}
          {activeTab === 'instruction' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  <span>Petunjuk Kerja &amp; Guardrail Aturan Agen:</span>
                </label>
                <span className="text-[11px] text-zinc-500 font-mono">
                  {instruction.length} Karakter &bull; ~{Math.round(instruction.length / 4)} Tokens
                </span>
              </div>

              <div className="relative">
                <textarea
                  rows={4}
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder="Masukkan instruksi khusus agen AI..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Perubahan instruksi diaudit dan diisolasi per outlet.</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetInstruction}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('reset_default', 'Reset ke SOP')}</span>
                  </button>

                  <button
                    onClick={handleSaveInstruction}
                    className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md ${colorStyles.btn}`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{t('save_instruction', 'Simpan Instruksi')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KNOWLEDGE DOCUMENTS */}
          {activeTab === 'knowledge' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchKnowledge}
                    onChange={(e) => setSearchKnowledge(e.target.value)}
                    placeholder="Cari dokumen pengetahuan agen..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  onClick={() => setIsAddingKnowledge((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-sm ${colorStyles.btn}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('add_knowledge', '+ Tambah Dokumen Pengetahuan')}</span>
                </button>
              </div>

              {/* Form Tambah Knowledge */}
              {isAddingKnowledge && (
                <form
                  onSubmit={handleAddKnowledge}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="font-bold text-white text-xs">Tambah Dokumen Baru ke Basis Pengetahuan</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingKnowledge(false)}
                      className="text-zinc-500 hover:text-white text-xs"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] text-zinc-400 font-semibold mb-1">Judul Dokumen / Aturan</label>
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Contoh: Aturan Buffer 7 Hari & Batas PO Indomarco"
                        required
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 font-semibold mb-1">Kategori</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="SOP Pengadaan & Restock">SOP Pengadaan &amp; Restock</option>
                        <option value="Kebijakan Kasir & Kasbon">Kebijakan Kasir &amp; Kasbon</option>
                        <option value="Pencegahan Fraud & Geofence">Pencegahan Fraud &amp; Geofence</option>
                        <option value="Katalog Grosir & Dus">Katalog Grosir &amp; Dus</option>
                        <option value="Strategi Penjualan">Strategi Penjualan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 font-semibold mb-1">Isi Dokumen / Referensi</label>
                    <textarea
                      rows={3}
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Tuliskan petunjuk operasional yang akan diacu agen AI..."
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingKnowledge(false)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold"
                    >
                      {t('cancel', 'Batal')}
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-1.5 rounded-xl text-white text-xs font-bold shadow-md ${colorStyles.btn}`}
                    >
                      {t('save_knowledge', 'Simpan ke Knowledge Base')}
                    </button>
                  </div>
                </form>
              )}

              {/* List of Knowledge items */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredKnowledge.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition flex flex-col justify-between gap-2.5 group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white text-xs">{item.title}</span>
                        <button
                          onClick={() => handleDeleteKnowledge(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition"
                          title="Hapus Dokumen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span className="inline-block px-2 py-0.5 mt-1 rounded bg-zinc-850 text-zinc-400 text-[10px] font-semibold border border-zinc-800">
                        {item.category}
                      </span>
                      <p className="text-[11px] text-zinc-300 mt-2 line-clamp-3 leading-relaxed font-sans">
                        {item.content}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-850 pt-2 font-mono">
                      <span>Ref ID: {item.id}</span>
                      <span>Diperbarui: {item.lastUpdated}</span>
                    </div>
                  </div>
                ))}
              </div>

              {filteredKnowledge.length === 0 && (
                <div className="p-6 text-center rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-zinc-500 text-xs">
                  Tidak ada dokumen knowledge yang cocok. Klik tombol di atas untuk menambahkan pengetahuan baru.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
