"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Pause, 
  RotateCw, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  FileAudio, 
  HelpCircle,
  ChevronRight,
  Database,
  Globe,
  Plus,
  Volume2,
  Trash2,
  Check,
  AlertTriangle,
  PlayCircle
} from "lucide-react";

// Mock Data
interface LanguagePair {
  id: string;
  learningLanguage: string;
  learningFlag: string;
  nativeLanguage: string;
  nativeFlag: string;
  label: string;
}

interface Lesson {
  id: string;
  lessonCode: string;
  level: number;
  topicNumber: number;
  lessonNumber: number;
  title: string;
  description: string;
  status: "draft" | "published";
  itemCount: number;
}

interface GuidedSegment {
  id: string;
  lessonCode: string;
  orderIndex: number;
  cardCode: string;
  type: string;
  section: string;
  tutorText: string;
  pinyin?: string;
  meaningEn: string;
  meaningVi: string;
  audioUrl?: string;
  ttsProvider: string;
  ttsStatus: "draft" | "generating" | "success" | "failed";
  ttsMessage?: string;
}

const mockLanguagePairs: LanguagePair[] = [
  { id: "1", learningLanguage: "Chinese", learningFlag: "🇨🇳", nativeLanguage: "Vietnamese", nativeFlag: "🇻🇳", label: "Chinese ➜ Vietnamese" },
  { id: "2", learningLanguage: "Japanese", learningFlag: "🇯🇵", nativeLanguage: "Vietnamese", nativeFlag: "🇻🇳", label: "Japanese ➜ Vietnamese" },
  { id: "3", learningLanguage: "Korean", learningFlag: "🇰🇷", nativeLanguage: "Vietnamese", nativeFlag: "🇻🇳", label: "Korean ➜ Vietnamese" }
];

const mockLessons: Record<string, Lesson[]> = {
  "1": [ // Chinese -> Vietnamese
    { id: "zh-1", lessonCode: "ZH_L101", level: 1, topicNumber: 1, lessonNumber: 1, title: "Greetings & Self Introduction", description: "Learn basic greetings: Ni hao, Wo shi...", status: "published", itemCount: 5 },
    { id: "zh-2", lessonCode: "ZH_L102", level: 1, topicNumber: 1, lessonNumber: 2, title: "Asking names & Nationalities", description: "Learn 'Ni jiao shenme mingzi?' and countries", status: "published", itemCount: 6 },
    { id: "zh-3", lessonCode: "ZH_L103", level: 1, topicNumber: 2, lessonNumber: 1, title: "Family & Occupation", description: "Talking about parents, siblings, and job titles", status: "draft", itemCount: 4 },
  ],
  "2": [ // Japanese -> Vietnamese
    { id: "ja-1", lessonCode: "JA_L101", level: 1, topicNumber: 1, lessonNumber: 1, title: "Hiragana Greetings & Bowing", description: "Learn Konnichiwa, Hajimemashite...", status: "published", itemCount: 5 },
    { id: "ja-2", lessonCode: "JA_L102", level: 1, topicNumber: 1, lessonNumber: 2, title: "Self Introduction & Desu", description: "Learn Watashi wa... desu and particle wa", status: "draft", itemCount: 4 }
  ]
};

