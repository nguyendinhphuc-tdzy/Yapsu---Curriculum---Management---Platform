"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Database, 
  Volume2, 
  Settings, 
  MessageSquare, 
  Plus, 
  Trash2, 
  RotateCw, 
  Check, 
  X, 
  Loader2, 
  VolumeX, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Play,
  Pause,
  PlusCircle,
  Globe,
  Sliders,
  Sparkles,
  Info
} from "lucide-react";

// Types definition
interface LanguagePair {
  id: string;
  learning: string;
  native: string;
  flag: string;
  label: string;
}

interface Lesson {
  id: string;
  lessonCode: string;
  level: number;
  title: string;
  description: string;
  status: "draft" | "published";
}

interface VocabItem {
  id: string;
  code: string;
  scriptText: string;
  readingText: string;
  romanization: string;
  meaning: string;
}

interface SentenceItem {
  id: string;
  code: string;
  scriptText: string;
  readingText: string;
  romanization: string;
  meaning: string;
}

interface GuidedSegment {
  id: string;
  orderIndex: number;
  cardCode: string;
  type: string;
  tutorText: string;
  meaningVi: string;
  ttsStatus: "draft" | "generating" | "success" | "failed";
  audioUrl?: string;
  qaStatus: "pending" | "passed" | "failed";
  ttsMessage?: string;
}

interface DrillItem {
  id: string;
  drillType: "listen_repeat" | "fill_blank" | "sentence_order";
  scriptText: string;
  meaning: string;
  promptBefore?: string;
  promptAfter?: string;
  answer?: string;
  sourceCode: string; // link to vocab/sentence code
}

interface RoleplayGoal {
  id: string;
  orderIndex: number;
  successCriteria: string;
  descriptionNative: string;
}

interface Roleplay {
  id: string;
  setup: string;
  notes: string;
  goals: RoleplayGoal[];
}

// Initial Mock Data
const initialLanguagePairs: LanguagePair[] = [
  { id: "zh-vi", learning: "Chinese", native: "Vietnamese", flag: "🇨🇳", label: "Chinese ➜ Vietnamese" },
  { id: "ja-vi", learning: "Japanese", native: "Vietnamese", flag: "🇯🇵", label: "Japanese ➜ Vietnamese" }
];

const initialLessons: Record<string, Lesson[]> = {
  "zh-vi": [
    { id: "zh-l101", lessonCode: "ZH_L101", level: 1, title: "Greetings & Self Intro", description: "Greetings and introductions (Ni hao, Wo shi...)", status: "published" },
    { id: "zh-l102", lessonCode: "ZH_L102", level: 1, title: "Numbers & Shopping", description: "Asking prices and counting numbers 1-100", status: "draft" }
  ],
  "ja-vi": [
    { id: "ja-l101", lessonCode: "JA_L101", level: 1, title: "Meeting Someone New", description: "Hajimemashite, Watashi wa... desu", status: "published" }
  ]
};

const initialVocabItems: Record<string, VocabItem[]> = {
  "ZH_L101": [
    { id: "v1", code: "L1-01_V1", scriptText: "你好", readingText: "nǐ hǎo", romanization: "nihao", meaning: "Hello" },
    { id: "v2", code: "L1-01_V2", scriptText: "我", readingText: "wǒ", romanization: "wo", meaning: "I / Me" },
    { id: "v3", code: "L1-01_V3", scriptText: "是", readingText: "shì", romanization: "shi", meaning: "Am / Is / Are" }
  ],
  "ZH_L102": [
    { id: "v4", code: "L1-02_V1", scriptText: "多少钱", readingText: "duō shǎo qián", romanization: "duoshaoqian", meaning: "How much money" }
  ],
  "JA_L101": [
    { id: "v5", code: "JA-01_V1", scriptText: "初めまして", readingText: "はじめまして", romanization: "hajimemashite", meaning: "Nice to meet you" }
  ]
};

const initialSentenceItems: Record<string, SentenceItem[]> = {
  "ZH_L101": [
    { id: "s1", code: "L1-01_S1", scriptText: "我是王华", readingText: "wǒ shì Wáng Huá", romanization: "wo shi Wang Hua", meaning: "I am Wang Hua" },
    { id: "s2", code: "L1-01_S2", scriptText: "很高兴认识你", readingText: "hěn gāoxìng rènshì nǐ", romanization: "hen gaoxing renshi ni", meaning: "Glad to meet you" }
  ],
  "ZH_L102": [],
  "JA_L101": []
};

