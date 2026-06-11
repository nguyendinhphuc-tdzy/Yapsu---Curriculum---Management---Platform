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
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Play,
  Pause,
  PlusCircle,
  Globe,
  Sliders,
  Sparkles,
  Info,
  Grid,
  Download,
  Upload,
  RefreshCw,
  Search,
  CheckCircle
} from "lucide-react";

// Types
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

interface ExcelRow {
  id: string;
  no: number | string;
  code: string;
  cn: string; // e.g. "你 | nǐ" or "\\" for tutor lines
  en: string; // e.g. "you" or tutor text transcript
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
  sourceCode: string; // references Vocab/Sentence code
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

// Initial Mock Data reflecting actual [Original] Yapsu AI Curriculum.xlsx
const mockLanguagePairs: LanguagePair[] = [
  { id: "zh-vi", learning: "Chinese", native: "Vietnamese", flag: "🇨🇳", label: "Chinese ➜ Vietnamese" },
  { id: "ja-vi", learning: "Japanese", native: "Vietnamese", flag: "🇯🇵", label: "Japanese ➜ Vietnamese" }
];

const mockLessons: Record<string, Lesson[]> = {
  "zh-vi": [
    { id: "zh-l101", lessonCode: "CN_L101", level: 1, title: "Introductions and greetings", description: "Learn basic pronouns and greetings", status: "published" },
    { id: "zh-l102", lessonCode: "CN_L102", level: 1, title: "Numbers & Shopping", description: "Asking prices and counting", status: "draft" }
  ],
  "ja-vi": [
    { id: "ja-l101", lessonCode: "JA_L101", level: 1, title: "Meeting Someone New", description: "Hajimemashite and self introduction", status: "published" }
  ]
};

// Raw Excel rows mapped exactly from [Original] Yapsu AI Curriculum.xlsx sheet L1-01
const initialExcelRows: Record<string, ExcelRow[]> = {
  "CN_L101": [
    { id: "row-1", no: 1, code: "CN_L101_A1", cn: "\\", en: "Hey there. Imagine this — it's your first day at a language exchange in Shanghai. Someone walks up to you, smiles, and says something in Chinese. You want to say hi and introduce yourself.\n\nThat's exactly what we're doing today. By the end of this lesson, you’ll be able to do both naturally in Chinese. Let’s go.\n\nAlright, quick question before we start— if you could only learn ONE word in any language before landing in a new country… what would it be?\nProbably \"you,\" right? Because every conversation starts there.\n\nIn Chinese, \"you\" is 你\nListen: 你. Give it a small rise — like you're slightly curious.\nNǐ.\nYour turn.", ttsStatus: "success", audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3", qaStatus: "passed" },
    { id: "row-2", no: 2, code: "CN_L101_V6", cn: "你 | nǐ", en: "you", ttsStatus: "success", audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3", qaStatus: "passed" },
    { id: "row-3", no: 3, code: "CN_L101_A2", cn: "\\", en: "Nice. That already sounds like Chinese.\n\nNow flip it. What about \"me\"? Because after you say \"you\"… you've gotta talk about yourself.\nThat’s 我. It dips down, then bounces back up. Try it:\n我.", ttsStatus: "success", audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3", qaStatus: "passed" },
    { id: "row-4", no: 4, code: "CN_L101_V7", cn: "我 | wǒ", en: "I | me", ttsStatus: "success", audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3", qaStatus: "passed" },
    { id: "row-5", no: 5, code: "CN_L101_A3", cn: "\\", en: "Perfect.\n\nOkay, here's the fun part.\nYou've got 你 — you. And now let me give you one more: 好 — it means \"good.\"\nSimilar feel to 我 — it dips a little. Hǎo.", ttsStatus: "success", audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3", qaStatus: "pending" },
    { id: "row-6", no: 6, code: "CN_L101_V4", cn: "好 | hǎo", en: "good", ttsStatus: "success", audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3", qaStatus: "pending" },
    { id: "row-7", no: 7, code: "CN_L101_A4", cn: "\\", en: "Good one.\nNow — put 你 and 好 together. What do you get?\n你好, which is hello.\nIn real life, most people say 你好 really smoothly — almost like one word. Nǐhǎo.\nTry it smooth: 你好.", ttsStatus: "success", audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3", qaStatus: "pending" },
    { id: "row-8", no: 8, code: "CN_L101_S4", cn: "你好 | nǐ hǎo", en: "hello", ttsStatus: "success", audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3", qaStatus: "pending" },
    { id: "row-9", no: 9, code: "CN_L101_A5", cn: "\\", en: "You nailed it. That sounded natural.\n\nNow — imagine someone just said 你好 to you. What's next? They're probably going to ask your name.\nHere's the word you need: 叫 — it means \"to be called.\"\nJust say it once for me — 叫.", ttsStatus: "failed", ttsMessage: "Gemini TTS timeout error", qaStatus: "failed" },
    { id: "row-10", no: 10, code: "CN_L101_V3", cn: "叫 | jiào", en: "to be called", ttsStatus: "generating", qaStatus: "pending" },
    { id: "row-11", no: 11, code: "CN_L101_A6", cn: "\\", en: "Good job.\n\nNow — after your name, people are going to want to know a bit more about you. Like, are you a student? Here's the word you need to know:\n\n学生 — that's \"student.\". Listen first — 学生. Now your turn:", ttsStatus: "draft", qaStatus: "pending" },
    { id: "row-12", no: 12, code: "CN_L101_V2", cn: "学生 | xuéshēng", en: "student", ttsStatus: "draft", qaStatus: "pending" },
    { id: "row-13", no: 13, code: "CN_L101_A7", cn: "\\", en: "Nice.\n\nAnd if you're not a student — maybe you're working and your are an engineer. Here's the word you need:\n\n工程师 — engineer. Okay it's a longer one, so let's just take it slow together — gōng… chéng… shī. Nice and easy. Now all together — 工程师.", ttsStatus: "draft", qaStatus: "pending" },
    { id: "row-14", no: 14, code: "CN_L101_V1", cn: "工程师 | gōngchéngshī", en: "engineer", ttsStatus: "draft", qaStatus: "pending" },
    { id: "row-15", no: 15, code: "CN_L101_G1", cn: "\\", en: "- Structure: Subject + Verb + Object (SVO)\n- Usage: Used to form basic affirmative sentences in Chinese.\n\n- Examples:\n+ 你是工程师。(Nǐ shì gōngchéngshī.) – You are an engineer.\n+ 我叫安娜。(Wǒ jiào Ānnà.) - My name is Anna.\n+ 我 là 学生。(Wǒ shì xuéshēng.) - I am a student.", ttsStatus: "draft", qaStatus: "pending" },
    { id: "row-16", no: 16, code: "CN_L101_S1", cn: "我是学生 | wǒ shì xuéshēng", en: "I am a student", ttsStatus: "draft", qaStatus: "pending" },
    { id: "row-17", no: 17, code: "CN_L101_S2", cn: "你是工程师 | nǐ shì gōngchéngshī", en: "You are an engineer", ttsStatus: "draft", qaStatus: "pending" }
  ],
  "CN_L102": [
    { id: "row-201", no: 1, code: "CN_L102_A1", cn: "\\", en: "Welcome to Lesson 2! Today we count numbers.", ttsStatus: "success", audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3", qaStatus: "passed" },
    { id: "row-202", no: 2, code: "CN_L102_V1", cn: "多少钱 | duō shǎo qián", en: "How much money", ttsStatus: "draft", qaStatus: "pending" }
  ],
  "JA_L101": [
    { id: "row-301", no: 1, code: "JA_L101_A1", cn: "\\", en: "Hajimemashite! Welcome to Japanese Level 1.", ttsStatus: "success", audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3", qaStatus: "passed" },
    { id: "row-302", no: 2, code: "JA_L101_V1", cn: "初めまして | はじめまして", en: "Nice to meet you", ttsStatus: "draft", qaStatus: "pending" }
  ]
};

const initialDrillItems: Record<string, DrillItem[]> = {
  "CN_L101": [
    { id: "dr-1", drillType: "listen_repeat", scriptText: "你好", meaning: "Xin chào", sourceCode: "CN_L101_V6" },
    { id: "dr-2", drillType: "fill_blank", scriptText: "我是学生", meaning: "Tôi là học sinh", promptBefore: "我", promptAfter: "学生", answer: "是", sourceCode: "CN_L101_S1" }
  ],
  "CN_L102": [],
  "JA_L101": []
};

const initialRoleplays: Record<string, Roleplay> = {
  "CN_L101": {
    id: "rp-1",
    setup: "Bạn đang tham gia một buổi trao đổi ngôn ngữ tại Bắc Kinh. Hãy tự giới thiệu tên mình bằng tiếng Trung với giáo viên.",
    notes: "Sử dụng mẫu câu '我叫 [Tên]' hoặc '我是 [Tên]'.",
    goals: [
      { id: "g-1", orderIndex: 1, successCriteria: "Chào giáo viên bằng 'nǐ hǎo'", descriptionNative: "Chào hỏi lịch sự" },
      { id: "g-2", orderIndex: 2, successCriteria: "Giới thiệu nghề nghiệp là 'xuéshēng' hoặc 'gōngchéngshī'", descriptionNative: "Giới thiệu nghề nghiệp" }
    ]
  },
  "CN_L102": { id: "rp-2", setup: "Hỏi giá tiền táo tại cửa hàng.", notes: "", goals: [] },
  "JA_L101": { id: "rp-3", setup: "Chào hỏi gia đình homestay tại sân bay.", notes: "", goals: [] }
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
    <div className="flex items-center space-x-2 bg-stone-50 border border-stone-200/60 rounded-full py-1 px-2.5 max-w-[150px]">
      <button 
        onClick={togglePlay}
        className="p-1.5 rounded-full bg-stone-800 text-white hover:bg-stone-700 transition-colors duration-200 cursor-pointer"
      >
        {isPlaying ? <Pause size={8} fill="white" /> : <Play size={8} fill="white" className="translate-x-[0.5px]" />}
      </button>
      <div className="w-16 bg-stone-200 h-1 rounded-full overflow-hidden">
        <div className="bg-stone-600 h-full transition-all duration-150" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
};

export default function CurriculumDashboard() {
  const [selectedPairId, setSelectedPairId] = useState<string>("zh-vi");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [activeTab, setActiveTab] = useState<string>("excel"); // excel, tutor, drills, roleplay
  const [searchQuery, setSearchQuery] = useState("");

  // States
  const [excelRowsMap, setExcelRowsMap] = useState<Record<string, ExcelRow[]>>(initialExcelRows);
  const [drillMap, setDrillMap] = useState<Record<string, DrillItem[]>>(initialDrillItems);
  const [roleplayMap, setRoleplayMap] = useState<Record<string, Roleplay>>(initialRoleplays);

  // Set default lesson when pair changes
  useEffect(() => {
    const pairLessons = mockLessons[selectedPairId] || [];
    if (pairLessons.length > 0) {
      setSelectedLesson(pairLessons[0]);
    } else {
      setSelectedLesson(null);
    }
  }, [selectedPairId]);

  const activeLessonCode = selectedLesson?.lessonCode || "";
  const currentRows = excelRowsMap[activeLessonCode] || [];

  // ----------------------------------------------------
  // TAB 1: EXCEL SPREADSHEET EDITOR (UC01 - Layer 2)
  // ----------------------------------------------------
  const handleCellEdit = (id: string, field: "cn" | "en" | "code", val: string) => {
    setExcelRowsMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(row => row.id === id ? { ...row, [field]: val } : row)
    }));
  };

  const addExcelRow = (type: "tutor" | "vocab" | "sentence" | "grammar") => {
    const newNo = currentRows.length + 1;
    let codePrefix = "V";
    let defaultCn = "新词汇 | xīn cí huì";
    let defaultEn = "New Vocab";
    
    if (type === "tutor") {
      codePrefix = "A";
      defaultCn = "\\";
      defaultEn = "Tutor instructions script here...";
    } else if (type === "sentence") {
      codePrefix = "S";
      defaultCn = "新句子 | xīn jù zi";
      defaultEn = "New sentence meaning";
    } else if (type === "grammar") {
      codePrefix = "G";
      defaultCn = "\\";
      defaultEn = "Grammar rule configuration...";
    }

    const newRow: ExcelRow = {
      id: `row-${Date.now()}`,
      no: newNo,
      code: `${activeLessonCode}_${codePrefix}${newNo}`,
      cn: defaultCn,
      en: defaultEn,
      ttsStatus: "draft",
      qaStatus: "pending"
    };

    setExcelRowsMap(prev => ({
      ...prev,
      [activeLessonCode]: [...(prev[activeLessonCode] || []), newRow]
    }));
  };

  const deleteExcelRow = (id: string) => {
    setExcelRowsMap(prev => {
      const updated = (prev[activeLessonCode] || []).filter(row => row.id !== id);
      const reindexed = updated.map((r, idx) => ({ ...r, no: idx + 1 }));
      return {
        ...prev,
        [activeLessonCode]: reindexed
      };
    });
  };

  // ----------------------------------------------------
  // TAB 2: TUTOR & AUDIO QA ACTIONS (UC02 - Layer 3)
  // ----------------------------------------------------
  const handleTranslationEdit = (id: string, val: string) => {
    setExcelRowsMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(row => row.id === id ? { ...row, en: val } : row)
    }));
  };

  const updateQAStatus = (id: string, status: "passed" | "failed") => {
    setExcelRowsMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(row => row.id === id ? { ...row, qaStatus: status } : row)
    }));
  };

  const regenerateAudio = (id: string) => {
    setExcelRowsMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(row => row.id === id ? { ...row, ttsStatus: "generating", ttsMessage: undefined } : row)
    }));