const mockSegments: Record<string, GuidedSegment[]> = {
  "ZH_L101": [
    {
      id: "zh101-s1",
      lessonCode: "ZH_L101",
      orderIndex: 1,
      cardCode: "L101_V01",
      type: "Tutor Card",
      section: "Vocab Introduce",
      tutorText: "你好",
      pinyin: "nǐ hǎo",
      meaningEn: "Hello",
      meaningVi: "Xin chào",
      audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3",
      ttsProvider: "gemini-tts",
      ttsStatus: "success"
    },
    {
      id: "zh101-s2",
      lessonCode: "ZH_L101",
      orderIndex: 2,
      cardCode: "L101_V02",
      type: "Tutor Card",
      section: "Vocab Introduce",
      tutorText: "我是王华",
      pinyin: "wǒ shì Wáng Huá",
      meaningEn: "I am Wang Hua",
      meaningVi: "Tôi là Vương Hoa",
      audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3",
      ttsProvider: "gemini-tts",
      ttsStatus: "success"
    },
    {
      id: "zh101-s3",
      lessonCode: "ZH_L101",
      orderIndex: 3,
      cardCode: "L101_S01",
      type: "Tutor Card",
      section: "Sentence Drill",
      tutorText: "你好！我是李明。很高兴认识你。",
      pinyin: "nǐ hǎo! wǒ shì Lǐ Míng. hěn gāoxìng rènshì nǐ.",
      meaningEn: "Hello! I am Li Ming. Nice to meet you.",
      meaningVi: "Chào bạn! Tôi là Lý Minh. Rất vui được quen biết bạn.",
      ttsProvider: "gemini-tts",
      ttsStatus: "failed",
      ttsMessage: "Gemini API Timeout: The speech model response took too long (> 10000ms)."
    },
    {
      id: "zh101-s4",
      lessonCode: "ZH_L101",
      orderIndex: 4,
      cardCode: "L101_S02",
      type: "Tutor Card",
      section: "Sentence Drill",
      tutorText: "你叫什么名字？",
      pinyin: "nǐ jiào shénme míngzì?",
      meaningEn: "What is your name?",
      meaningVi: "Bạn tên là gì?",
      ttsProvider: "gemini-tts",
      ttsStatus: "generating"
    },
    {
      id: "zh101-s5",
      lessonCode: "ZH_L101",
      orderIndex: 5,
      cardCode: "L101_R01",
      type: "Recap Card",
      section: "Review & Goodbye",
      tutorText: "再见！",
      pinyin: "zàijiàn!",
      meaningEn: "Goodbye!",
      meaningVi: "Tạm biệt!",
      ttsProvider: "gemini-tts",
      ttsStatus: "draft"
    }
  ],
  "ZH_L102": [
    {
      id: "zh102-s1",
      lessonCode: "ZH_L102",
      orderIndex: 1,
      cardCode: "L102_V01",
      type: "Tutor Card",
      section: "Vocab Introduce",
      tutorText: "你",
      pinyin: "nǐ",
      meaningEn: "You",
      meaningVi: "Bạn / Anh / Chị",
      audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3",
      ttsProvider: "gemini-tts",
      ttsStatus: "success"
    },
    {
      id: "zh102-s2",
      lessonCode: "ZH_L102",
      orderIndex: 2,
      cardCode: "L102_V02",
      type: "Tutor Card",
      section: "Vocab Introduce",
      tutorText: "中国",
      pinyin: "Zhōngguó",
      meaningEn: "China",
      meaningVi: "Trung Quốc",
      ttsProvider: "gemini-tts",
      ttsStatus: "draft"
    }
  ]
};

// Custom Mini Audio Player Component
interface MiniPlayerProps {
  url: string;
}

const MiniAudioPlayer: React.FC<MiniPlayerProps> = ({ url }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio(url);
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.log("Audio play failed:", err));
      setIsPlaying(true);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 rounded-full py-1.5 px-3 max-w-[190px]">
      <button 
        onClick={togglePlay}
        className="p-1 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all cursor-pointer"
      >
        {isPlaying ? <Pause size={12} fill="white" /> : <Play size={12} fill="white" className="translate-x-[0.5px]" />}
      </button>
      
      <div className="flex flex-col flex-1 min-w-[70px]">
        <div className="w-full bg-slate-700 h-1 rounded-full overflow-hidden">
          <div className="bg-indigo-400 h-full transition-all duration-100" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-mono">
          <span>{formatTime(audioRef.current ? audioRef.current.currentTime : 0)}</span>
          <span>{formatTime(duration || 2)}</span>
        </div>
      </div>
    </div>
  );
};