const initialGuidedSegments: Record<string, GuidedSegment[]> = {
  "ZH_L101": [
    { id: "seg1", orderIndex: 1, cardCode: "ZH_C01", type: "Tutor Card", tutorText: "你好", meaningVi: "Xin chào", ttsStatus: "success", audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3", qaStatus: "passed" },
    { id: "seg2", orderIndex: 2, cardCode: "ZH_C02", type: "Tutor Card", tutorText: "我是王华", meaningVi: "Tôi là Vương Hoa", ttsStatus: "success", audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3", qaStatus: "pending" },
    { id: "seg3", orderIndex: 3, cardCode: "ZH_C03", type: "Tutor Card", tutorText: "很高兴认识你", meaningVi: "Rất vui được làm quen với bạn", ttsStatus: "failed", qaStatus: "failed", ttsMessage: "TTS synthesis failed: timeout" }
  ],
  "ZH_L102": [],
  "JA_L101": []
};

const initialDrillItems: Record<string, DrillItem[]> = {
  "ZH_L101": [
    { id: "dr1", drillType: "listen_repeat", scriptText: "你好", meaning: "Xin chào", sourceCode: "L1-01_V1" },
    { id: "dr2", drillType: "fill_blank", scriptText: "我是王华", meaning: "Tôi là Vương Hoa", promptBefore: "我", promptAfter: "王华", answer: "是", sourceCode: "L1-01_S1" }
  ],
  "ZH_L102": [],
  "JA_L101": []
};

const initialRoleplays: Record<string, Roleplay> = {
  "ZH_L101": {
    id: "rp1",
    setup: "You are visiting a local school in Beijing. Introduce yourself to the teacher and say hello.",
    notes: "Focus on high-pitch pronunciation on 'nǐ hǎo'.",
    goals: [
      { id: "g1", orderIndex: 1, successCriteria: "Say 'nǐ hǎo' correctly", descriptionNative: "Chào giáo viên bằng tiếng Trung" },
      { id: "g2", orderIndex: 2, successCriteria: "Introduce your name using 'wǒ shì...'", descriptionNative: "Giới thiệu tên mình chính xác" }
    ]
  },
  "ZH_L102": {
    id: "rp2",
    setup: "You are at a local fruit shop. Ask the shopkeeper how much the apples cost.",
    notes: "Use 'duō shǎo qián'.",
    goals: []
  },
  "JA_L101": {
    id: "rp3",
    setup: "You meet your Japanese host family for the first time at the airport.",
    notes: "Bow slightly when talking.",
    goals: []
  }
};

// Mini Audio Player Component
interface MiniPlayerProps {
  url: string;
}
const MiniAudioPlayer: React.FC<MiniPlayerProps> = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(url);
    const audio = audioRef.current;
    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", onEnded);
    };
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  return (
    <div className="flex items-center space-x-2 bg-slate-800 border border-slate-700/60 rounded-full py-1.5 px-3 max-w-[170px]">
      <button 
        onClick={togglePlay}
        className="p-1 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all cursor-pointer"
      >
        {isPlaying ? <Pause size={10} fill="white" /> : <Play size={10} fill="white" className="translate-x-[0.5px]" />}
      </button>
      <div className="w-20 bg-slate-700 h-1 rounded-full overflow-hidden">
        <div className="bg-indigo-400 h-full transition-all duration-100" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

export default function CurriculumDashboard() {
  const [selectedPairId, setSelectedPairId] = useState<string>("zh-vi");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<string>("core"); // core, tutor, drills, roleplay

  // App-level mock state
  const [vocabMap, setVocabMap] = useState<Record<string, VocabItem[]>>(initialVocabItems);
  const [sentenceMap, setSentenceMap] = useState<Record<string, SentenceItem[]>>(initialSentenceItems);
  const [segmentMap, setSegmentMap] = useState<Record<string, GuidedSegment[]>>(initialGuidedSegments);
  const [drillMap, setDrillMap] = useState<Record<string, DrillItem[]>>(initialDrillItems);
  const [roleplayMap, setRoleplayMap] = useState<Record<string, Roleplay>>(initialRoleplays);

  // Set default lesson when pair changes
  useEffect(() => {
    const pairLessons = initialLessons[selectedPairId] || [];
    if (pairLessons.length > 0) {
      setSelectedLesson(pairLessons[0]);
    } else {
      setSelectedLesson(null);
    }
  }, [selectedPairId]);

  const activeLessonCode = selectedLesson?.lessonCode || "";

  // ----------------------------------------------------
  // TAB 1: CORE CONTENT ACTIONS
  // ----------------------------------------------------
  const currentVocabs = vocabMap[activeLessonCode] || [];
  const currentSentences = sentenceMap[activeLessonCode] || [];

  const handleVocabEdit = (id: string, field: keyof VocabItem, val: string) => {
    setVocabMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(item => item.id === id ? { ...item, [field]: val } : item)
    }));
  };

  const handleSentenceEdit = (id: string, field: keyof SentenceItem, val: string) => {
    setSentenceMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(item => item.id === id ? { ...item, [field]: val } : item)
    }));
  };

  const addVocabRow = () => {
    const newId = `v-${Date.now()}`;
    const newIndex = currentVocabs.length + 1;
    const newItem: VocabItem = {
      id: newId,
      code: `${selectedLesson?.lessonCode || "L"}_V${newIndex}`,
      scriptText: "新词汇",
      readingText: "xīn cí huì",
      romanization: "xincihui",
      meaning: "New vocabulary word"
    };
    setVocabMap(prev => ({
      ...prev,
      [activeLessonCode]: [...(prev[activeLessonCode] || []), newItem]
    }));
  };

  const addSentenceRow = () => {
    const newId = `s-${Date.now()}`;
    const newIndex = currentSentences.length + 1;
    const newItem: SentenceItem = {
      id: newId,
      code: `${selectedLesson?.lessonCode || "L"}_S${newIndex}`,
      scriptText: "这是一个新句子",
      readingText: "zhè shì yīgè xīn jùzi",
      romanization: "zhe shi yige xin juzi",
      meaning: "This is a new sentence"
    };
    setSentenceMap(prev => ({
      ...prev,
      [activeLessonCode]: [...(prev[activeLessonCode] || []), newItem]
    }));
  };

  const deleteVocab = (id: string) => {
    setVocabMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].filter(item => item.id !== id)
    }));
  };

  const deleteSentence = (id: string) => {
    setSentenceMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].filter(item => item.id !== id)
    }));
  };

  // Auto-sync Core content additions to Tutor Segments (simulating pipeline linkage)
  const syncToTutorSegments = () => {
    const currentSegs = segmentMap[activeLessonCode] || [];
    const existingCodes = new Set(currentSegs.map(s => s.cardCode));
    const newSegs = [...currentSegs];

    currentVocabs.forEach((v, index) => {
      if (!existingCodes.has(v.code)) {
        newSegs.push({
          id: `seg-v-${v.id}`,
          orderIndex: newSegs.length + 1,
          cardCode: v.code,
          type: "Tutor Card",
          tutorText: v.scriptText,
          meaningVi: v.meaning,
          ttsStatus: "draft",
          qaStatus: "pending"
        });
      }
    });

    currentSentences.forEach((s, index) => {
      if (!existingCodes.has(s.code)) {
        newSegs.push({
          id: `seg-s-${s.id}`,
          orderIndex: newSegs.length + 1,
          cardCode: s.code,
          type: "Tutor Card",
          tutorText: s.scriptText,
          meaningVi: s.meaning,
          ttsStatus: "draft",
          qaStatus: "pending"
        });
      }
    });

    setSegmentMap(prev => ({ ...prev, [activeLessonCode]: newSegs }));
  };

  // ----------------------------------------------------
  // TAB 2: TUTOR & AUDIO QA ACTIONS
  // ----------------------------------------------------
  const currentSegments = segmentMap[activeLessonCode] || [];

  const handleSegmentTextEdit = (id: string, val: string) => {
    setSegmentMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(s => s.id === id ? { ...s, tutorText: val } : s)
    }));
  };

  const handleSegmentTranslationEdit = (id: string, val: string) => {
    setSegmentMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(s => s.id === id ? { ...s, meaningVi: val } : s)
    }));
  };

  const updateQAStatus = (id: string, status: "passed" | "failed") => {
    setSegmentMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(s => s.id === id ? { ...s, qaStatus: status } : s)
    }));
  };

  const regenerateAudio = (id: string) => {
    setSegmentMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(s => s.id === id ? { ...s, ttsStatus: "generating", ttsMessage: undefined } : s)
    }));

    setTimeout(() => {
      setSegmentMap(prev => ({
        ...prev,
        [activeLessonCode]: prev[activeLessonCode].map(s => s.id === id ? { 
          ...s, 
          ttsStatus: "success", 
          qaStatus: "passed",
          audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3" 
        } : s)
      }));
    }, 1500);
  };

  // ----------------------------------------------------
  // TAB 3: DRILL CONFIGURATION ACTIONS
  // ----------------------------------------------------
  const currentDrills = drillMap[activeLessonCode] || [];

  const handleDrillEdit = (id: string, field: keyof DrillItem, val: string) => {
    setDrillMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(d => d.id === id ? { ...d, [field]: val } : d)
    }));
  };

  const addDrillItem = (sourceCode: string, text: string, meaning: string) => {
    const newId = `dr-${Date.now()}`;
    const newItem: DrillItem = {
      id: newId,
      drillType: "listen_repeat",
      scriptText: text,
      meaning: meaning,
      sourceCode: sourceCode
    };
    setDrillMap(prev => ({
      ...prev,
      [activeLessonCode]: [...(prev[activeLessonCode] || []), newItem]
    }));
  };

  const removeDrillItem = (id: string) => {
    setDrillMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].filter(d => d.id !== id)
    }));
  };

  // ----------------------------------------------------
  // TAB 4: ROLEPLAY SETUP ACTIONS
  // ----------------------------------------------------
  const currentRoleplay = roleplayMap[activeLessonCode] || { id: "new", setup: "", notes: "", goals: [] };

  const handleRoleplaySetupChange = (val: string) => {
    setRoleplayMap(prev => ({
      ...prev,
      [activeLessonCode]: { ...currentRoleplay, setup: val }
    }));
  };

  const handleRoleplayNotesChange = (val: string) => {
    setRoleplayMap(prev => ({
      ...prev,
      [activeLessonCode]: { ...currentRoleplay, notes: val }
    }));
  };

  const addRoleplayGoal = () => {
    const newGoal: RoleplayGoal = {
      id: `g-${Date.now()}`,
      orderIndex: currentRoleplay.goals.length + 1,
      successCriteria: "Speak fluently without pauses",
      descriptionNative: "Nói lưu loát không ngập ngừng"
    };
    setRoleplayMap(prev => ({
      ...prev,
      [activeLessonCode]: {
        ...currentRoleplay,
        goals: [...currentRoleplay.goals, newGoal]
      }
    }));
  };

  const editRoleplayGoal = (goalId: string, field: keyof RoleplayGoal, val: string) => {
    setRoleplayMap(prev => ({
      ...prev,
      [activeLessonCode]: {
        ...currentRoleplay,
        goals: currentRoleplay.goals.map(g => g.id === goalId ? { ...g, [field]: val } : g)
      }
    }));
  };

  const removeRoleplayGoal = (goalId: string) => {
    setRoleplayMap(prev => ({
      ...prev,
      [activeLessonCode]: {
        ...currentRoleplay,
        goals: currentRoleplay.goals.filter(g => g.id !== goalId)
      }
    }));
  };

  const isRoleplayTooLong = currentRoleplay.setup.length > 1000;

  return (
    <div className="flex h-screen bg-[#090b11] text-slate-100 overflow-hidden font-sans">
      
      {/* SIDEBAR SELECTORS */}
      <aside className="w-80 bg-[#101424] border-r border-slate-800/80 flex flex-col justify-between">
        
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-slate-800/80 flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Database className="text-white" size={16} />
            </div>
            <div>
              <h1 className="text-sm font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">Yapsu Pipeline</h1>
              <p className="text-[9px] text-indigo-400 font-semibold tracking-wider uppercase">Curriculum Engine</p>
            </div>
          </div>

          {/* Language Pair Selector */}
          <div className="p-4 border-b border-slate-800/60 bg-[#13192f]/40">
            <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">
              Language Pair
            </label>
            <div className="relative">
              <select 
                value={selectedPairId} 
                onChange={(e) => setSelectedPairId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 text-xs text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none"
              >
                {initialLanguagePairs.map((pair) => (
                  <option key={pair.id} value={pair.id}>
                    {pair.flag} {pair.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <Globe size={12} />
              </div>
            </div>
          </div>

          {/* Lessons list */}
          <div className="p-4">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2 px-1">
              Select Lesson
            </div>
            <div className="space-y-1">
              {(initialLessons[selectedPairId] || []).map((lesson) => {
                const isSelected = selectedLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer relative group flex items-start space-x-3 ${
                      isSelected 
                        ? "bg-indigo-600/20 border-indigo-500/50 shadow-md" 
                        : "hover:bg-slate-800/40 border-transparent"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] font-mono font-bold text-indigo-400">{lesson.lessonCode}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded uppercase font-semibold ${
                          lesson.status === "published" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                        }`}>{lesson.status}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200 truncate group-hover:text-white">{lesson.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{lesson.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0a0c14] flex items-center justify-between text-[10px] text-slate-500">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Local Presentation Mode</span>
          </div>
          <span className="font-mono">v1.1-preview</span>
        </div>

      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0a0d17]">
        
        {/* Main Header / Top bar with Workflow Tabs */}
        <header className="bg-[#101424]/90 border-b border-slate-800/80 px-8 flex flex-col justify-end pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[10px] font-mono text-indigo-400 uppercase font-bold tracking-wider">Active Workspace</div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2 mt-0.5">
                <span>{selectedLesson ? selectedLesson.title : "No Lesson Selected"}</span>
                <span className="text-xs font-mono font-normal bg-slate-800 border border-slate-700/60 py-0.5 px-2 rounded text-slate-300">
                  {activeLessonCode}
                </span>
              </h2>
            </div>
            
            {/* Quick Stats Summary */}
            <div className="flex space-x-6 text-xs bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 uppercase font-bold">Core Items</span>
                <span className="text-sm font-black text-indigo-400">{currentVocabs.length + currentSentences.length}</span>
              </div>
              <span className="w-px bg-slate-800 my-1"></span>
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 uppercase font-bold">Tutor Segments</span>
                <span className="text-sm font-black text-slate-300">{currentSegments.length}</span>
              </div>
              <span className="w-px bg-slate-800 my-1"></span>
              <div className="flex flex-col">
                <span className="text-[9px] text-slate-500 uppercase font-bold">Audio Ready</span>
                <span className="text-sm font-black text-emerald-400">{currentSegments.filter(s => s.ttsStatus === "success").length}</span>
              </div>
            </div>
          </div>

          {/* 4 Tabs Selector */}
          <div className="flex space-x-2 -mb-px">
            <button
              onClick={() => setActiveTab("core")}
              className={`pb-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "core"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Database size={13} />
              <span>[1] Core Content (UC01)</span>
            </button>
            
            <button
              onClick={() => setActiveTab("tutor")}
              className={`pb-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "tutor"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Volume2 size={13} />
              <span>[2] Tutor & Audio QA (UC02)</span>
            </button>
            
            <button
              onClick={() => setActiveTab("drills")}
              className={`pb-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "drills"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sliders size={13} />
              <span>[3] Drill Config (UC03)</span>
            </button>
            
            <button
              onClick={() => setActiveTab("roleplay")}
              className={`pb-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "roleplay"
                  ? "border-indigo-500 text-indigo-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <MessageSquare size={13} />
              <span>[4] Roleplay Setup (UC04)</span>
            </button>
          </div>

        </header>

        {/* WORKFLOW VIEWPORTS */}
        <section className="flex-1 overflow-y-auto p-8 relative">

          {/* TAB 1: CORE CONTENT VIEW */}
          {activeTab === "core" && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Vocab & Sentence Items Library (Layer 2)</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">This forms the main curriculum database. Add, edit, or delete base terms here.</p>
                </div>
                <button 
                  onClick={syncToTutorSegments}
                  className="bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/20 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Sparkles size={12} />
                  <span>Sync to Tutor Segments</span>
                </button>
              </div>

              {/* Vocab Items Grid */}
              <div className="bg-[#121626]/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-slate-800/80 bg-[#101323]/50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200">Vocab Items</span>
                  <button 
                    onClick={addVocabRow}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white py-1 px-3 rounded text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
                  >
                    <Plus size={12} />
                    <span>Add Vocab</span>
                  </button>
                </div>
                
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase font-bold tracking-wider bg-slate-900/30">
                      <th className="py-3 px-4 w-28">Item Code</th>
                      <th className="py-3 px-4 w-48">Script Text (Hanzi/Kana)</th>
                      <th className="py-3 px-4 w-40">Reading / Romanization</th>
                      <th className="py-3 px-4">Base Meaning (English)</th>
                      <th className="py-3 px-4 w-20 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {currentVocabs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500 italic">No Vocabs configured.</td>
                      </tr>
                    ) : (
                      currentVocabs.map((vocab) => (
                        <tr key={vocab.id} className="hover:bg-slate-800/20">
                          <td className="py-3 px-4 font-mono text-indigo-400 font-bold">{vocab.code}</td>
                          <td className="py-3 px-4">
                            <input 
                              type="text" 
                              value={vocab.scriptText} 
                              onChange={(e) => handleVocabEdit(vocab.id, "scriptText", e.target.value)}
                              className="bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded px-2 py-1 text-xs w-full text-white font-bold"
                            />
                          </td>
                          <td className="py-3 px-4 space-y-1">
                            <input 
                              type="text" 
                              value={vocab.readingText} 
                              onChange={(e) => handleVocabEdit(vocab.id, "readingText", e.target.value)}
                              placeholder="Reading/Pinyin"
                              className="bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded px-2 py-0.5 text-[10px] w-full text-slate-300 font-mono"
                            />
                            <input 
                              type="text" 
                              value={vocab.romanization} 
                              onChange={(e) => handleVocabEdit(vocab.id, "romanization", e.target.value)}
                              placeholder="Romanization"
                              className="bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded px-2 py-0.5 text-[10px] w-full text-slate-400 font-mono"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input 
                              type="text" 
                              value={vocab.meaning} 
                              onChange={(e) => handleVocabEdit(vocab.id, "meaning", e.target.value)}
                              className="bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded px-2 py-1 text-xs w-full text-slate-300"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button 
                              onClick={() => deleteVocab(vocab.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sentence Items Grid */}
              <div className="bg-[#121626]/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-slate-800/80 bg-[#101323]/50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200">Sentence Items</span>
                  <button 
                    onClick={addSentenceRow}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white py-1 px-3 rounded text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
                  >
                    <Plus size={12} />
                    <span>Add Sentence</span>
                  </button>
                </div>
                
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase font-bold tracking-wider bg-slate-900/30">
                      <th className="py-3 px-4 w-28">Item Code</th>
                      <th className="py-3 px-4 w-52">Script Text</th>
                      <th className="py-3 px-4 w-40">Reading / Romanization</th>
                      <th className="py-3 px-4">Base Meaning (English)</th>
                      <th className="py-3 px-4 w-20 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {currentSentences.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500 italic">No Sentences configured.</td>
                      </tr>
                    ) : (
                      currentSentences.map((sent) => (
                        <tr key={sent.id} className="hover:bg-slate-800/20">
                          <td className="py-3 px-4 font-mono text-indigo-400 font-bold">{sent.code}</td>
                          <td className="py-3 px-4">
                            <input 
                              type="text" 
                              value={sent.scriptText} 
                              onChange={(e) => handleSentenceEdit(sent.id, "scriptText", e.target.value)}
                              className="bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded px-2 py-1 text-xs w-full text-white font-bold"
                            />
                          </td>
                          <td className="py-3 px-4 space-y-1">
                            <input 
                              type="text" 
                              value={sent.readingText} 
                              onChange={(e) => handleSentenceEdit(sent.id, "readingText", e.target.value)}
                              placeholder="Reading/Pinyin"
                              className="bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded px-2 py-0.5 text-[10px] w-full text-slate-300 font-mono"
                            />
                            <input 
                              type="text" 
                              value={sent.romanization} 
                              onChange={(e) => handleSentenceEdit(sent.id, "romanization", e.target.value)}
                              placeholder="Romanization"
                              className="bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded px-2 py-0.5 text-[10px] w-full text-slate-400 font-mono"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input 
                              type="text" 
                              value={sent.meaning} 
                              onChange={(e) => handleSentenceEdit(sent.id, "meaning", e.target.value)}
                              className="bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded px-2 py-1 text-xs w-full text-slate-300"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button 
                              onClick={() => deleteSentence(sent.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 2: TUTOR & AUDIO QA VIEW */}
          {activeTab === "tutor" && (
            <div className="space-y-6">
              
              <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Tutor Pipeline & Audio QA Dashboard (UC02)</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Manage audio generation statuses and approve native translation overlays before sync.</p>
                </div>
                
                <div className="flex items-center space-x-3 text-xs">
                  <span className="flex items-center space-x-1.5 text-emerald-400 font-bold bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                    <CheckCircle2 size={12} />
                    <span>Passed: {currentSegments.filter(s => s.qaStatus === "passed").length}</span>
                  </span>
                  <span className="flex items-center space-x-1.5 text-rose-400 font-bold bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20">
                    <XCircle size={12} />
                    <span>Failed: {currentSegments.filter(s => s.qaStatus === "failed").length}</span>
                  </span>
                </div>
              </div>

              {/* Segment Table */}
              <div className="bg-[#121626]/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase font-bold tracking-wider bg-slate-900/30">
                      <th className="py-3 px-4 w-12 text-center">Idx</th>
                      <th className="py-3 px-4 w-24">Card Code</th>
                      <th className="py-3 px-4 w-1/3">Tutor Source Text</th>
                      <th className="py-3 px-4">Translation Overlay (Native)</th>
                      <th className="py-3 px-4 w-40">Audio Status</th>
                      <th className="py-3 px-4 w-44">Human QA</th>
                      <th className="py-3 px-4 w-20 text-center">Regen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {currentSegments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-500 italic">No segments loaded. Sync items from Tab 1.</td>
                      </tr>
                    ) : (
                      currentSegments.map((segment) => {
                        const isFailed = segment.qaStatus === "failed";
                        return (
                          <tr 
                            key={segment.id} 
                            className={`hover:bg-slate-800/20 transition-all ${
                              isFailed ? "bg-rose-500/[0.02] border-l-2 border-l-rose-500" : ""
                            }`}
                          >
                            {/* Index */}
                            <td className="py-4 px-4 text-center font-mono text-slate-400">#{segment.orderIndex}</td>
                            
                            {/* Card Code */}
                            <td className="py-4 px-4 font-mono font-semibold text-slate-300">{segment.cardCode}</td>
                            
                            {/* Source Text (Editable ONLY when failed or drafting) */}
                            <td className="py-4 px-4">
                              {isFailed ? (
                                <div className="space-y-1">
                                  <textarea 
                                    value={segment.tutorText} 
                                    onChange={(e) => handleSegmentTextEdit(segment.id, e.target.value)}
                                    className="w-full bg-slate-900 border border-rose-500/40 rounded p-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                                    rows={2}
                                  />
                                  <span className="text-[9px] text-rose-400 flex items-center space-x-1">
                                    <AlertTriangle size={10} />
                                    <span>Failed QA. Please correct the script text above and click Regenerate.</span>
                                  </span>
                                </div>
                              ) : (
                                <div className="text-sm font-bold text-white tracking-wide">{segment.tutorText}</div>
                              )}
                            </td>

                            {/* Localized Translation Input */}
                            <td className="py-4 px-4">
                              <input 
                                type="text"
                                value={segment.meaningVi}
                                onChange={(e) => handleSegmentTranslationEdit(segment.id, e.target.value)}
                                placeholder="Nhập bản dịch..."
                                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded px-2.5 py-1.5 text-xs text-slate-100 transition-colors"
                              />
                            </td>

                            {/* Audio Status */}
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                {segment.ttsStatus === "success" && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                    Generated
                                  </span>
                                )}
                                {segment.ttsStatus === "failed" && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                                    Failed
                                  </span>
                                )}
                                {segment.ttsStatus === "generating" && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold animate-pulse">
                                    <Loader2 size={10} className="mr-1 animate-spin" />
                                    Generating
                                  </span>
                                )}
                                {segment.ttsStatus === "draft" && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 text-[10px] font-bold">
                                    Draft
                                  </span>
                                )}

                                {/* Inline Audio Player if Success */}
                                {segment.ttsStatus === "success" && segment.audioUrl && (
                                  <div className="mt-1.5">
                                    <MiniAudioPlayer url={segment.audioUrl} />
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Human QA Actions */}
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => updateQAStatus(segment.id, "passed")}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center space-x-1 border ${
                                    segment.qaStatus === "passed"
                                      ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/20"
                                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30"
                                  }`}
                                >
                                  <Check size={10} />
                                  <span>Pass</span>
                                </button>
                                <button
                                  onClick={() => updateQAStatus(segment.id, "failed")}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all flex items-center space-x-1 border ${
                                    segment.qaStatus === "failed"
                                      ? "bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-950/20"
                                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30"
                                  }`}
                                >
                                  <X size={10} />
                                  <span>Fail</span>
                                </button>
                              </div>
                            </td>

                            {/* Regenerate Action */}
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={() => regenerateAudio(segment.id)}
                                disabled={segment.ttsStatus === "generating"}
                                className={`p-2 rounded-lg border shadow-sm transition-all cursor-pointer ${
                                  isFailed
                                    ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white"
                                }`}
                                title="Call TTS Pipeline"
                              >
                                <RotateCw size={12} className={segment.ttsStatus === "generating" ? "animate-spin animate-infinite" : ""} />
                              </button>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 3: DRILL CONFIGURATION VIEW */}
          {activeTab === "drills" && (
            <div className="space-y-6">
              
              <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
                <h3 className="text-sm font-bold text-slate-200">Interactive Drill Constructor (UC03)</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Build interactive voice, fill-in-the-blank, or syntax reordering exercises based on active core items.</p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                
                {/* Left Side: Select Item from Core to Build Drill */}
                <div className="col-span-1 bg-[#121626]/80 border border-slate-800 rounded-xl p-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide border-b border-slate-800 pb-2">Core Content Items</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">Vocabs</span>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {currentVocabs.map(v => (
                          <div key={v.id} className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/40 text-[11px]">
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate">{v.scriptText}</div>
                              <div className="text-[9px] text-slate-400 font-mono">{v.code}</div>
                            </div>
                            <button 
                              onClick={() => addDrillItem(v.code, v.scriptText, v.meaning)}
                              className="p-1 rounded bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all cursor-pointer"
                              title="Create Drill from this item"
                            >
                              <PlusCircle size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">Sentences</span>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {currentSentences.map(s => (
                          <div key={s.id} className="flex justify-between items-center p-2 rounded bg-slate-900/50 border border-slate-800/40 text-[11px]">
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate">{s.scriptText}</div>
                              <div className="text-[9px] text-slate-400 font-mono">{s.code}</div>
                            </div>
                            <button 
                              onClick={() => addDrillItem(s.code, s.scriptText, s.meaning)}
                              className="p-1 rounded bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all cursor-pointer"
                            >
                              <PlusCircle size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Side: Configure Drill Items */}
                <div className="col-span-2 bg-[#121626]/80 border border-slate-800 rounded-xl p-4 space-y-4 flex flex-col">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide border-b border-slate-800 pb-2">Active Drills List</h4>

                  <div className="space-y-4 flex-1">
                    {currentDrills.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 italic text-xs">
                        No active drills configured. Click the "+" button on the left panel to add a drill from the core library.
                      </div>
                    ) : (
                      currentDrills.map((drill) => {
                        const isFillBlank = drill.drillType === "fill_blank";
                        return (
                          <div key={drill.id} className="p-4 rounded-xl bg-slate-900/55 border border-slate-800/80 space-y-3 relative group">
                            
                            <button 
                              onClick={() => removeDrillItem(drill.id)}
                              className="absolute top-4 right-4 p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>

                            <div className="flex items-center space-x-3">
                              <span className="font-mono text-[9px] font-bold bg-slate-800 py-1 px-2 rounded border border-slate-700 text-slate-300">
                                Source: {drill.sourceCode}
                              </span>
                              
                              <div className="flex items-center space-x-1.5">
                                <span className="text-[10px] font-semibold text-slate-400">Drill Type:</span>
                                <select
                                  value={drill.drillType}
                                  onChange={(e) => handleDrillEdit(drill.id, "drillType", e.target.value as any)}
                                  className="bg-slate-950 border border-slate-800 rounded py-0.5 px-2 text-[10px] text-indigo-400 focus:outline-none"
                                >
                                  <option value="listen_repeat">Listen & Repeat (Speaking)</option>
                                  <option value="fill_blank">Fill in the Blank</option>
                                  <option value="sentence_order">Sentence Ordering</option>
                                </select>
                              </div>
                            </div>

                            {/* Base preview */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Target Script</label>
                                <input 
                                  type="text" 
                                  value={drill.scriptText} 
                                  onChange={(e) => handleDrillEdit(drill.id, "scriptText", e.target.value)}
                                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs w-full text-white font-bold"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Meaning</label>
                                <input 
                                  type="text" 
                                  value={drill.meaning} 
                                  onChange={(e) => handleDrillEdit(drill.id, "meaning", e.target.value)}
                                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs w-full text-slate-300"
                                />
                              </div>
                            </div>

                            {/* If Fill Blank selected, show special configuration inputs */}
                            {isFillBlank && (
                              <div className="bg-[#0e111d]/90 border border-slate-800/80 rounded-lg p-3 space-y-2 mt-2">
                                <div className="text-[10px] text-slate-400 font-bold flex items-center space-x-1">
                                  <Info size={10} className="text-indigo-400" />
                                  <span>Fill-in-the-blank Exercise Logic Configurations</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[8px] text-slate-500 uppercase font-semibold">Prompt Before</label>
                                    <input 
                                      type="text" 
                                      value={drill.promptBefore || ""} 
                                      onChange={(e) => handleDrillEdit(drill.id, "promptBefore", e.target.value)}
                                      placeholder="e.g. 我"
                                      className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs w-full text-white"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8px] text-slate-500 uppercase font-semibold">Blank Answer</label>
                                    <input 
                                      type="text" 
                                      value={drill.answer || ""} 
                                      onChange={(e) => handleDrillEdit(drill.id, "answer", e.target.value)}
                                      placeholder="e.g. 是"
                                      className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs w-full text-indigo-400 font-bold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8px] text-slate-500 uppercase font-semibold">Prompt After</label>
                                    <input 
                                      type="text" 
                                      value={drill.promptAfter || ""} 
                                      onChange={(e) => handleDrillEdit(drill.id, "promptAfter", e.target.value)}
                                      placeholder="e.g. 王华"
                                      className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs w-full text-white"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })
                    )}
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 4: ROLEPLAY SETUP VIEW */}
          {activeTab === "roleplay" && (
            <div className="space-y-6">
              
              <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
                <h3 className="text-sm font-bold text-slate-200">Interactive Roleplay Configurator (UC04)</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Define conversation settings and AI goals for mock grading check-lists.</p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                
                {/* Context setup */}
                <div className="col-span-1 bg-[#121626]/80 border border-slate-800 rounded-xl p-4 space-y-4">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide border-b border-slate-800 pb-2">Context Prompt & Info</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Prompt Setup Context</label>
                      <textarea
                        value={currentRoleplay.setup}
                        onChange={(e) => handleRoleplaySetupChange(e.target.value)}
                        placeholder="Define prompt scenario instructions for the AI tutor..."
                        className={`w-full bg-slate-950 border rounded p-2 text-xs text-white focus:outline-none focus:border-indigo-500 ${
                          isRoleplayTooLong ? "border-rose-500" : "border-slate-800"
                        }`}
                        rows={6}
                      />
                      
                      <div className="flex justify-between items-center mt-1 text-[9px]">
                        <span className={isRoleplayTooLong ? "text-rose-400 font-bold" : "text-slate-500"}>
                          {currentRoleplay.setup.length} / 1000 characters
                        </span>
                        {isRoleplayTooLong && (
                          <span className="text-rose-400 flex items-center space-x-0.5 font-bold">
                            <AlertTriangle size={8} />
                            <span>Warning: Token limit exceeded</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Tutor Scenario Notes</label>
                      <textarea
                        value={currentRoleplay.notes}
                        onChange={(e) => handleRoleplayNotesChange(e.target.value)}
                        placeholder="Internal guidelines or scenario tips..."
                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                        rows={4}
                      />
                    </div>
                  </div>

                </div>

                {/* Goals success criteria */}
                <div className="col-span-2 bg-[#121626]/80 border border-slate-800 rounded-xl p-4 space-y-4 flex flex-col">
                  <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Conversational Goals (Success Criteria)</h4>
                    <button
                      onClick={addRoleplayGoal}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white py-1 px-3 rounded text-xs font-bold flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Plus size={12} />
                      <span>Add Goal</span>
                    </button>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px]">
                    {currentRoleplay.goals.length === 0 ? (
                      <div className="py-12 text-center text-slate-500 italic text-xs">
                        No goals added. Add grading criteria so the AI can evaluate the student conversation.
                      </div>
                    ) : (
                      currentRoleplay.goals.map((goal, idx) => (
                        <div key={goal.id} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800/80 relative flex items-start space-x-4">
                          
                          <button
                            onClick={() => removeRoleplayGoal(goal.id)}
                            className="absolute top-3 right-3 p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>

                          <div className="font-mono text-xs text-indigo-400 font-bold bg-slate-950 h-6 w-6 rounded-full flex items-center justify-center border border-slate-800">
                            {idx + 1}
                          </div>

                          <div className="flex-1 grid grid-cols-2 gap-4 pr-6">
                            <div>
                              <label className="block text-[8px] text-slate-500 uppercase font-semibold mb-0.5">Success Criteria (English)</label>
                              <input
                                type="text"
                                value={goal.successCriteria}
                                onChange={(e) => editRoleplayGoal(goal.id, "successCriteria", e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-[8px] text-slate-500 uppercase font-semibold mb-0.5">Native Description (Overlay)</label>
                              <input
                                type="text"
                                value={goal.descriptionNative}
                                onChange={(e) => editRoleplayGoal(goal.id, "descriptionNative", e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300"
                              />
                            </div>
                          </div>

                        </div>
                      ))
                    )}
                  </div>

                </div>

              </div>

            </div>
          )}

        </section>

      </main>

    </div>
  );
}