    setTimeout(() => {
      setExcelRowsMap(prev => ({
        ...prev,
        [activeLessonCode]: prev[activeLessonCode].map(row => row.id === id ? { 
          ...row, 
          ttsStatus: "success", 
          qaStatus: "passed",
          audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3" 
        } : row)
      }));
    }, 1500);
  };

  // ----------------------------------------------------
  // TAB 3: DRILL CONFIGURATION ACTIONS (UC03 - Layer 3)
  // ----------------------------------------------------
  const currentDrills = drillMap[activeLessonCode] || [];

  const handleDrillEdit = (id: string, field: keyof DrillItem, val: string) => {
    setDrillMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(d => d.id === id ? { ...d, [field]: val } : d)
    }));
  };

  const addDrillFromExcel = (row: ExcelRow) => {
    const isVocab = row.code.includes("_V");
    const cleanText = row.cn.split("|")[0].trim();
    const cleanMeaning = row.en;
    
    const newDrill: DrillItem = {
      id: `dr-${Date.now()}`,
      drillType: isVocab ? "listen_repeat" : "fill_blank",
      scriptText: cleanText,
      meaning: cleanMeaning,
      sourceCode: row.code
    };
    
    setDrillMap(prev => ({
      ...prev,
      [activeLessonCode]: [...(prev[activeLessonCode] || []), newDrill]
    }));
  };

  const deleteDrill = (id: string) => {
    setDrillMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].filter(d => d.id !== id)
    }));
  };

  // ----------------------------------------------------
  // TAB 4: ROLEPLAY SETUP ACTIONS (UC04 - Layer 3)
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
      successCriteria: "Speak fluently without hesitations",
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

  // Filtered rows for Excel Sheet View
  const filteredRows = currentRows.filter(row => {
    return (
      row.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.cn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.en.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const activePair = mockLanguagePairs.find(p => p.id === selectedPairId);

  return (
    <div className="flex h-screen bg-[#F8F7F5] text-stone-800 overflow-hidden font-sans">
      
      {/* SIDEBAR SELECTORS (Editorial Light Style) */}
      <aside className="w-80 bg-white border-r border-stone-200/80 flex flex-col justify-between">
        
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-stone-100 flex items-center space-x-3">
            <div className="h-8 w-8 rounded-xl bg-stone-850 flex items-center justify-center">
              <Database className="text-white" size={14} />
            </div>
            <div>
              <h1 className="text-sm font-bold font-serif text-stone-800">Yapsu Pipeline</h1>
              <p className="text-[9px] text-stone-500 font-semibold tracking-wider uppercase">Curriculum Engine</p>
            </div>
          </div>

          {/* Language Pair Selector */}
          <div className="p-4 border-b border-stone-100 bg-stone-50/40">
            <label className="block text-[9px] text-stone-500 uppercase font-bold tracking-wider mb-2">
              Language Pair
            </label>
            <div className="relative">
              <select 
                value={selectedPairId} 
                onChange={(e) => setSelectedPairId(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl py-2 pl-3 pr-8 text-xs text-stone-855 font-medium focus:outline-none focus:border-stone-400 transition-colors duration-200 cursor-pointer appearance-none"
              >
                {mockLanguagePairs.map((pair) => (
                  <option key={pair.id} value={pair.id}>
                    {pair.flag} {pair.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-stone-500">
                <Globe size={12} />
              </div>
            </div>
          </div>

          {/* Lessons list */}
          <div className="p-4">
            <div className="text-[9px] text-stone-500 uppercase font-bold tracking-wider mb-2 px-1">
              Select Lesson
            </div>
            <div className="space-y-1">
              {(mockLessons[selectedPairId] || []).map((lesson) => {
                const isSelected = selectedLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer relative group flex items-start space-x-3 ${
                      isSelected 
                        ? "bg-[#F8F7F5] border-stone-200/80" 
                        : "hover:bg-stone-50 border-transparent"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-mono font-bold text-stone-500">{lesson.lessonCode}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-semibold border ${
                          lesson.status === "published" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>{lesson.status}</span>
                      </div>
                      <h4 className="text-xs font-bold text-stone-800 truncate group-hover:text-stone-800 font-serif">{lesson.title}</h4>
                      <p className="text-[10px] text-stone-500 truncate mt-0.5">{lesson.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between text-[10px] text-stone-500">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Presentation Mockup Mode</span>
          </div>
          <span className="font-mono text-[9px]">v1.2-claude</span>
        </div>

      </aside>

      {/* MAIN MAIN AREA */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#F8F7F5]">
        
        {/* Main Header / Top bar with Workflow Tabs */}
        <header className="bg-white border-b border-stone-200/80 px-8 flex flex-col justify-end pt-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-[9px] font-mono text-stone-500 uppercase font-bold tracking-wider">Active Workspace</div>
              <h2 className="text-xl font-medium font-serif text-stone-800 flex items-center space-x-2 mt-0.5">
                <span>{selectedLesson ? selectedLesson.title : "No Lesson Selected"}</span>
                <span className="text-xs font-mono font-normal bg-stone-50 border border-stone-200/60 py-0.5 px-2 rounded text-stone-500">
                  {activeLessonCode}
                </span>
              </h2>
            </div>
            
            {/* Quick Stats Summary */}
            <div className="flex space-x-6 text-xs bg-stone-50/80 p-2 rounded-xl border border-stone-200/60">
              <div className="flex flex-col">
                <span className="text-[9px] text-stone-500 uppercase font-bold">Total Rows</span>
                <span className="text-xs font-bold text-stone-800">{currentRows.length}</span>
              </div>
              <span className="w-px bg-stone-200 my-1"></span>
              <div className="flex flex-col">
                <span className="text-[9px] text-stone-500 uppercase font-bold">Vocabs / Sentences</span>
                <span className="text-xs font-bold text-stone-800">
                  {currentRows.filter(r => r.code.includes("_V") || r.code.includes("_S")).length}
                </span>
              </div>
              <span className="w-px bg-stone-200 my-1"></span>
              <div className="flex flex-col">
                <span className="text-[9px] text-stone-500 uppercase font-bold">Audio Ready</span>
                <span className="text-xs font-bold text-emerald-700">{currentRows.filter(s => s.ttsStatus === "success").length}</span>
              </div>
            </div>
          </div>

          {/* Workflow Tabs (Serif Design) */}
          <div className="flex space-x-2 -mb-px">
            <button
              onClick={() => setActiveTab("excel")}
              className={`pb-3 px-4 font-serif font-medium text-xs border-b-2 transition-colors duration-200 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "excel"
                  ? "border-stone-800 text-stone-800 font-semibold"
                  : "border-transparent text-stone-500 hover:text-stone-850"
              }`}
            >
              <Grid size={12} />
              <span>Spreadsheet Grid (UC01)</span>
            </button>
            
            <button
              onClick={() => setActiveTab("tutor")}
              className={`pb-3 px-4 font-serif font-medium text-xs border-b-2 transition-colors duration-200 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "tutor"
                  ? "border-stone-800 text-stone-800 font-semibold"
                  : "border-transparent text-stone-500 hover:text-stone-850"
              }`}
            >
              <Volume2 size={12} />
              <span>Tutor Audio QA (UC02)</span>
            </button>
            
            <button
              onClick={() => setActiveTab("drills")}
              className={`pb-3 px-4 font-serif font-medium text-xs border-b-2 transition-colors duration-200 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "drills"
                  ? "border-stone-800 text-stone-800 font-semibold"
                  : "border-transparent text-stone-500 hover:text-stone-850"
              }`}
            >
              <Sliders size={12} />
              <span>Drill Config (UC03)</span>
            </button>
            
            <button
              onClick={() => setActiveTab("roleplay")}
              className={`pb-3 px-4 font-serif font-medium text-xs border-b-2 transition-colors duration-200 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "roleplay"
                  ? "border-stone-800 text-stone-800 font-semibold"
                  : "border-transparent text-stone-500 hover:text-stone-850"
              }`}
            >
              <MessageSquare size={12} />
              <span>Roleplay Setup (UC04)</span>
            </button>
          </div>

        </header>

        {/* WORKFLOW VIEWPORTS */}
        <section className="flex-1 overflow-y-auto p-8 relative">

          {/* TAB 1: EXCEL SPREADSHEET GRID */}
          {activeTab === "excel" && (
            <div className="space-y-6">
              
              <div className="flex justify-between items-center bg-white p-6 border border-stone-200/80 rounded-2xl">
                <div>
                  <h3 className="text-sm font-bold text-stone-800 font-serif">Spreadsheet Editor Interface</h3>
                  <p className="text-[11px] text-stone-500 mt-0.5 font-sans">
                    Matches the exact layout of <code>[Original] Yapsu AI Curriculum.xlsx</code>. Click cells to edit.
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex space-x-2 text-xs font-sans">
                  <button 
                    onClick={() => addExcelRow("tutor")}
                    className="bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 py-1.5 px-3 rounded-lg font-medium cursor-pointer transition-colors duration-200 flex items-center space-x-1"
                  >
                    <Plus size={11} />
                    <span>+ Tutor Card</span>
                  </button>
                  <button 
                    onClick={() => addExcelRow("vocab")}
                    className="bg-stone-800 text-white hover:bg-stone-700 py-1.5 px-3 rounded-lg font-medium cursor-pointer transition-colors duration-200 flex items-center space-x-1 border border-stone-800"
                  >
                    <Plus size={11} />
                    <span>+ Vocab Card</span>
                  </button>
                  <button 
                    onClick={() => addExcelRow("sentence")}
                    className="bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 py-1.5 px-3 rounded-lg font-medium cursor-pointer transition-colors duration-200 flex items-center space-x-1"
                  >
                    <Plus size={11} />
                    <span>+ Sentence Card</span>
                  </button>
                  <button 
                    onClick={() => addExcelRow("grammar")}
                    className="bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 py-1.5 px-3 rounded-lg font-medium cursor-pointer transition-colors duration-200 flex items-center space-x-1"
                  >
                    <Plus size={11} />
                    <span>+ Grammar Card</span>
                  </button>
                </div>
              </div>

              {/* Search / Toolbar */}
              <div className="flex justify-between items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500 my-auto" size={13} />
                  <input
                    type="text"
                    placeholder="Search spreadsheet cells..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border border-stone-200 rounded-lg py-2 pl-9 pr-4 text-xs text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-0 transition-colors duration-200"
                  />
                </div>
                
                <span className="text-[11px] text-stone-500 italic font-serif">
                  Note: Split CN texts via <code>|</code> characters to register readings.
                </span>
              </div>

              {/* Spreadsheet Grid (Editorial styling) */}
              <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-none">
                <table className="w-full text-left border-collapse text-xs table-fixed">
                  <thead>
                    <tr className="border-b border-stone-200 text-[10px] text-stone-500 uppercase font-semibold tracking-wider bg-stone-50/50">
                      <th className="py-4 px-6 w-16 text-center font-serif">No.</th>
                      <th className="py-4 px-6 w-36 font-serif">Code</th>
                      <th className="py-4 px-6 w-72 font-serif">CN (Script | Reading)</th>
                      <th className="py-4 px-6 font-serif">EN (English / Script)</th>
                      <th className="py-4 px-6 w-24 text-center font-serif">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-sans">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-stone-400 italic">No spreadsheet rows configured.</td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => {
                        const isTutor = row.cn === "\\";
                        return (
                          <tr key={row.id} className="hover:bg-stone-50/30 transition-colors duration-200">
                            {/* No */}
                            <td className="py-4 px-6 text-center font-mono text-stone-500">{row.no}</td>
                            
                            {/* Code */}
                            <td className="py-4 px-6">
                              <input 
                                type="text"
                                value={row.code}
                                onChange={(e) => handleCellEdit(row.id, "code", e.target.value)}
                                className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:border-stone-400 focus:ring-0 rounded-lg px-2 py-1 text-xs text-stone-800 font-mono font-semibold focus:outline-none transition-colors duration-200"
                              />
                            </td>
                            
                            {/* CN cell */}
                            <td className="py-4 px-6">
                              <input 
                                type="text"
                                value={row.cn}
                                onChange={(e) => handleCellEdit(row.id, "cn", e.target.value)}
                                className={`w-full bg-transparent border border-transparent hover:border-stone-200 focus:border-stone-400 focus:ring-0 rounded-lg px-2 py-1 text-xs focus:outline-none font-medium transition-colors duration-200 ${
                                  isTutor ? "text-stone-500 font-mono italic" : "text-stone-805"
                                }`}
                              />
                            </td>
                            
                            {/* EN cell */}
                            <td className="py-4 px-6">
                              <textarea
                                value={row.en}
                                onChange={(e) => handleCellEdit(row.id, "en", e.target.value)}
                                className={`w-full bg-transparent border border-transparent hover:border-stone-200 focus:border-stone-400 focus:ring-0 rounded-lg px-2 py-1 text-xs focus:outline-none leading-relaxed resize-none transition-colors duration-200 ${
                                  isTutor ? "text-stone-800 font-serif" : "text-stone-500"
                                }`}
                                rows={isTutor && row.en.length > 80 ? 3 : 1}
                              />
                            </td>
                            
                            {/* Delete Action */}
                            <td className="py-4 px-6 text-center">
                              <button 
                                onClick={() => deleteExcelRow(row.id)}
                                className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors duration-200 cursor-pointer"
                              >
                                <Trash2 size={13} />
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

          {/* TAB 2: TUTOR & AUDIO QA VIEW */}
          {activeTab === "tutor" && (
            <div className="space-y-6">
              
              <div className="bg-white p-6 border border-stone-200/80 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-800 font-serif">Tutor Pipeline & Audio QA Dashboard</h3>
                  <p className="text-[11px] text-stone-500 mt-0.5">Approve translations and preview the generated pronunciation audio files.</p>
                </div>
                
                <div className="flex items-center space-x-2 text-xs font-sans">
                  <span className="flex items-center space-x-1.5 text-emerald-700 font-semibold bg-emerald-50 border border-emerald-100/80 px-2.5 py-1 rounded-full">
                    <CheckCircle2 size={11} />
                    <span>Passed: {currentRows.filter(s => s.qaStatus === "passed").length}</span>
                  </span>
                  <span className="flex items-center space-x-1.5 text-rose-700 font-semibold bg-rose-50 border border-rose-100/80 px-2.5 py-1 rounded-full">
                    <XCircle size={11} />
                    <span>Failed: {currentRows.filter(s => s.qaStatus === "failed").length}</span>
                  </span>
                </div>
              </div>

              {/* QA Segment Table */}
              <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-none">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-[10px] text-stone-500 uppercase font-semibold tracking-wider bg-stone-50/50">
                      <th className="py-4 px-6 w-16 text-center font-serif">Idx</th>
                      <th className="py-4 px-6 w-36 font-serif">Code</th>
                      <th className="py-4 px-6 w-1/3 font-serif">Tutor Source Text</th>
                      <th className="py-4 px-6 font-serif">Translation Overlay (Native)</th>
                      <th className="py-4 px-6 w-44 font-serif">Audio Status</th>
                      <th className="py-4 px-6 w-44 font-serif">Human QA</th>
                      <th className="py-4 px-6 w-24 text-center font-serif">Regen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-sans">
                    {currentRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-stone-400 italic">No segments loaded. Add items to Tab 1.</td>
                      </tr>
                    ) : (
                      currentRows.map((row) => {
                        const isFailed = row.qaStatus === "failed";
                        const isTutor = row.cn === "\\";
                        
                        return (
                          <tr 
                            key={row.id} 
                            className={`transition-colors duration-200 ${
                              isFailed ? "bg-rose-500/[0.01] border-l-2 border-l-rose-500" : "hover:bg-stone-50/20"
                            }`}
                          >
                            {/* Index */}
                            <td className="py-4 px-6 text-center font-mono text-stone-500">#{row.no}</td>
                            
                            {/* Card Code */}
                            <td className="py-4 px-6 font-mono font-semibold text-stone-700">{row.code}</td>
                            
                            {/* Source Text */}
                            <td className="py-4 px-6">
                              {isFailed ? (
                                <div className="space-y-1">
                                  <textarea 
                                    value={row.cn} 
                                    onChange={(e) => handleCellEdit(row.id, "cn", e.target.value)}
                                    className="w-full bg-transparent border border-rose-200 rounded-lg p-2 text-xs text-stone-800 font-bold focus:outline-none focus:border-rose-400 focus:ring-0 transition-colors duration-200"
                                    rows={2}
                                  />
                                  <span className="text-[9px] text-rose-600 flex items-center space-x-1 font-medium">
                                    <AlertTriangle size={10} />
                                    <span>Failed QA: Correct script text and click Regenerate.</span>
                                  </span>
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  <div className="text-sm font-bold text-stone-800 tracking-wide font-serif">
                                    {isTutor ? "Tutor Speech Segment" : row.cn.split("|")[0].trim()}
                                  </div>
                                  {!isTutor && row.cn.includes("|") && (
                                    <div className="text-[10px] text-[#C27A5C] font-mono">
                                      {row.cn.split("|")[1].trim()}
                                    </div>
                                  )}
                                  {isTutor && (
                                    <div className="text-[11px] text-stone-500 leading-relaxed font-serif max-h-24 overflow-y-auto pr-2">
                                      {row.en}
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Localized Translation Input */}
                            <td className="py-4 px-6">
                              {!isTutor ? (
                                <input 
                                  type="text"
                                  value={row.en}
                                  onChange={(e) => handleTranslationEdit(row.id, e.target.value)}
                                  placeholder="Nhập bản dịch..."
                                  className="w-full bg-transparent border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 font-medium focus:border-stone-400 focus:outline-none focus:ring-0 transition-colors duration-200"
                                />
                              ) : (
                                <span className="text-[10px] text-stone-500 italic">Instruction Segment</span>
                              )}
                            </td>

                            {/* Audio Status */}
                            <td className="py-4 px-6">
                              <div className="space-y-1.5">
                                {row.ttsStatus === "success" && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">
                                    Generated
                                  </span>
                                )}
                                {row.ttsStatus === "failed" && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold">
                                    Failed
                                  </span>
                                )}
                                {row.ttsStatus === "generating" && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold animate-pulse">
                                    <Loader2 size={10} className="mr-1 animate-spin" />
                                    Generating
                                  </span>
                                )}
                                {row.ttsStatus === "draft" && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-stone-50 text-stone-500 border border-stone-200 text-[10px] font-bold">
                                    Draft
                                  </span>
                                )}

                                {/* Audio Player */}
                                {row.ttsStatus === "success" && row.audioUrl && (
                                  <div className="mt-1">
                                    <MiniAudioPlayer url={row.audioUrl} />
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Human QA Actions */}
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-1.5">
                                <button
                                  onClick={() => updateQAStatus(row.id, "passed")}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-colors duration-200 flex items-center space-x-1 border ${
                                    row.qaStatus === "passed"
                                      ? "bg-[#C27A5C] border-[#C27A5C] text-white"
                                      : "bg-white border-stone-200 text-stone-500 hover:text-stone-800 hover:bg-stone-50"
                                  }`}
                                >
                                  <Check size={10} />
                                  <span>Pass</span>
                                </button>
                                <button
                                  onClick={() => updateQAStatus(row.id, "failed")}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-colors duration-200 flex items-center space-x-1 border ${
                                    row.qaStatus === "failed"
                                      ? "bg-stone-800 border-stone-800 text-white"
                                      : "bg-white border-stone-200 text-stone-550 hover:text-stone-800 hover:bg-stone-50"
                                  }`}
                                >
                                  <X size={10} />
                                  <span>Fail</span>
                                </button>
                              </div>
                            </td>

                            {/* Regenerate Action */}
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => regenerateAudio(row.id)}
                                disabled={row.ttsStatus === "generating"}
                                className={`p-2 rounded-lg border transition-colors duration-200 cursor-pointer ${
                                  isFailed
                                    ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                                    : "bg-white border-stone-200 text-stone-500 hover:bg-stone-50"
                                }`}
                                title="TTS Synthesis"
                              >
                                <RotateCw size={11} className={row.ttsStatus === "generating" ? "animate-spin" : ""} />
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
              
              <div className="bg-white p-6 border border-stone-200/80 rounded-2xl">
                <h3 className="text-sm font-bold text-stone-800 font-serif">Drill Configuration Editor</h3>
                <p className="text-[11px] text-stone-500 mt-0.5">Construct interactive spelling, fill-in-the-blank, or syntax reordering exercises.</p>
              </div>

              <div className="grid grid-cols-3 gap-6 font-sans">
                
                {/* Left side: Spreadsheet Content Cards */}
                <div className="col-span-1 bg-white border border-stone-200/80 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wide border-b border-stone-100 pb-2 font-serif">Spreadsheet Content Cards</h4>
                  
                  <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                    {currentRows.filter(r => !r.code.includes("_A") && !r.code.includes("_G")).map(row => (
                      <div key={row.id} className="flex justify-between items-center p-2 rounded-lg border border-stone-100 bg-stone-50/40 text-[11px] hover:bg-stone-50 hover:border-stone-200 transition-colors duration-200">
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-stone-800 truncate">{row.cn.split("|")[0].trim()}</div>
                          <div className="text-[9px] text-stone-500 font-mono truncate">{row.code}</div>
                        </div>
                        <button 
                          onClick={() => addDrillFromExcel(row)}
                          className="p-1 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-800 hover:text-white transition-colors duration-200 cursor-pointer flex-shrink-0"
                        >
                          <PlusCircle size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Right side: Configure Drill Items */}
                <div className="col-span-2 bg-white border border-stone-200/80 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wide border-b border-stone-100 pb-2 font-serif">Active Drills Configurations</h4>

                  <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
                    {currentDrills.length === 0 ? (
                      <div className="py-12 text-center text-stone-500 italic text-xs">
                        No active drills configured. Click the "+" button on the left panel to import a card.
                      </div>
                    ) : (
                      currentDrills.map((drill) => {
                        const isFillBlank = drill.drillType === "fill_blank";
                        return (
                          <div key={drill.id} className="p-5 rounded-2xl border border-stone-200 bg-stone-50/30 space-y-4 relative group">
                            
                            <button 
                              onClick={() => deleteDrill(drill.id)}
                              className="absolute top-4 right-4 p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors duration-200 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>

                            <div className="flex items-center space-x-3 text-xs">
                              <span className="font-mono text-[9px] font-bold bg-white py-1 px-2 rounded-lg border border-stone-200 text-stone-550">
                                Source: {drill.sourceCode}
                              </span>
                              
                              <div className="flex items-center space-x-1.5">
                                <span className="text-[10px] font-semibold text-stone-500">Drill Type:</span>
                                <select
                                  value={drill.drillType}
                                  onChange={(e) => handleDrillEdit(drill.id, "drillType", e.target.value as any)}
                                  className="bg-white border border-stone-200 rounded-lg py-0.5 px-2 text-[10px] text-stone-800 focus:outline-none focus:border-stone-400 transition-colors duration-200"
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
                                <label className="block text-[9px] text-stone-500 font-bold uppercase mb-1">Target Script</label>
                                <input 
                                  type="text" 
                                  value={drill.scriptText} 
                                  onChange={(e) => handleDrillEdit(drill.id, "scriptText", e.target.value)}
                                  className="bg-transparent border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs w-full text-stone-800 font-bold focus:border-stone-400 focus:outline-none focus:ring-0 transition-colors duration-200"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] text-stone-500 font-bold uppercase mb-1">Meaning</label>
                                <input 
                                  type="text" 
                                  value={drill.meaning} 
                                  onChange={(e) => handleDrillEdit(drill.id, "meaning", e.target.value)}
                                  className="bg-transparent border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs w-full text-stone-600 focus:border-stone-400 focus:outline-none focus:ring-0 transition-colors duration-200"
                                />
                              </div>
                            </div>

                            {/* Fill Blank Logic */}
                            {isFillBlank && (
                              <div className="bg-white border border-stone-200/80 rounded-xl p-4 space-y-3 mt-2 shadow-none">
                                <div className="text-[10px] text-stone-500 font-semibold flex items-center space-x-1 font-serif">
                                  <Info size={11} className="text-stone-800" />
                                  <span>Fill-in-the-blank Exercise Logic Configurations</span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                  <div>
                                    <label className="block text-[8px] text-stone-500 uppercase font-semibold mb-0.5">Prompt Before</label>
                                    <input 
                                      type="text" 
                                      value={drill.promptBefore || ""} 
                                      onChange={(e) => handleDrillEdit(drill.id, "promptBefore", e.target.value)}
                                      placeholder="e.g. 我"
                                      className="bg-transparent border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs w-full text-stone-800 focus:border-stone-400 focus:outline-none focus:ring-0 transition-colors duration-200"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8px] text-stone-500 uppercase font-semibold mb-0.5">Blank Answer</label>
                                    <input 
                                      type="text" 
                                      value={drill.answer || ""} 
                                      onChange={(e) => handleDrillEdit(drill.id, "answer", e.target.value)}
                                      placeholder="e.g. 是"
                                      className="bg-transparent border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs w-full text-[#C27A5C] font-bold focus:border-stone-400 focus:outline-none focus:ring-0 transition-colors duration-200"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[8px] text-stone-500 uppercase font-semibold mb-0.5">Prompt After</label>
                                    <input 
                                      type="text" 
                                      value={drill.promptAfter || ""} 
                                      onChange={(e) => handleDrillEdit(drill.id, "promptAfter", e.target.value)}
                                      placeholder="e.g. 学生"
                                      className="bg-transparent border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs w-full text-stone-800 focus:border-stone-400 focus:outline-none focus:ring-0 transition-colors duration-200"
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
              
              <div className="bg-white p-6 border border-stone-200/80 rounded-2xl">
                <h3 className="text-sm font-bold text-stone-800 font-serif">Roleplay Scenario Editor</h3>
                <p className="text-[11px] text-stone-500 mt-0.5">Define conversation settings and AI goals for mock grading check-lists.</p>
              </div>

              <div className="grid grid-cols-3 gap-6 font-sans">
                
                {/* Context setup */}
                <div className="col-span-1 bg-white border border-stone-200/80 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wide border-b border-stone-100 pb-2 font-serif">Context Prompt & Info</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] text-stone-500 font-bold uppercase mb-1">Prompt Setup Context</label>
                      <textarea
                        value={currentRoleplay.setup}
                        onChange={(e) => handleRoleplaySetupChange(e.target.value)}
                        placeholder="Define prompt scenario instructions for the AI tutor..."
                        className={`w-full bg-transparent border rounded-lg p-2 text-xs text-stone-800 focus:outline-none focus:border-stone-450 focus:ring-0 transition-colors duration-200 ${
                          currentRoleplay.setup.length > 1000 ? "border-rose-300" : "border-stone-200"
                        }`}
                        rows={6}
                      />
                      
                      <div className="flex justify-between items-center mt-1 text-[9px]">
                        <span className={currentRoleplay.setup.length > 1000 ? "text-rose-600 font-bold" : "text-stone-500"}>
                          {currentRoleplay.setup.length} / 1000 characters
                        </span>
                        {currentRoleplay.setup.length > 1000 && (
                          <span className="text-rose-600 flex items-center space-x-0.5 font-bold">
                            <AlertTriangle size={8} />
                            <span>Warning: Token limit exceeded</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] text-stone-500 font-bold uppercase mb-1">Tutor Scenario Notes</label>
                      <textarea
                        value={currentRoleplay.notes}
                        onChange={(e) => handleRoleplayNotesChange(e.target.value)}
                        placeholder="Internal guidelines or scenario tips..."
                        className="w-full bg-transparent border border-stone-200 rounded-lg p-2 text-xs text-stone-500 focus:outline-none focus:border-stone-400 focus:ring-0 transition-colors duration-200"
                        rows={4}
                      />
                    </div>
                  </div>

                </div>

                {/* Goals success criteria */}
                <div className="col-span-2 bg-white border border-stone-200/80 rounded-2xl p-5 space-y-4 flex flex-col">
                  <div className="border-b border-stone-100 pb-2 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wide font-serif">Conversational Goals (Success Criteria)</h4>
                    <button
                      onClick={addRoleplayGoal}
                      className="bg-stone-800 hover:bg-stone-700 text-white py-1.5 px-3 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors duration-200 active:scale-95 border border-stone-800"
                    >
                      <Plus size={12} />
                      <span>Add Goal</span>
                    </button>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
                    {currentRoleplay.goals.length === 0 ? (
                      <div className="py-12 text-center text-stone-500 italic text-xs">
                        No goals added. Add grading criteria so the AI can evaluate the student conversation.
                      </div>
                    ) : (
                      currentRoleplay.goals.map((goal, idx) => (
                        <div key={goal.id} className="p-4 rounded-xl bg-stone-50/40 border border-stone-200/80 relative flex items-start space-x-4">
                          
                          <button
                            onClick={() => removeRoleplayGoal(goal.id)}
                            className="absolute top-3 right-3 p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors duration-200 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>

                          <div className="font-mono text-xs text-stone-500 font-bold bg-white h-6 w-6 rounded-full flex items-center justify-center border border-stone-200">
                            {idx + 1}
                          </div>

                          <div className="flex-1 grid grid-cols-2 gap-4 pr-6">
                            <div>
                              <label className="block text-[8px] text-stone-500 uppercase font-semibold mb-1">Success Criteria (English)</label>
                              <input
                                type="text"
                                value={goal.successCriteria}
                                onChange={(e) => editRoleplayGoal(goal.id, "successCriteria", e.target.value)}
                                className="w-full bg-transparent border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 focus:border-stone-400 focus:outline-none focus:ring-0 transition-colors duration-200"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-[8px] text-stone-500 uppercase font-semibold mb-1">Native Description (Overlay)</label>
                              <input
                                type="text"
                                value={goal.descriptionNative}
                                onChange={(e) => editRoleplayGoal(goal.id, "descriptionNative", e.target.value)}
                                className="w-full bg-transparent border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-500 focus:border-stone-400 focus:outline-none focus:ring-0 transition-colors duration-200"
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