export default function AudioQADashboard() {
  const [selectedPairId, setSelectedPairId] = useState<string>("1");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [segments, setSegments] = useState<GuidedSegment[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Stats
  const [totalCount, setTotalCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [generatingCount, setGeneratingCount] = useState(0);
  
  // Set default lesson on load or pair change
  useEffect(() => {
    const lessons = mockLessons[selectedPairId] || [];
    if (lessons.length > 0) {
      setSelectedLesson(lessons[0]);
    } else {
      setSelectedLesson(null);
    }
  }, [selectedPairId]);

  // Load segments when lesson changes
  useEffect(() => {
    if (selectedLesson) {
      const code = selectedLesson.lessonCode;
      const initialSegs = mockSegments[code] || [];
      setSegments(initialSegs);
    } else {
      setSegments([]);
    }
  }, [selectedLesson]);

  // Recalculate stats whenever segments change
  useEffect(() => {
    setTotalCount(segments.length);
    setSuccessCount(segments.filter(s => s.ttsStatus === "success").length);
    setFailedCount(segments.filter(s => s.ttsStatus === "failed").length);
    setGeneratingCount(segments.filter(s => s.ttsStatus === "generating").length);
  }, [segments]);

  // Handle translation input change
  const handleTranslationChange = (id: string, newTranslation: string) => {
    setSegments(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, meaningVi: newTranslation };
      }
      return s;
    }));
  };

  // Simulate single audio generation
  const generateAudio = (id: string) => {
    setSegments(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, ttsStatus: "generating", ttsMessage: undefined };
      }
      return s;
    }));

    setTimeout(() => {
      setSegments(prev => prev.map(s => {
        if (s.id === id) {
          // Simulate 90% success rate, 10% failure
          const isSuccess = Math.random() > 0.15;
          if (isSuccess) {
            return {
              ...s,
              ttsStatus: "success",
              audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3"
            };
          } else {
            return {
              ...s,
              ttsStatus: "failed",
              ttsMessage: "Gemini API Error: System generation timed out during audio mapping flow."
            };
          }
        }
        return s;
      }));
    }, 2000);
  };

  // Simulate Batch Audio Generation
  const generateAllMissing = () => {
    const toGen = segments.filter(s => s.ttsStatus !== "success");
    if (toGen.length === 0) return;

    // Set all non-success to generating
    setSegments(prev => prev.map(s => {
      if (s.ttsStatus !== "success") {
        return { ...s, ttsStatus: "generating", ttsMessage: undefined };
      }
      return s;
    }));

    // Resolve sequentially or in batch with random delays
    toGen.forEach((seg, idx) => {
      setTimeout(() => {
        setSegments(prev => prev.map(s => {
          if (s.id === seg.id) {
            return {
              ...s,
              ttsStatus: "success",
              audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3"
            };
          }
          return s;
        }));
      }, 1500 + idx * 800);
    });
  };

  const getStatusBadge = (status: GuidedSegment["ttsStatus"]) => {
    switch (status) {
      case "success":
        return (
          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle size={12} className="mr-1.5" />
            Success
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle size={12} className="mr-1.5" />
            Failed
          </span>
        );
      case "generating":
        return (
          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <Loader2 size={12} className="mr-1.5 animate-spin" />
            Generating
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <HelpCircle size={12} className="mr-1.5" />
            Draft
          </span>
        );
    }
  };

  // Filtered segments
  const filteredSegments = segments.filter(s => {
    const matchesSearch = 
      s.tutorText.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (s.pinyin && s.pinyin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.meaningVi.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || s.ttsStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const activePair = mockLanguagePairs.find(p => p.id === selectedPairId);

  return (
    <div className="flex h-screen bg-[#0d0f17] text-slate-100 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-80 bg-[#121624]/90 border-r border-slate-800/80 flex flex-col backdrop-blur-md">
        
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <FileAudio className="text-white" size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">Yapsu Platform</h1>
              <p className="text-[10px] text-slate-400 tracking-wider font-semibold uppercase">Curriculum Engine</p>
            </div>
          </div>
        </div>

        {/* Language Pair Selector */}
        <div className="p-4 border-b border-slate-800/60 bg-[#151a2d]/40">
          <label className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">
            Target Language Pair
          </label>
          <div className="relative">
            <select 
              value={selectedPairId} 
              onChange={(e) => setSelectedPairId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/60 rounded-lg py-2 px-3 text-xs text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer appearance-none"
            >
              {mockLanguagePairs.map((pair) => (
                <option key={pair.id} value={pair.id}>
                  {pair.learningFlag} {pair.label}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
              <Globe size={12} />
            </div>
          </div>
        </div>

        {/* Lesson List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2 px-1">
              <span>Lessons & Curriculum</span>
              <span className="bg-slate-800 text-[9px] py-0.5 px-2 rounded-full font-mono font-medium">
                {(mockLessons[selectedPairId] || []).length} Total
              </span>
            </div>
            
            <div className="space-y-1">
              {(mockLessons[selectedPairId] || []).map((lesson) => {
                const isSelected = selectedLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`w-full text-left p-3 rounded-lg transition-all cursor-pointer relative group flex items-start space-x-3 ${
                      isSelected 
                        ? "bg-gradient-to-r from-indigo-600/30 to-indigo-900/10 border border-indigo-500/50 shadow-md shadow-indigo-900/20" 
                        : "hover:bg-slate-800/40 border border-transparent"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r"></span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-indigo-400">
                          {lesson.lessonCode}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                          lesson.status === "published" 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {lesson.status}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                        {lesson.title}
                      </h3>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {lesson.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-[#0e111d] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-medium text-[11px]">System Online</span>
          </div>
          <span className="text-[10px] font-mono bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/40">
            v1.0.2-mock
          </span>
        </div>

      </aside>

      {/* MAIN MAIN AREA */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0d0f17]">
        
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-[#101424]/40 backdrop-blur-md px-8 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-xl font-bold text-slate-200">{selectedLesson ? selectedLesson.title : "Select a Lesson"}</span>
            <span className="text-xs font-mono bg-slate-800/80 border border-slate-700/60 py-0.5 px-2.5 rounded-full text-indigo-400">
              {selectedLesson?.lessonCode}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={generateAllMissing}
              disabled={segments.every(s => s.ttsStatus === "success")}
              className={`flex items-center space-x-2 text-xs font-bold py-2 px-4 rounded-lg shadow-md cursor-pointer transition-all ${
                segments.every(s => s.ttsStatus === "success")
                  ? "bg-slate-800 text-slate-500 border border-slate-700/40 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white hover:shadow-indigo-500/10"
              }`}
            >
              <Volume2 size={14} />
              <span>Generate All Missing</span>
            </button>
            
            <span className="h-4 w-px bg-slate-700/50"></span>
            
            <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-lg p-1">
              <span className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase font-mono">
                Source:
              </span>
              <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded border border-indigo-500/20">
                Gemini AI Draft
              </span>
            </div>
          </div>
        </header>

        {/* Dashboard Stats */}
        <section className="p-8 pb-4">
          <div className="grid grid-cols-4 gap-4">
            
            <div className="bg-[#121626]/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all"></div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Cards</span>
                <h3 className="text-2xl font-black text-white mt-1">{totalCount}</h3>
              </div>
              <div className="h-10 w-10 bg-slate-800/80 border border-slate-700/40 rounded-lg flex items-center justify-center text-slate-300">
                <Database size={18} />
              </div>
            </div>

            <div className="bg-[#121626]/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all"></div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Audio Ready (QA Pass)</span>
                <div className="flex items-baseline space-x-2">
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">{successCount}</h3>
                  <span className="text-xs text-slate-400">({totalCount > 0 ? Math.round((successCount/totalCount)*100) : 0}%)</span>
                </div>
              </div>
              <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                <CheckCircle size={18} />
              </div>
            </div>

            <div className="bg-[#121626]/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 w-16 h-16 bg-rose-500/5 rounded-full blur-xl group-hover:bg-rose-500/10 transition-all"></div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Failed Generation</span>
                <h3 className="text-2xl font-black text-rose-400 mt-1">{failedCount}</h3>
              </div>
              <div className="h-10 w-10 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center justify-center text-rose-400">
                <AlertTriangle size={18} />
              </div>
            </div>

            <div className="bg-[#121626]/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute right-0 top-0 translate-x-2 -translate-y-2 w-16 h-16 bg-amber-500/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-all"></div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Generating / Processing</span>
                <h3 className="text-2xl font-black text-amber-400 mt-1">{generatingCount}</h3>
              </div>
              <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center text-amber-400">
                <Loader2 size={18} className={generatingCount > 0 ? "animate-spin" : ""} />
              </div>
            </div>

          </div>
        </section>

        {/* Main Content Actions Toolbar */}
        <section className="px-8 pb-4 flex items-center justify-between space-x-4">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 my-auto" size={14} />
            <input
              type="text"
              placeholder="Search source script text, romanization, or translations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
              <Filter size={12} className="text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Filter Audio Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none border-none py-0.5 cursor-pointer font-medium"
              >
                <option value="all">All States</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="generating">Generating</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

        </section>

        {/* Audio QA Pipeline Table */}
        <section className="flex-1 px-8 pb-8 overflow-y-auto">
          <div className="bg-[#121626]/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg h-full flex flex-col">
            
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 tracking-wider bg-[#101323]/60 uppercase">
                    <th className="py-4 px-6 w-16">Index</th>
                    <th className="py-4 px-4 w-24">Card Code</th>
                    <th className="py-4 px-4">Tutor Source Text</th>
                    <th className="py-4 px-4">Translation Overlay (Native)</th>
                    <th className="py-4 px-4 w-40">Audio Status</th>
                    <th className="py-4 px-4 w-52">Audio Player</th>
                    <th className="py-4 px-6 text-center w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredSegments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                        No segments found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSegments.map((segment) => (
                      <tr 
                        key={segment.id} 
                        className={`hover:bg-slate-800/20 transition-all ${
                          segment.ttsStatus === "failed" ? "bg-rose-500/[0.01]" : ""
                        }`}
                      >
                        {/* Index */}
                        <td className="py-4 px-6 font-mono text-slate-400 font-semibold">
                          #{segment.orderIndex}
                        </td>
                        
                        {/* Card Code */}
                        <td className="py-4 px-4">
                          <span className="font-mono bg-slate-800 text-slate-300 py-1 px-2 rounded border border-slate-700/30 text-[10px]">
                            {segment.cardCode}
                          </span>
                        </td>
                        
                        {/* Source Text */}
                        <td className="py-4 px-4 max-w-xs">
                          <div className="space-y-1">
                            <div className="text-sm font-bold text-white tracking-wide">
                              {segment.tutorText}
                            </div>
                            {segment.pinyin && (
                              <div className="text-[10px] text-indigo-300 font-mono">
                                {segment.pinyin}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 truncate">
                              En Base: <span className="italic">{segment.meaningEn}</span>
                            </div>
                          </div>
                        </td>
                        
                        {/* Localized Translation Input */}
                        <td className="py-4 px-4">
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={segment.meaningVi}
                              onChange={(e) => handleTranslationChange(segment.id, e.target.value)}
                              placeholder="Nhập bản dịch tiếng Việt..."
                              className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded px-2.5 py-1.5 text-xs text-slate-100 transition-colors"
                            />
                            <div className="flex items-center space-x-1.5 text-[9px] text-slate-500">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                              <span>Target Overlay Language: {activePair?.nativeLanguage}</span>
                            </div>
                          </div>
                        </td>
                        
                        {/* Audio Status */}
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <div>{getStatusBadge(segment.ttsStatus)}</div>
                            {segment.ttsStatus === "failed" && segment.ttsMessage && (
                              <div className="text-[9px] text-rose-400 max-w-[150px] leading-tight break-words font-mono bg-rose-500/5 p-1 rounded border border-rose-500/10">
                                {segment.ttsMessage}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* Audio Player Controls */}
                        <td className="py-4 px-4">
                          {segment.ttsStatus === "success" && segment.audioUrl ? (
                            <MiniAudioPlayer url={segment.audioUrl} />
                          ) : segment.ttsStatus === "generating" ? (
                            <div className="flex items-center space-x-2 text-slate-500 text-[10px] font-medium">
                              <Loader2 size={12} className="animate-spin text-indigo-400" />
                              <span>Awaiting stream...</span>
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[10px] font-medium">
                              No active audio
                            </span>
                          )}
                        </td>
                        
                        {/* Actions */}
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => generateAudio(segment.id)}
                            disabled={segment.ttsStatus === "generating"}
                            className={`p-2 rounded-lg border shadow-sm transition-all cursor-pointer ${
                              segment.ttsStatus === "success"
                                ? "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600"
                                : segment.ttsStatus === "failed"
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                                : "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500"
                            }`}
                            title={segment.ttsStatus === "success" ? "Regenerate Audio" : "Generate Audio"}
                          >
                            <RotateCw size={12} className={segment.ttsStatus === "generating" ? "animate-spin" : ""} />
                          </button>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer / Summary */}
            <div className="py-3.5 px-6 border-t border-slate-800 bg-[#101323]/40 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center space-x-1.5">
                <span>Showing</span>
                <span className="text-slate-200 font-bold">{filteredSegments.length}</span>
                <span>of</span>
                <span className="text-slate-200 font-bold">{segments.length}</span>
                <span>segments in current lesson overlay.</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Audio Config: Gemini TTS (en-US, zh-CN)</span>
                </div>
              </div>
            </div>

          </div>
        </section>

      </main>

    </div>
  );
}
