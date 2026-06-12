"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Database, 
  Volume2, 
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
  Globe,
  Sliders,
  Info,
  Grid,
  Search,
  Save,
  FileSpreadsheet,
  Lock,
  ChevronRight,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Upload,
  Sparkles
} from "lucide-react";

// Types
interface Language {
  id: string;
  code: string;
  name: string;
  script: string;
  speechLocale: string;
  isAvailable: boolean;
  flag: string;
}

export type LessonStatus = "incomplete" | "ready" | "disabled" | "needs_review" | "published";
export type RowStatus = "incomplete" | "ready" | "disabled" | "needs_review";
export type ContentType = "guided_script" | "vocab" | "sentence" | "grammar";

export interface Lesson {
  id: string;
  languageCode: string;
  lessonCode: string;
  level: number;
  title: string;
  description: string;
  status: LessonStatus;
  isEnabled: boolean;
  localizationCoverage: number;
}

export interface ExcelRow {
  id: string;
  no: number | string;
  code: string;
  type?: ContentType;
  source: string; // e.g. "你" or "\\" for tutor lines
  reading: string; // e.g. "nǐ" or ""
  en: string; // e.g. "you" or tutor text transcript
  vn: string;
  kr: string;
  es: string;
  status?: RowStatus;
  isEnabled?: boolean;
  ttsStatus: "draft" | "generating" | "success" | "failed" | "outdated";
  audioUrl?: string;
  audioSource?: "uploaded" | "generated";
  scriptVersion?: number;
  audioVersion?: number;
  qaStatus: "pending" | "passed" | "failed"; // Human QA
  aiQaStatus?: "pending" | "passed" | "failed"; // AI QA
  humanQaReason?: string;
  ttsMessage?: string;
}

interface ImportPreviewRow {
  rowNumber: number;
  code: string;
  type: ContentType | "invalid";
  sourceText: string;
  reading: string;
  meaningEn: string;
  meaningVn: string;
  meaningKr: string;
  meaningEs: string;
  status: "valid" | "invalid" | "duplicate";
  errors: string[];
}

interface ToastMessage {
  type: "success" | "warning" | "error";
  message: string;
}

export interface DrillItem {
  id: string;
  drillType: "listen_repeat" | "fill_blank" | "sentence_order";
  scriptText: string;
  meaningEn: string;
  meaningVn: string;
  meaningKr: string;
  meaningEs: string;
  promptBefore?: string;
  promptAfter?: string;
  choices?: string;
  answer?: string;
  sourceCode: string; // references Vocab/Sentence code
  assignment?: "not_added" | "drill" | "extra_drill";
  blankStart?: number;
  blankEnd?: number;
}

export interface RoleplayGoal {
  id: string;
  orderIndex: number;
  title?: string;
  successCriteria: string;
  descriptionEn: string;
  descriptionNative: string;
  isEnabled: boolean;
}

export interface Roleplay {
  id: string;
  lessonTitle?: string;
  title: string;
  setup: string;
  sourceCodes?: string;
  goals: RoleplayGoal[];
}

// Mock data follows the confirmed ERD: LANGUAGE -> LESSON -> source content items.
const mockLanguages: Language[] = [
  { id: "lang-zh", code: "zh", name: "Chinese", script: "Hans", speechLocale: "cmn-CN", isAvailable: true, flag: "CN" },
  { id: "lang-ja", code: "ja", name: "Japanese", script: "Jpan", speechLocale: "ja-JP", isAvailable: true, flag: "JP" }
];

const nativeLocales = [
  { code: "vn", label: "Vietnamese" },
  { code: "kr", label: "Korean" },
  { code: "es", label: "Spanish" }
] as const;

const mockLessons: Record<string, Lesson[]> = {
  zh: [
    { id: "zh-l101", languageCode: "zh", lessonCode: "CN_L101", level: 1, title: "Introductions & Greetings", description: "Basic pronouns and greetings", status: "ready", isEnabled: true, localizationCoverage: 100 },
    { id: "zh-l102", languageCode: "zh", lessonCode: "CN_L102", level: 1, title: "People & Occupations", description: "He/she, teachers, students", status: "ready", isEnabled: true, localizationCoverage: 85 },
    { id: "zh-l103", languageCode: "zh", lessonCode: "CN_L103", level: 1, title: "Asking Questions", description: "什么, nationalities and languages", status: "ready", isEnabled: true, localizationCoverage: 80 },
    { id: "zh-l104", languageCode: "zh", lessonCode: "CN_L104", level: 1, title: "Family & Relationships", description: "Family members and 的", status: "ready", isEnabled: true, localizationCoverage: 75 },
    { id: "zh-l105", languageCode: "zh", lessonCode: "CN_L105", level: 1, title: "Dates & Birthdays", description: "Numbers, months, and birthdays", status: "ready", isEnabled: true, localizationCoverage: 70 }
  ],
  ja: [
    { id: "ja-l101", languageCode: "ja", lessonCode: "JP_L101", level: 1, title: "Meeting Someone New", description: "Hajimemashite and self-introduction", status: "ready", isEnabled: true, localizationCoverage: 90 },
    { id: "ja-l102", languageCode: "ja", lessonCode: "JP_L102", level: 1, title: "This & That", description: "Demonstratives: これ, それ, あれ", status: "ready", isEnabled: true, localizationCoverage: 85 },
    { id: "ja-l103", languageCode: "ja", lessonCode: "JP_L103", level: 1, title: "Adjectives", description: "い-adjectives: big, small, new", status: "ready", isEnabled: true, localizationCoverage: 80 },
    { id: "ja-l104", languageCode: "ja", lessonCode: "JP_L104", level: 1, title: "Location & Position", description: "Where things are: うえ, した, の", status: "ready", isEnabled: true, localizationCoverage: 75 },
    { id: "ja-l105", languageCode: "ja", lessonCode: "JP_L105", level: 1, title: "Daily Actions", description: "Verbs: read, write, speak, live", status: "ready", isEnabled: true, localizationCoverage: 70 }
  ]
};

import { initialExcelRows, initialDrillItems, initialRoleplays } from "../data/mockNotionData";

const normalizedInitialDrills = Object.fromEntries(
  Object.entries(initialDrillItems).map(([lessonCode, drills]) => {
    const sourceRows = initialExcelRows[lessonCode] || [];
    const sourceByCode = new Map(sourceRows.map(row => [row.code, row]));
    return [
      lessonCode,
      drills
        .filter(drill => drill.sourceCode !== "Unknown" && sourceByCode.has(drill.sourceCode))
        .map(drill => {
          const source = sourceByCode.get(drill.sourceCode);
          return {
            ...drill,
            assignment: drill.assignment || "drill",
            scriptText: source?.source || drill.scriptText,
            meaningEn: source?.en || drill.meaningEn,
            meaningVn: source?.vn || drill.meaningVn,
            meaningKr: source?.kr || drill.meaningKr,
            meaningEs: source?.es || drill.meaningEs
          };
        })
    ];
  })
) as Record<string, DrillItem[]>;

const inferContentType = (code: string): ContentType => {
  if (code.includes("_V")) return "vocab";
  if (code.includes("_S")) return "sentence";
  if (code.includes("_G")) return "grammar";
  return "guided_script";
};

const getRequiredFieldErrors = (row: ExcelRow) => {
  const type = row.type || inferContentType(row.code);
  const errors: string[] = [];
  if (!row.code.trim()) errors.push("code");
  if (!row.en.trim()) errors.push(type === "guided_script" ? "textEnglish" : "base meaning");
  if ((type === "vocab" || type === "sentence") && (!row.source.trim() || row.source.trim() === "\\")) {
    errors.push("scriptText");
  }
  return errors;
};

const getRowStatus = (row: ExcelRow): RowStatus => {
  if (row.status === "disabled") return "disabled";
  if (row.status === "needs_review") return "needs_review";
  return getRequiredFieldErrors(row).length > 0 ? "incomplete" : "ready";
};

const statusStyles: Record<LessonStatus | RowStatus, string> = {
  incomplete: "bg-amber-50 text-amber-700 border-amber-200",
  ready: "bg-sky-50 text-sky-700 border-sky-200",
  disabled: "bg-stone-100 text-stone-900 border-stone-200",
  needs_review: "bg-rose-50 text-rose-700 border-rose-200",
  published: "bg-emerald-50 text-emerald-700 border-emerald-200"
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
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>("zh");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(mockLessons.zh[0]);
  const [activeTab, setActiveTab] = useState<string>("excel"); // excel, tutor, drills, roleplay
  const [searchQuery, setSearchQuery] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [importPreview, setImportPreview] = useState<ImportPreviewRow[]>([]);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [blankSelectionStart, setBlankSelectionStart] = useState<Record<string, number | undefined>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
  const firstFieldRefs = useRef<Record<string, HTMLTextAreaElement | HTMLInputElement | null>>({});
  const goalEnglishRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const drillIdRef = useRef(1000);

  // States
  const [excelRowsMap, setExcelRowsMap] = useState<Record<string, ExcelRow[]>>(initialExcelRows);
  const [drillMap, setDrillMap] = useState<Record<string, DrillItem[]>>(normalizedInitialDrills);
  const [roleplayMap, setRoleplayMap] = useState<Record<string, Roleplay>>(initialRoleplays);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const warnAboutUnsavedChanges = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnAboutUnsavedChanges);
    return () => window.removeEventListener("beforeunload", warnAboutUnsavedChanges);
  }, [isDirty]);

  const activeLessonCode = selectedLesson?.lessonCode || "";
  const currentRows = excelRowsMap[activeLessonCode] || [];
  const getLocaleCoverage = (locale: "vn" | "kr" | "es") => {
    if (currentRows.length === 0) return 0;
    return Math.round((currentRows.filter(row => row[locale].trim()).length / currentRows.length) * 100);
  };
  const getNextSystemCode = (type: ContentType, excludedRowId?: string) => {
    const prefixByType: Record<ContentType, string> = {
      guided_script: "A",
      vocab: "V",
      sentence: "S",
      grammar: "G"
    };
    const prefix = `${activeLessonCode}_${prefixByType[type]}`;
    const highestSuffix = currentRows.reduce((highest, row) => {
      if (row.id === excludedRowId || !row.code.startsWith(prefix)) return highest;
      const suffix = Number(row.code.slice(prefix.length));
      return Number.isFinite(suffix) ? Math.max(highest, suffix) : highest;
    }, 0);
    return `${prefix}${highestSuffix + 1}`;
  };

  // ----------------------------------------------------
  // TAB 1: EXCEL SPREADSHEET EDITOR (UC01 - Layer 2)
  // ----------------------------------------------------
  const handleCellEdit = (id: string, field: "source" | "reading" | "en" | "vn" | "kr" | "es", val: string) => {
    setExcelRowsMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(row => {
        if (row.id !== id) return row;
        const hasDependency = Boolean(row.audioUrl) || (drillMap[activeLessonCode] || []).some(drill => drill.sourceCode === row.code);
        const contentType = row.type || inferContentType(row.code);
        const affectsAudio = field === "source" || field === "reading" || (contentType === "guided_script" && field === "en");
        return {
          ...row,
          [field]: val,
          status: hasDependency ? "needs_review" : undefined,
          isEnabled: hasDependency ? false : row.isEnabled,
          scriptVersion: affectsAudio ? (row.scriptVersion || 1) + 1 : row.scriptVersion,
          ttsStatus: affectsAudio && row.audioUrl ? "outdated" : row.ttsStatus,
          aiQaStatus: affectsAudio && row.audioUrl ? "pending" : row.aiQaStatus,
          qaStatus: affectsAudio && row.audioUrl ? "pending" : row.qaStatus
        };
      })
    }));
    setIsDirty(true);
  };

  const addExcelRow = (type: "tutor" | "vocab" | "sentence" | "grammar") => {
    const newNo = currentRows.length + 1;
    let contentType: ContentType = "vocab";
    let defaultCn = "";
    
    if (type === "tutor") {
      contentType = "guided_script";
      defaultCn = "\\";
    } else if (type === "sentence") {
      contentType = "sentence";
    } else if (type === "grammar") {
      contentType = "grammar";
      defaultCn = "\\";
    }

    const newRow: ExcelRow = {
      id: `row-${Date.now()}`,
      no: newNo,
      code: getNextSystemCode(contentType),
      type: contentType,
      source: defaultCn,
      reading: "",
      en: "",
      vn: "",
      kr: "",
      es: "",
      status: "incomplete",
      isEnabled: false,
      ttsStatus: "draft",
      scriptVersion: 1,
      audioVersion: 0,
      qaStatus: "pending",
      aiQaStatus: "pending"
    };

    setExcelRowsMap(prev => ({
      ...prev,
      [activeLessonCode]: [...(prev[activeLessonCode] || []), newRow]
    }));
    setIsDirty(true);
    setHighlightedRowId(newRow.id);
    const cardLabel: Record<ContentType, string> = {
      guided_script: "Tutor Card",
      vocab: "Vocab Card",
      sentence: "Sentence Card",
      grammar: "Grammar Card"
    };
    setToast({ type: "success", message: `Added ${cardLabel[contentType]} at row ${newNo}. Complete required fields before enabling.` });
    window.setTimeout(() => {
      rowRefs.current[newRow.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
      firstFieldRefs.current[newRow.id]?.focus();
    }, 80);
    window.setTimeout(() => setHighlightedRowId(null), 2600);
  };

  const deleteExcelRow = (id: string) => {
    const target = currentRows.find(row => row.id === id);
    if (!target) return;
    const dependencies = [
      target.audioUrl ? "Audio" : "",
      (drillMap[activeLessonCode] || []).some(drill => drill.sourceCode === target.code) ? "Drill" : "",
      target.code.includes("_S") && (roleplayMap[activeLessonCode]?.goals.length || 0) > 0 ? "Roleplay" : ""
    ].filter(Boolean);
    if (dependencies.length > 0 && !window.confirm(`${target.code} is used by ${dependencies.join(", ")}. Delete it and mark downstream data for review?`)) {
      return;
    }
    setExcelRowsMap(prev => {
      const updated = (prev[activeLessonCode] || []).filter(row => row.id !== id);
      const reindexed = updated.map((r, idx) => ({ ...r, no: idx + 1 }));
      return {
        ...prev,
        [activeLessonCode]: reindexed
      };
    });
    setIsDirty(true);
    setToast({ type: "warning", message: `${target.code} removed. ${dependencies.length ? `${dependencies.join(", ")} must be reviewed.` : "No downstream dependencies found."}` });
  };

  const reorderRows = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    if (searchQuery.trim()) {
      setToast({ type: "warning", message: "Clear the search filter before reordering cards." });
      return;
    }

    const sourceIndex = currentRows.findIndex(row => row.id === sourceId);
    const targetIndex = currentRows.findIndex(row => row.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const reordered = [...currentRows];
    const [movedRow] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, movedRow);
    const reindexed = reordered.map((row, index) => ({ ...row, no: index + 1 }));

    setExcelRowsMap(prev => ({ ...prev, [activeLessonCode]: reindexed }));
    setIsDirty(true);
    setHighlightedRowId(sourceId);
    setToast({
      type: "success",
      message: `Moved ${movedRow.code} from row ${sourceIndex + 1} to row ${targetIndex + 1}.`
    });
    window.setTimeout(() => setHighlightedRowId(null), 1800);
  };

  const moveRow = (rowId: string, direction: -1 | 1) => {
    if (searchQuery.trim()) {
      setToast({ type: "warning", message: "Clear the search filter before reordering cards." });
      return;
    }
    const sourceIndex = currentRows.findIndex(row => row.id === rowId);
    const targetIndex = sourceIndex + direction;
    if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= currentRows.length) return;
    reorderRows(rowId, currentRows[targetIndex].id);
  };

  const toggleRowEnabled = (row: ExcelRow) => {
    const missingFields = getRequiredFieldErrors(row);
    if (!row.isEnabled && missingFields.length > 0) {
      setToast({ type: "error", message: `${row.code} cannot be enabled. Missing: ${missingFields.join(", ")}.` });
      return;
    }
    setExcelRowsMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(item =>
        item.id === row.id
          ? { ...item, isEnabled: !item.isEnabled, status: !item.isEnabled ? "ready" : "disabled" }
          : item
      )
    }));
    setIsDirty(true);
  };

  const handleTypeChange = (row: ExcelRow, type: ContentType) => {
    setExcelRowsMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(item =>
        item.id === row.id
          ? {
              ...item,
              type,
              code: getNextSystemCode(type, row.id),
              source: type === "guided_script" || type === "grammar" ? "\\" : item.source === "\\" ? "" : item.source,
              reading: type === "guided_script" || type === "grammar" ? "" : item.reading,
              status: "incomplete",
              isEnabled: false
            }
          : item
      )
    }));
    setIsDirty(true);
  };

  const saveDraft = () => {
    setIsDirty(false);
    setToast({ type: "success", message: `Draft saved for ${activeLessonCode}.` });
  };

  const submitLesson = () => {
    const invalidRows = currentRows.filter(row => row.isEnabled && getRequiredFieldErrors(row).length > 0);
    const duplicateCodes = currentRows.filter((row, index, rows) => rows.findIndex(item => item.code === row.code) !== index);
    const blockedAudio = currentRows.filter(row => row.isEnabled && ["failed", "outdated"].includes(row.ttsStatus));
    const failedHumanQa = currentRows.filter(row => row.isEnabled && row.qaStatus === "failed");
    if (invalidRows.length || duplicateCodes.length) {
      setToast({ type: "error", message: `Cannot submit: ${invalidRows.length} incomplete enabled row(s), ${duplicateCodes.length} duplicate code(s).` });
      return;
    }
    if (blockedAudio.length || failedHumanQa.length) {
      setToast({ type: "error", message: `Cannot submit: ${blockedAudio.length} failed/outdated audio row(s), ${failedHumanQa.length} failed Human QA row(s).` });
      return;
    }
    const incompleteLocale = nativeLocales.find(locale => getLocaleCoverage(locale.code) < 100);
    if (incompleteLocale) {
      setToast({ type: "error", message: `Cannot publish ${activeLessonCode}: ${incompleteLocale.label} localization coverage is ${getLocaleCoverage(incompleteLocale.code)}%.` });
      return;
    }
    setIsDirty(false);
    setToast({ type: "success", message: `${activeLessonCode} submitted successfully and is ready for review.` });
  };

  const generateMissingAudio = (ids?: string[]) => {
    const requestedIds = ids ? new Set(ids) : null;
    const missingRows = currentRows.filter(r =>
      (!requestedIds || requestedIds.has(r.id)) && ["draft", "failed", "outdated"].includes(r.ttsStatus)
    );
    if (missingRows.length === 0) {
      setToast({ type: "success", message: "All audio files have already been generated." });
      return;
    }
    missingRows.forEach(row => regenerateAudio(row.id));
    setToast({ type: "success", message: `Generating audio for ${missingRows.length} items...` });
  };

  const buildImportPreview = (rawRows: string[][]) => {
    const existingCodes = new Set(currentRows.map(row => row.code));
    return rawRows.map((cells, index): ImportPreviewRow => {
      const [code = "", sourceText = "", reading = "", meaningEn = "", meaningVn = "", meaningKr = "", meaningEs = ""] = cells.map(cell => cell.trim());
      const type = code ? inferContentType(code) : "invalid";
      const errors: string[] = [];
      if (!code) errors.push("Missing code");
      if (!code.startsWith(`${activeLessonCode}_`)) errors.push(`Code must start with ${activeLessonCode}_`);
      if (type !== "guided_script" && !sourceText) errors.push("Missing source text");
      if (!meaningEn && !meaningVn) errors.push(type === "guided_script" ? "Missing English script" : "Missing meaning");
      const duplicate = existingCodes.has(code) || rawRows.some((other, otherIndex) => otherIndex !== index && other[0]?.trim() === code);
      if (duplicate) errors.push("Duplicate code");
      return {
        rowNumber: index + 2,
        code,
        type,
        sourceText,
        reading,
        meaningEn,
        meaningVn,
        meaningKr,
        meaningEs,
        status: duplicate ? "duplicate" : errors.length ? "invalid" : "valid",
        errors
      };
    });
  };

  const hasValidImportSchema = (headers: string[]) => {
    const normalized = headers.map(header => String(header).toLowerCase().replace(/[\s_-]+/g, ""));
    return (
      normalized.some(header => ["code", "systemcode", "dataid"].includes(header)) &&
      normalized.some(header => ["source", "sourcetext", "script"].includes(header)) &&
      normalized.some(header => ["english", "meaningen", "en"].includes(header))
    );
  };

  const showInvalidImportSchema = () => {
    setImportPreview([{
      rowNumber: 1,
      code: "",
      type: "invalid",
      sourceText: "",
      reading: "",
      meaningEn: "",
      meaningVn: "",
      meaningKr: "",
      meaningEs: "",
      status: "invalid",
      errors: ["Invalid schema. Required columns: Code, Source, and English."]
    }]);
    setShowImportPreview(true);
  };

  const handleImportFile = async (file: File) => {
    setImportFileName(file.name);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as string[][];
      const rows: string[][] = jsonData.map(row => {
        const paddedRow = [...row, "", "", "", "", "", "", ""].slice(0, 7);
        return paddedRow.map(cell => String(cell).trim());
      }).filter(row => row.some(cell => cell !== ""));
      if (!hasValidImportSchema(rows[0] || [])) {
        showInvalidImportSchema();
        return;
      }
      setImportPreview(buildImportPreview(rows.slice(1)));
      setShowImportPreview(true);
      return;
    }
    if (file.name.toLowerCase().endsWith(".csv")) {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.text(), { type: "string" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" }) as string[][];
      if (!hasValidImportSchema(rows[0] || [])) {
        showInvalidImportSchema();
        return;
      }
      setImportPreview(buildImportPreview(rows.slice(1).map(row => row.map(cell => String(cell)))));
    } else {
      const sampleRows = [
        [`${activeLessonCode}_V99`, "示例", "shì lì", "example"],
        [`${activeLessonCode}_S99`, "这是示例", "zhè shì shì lì", "This is an example"],
        [`${activeLessonCode}_V99`, "重复", "chóng fù", "duplicate"],
        ["OTHER_L101_V1", "错误", "cuò wù", ""]
      ];
      setImportPreview(buildImportPreview(sampleRows));
    }
    setShowImportPreview(true);
  };

  const confirmImport = () => {
    const validRows = importPreview.filter(row => row.status === "valid");
    const importedRows: ExcelRow[] = validRows.map((row, index) => ({
      id: `import-${Date.now()}-${index}`,
      no: currentRows.length + index + 1,
      code: row.code,
      type: row.type === "invalid" ? "vocab" : row.type,
      source: row.type === "guided_script" || row.type === "grammar" ? "\\" : row.sourceText,
      reading: row.type === "guided_script" || row.type === "grammar" ? "" : row.reading,
      en: row.meaningEn,
      vn: row.meaningVn,
      kr: row.meaningKr,
      es: row.meaningEs,
      status: "ready",
      isEnabled: false,
      ttsStatus: "draft",
      scriptVersion: 1,
      audioVersion: 0,
      qaStatus: "pending",
      aiQaStatus: "pending"
    }));
    setExcelRowsMap(prev => ({
      ...prev,
      [activeLessonCode]: [...(prev[activeLessonCode] || []), ...importedRows]
    }));
    setShowImportPreview(false);
    setIsDirty(true);
    setToast({ type: "success", message: `Imported ${importedRows.length} valid row(s). Invalid and duplicate rows were skipped.` });
  };

  // ----------------------------------------------------
  // TAB 2: TUTOR & AUDIO QA ACTIONS (UC02 - Layer 3)
  // ----------------------------------------------------
  const updateQAStatus = (id: string, status: "passed" | "failed") => {
    const row = currentRows.find(item => item.id === id);
    if (!row || row.aiQaStatus !== "passed") {
      setToast({ type: "error", message: `${row?.code || "This row"} requires AI QA Pass before Human QA.` });
      return;
    }
    const reason = status === "failed"
      ? window.prompt("Reason for Human QA failure:", row.humanQaReason || "")?.trim()
      : "";
    if (status === "failed" && !reason) {
      setToast({ type: "warning", message: "A failure reason is required for Human QA Fail." });
      return;
    }
    setExcelRowsMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(item =>
        item.id === id ? { ...item, qaStatus: status, humanQaReason: reason || undefined } : item
      )
    }));
    setIsDirty(true);
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
          audioSource: "generated",
          audioVersion: (row.audioVersion || 0) + 1,
          aiQaStatus: "pending",
          qaStatus: "pending",
          audioUrl: "https://www.soundjay.com/buttons/sounds/button-3.mp3" 
        } : row)
      }));
    }, 1500);
  };

  const runAiQa = (ids: string[]) => {
    const eligibleIds = new Set(ids.filter(id => {
      const row = currentRows.find(item => item.id === id);
      return row?.ttsStatus === "success" && Boolean(row.audioUrl);
    }));
    if (eligibleIds.size === 0) {
      setToast({ type: "warning", message: "No selected row has a current audio revision ready for AI QA." });
      return;
    }
    setExcelRowsMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(row =>
        eligibleIds.has(row.id) ? { ...row, aiQaStatus: "passed", qaStatus: "pending" } : row
      )
    }));
    setIsDirty(true);
    setToast({ type: "success", message: `AI QA passed for ${eligibleIds.size} audio row(s).` });
  };

  const handleAudioFiles = (files: FileList) => {
    const allowedExtensions = new Set(["mp3", "m4a", "wav", "ogg"]);
    const seenCodes = new Set<string>();
    const matches = new Map<string, File>();
    let invalid = 0;
    let duplicate = 0;
    let unmatched = 0;

    Array.from(files).forEach(file => {
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      const code = file.name.replace(/\.[^.]+$/, "");
      if (!allowedExtensions.has(extension)) {
        invalid += 1;
      } else if (seenCodes.has(code)) {
        duplicate += 1;
      } else if (!currentRows.some(row => row.code === code)) {
        unmatched += 1;
      } else {
        seenCodes.add(code);
        matches.set(code, file);
      }
    });

    setExcelRowsMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(row => {
        const file = matches.get(row.code);
        return file
          ? {
              ...row,
              audioUrl: URL.createObjectURL(file),
              audioSource: "uploaded",
              audioVersion: (row.audioVersion || 0) + 1,
              ttsStatus: "success",
              aiQaStatus: "pending",
              qaStatus: "pending"
            }
          : row;
      })
    }));
    setIsDirty(matches.size > 0 || isDirty);
    setToast({
      type: matches.size > 0 ? "success" : "warning",
      message: `Matched ${matches.size} audio file(s). Unmatched: ${unmatched}, duplicate: ${duplicate}, invalid format: ${invalid}.`
    });
  };

  // ----------------------------------------------------
  // TAB 3: DRILL CONFIGURATION ACTIONS (UC03 - Layer 3)
  // ----------------------------------------------------
  const currentDrills = drillMap[activeLessonCode] || [];

  const handleDrillEdit = <K extends keyof DrillItem>(id: string, field: K, val: DrillItem[K]) => {
    setDrillMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].map(d => d.id === id ? { ...d, [field]: val } : d)
    }));
  };

  const addDrillFromExcel = (row: ExcelRow) => {
    const existing = currentDrills.find(drill => drill.sourceCode === row.code);
    if (existing) {
      setToast({ type: "warning", message: `${row.code} is already assigned to ${existing.assignment === "extra_drill" ? "Extra Drill" : "Drill"}. Remove it before reassigning.` });
      return;
    }
    const isVocab = row.code.includes("_V");
    const cleanText = row.source;
    
    drillIdRef.current += 1;
    const newDrill: DrillItem = {
      id: `dr-${drillIdRef.current}`,
      drillType: isVocab ? "listen_repeat" : "fill_blank",
      scriptText: cleanText,
      meaningEn: row.en,
      meaningVn: row.vn,
      meaningKr: row.kr,
      meaningEs: row.es,
      sourceCode: row.code,
      assignment: "drill"
    };
    
    setDrillMap(prev => ({
      ...prev,
      [activeLessonCode]: [...(prev[activeLessonCode] || []), newDrill]
    }));
    setIsDirty(true);
    setToast({ type: "success", message: `Added ${row.code} to Main Drill.` });
  };

  const deleteDrill = (id: string) => {
    setDrillMap(prev => ({
      ...prev,
      [activeLessonCode]: prev[activeLessonCode].filter(d => d.id !== id)
    }));
    setIsDirty(true);
  };

  const reorderDrills = (fromId: string, toId: string) => {
    setDrillMap(prev => {
      const arr = [...prev[activeLessonCode]];
      const fromIndex = arr.findIndex(d => d.id === fromId);
      const toIndex = arr.findIndex(d => d.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const [movedItem] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, movedItem);
      return { ...prev, [activeLessonCode]: arr };
    });
    setIsDirty(true);
  };

  const selectBlankToken = (drill: DrillItem, index: number) => {
    const pendingStart = blankSelectionStart[drill.id];
    if (pendingStart === undefined) {
      setBlankSelectionStart(prev => ({ ...prev, [drill.id]: index }));
      handleDrillEdit(drill.id, "blankStart", index);
      handleDrillEdit(drill.id, "blankEnd", index);
      handleDrillEdit(drill.id, "promptBefore", drill.scriptText.slice(0, index));
      handleDrillEdit(drill.id, "answer", drill.scriptText.slice(index, index + 1));
      handleDrillEdit(drill.id, "promptAfter", drill.scriptText.slice(index + 1));
      return;
    }
    const start = Math.min(pendingStart, index);
    const end = Math.max(pendingStart, index);
    handleDrillEdit(drill.id, "blankStart", start);
    handleDrillEdit(drill.id, "blankEnd", end);
    handleDrillEdit(drill.id, "promptBefore", drill.scriptText.slice(0, start));
    handleDrillEdit(drill.id, "answer", drill.scriptText.slice(start, end + 1));
    handleDrillEdit(drill.id, "promptAfter", drill.scriptText.slice(end + 1));
    setBlankSelectionStart(prev => ({ ...prev, [drill.id]: undefined }));
    setIsDirty(true);
  };

  const saveDrills = () => {
    const orphan = currentDrills.find(drill => !currentRows.some(row => row.code === drill.sourceCode));
    const invalidFillBlank = currentDrills.find(drill =>
      drill.drillType === "fill_blank" && (!drill.answer?.trim() || drill.blankStart === undefined || drill.blankEnd === undefined)
    );
    if (orphan) {
      setToast({ type: "error", message: `${orphan.sourceCode} is an orphan Drill item. Pick a valid Layer 2 source card.` });
      return;
    }
    if (invalidFillBlank) {
      setToast({ type: "error", message: `${invalidFillBlank.sourceCode} requires one contiguous blank token range.` });
      return;
    }
    setIsDirty(false);
    setToast({
      type: "success",
      message: `Saved ${currentDrills.filter(drill => drill.assignment !== "extra_drill").length} Drill and ${currentDrills.filter(drill => drill.assignment === "extra_drill").length} Extra Drill item(s).`
    });
  };

  // ----------------------------------------------------
  // TAB 4: ROLEPLAY SETUP ACTIONS (UC04 - Layer 3)
  // ----------------------------------------------------
  const currentRoleplay = roleplayMap[activeLessonCode] || {
    id: `roleplay-${activeLessonCode || "new"}`,
    lessonTitle: selectedLesson?.title || "",
    title: "",
    setup: "",
    goals: []
  };

  const addRoleplayGoal = () => {
    const newGoal: RoleplayGoal = {
      id: `g-${Date.now()}`,
      orderIndex: currentRoleplay.goals.length + 1,
      title: "",
      successCriteria: "",
      descriptionEn: "",
      descriptionNative: "",
      isEnabled: true
    };
    setRoleplayMap(prev => ({
      ...prev,
      [activeLessonCode]: {
        ...currentRoleplay,
        goals: [...currentRoleplay.goals, newGoal]
      }
    }));
    setIsDirty(true);
    window.setTimeout(() => goalEnglishRefs.current[newGoal.id]?.focus(), 80);
    setToast({ type: "success", message: `Added Roleplay Goal at row ${newGoal.orderIndex}.` });
  };

  const editRoleplayGoal = <K extends keyof RoleplayGoal>(goalId: string, field: K, val: RoleplayGoal[K]) => {
    setRoleplayMap(prev => ({
      ...prev,
      [activeLessonCode]: {
        ...currentRoleplay,
        goals: currentRoleplay.goals.map(g => g.id === goalId ? { ...g, [field]: val } : g)
      }
    }));
    setIsDirty(true);
  };

  const removeRoleplayGoal = (goalId: string) => {
    setRoleplayMap(prev => {
      const updatedGoals = currentRoleplay.goals.filter(g => g.id !== goalId);
      const reindexed = updatedGoals.map((g, idx) => ({ ...g, orderIndex: idx + 1 }));
      return {
        ...prev,
        [activeLessonCode]: {
          ...currentRoleplay,
          goals: reindexed
        }
      }
    });
    setIsDirty(true);
  };

  const reorderRoleplayGoal = (goalId: string, direction: "up" | "down") => {
    const index = currentRoleplay.goals.findIndex(g => g.id === goalId);
    if (index < 0) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === currentRoleplay.goals.length - 1) return;

    const newGoals = [...currentRoleplay.goals];
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    
    const temp = newGoals[index];
    newGoals[index] = newGoals[swapIndex];
    newGoals[swapIndex] = temp;
    
    const reindexed = newGoals.map((g, idx) => ({ ...g, orderIndex: idx + 1 }));

    setRoleplayMap(prev => ({
      ...prev,
      [activeLessonCode]: {
        ...currentRoleplay,
        goals: reindexed
      }
    }));
    setIsDirty(true);
  };

  const saveRoleplay = () => {
    const activeGoals = currentRoleplay.goals.filter(goal => goal.isEnabled);
    const invalidGoal = activeGoals.find(goal =>
      !(goal.title?.trim() || goal.successCriteria.trim()) ||
      !goal.descriptionEn.trim() ||
      !goal.successCriteria.trim()
    );
    if (!currentRoleplay.title?.trim() || !currentRoleplay.setup?.trim()) {
      setToast({ type: "error", message: "Roleplay requires a mobile title and context description." });
      return;
    }
    if (activeGoals.length === 0 || invalidGoal) {
      setToast({ type: "error", message: "Roleplay requires at least one enabled goal with title, English description and success criteria." });
      return;
    }
    setRoleplayMap(prev => ({
      ...prev,
      [activeLessonCode]: {
        ...currentRoleplay,
        lessonTitle: selectedLesson?.title || currentRoleplay.lessonTitle || ""
      }
    }));
    setIsDirty(false);
    setToast({ type: "success", message: `Roleplay configured with ${activeGoals.length} active goal(s).` });
  };

  // Filtered rows for Excel Sheet View
  const filteredRows = currentRows.filter(row => {
    return (
      row.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.reading.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.en.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const activeLanguage = mockLanguages.find(language => language.code === selectedLanguageCode);

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
              <p className="text-[9px] text-stone-800 font-semibold tracking-wider uppercase">Curriculum Engine</p>
            </div>
          </div>

          {/* Learning Language Selector */}
          <div className="p-4 border-b border-stone-100 bg-stone-50/40">
            <label className="block text-[9px] text-stone-800 uppercase font-bold tracking-wider mb-2">
              Learning Language
            </label>
            <div className="relative">
              <select 
                value={selectedLanguageCode} 
                onChange={(e) => {
                  const languageCode = e.target.value;
                  setSelectedLanguageCode(languageCode);
                  setSelectedLesson(mockLessons[languageCode]?.[0] || null);
                  setSelectedRowIds(new Set());
                  setIsDirty(false);
                }}
                className="w-full bg-white border border-stone-200 rounded-xl py-2 pl-3 pr-8 text-xs text-stone-855 font-medium focus:outline-none focus:border-stone-400 transition-colors duration-200 cursor-pointer appearance-none"
              >
                {mockLanguages.map((language) => (
                  <option key={language.id} value={language.code}>
                    {language.flag} {language.name} ({language.script})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-stone-800">
                <Globe size={12} />
              </div>
            </div>
          </div>

          {/* Lessons list */}
          <div className="p-4">
            <div className="text-[9px] text-stone-800 uppercase font-bold tracking-wider mb-2 px-1">
              Select Lesson
            </div>
            <div className="space-y-1">
              {(mockLessons[selectedLanguageCode] || []).map((lesson) => {
                const isSelected = selectedLesson?.id === lesson.id;
                return (
                  <button
                    key={lesson.id}
                    onClick={() => {
                      setSelectedLesson(lesson);
                      setSelectedRowIds(new Set());
                      setIsDirty(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 cursor-pointer relative group flex items-start space-x-3 ${
                      isSelected 
                        ? "bg-[#F8F7F5] border-stone-200/80" 
                        : "hover:bg-stone-50 border-transparent"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-mono font-bold text-stone-800">{lesson.lessonCode}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-semibold border ${statusStyles[lesson.status]}`}>
                          {lesson.status.replace("_", " ")}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-stone-800 truncate group-hover:text-stone-800 font-serif">{lesson.title}</h4>
                      <p className="text-[10px] text-stone-800 truncate mt-0.5">{lesson.description}</p>
                      <div className="mt-2 flex items-center justify-between text-[9px] text-stone-800">
                        <span>Localization coverage</span>
                        <span className={lesson.localizationCoverage === 100 ? "text-emerald-700 font-semibold" : "text-amber-700 font-semibold"}>
                          {lesson.localizationCoverage}%
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/30 flex items-center justify-between text-[10px] text-stone-800">
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
              <div className="text-[9px] font-mono text-stone-800 uppercase font-bold tracking-wider">Active Workspace</div>
              <h2 className="text-xl font-medium font-serif text-stone-800 flex items-center space-x-2 mt-0.5">
                <span>{selectedLesson ? selectedLesson.title : "No Lesson Selected"}</span>
                <span className="text-xs font-mono font-normal bg-stone-50 border border-stone-200/60 py-0.5 px-2 rounded text-stone-800">
                  {activeLessonCode}
                </span>
              </h2>
            </div>
            
            {/* Quick Stats Summary */}
            <div className="flex space-x-6 text-xs bg-stone-50/80 p-2 rounded-xl border border-stone-200/60">
              <div className="flex flex-col">
                <span className="text-[9px] text-stone-800 uppercase font-bold">Total Rows</span>
                <span className="text-xs font-bold text-stone-800">{currentRows.length}</span>
              </div>
              <span className="w-px bg-stone-200 my-1"></span>
              <div className="flex flex-col">
                <span className="text-[9px] text-stone-800 uppercase font-bold">Vocabs / Sentences</span>
                <span className="text-xs font-bold text-stone-800">
                  {currentRows.filter(r => r.code.includes("_V") || r.code.includes("_S")).length}
                </span>
              </div>
              <span className="w-px bg-stone-200 my-1"></span>
              <div className="flex flex-col">
                <span className="text-[9px] text-stone-800 uppercase font-bold">Audio Ready</span>
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
                  : "border-transparent text-stone-800 hover:text-stone-850"
              }`}
            >
              <Grid size={12} />
              <span>Curriculum & Audio QA (UC01 + UC02)</span>
            </button>
            
            <button
              onClick={() => setActiveTab("drills")}
              className={`pb-3 px-4 font-serif font-medium text-xs border-b-2 transition-colors duration-200 flex items-center space-x-1.5 cursor-pointer ${
                activeTab === "drills"
                  ? "border-stone-800 text-stone-800 font-semibold"
                  : "border-transparent text-stone-800 hover:text-stone-850"
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
                  : "border-transparent text-stone-800 hover:text-stone-850"
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
              
              <div className="flex justify-between items-start gap-6 bg-white p-6 border border-stone-200/80 rounded-2xl">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-stone-800 font-serif">Curriculum & Language Editor</h3>
                    {isDirty && (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700">
                        Unsaved changes
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-800 mt-0.5 font-sans">
                    {activeLanguage?.name} lesson source data mapped to Guided Script, Vocab, Sentence and Grammar entities.
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-[10px] text-stone-800">
                    <span className="font-mono">{activeLessonCode}</span>
                    <ChevronRight size={10} />
                    <span>{currentRows.filter(row => row.isEnabled).length}/{currentRows.length} enabled</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {nativeLocales.map(locale => {
                      const coverage = getLocaleCoverage(locale.code);
                      return (
                        <span key={locale.code} className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${
                          coverage === 100
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}>
                          {locale.code.toUpperCase()} {coverage}%
                        </span>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex flex-wrap justify-end gap-2 text-xs font-sans">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleImportFile(file);
                      event.target.value = "";
                    }}
                  />
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept=".mp3,.m4a,.wav,.ogg,audio/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      if (event.target.files?.length) handleAudioFiles(event.target.files);
                      event.target.value = "";
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-700 transition-colors hover:bg-stone-50"
                  >
                    <FileSpreadsheet size={12} />
                    <span>Import Curriculum</span>
                  </button>
                  <button
                    onClick={saveDraft}
                    disabled={!isDirty}
                    className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Save size={12} />
                    <span>Save Draft</span>
                  </button>
                  <button
                    onClick={() => generateMissingAudio(selectedRowIds.size ? Array.from(selectedRowIds) : undefined)}
                    className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-700 transition-colors hover:bg-stone-50"
                  >
                    <Volume2 size={12} />
                    <span>{selectedRowIds.size ? `Generate Selected (${selectedRowIds.size})` : "Generate Missing Audio"}</span>
                  </button>
                  <button
                    onClick={() => audioInputRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-700 transition-colors hover:bg-stone-50"
                  >
                    <Upload size={12} />
                    <span>Upload Audio</span>
                  </button>
                  <button
                    onClick={() => runAiQa(selectedRowIds.size ? Array.from(selectedRowIds) : currentRows.map(row => row.id))}
                    className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 font-medium text-stone-700 transition-colors hover:bg-stone-50"
                  >
                    <Sparkles size={12} />
                    <span>AI QA {selectedRowIds.size ? `Selected (${selectedRowIds.size})` : "Ready"}</span>
                  </button>
                  <button
                    onClick={submitLesson}
                    className="flex items-center gap-1.5 rounded-lg border border-stone-800 bg-stone-800 px-3 py-1.5 font-medium text-white transition-colors hover:bg-stone-700"
                  >
                    <CheckCircle2 size={12} />
                    <span>Submit Lesson</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center gap-4 rounded-2xl border border-stone-200/80 bg-white p-4">
                <div className="flex flex-wrap gap-2 text-xs font-sans">
                  <button 
                    onClick={() => addExcelRow("tutor")}
                    className="bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 py-1.5 px-3 rounded-lg font-medium cursor-pointer transition-colors duration-200 flex items-center space-x-1"
                  >
                    <span>Tutor Card</span>
                  </button>
                  <button 
                    onClick={() => addExcelRow("vocab")}
                    className="bg-stone-800 text-white hover:bg-stone-700 py-1.5 px-3 rounded-lg font-medium cursor-pointer transition-colors duration-200 flex items-center space-x-1 border border-stone-800"
                  >
                    <span>Vocab Card</span>
                  </button>
                  <button 
                    onClick={() => addExcelRow("sentence")}
                    className="bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 py-1.5 px-3 rounded-lg font-medium cursor-pointer transition-colors duration-200 flex items-center space-x-1"
                  >
                    <span>Sentence Card</span>
                  </button>
                  <button 
                    onClick={() => addExcelRow("grammar")}
                    className="bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 py-1.5 px-3 rounded-lg font-medium cursor-pointer transition-colors duration-200 flex items-center space-x-1"
                  >
                    <span>Grammar Card</span>
                  </button>
                </div>
                <p className="max-w-md text-right text-[10px] leading-relaxed text-stone-800">
                  System codes are generated from the lesson and content type. A record can only be enabled after all required fields are complete.
                </p>
              </div>

              {/* Search / Toolbar */}
              <div className="flex justify-between items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-800 my-auto" size={13} />
                  <input
                    type="text"
                    placeholder="Search spreadsheet cells..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border border-stone-200 rounded-lg py-2 pl-9 pr-4 text-xs text-stone-800 focus:outline-none focus:border-stone-400 focus:ring-0 transition-colors duration-200"
                  />
                </div>
                
                <span className="text-[11px] text-stone-800 italic font-serif">
                  {searchQuery.trim()
                    ? "Clear search to reorder cards."
                    : "Drag the handle or use arrows to change card order."}
                </span>
              </div>

              {/* Spreadsheet Grid (Editorial styling) */}
              <div className="bg-white border border-stone-200/80 rounded-2xl overflow-x-auto shadow-none">
                <table className="w-full min-w-[1900px] text-left border-collapse text-xs table-fixed">
                  <thead>
                    <tr className="border-b border-stone-200 text-[10px] text-stone-800 uppercase font-semibold tracking-wider bg-stone-50/50">
                      <th className="py-4 px-3 w-12 text-center font-serif">
                        <input
                          type="checkbox"
                          aria-label="Select all curriculum rows"
                          checked={currentRows.length > 0 && selectedRowIds.size === currentRows.length}
                          onChange={event => {
                            setSelectedRowIds(event.target.checked ? new Set(currentRows.map(row => row.id)) : new Set());
                          }}
                        />
                      </th>
                      <th className="py-4 px-4 w-20 text-center font-serif">Order</th>
                      <th className="py-4 px-4 w-32 font-serif">Content Type</th>
                      <th className="py-4 px-4 w-36 font-serif">System Code</th>
                      <th className="py-4 px-4 w-40 font-serif">Source</th>
                      <th className="py-4 px-4 w-40 font-serif">Reading</th>
                      <th className="py-4 px-4 w-56 font-serif">English (Script)</th>
                      <th className="py-4 px-4 w-48 font-serif">Vietnamese</th>
                      <th className="py-4 px-4 w-48 font-serif">Korean</th>
                      <th className="py-4 px-4 w-48 font-serif">Spanish</th>
                      <th className="py-4 px-4 w-28 text-center font-serif">Audio</th>
                      <th className="py-4 px-4 w-24 text-center font-serif">AI QA</th>
                      <th className="py-4 px-4 w-24 text-center font-serif">Human QA</th>
                      <th className="py-4 px-4 w-28 font-serif">Status</th>
                      <th className="py-4 px-4 w-20 text-center font-serif">Enabled</th>
                      <th className="py-4 px-4 w-24 text-center font-serif">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-sans">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={16} className="py-8 text-center text-stone-600 italic">No curriculum records configured.</td>
                      </tr>
                    ) : (
                      filteredRows.map((row) => {
                        const contentType = row.type || inferContentType(row.code);
                        const isTutor = contentType === "guided_script";
                        const rowStatus = getRowStatus(row);
                        const requiredErrors = getRequiredFieldErrors(row);
                        return (
                          <tr
                            key={row.id}
                            ref={element => { rowRefs.current[row.id] = element; }}
                            onDragOver={event => {
                              if (searchQuery.trim()) return;
                              event.preventDefault();
                              if (draggedRowId && draggedRowId !== row.id) setDragOverRowId(row.id);
                            }}
                            onDragLeave={() => {
                              if (dragOverRowId === row.id) setDragOverRowId(null);
                            }}
                            onDrop={event => {
                              event.preventDefault();
                              if (draggedRowId) reorderRows(draggedRowId, row.id);
                              setDraggedRowId(null);
                              setDragOverRowId(null);
                            }}
                            className={`transition-colors duration-500 ${
                              dragOverRowId === row.id
                                ? "bg-sky-50 ring-2 ring-inset ring-sky-300"
                                : highlightedRowId === row.id
                                  ? "bg-amber-50 ring-1 ring-inset ring-amber-200"
                                  : "hover:bg-stone-50/30"
                            } ${draggedRowId === row.id ? "opacity-50" : ""}`}
                          >
                            <td className="py-4 px-3 text-center align-top">
                              <input
                                type="checkbox"
                                aria-label={`Select ${row.code}`}
                                checked={selectedRowIds.has(row.id)}
                                onChange={event => {
                                  setSelectedRowIds(previous => {
                                    const next = new Set(previous);
                                    if (event.target.checked) next.add(row.id);
                                    else next.delete(row.id);
                                    return next;
                                  });
                                }}
                              />
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  draggable={!searchQuery.trim()}
                                  onDragStart={event => {
                                    if (searchQuery.trim()) {
                                      event.preventDefault();
                                      return;
                                    }
                                    event.dataTransfer.effectAllowed = "move";
                                    setDraggedRowId(row.id);
                                  }}
                                  onDragEnd={() => {
                                    setDraggedRowId(null);
                                    setDragOverRowId(null);
                                  }}
                                  title={searchQuery.trim() ? "Clear search to reorder" : "Drag to reorder"}
                                  className="cursor-grab rounded p-1 text-stone-600 hover:bg-stone-100 hover:text-stone-700 active:cursor-grabbing disabled:cursor-not-allowed"
                                >
                                  <GripVertical size={13} />
                                </button>
                                <span className="min-w-5 text-center font-mono text-stone-800">{row.no}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <select
                                value={contentType}
                                onChange={event => handleTypeChange(row, event.target.value as ContentType)}
                                className="w-full rounded-lg border border-stone-200 bg-white px-2 py-1.5 text-[11px] font-medium text-stone-700 focus:border-stone-400 focus:outline-none"
                              >
                                <option value="guided_script">Guided Script</option>
                                <option value="vocab">Vocab</option>
                                <option value="sentence">Sentence</option>
                                <option value="grammar">Grammar</option>
                              </select>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1.5 rounded-lg border border-stone-100 bg-stone-50 px-2 py-1.5 font-mono text-[11px] font-semibold text-stone-700">
                                <Lock size={10} className="shrink-0 text-stone-600" />
                                <span className="truncate">{row.code}</span>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <input 
                                ref={element => { if (!isTutor) firstFieldRefs.current[row.id] = element; }}
                                type="text"
                                value={row.source}
                                onChange={(e) => handleCellEdit(row.id, "source", e.target.value)}
                                disabled={isTutor}
                                placeholder={isTutor ? "Not applicable" : "Source text"}
                                className={`w-full bg-transparent border border-transparent hover:border-stone-200 focus:border-stone-400 focus:ring-0 rounded-lg px-2 py-1 text-xs focus:outline-none font-medium transition-colors duration-200 ${
                                  isTutor ? "text-stone-600 font-mono italic cursor-not-allowed" : "text-stone-800"
                                }`}
                              />
                            </td>
                            <td className="py-4 px-4">
                              <input 
                                type="text"
                                value={row.reading}
                                onChange={(e) => handleCellEdit(row.id, "reading", e.target.value)}
                                disabled={isTutor}
                                placeholder={isTutor ? "Not applicable" : "Reading / Pinyin"}
                                className={`w-full bg-transparent border border-transparent hover:border-stone-200 focus:border-stone-400 focus:ring-0 rounded-lg px-2 py-1 text-xs focus:outline-none font-medium transition-colors duration-200 ${
                                  isTutor ? "text-stone-600 font-mono italic cursor-not-allowed" : "text-stone-800"
                                }`}
                              />
                            </td>
                            <td className="py-4 px-4">
                              <textarea
                                ref={element => { if (isTutor) firstFieldRefs.current[row.id] = element; }}
                                value={row.en}
                                onChange={(e) => handleCellEdit(row.id, "en", e.target.value)}
                                placeholder={isTutor ? "Required: English guided script" : "Optional: Meaning"}
                                className={`w-full bg-transparent border border-transparent hover:border-stone-200 focus:border-stone-400 focus:ring-0 rounded-lg px-2 py-1 text-xs focus:outline-none leading-relaxed resize-none transition-colors duration-200 ${
                                  isTutor ? "text-stone-800 font-serif" : "text-stone-800"
                                }`}
                                rows={isTutor && row.en.length > 80 ? 3 : 1}
                              />
                            </td>
                            <td className="py-4 px-4">
                              <textarea
                                value={row.vn}
                                onChange={(e) => handleCellEdit(row.id, "vn", e.target.value)}
                                placeholder={isTutor ? "Optional: Vi translation" : "Optional: Meaning"}
                                className={`w-full bg-transparent border border-transparent hover:border-stone-200 focus:border-stone-400 focus:ring-0 rounded-lg px-2 py-1 text-xs focus:outline-none leading-relaxed resize-none transition-colors duration-200 ${
                                  isTutor ? "text-stone-800 font-serif" : "text-stone-800"
                                }`}
                                rows={isTutor && row.vn.length > 80 ? 3 : 1}
                              />
                            </td>
                            <td className="py-4 px-4">
                              <textarea
                                value={row.kr}
                                onChange={(e) => handleCellEdit(row.id, "kr", e.target.value)}
                                placeholder={isTutor ? "Optional: Kr translation" : "Optional: Meaning"}
                                className={`w-full bg-transparent border border-transparent hover:border-stone-200 focus:border-stone-400 focus:ring-0 rounded-lg px-2 py-1 text-xs focus:outline-none leading-relaxed resize-none transition-colors duration-200 ${
                                  isTutor ? "text-stone-800 font-serif" : "text-stone-800"
                                }`}
                                rows={isTutor && row.kr.length > 80 ? 3 : 1}
                              />
                            </td>
                            <td className="py-4 px-4">
                              <textarea
                                value={row.es}
                                onChange={(e) => handleCellEdit(row.id, "es", e.target.value)}
                                placeholder={isTutor ? "Optional: Es translation" : "Optional: Meaning"}
                                className={`w-full bg-transparent border border-transparent hover:border-stone-200 focus:border-stone-400 focus:ring-0 rounded-lg px-2 py-1 text-xs focus:outline-none leading-relaxed resize-none transition-colors duration-200 ${
                                  isTutor ? "text-stone-800 font-serif" : "text-stone-800"
                                }`}
                                rows={isTutor && row.es.length > 80 ? 3 : 1}
                              />
                            </td>
                            <td className="py-4 px-4 align-top">
                              <div className="flex flex-col items-center gap-1.5">
                                {row.ttsStatus === "success" && row.audioUrl && (
                                  <MiniAudioPlayer url={row.audioUrl} />
                                )}
                                {row.ttsStatus === "generating" && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-bold animate-pulse">
                                    <Loader2 size={10} className="mr-1 animate-spin" />
                                    Generating
                                  </span>
                                )}
                                {row.ttsStatus === "outdated" && (
                                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                                    Outdated
                                  </span>
                                )}
                                {(["draft", "failed", "outdated"] as ExcelRow["ttsStatus"][]).includes(row.ttsStatus) && (
                                  <button
                                    onClick={() => regenerateAudio(row.id)}
                                    className={`p-1.5 rounded-lg border transition-colors duration-200 cursor-pointer ${
                                      row.ttsStatus === "failed" ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-white border-stone-200 text-stone-800 hover:bg-stone-50"
                                    }`}
                                    title="Generate Audio"
                                  >
                                    <RotateCw size={11} />
                                  </button>
                                )}
                                <span className="text-[8px] text-stone-500">
                                  {row.audioSource || "none"} · script v{row.scriptVersion || 1} / audio v{row.audioVersion || 0}
                                </span>
                              </div>
                            </td>
                            
                            <td className="py-4 px-4 align-top text-center">
                              {row.aiQaStatus === "passed" && <span className="inline-flex items-center text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[9px] border border-emerald-100"><CheckCircle2 size={10} className="mr-1" />Pass</span>}
                              {row.aiQaStatus === "failed" && <span className="inline-flex items-center text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded text-[9px] border border-rose-100"><XCircle size={10} className="mr-1" />Fail</span>}
                              {(!row.aiQaStatus || row.aiQaStatus === "pending") && <span className="text-[9px] text-stone-600 font-mono italic">Pending</span>}
                            </td>

                            <td className="py-4 px-4 align-top">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => updateQAStatus(row.id, "passed")}
                                  disabled={row.aiQaStatus !== "passed"}
                                  className={`p-1.5 rounded-lg transition-colors duration-200 cursor-pointer border ${
                                    row.qaStatus === "passed"
                                      ? "bg-[#C27A5C] border-[#C27A5C] text-white"
                                      : "bg-white border-stone-200 text-stone-600 hover:text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-30"
                                  }`}
                                  title="Pass Human QA"
                                >
                                  <Check size={11} />
                                </button>
                                <button
                                  onClick={() => updateQAStatus(row.id, "failed")}
                                  disabled={row.aiQaStatus !== "passed"}
                                  className={`p-1.5 rounded-lg transition-colors duration-200 cursor-pointer border ${
                                    row.qaStatus === "failed"
                                      ? "bg-stone-800 border-stone-800 text-white"
                                      : "bg-white border-stone-200 text-stone-600 hover:text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-30"
                                  }`}
                                  title="Fail Human QA"
                                >
                                  <X size={11} />
                                </button>
                              </div>
                              {row.humanQaReason && <p className="mt-1 text-[8px] leading-tight text-rose-600">{row.humanQaReason}</p>}
                            </td>

                            <td className="py-4 px-4 align-top">
                              <span className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-wide ${statusStyles[rowStatus]}`}>
                                {rowStatus.replace("_", " ")}
                              </span>
                              {requiredErrors.length > 0 && (
                                <p className="mt-1.5 text-[9px] leading-relaxed text-rose-600">
                                  Missing: {requiredErrors.join(", ")}
                                </p>
                              )}
                            </td>
                            <td className="py-4 px-4 text-center align-top">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={Boolean(row.isEnabled)}
                                onClick={() => toggleRowEnabled(row)}
                                className={`relative mt-0.5 inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                  row.isEnabled ? "bg-emerald-600" : "bg-stone-300"
                                }`}
                              >
                                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${row.isEnabled ? "translate-x-[18px]" : "translate-x-1"}`} />
                              </button>
                            </td>
                            <td className="py-4 px-4 align-top">
                              <div className="flex items-center justify-center gap-0.5">
                                <button
                                  onClick={() => moveRow(row.id, -1)}
                                  disabled={searchQuery.trim().length > 0 || currentRows.findIndex(item => item.id === row.id) === 0}
                                  title="Move up"
                                  className="rounded-lg p-1.5 text-stone-800 hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-25"
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <button
                                  onClick={() => moveRow(row.id, 1)}
                                  disabled={searchQuery.trim().length > 0 || currentRows.findIndex(item => item.id === row.id) === currentRows.length - 1}
                                  title="Move down"
                                  className="rounded-lg p-1.5 text-stone-800 hover:bg-stone-100 hover:text-stone-800 disabled:cursor-not-allowed disabled:opacity-25"
                                >
                                  <ArrowDown size={12} />
                                </button>
                                <button 
                                  onClick={() => deleteExcelRow(row.id)}
                                  title="Delete record"
                                  className="p-1.5 text-stone-800 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors duration-200 cursor-pointer"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
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

          {/* UC03: Drill Config */}
          {activeTab === "drills" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-stone-200/80 bg-white p-5">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-stone-800 font-serif">Layer 2 Source Assignment</h4>
                    <p className="mt-1 text-[10px] text-stone-600">Each source card can belong to Main Drill or Extra Drill, never both.</p>
                  </div>
                  <button onClick={saveDrills} className="flex items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-2 text-xs font-semibold text-white hover:bg-stone-700">
                    <Save size={12} />
                    <span>Save Drill Configuration</span>
                  </button>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[800px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-200 text-[9px] font-semibold uppercase tracking-wide text-stone-500">
                        <th className="px-3 py-2">Source Code</th>
                        <th className="px-3 py-2">Source Content</th>
                        <th className="px-3 py-2">Assignment</th>
                        <th className="px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {currentRows
                        .filter(row => ["vocab", "sentence"].includes(row.type || inferContentType(row.code)))
                        .map(row => {
                          const assignment = currentDrills.find(drill => drill.sourceCode === row.code);
                          return (
                            <tr key={`assignment-${row.id}`}>
                              <td className="px-3 py-2 font-mono font-semibold text-stone-700">{row.code}</td>
                              <td className="max-w-md truncate px-3 py-2 text-stone-700">{row.source}</td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-semibold ${
                                  assignment?.assignment === "extra_drill"
                                    ? "border-violet-200 bg-violet-50 text-violet-700"
                                    : assignment
                                      ? "border-sky-200 bg-sky-50 text-sky-700"
                                      : "border-stone-200 bg-stone-50 text-stone-500"
                                }`}>
                                  {assignment?.assignment === "extra_drill" ? "Extra Drill" : assignment ? "Main Drill" : "Not Added"}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right">
                                {assignment ? (
                                  <button onClick={() => deleteDrill(assignment.id)} className="rounded-lg border border-stone-200 px-2 py-1 text-[10px] text-stone-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
                                    Remove assignment
                                  </button>
                                ) : (
                                  <button onClick={() => addDrillFromExcel(row)} className="rounded-lg bg-stone-800 px-2 py-1 text-[10px] font-semibold text-white hover:bg-stone-700">
                                    Add to Main Drill
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

            <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-none">
              <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                <div>
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wide font-serif">Drill Configuration Table</h4>
                  <p className="text-[10px] text-stone-800 mt-1">Configure exercises for each vocabulary/sentence. A row must be added as a Drill to configure its type and script.</p>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
                <table className="w-full min-w-[1400px] text-left border-collapse text-xs table-fixed">
                  <thead>
                    <tr className="border-b border-stone-200 text-[10px] text-stone-800 uppercase font-semibold tracking-wider bg-stone-50/50 sticky top-0 z-10">
                      <th className="py-3 px-4 w-32 font-serif">Source</th>
                      <th className="py-3 px-4 w-24 text-center font-serif">Action</th>
                      <th className="py-3 px-4 w-32 font-serif">Assignment</th>
                      <th className="py-3 px-4 w-40 font-serif">Drill Type</th>
                      <th className="py-3 px-4 w-48 font-serif">Target Script</th>
                      <th className="py-3 px-4 w-40 font-serif">Meaning (EN)</th>
                      <th className="py-3 px-4 w-40 font-serif">Meaning (VN)</th>
                      <th className="py-3 px-4 w-40 font-serif">Meaning (KR)</th>
                      <th className="py-3 px-4 w-40 font-serif">Meaning (ES)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* ADDED DRILLS (with Drag and Drop) */}
                    {currentDrills.map((drill) => {
                      const row = currentRows.find(r => r.code === drill.sourceCode);
                      const isFillBlank = drill.drillType === "fill_blank";

                      return (
                        <React.Fragment key={drill.id}>
                          <tr 
                            className={`border-b border-stone-100 transition-colors duration-150 bg-white hover:bg-stone-50/50 ${draggedRowId === drill.id ? "opacity-50" : ""}`}
                            onDragOver={event => {
                              if (searchQuery.trim() || !draggedRowId || draggedRowId === drill.id) return;
                              event.preventDefault();
                              event.dataTransfer.dropEffect = "move";
                              setDragOverRowId(drill.id);
                            }}
                            onDragLeave={() => setDragOverRowId(null)}
                            onDrop={event => {
                              event.preventDefault();
                              if (!draggedRowId || draggedRowId === drill.id) return;
                              reorderDrills(draggedRowId, drill.id);
                              setDraggedRowId(null);
                              setDragOverRowId(null);
                            }}
                            style={{
                              borderTop: dragOverRowId === drill.id ? "2px solid #C27A5C" : undefined
                            }}
                          >
                            {/* Source */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  draggable={!searchQuery.trim()}
                                  onDragStart={event => {
                                    if (searchQuery.trim()) {
                                      event.preventDefault();
                                      return;
                                    }
                                    event.dataTransfer.effectAllowed = "move";
                                    setDraggedRowId(drill.id);
                                  }}
                                  onDragEnd={() => {
                                    setDraggedRowId(null);
                                    setDragOverRowId(null);
                                  }}
                                  title={searchQuery.trim() ? "Clear search to reorder" : "Drag to reorder"}
                                  className="cursor-grab rounded p-1 text-stone-600 hover:bg-stone-100 hover:text-stone-700 active:cursor-grabbing disabled:cursor-not-allowed"
                                >
                                  <GripVertical size={13} />
                                </button>
                                <span className="font-mono text-[10px] font-bold bg-stone-100 py-1 px-2 rounded-lg border border-stone-200 text-stone-900 truncate block text-center w-full">
                                  {drill.sourceCode}
                                </span>
                              </div>
                            </td>

                            {/* Action */}
                            <td className="py-3 px-4 text-center">
                              <button 
                                onClick={() => deleteDrill(drill.id)}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer inline-flex"
                                title="Remove Drill"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>

                            {/* Assignment */}
                            <td className="py-3 px-4">
                              <select
                                value={drill.assignment || "drill"}
                                onChange={(e) => handleDrillEdit(drill.id, "assignment", e.target.value as DrillItem["assignment"])}
                                className="w-full bg-white border border-[#C27A5C]/30 rounded-lg py-1 px-2 text-[11px] text-stone-800 focus:outline-none focus:border-[#C27A5C] font-semibold text-[#C27A5C]"
                              >
                                <option value="drill">Main Drill</option>
                                <option value="extra_drill">Extra Drill</option>
                              </select>
                            </td>

                            {/* Drill Type */}
                            <td className="py-3 px-4">
                              <select
                                value={drill.drillType}
                                onChange={(e) => handleDrillEdit(drill.id, "drillType", e.target.value as DrillItem["drillType"])}
                                className="w-full bg-white border border-stone-200 rounded-lg py-1 px-2 text-[11px] text-stone-800 focus:outline-none focus:border-stone-400"
                              >
                                <option value="listen_repeat">Listen & Repeat</option>
                                <option value="fill_blank">Fill in the Blank</option>
                                <option value="sentence_order">Sentence Ordering</option>
                              </select>
                            </td>

                            {/* Target Script */}
                            <td className="py-3 px-4">
                              <div className="space-y-2">
                                <div className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-bold text-stone-800">
                                  {row?.source || drill.scriptText || "Orphan source"}
                                </div>
                                {drill.drillType === "sentence_order" && (
                                  <p className="text-[9px] text-stone-500">Tokens are derived automatically from the source sentence.</p>
                                )}
                              </div>
                            </td>

                            {/* Meaning EN */}
                            <td className="py-3 px-4">
                              <div className="rounded-lg border border-stone-100 bg-stone-50 px-2 py-1 text-[11px] text-stone-700">{row?.en || drill.meaningEn || "-"}</div>
                            </td>

                            {/* Meaning VN */}
                            <td className="py-3 px-4">
                              <div className="rounded-lg border border-stone-100 bg-stone-50 px-2 py-1 text-[11px] text-stone-700">{row?.vn || drill.meaningVn || "-"}</div>
                            </td>

                            {/* Meaning KR */}
                            <td className="py-3 px-4">
                              <div className="rounded-lg border border-stone-100 bg-stone-50 px-2 py-1 text-[11px] text-stone-700">{row?.kr || drill.meaningKr || "-"}</div>
                            </td>

                            {/* Meaning ES */}
                            <td className="py-3 px-4">
                              <div className="rounded-lg border border-stone-100 bg-stone-50 px-2 py-1 text-[11px] text-stone-700">{row?.es || drill.meaningEs || "-"}</div>
                            </td>
                          </tr>

                          {/* Fill Blank Logic Row */}
                          {isFillBlank && (
                            <tr className="border-b border-stone-100 bg-stone-50/80">
                              <td colSpan={9} className="py-4 px-4 pl-16">
                                <div className="bg-white border border-stone-200/80 rounded-xl p-4 space-y-3 shadow-sm max-w-3xl">
                                  <div className="text-[10px] text-stone-800 font-semibold flex items-center space-x-1 font-serif">
                                    <Info size={11} className="text-stone-800" />
                                    <span>Fill-in-the-blank Token Selection</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1 p-3 bg-stone-50/50 rounded-lg border border-stone-200/60">
                                    {Array.from(row?.source || drill.scriptText).map((char, idx) => {
                                      const isSelected = drill.blankStart !== undefined && drill.blankEnd !== undefined && idx >= drill.blankStart && idx <= drill.blankEnd;
                                      
                                      return (
                                        <button
                                          key={idx}
                                          onClick={() => selectBlankToken({ ...drill, scriptText: row?.source || drill.scriptText }, idx)}
                                          className={`px-2 py-1 rounded-md text-sm transition-colors duration-200 cursor-pointer ${
                                            isSelected 
                                              ? "bg-[#C27A5C] text-white font-bold shadow-sm" 
                                              : "bg-white text-stone-700 border border-stone-200 hover:border-[#C27A5C] hover:text-[#C27A5C]"
                                          }`}
                                        >
                                          {char}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div className="text-[10px] text-stone-800 italic">
                                    Click the first and last character of one contiguous blank range. Click once for a single-character blank.
                                  </div>
                                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-stone-100">
                                    <div>
                                      <label className="block text-[8px] text-stone-800 uppercase font-semibold mb-0.5">Prompt Before</label>
                                      <div className="bg-transparent border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs w-full text-stone-800 bg-stone-50">{drill.promptBefore || "-"}</div>
                                    </div>
                                    <div>
                                      <label className="block text-[8px] text-[#C27A5C] uppercase font-semibold mb-0.5">Blank Answer</label>
                                      <div className="bg-transparent border border-[#C27A5C]/30 rounded-lg px-2.5 py-1.5 text-xs w-full text-[#C27A5C] font-bold bg-[#C27A5C]/5">{drill.answer || "-"}</div>
                                    </div>
                                    <div>
                                      <label className="block text-[8px] text-stone-800 uppercase font-semibold mb-0.5">Prompt After</label>
                                      <div className="bg-transparent border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs w-full text-stone-800 bg-stone-50">{drill.promptAfter || "-"}</div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    {currentRows.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-stone-800 italic text-xs">
                          No spreadsheet content available. Please import a spreadsheet in the Curriculum Tab first.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          )}

          {/* TAB 4: ROLEPLAY SETUP VIEW */}
          {activeTab === "roleplay" && (
            <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-none flex flex-col">
              <div className="p-5 border-b border-stone-100 flex flex-col bg-stone-50/50 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wide font-serif">Roleplay Editor</h4>
                    <p className="text-[10px] text-stone-800 mt-1">Configure roleplay context and goals to align with the Mobile App.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={saveRoleplay} className="flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50">
                      <Save size={12} />
                      <span>Save Roleplay</span>
                    </button>
                    <button
                      onClick={addRoleplayGoal}
                      className="bg-stone-800 hover:bg-stone-700 text-white py-1.5 px-3 rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer transition-colors duration-200 active:scale-95 border border-stone-800"
                    >
                      <Plus size={12} />
                      <span>Add Goal</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col space-y-3 bg-white p-4 rounded-xl border border-stone-200/60 shadow-sm">
                  <div>
                    <label className="block text-[10px] text-stone-800 font-bold uppercase tracking-wider mb-1.5">Lesson Title (Inherited)</label>
                    <div className="flex items-center gap-2 rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700">
                      <Lock size={11} className="text-stone-400" />
                      <span>{selectedLesson?.title || "No lesson selected"}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-800 font-bold uppercase tracking-wider mb-1.5">Mobile Roleplay Title</label>
                    <input 
                      type="text" 
                      value={currentRoleplay.title || ""} 
                      onChange={(e) => {
                        setRoleplayMap(prev => ({ ...prev, [activeLessonCode]: { ...currentRoleplay, title: e.target.value } }));
                        setIsDirty(true);
                      }}
                      placeholder="e.g. Meeting Someone at a Tea Gathering"
                      className="w-full bg-stone-50/50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 font-bold focus:outline-none focus:border-[#C27A5C] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-stone-800 font-bold uppercase tracking-wider mb-1.5">Mobile Context Description</label>
                    <textarea 
                      value={currentRoleplay.setup || ""} 
                      onChange={(e) => {
                        setRoleplayMap(prev => ({ ...prev, [activeLessonCode]: { ...currentRoleplay, setup: e.target.value } }));
                        setIsDirty(true);
                      }}
                      placeholder="Visible scenario context shown on the Mobile App"
                      rows={3}
                      className="w-full bg-stone-50/50 border border-stone-200 rounded-lg px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#C27A5C] transition-colors resize-none"
                    />
                    <p className="mt-1 text-[9px] text-stone-500">This is user-facing context. Internal/system prompts are not exposed in this MVP.</p>
                  </div>
                </div>
              </div>

              <div className="max-h-[600px] overflow-y-auto overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs table-fixed">
                  <thead>
                    <tr className="border-b border-stone-200 text-[10px] text-stone-800 uppercase font-semibold tracking-wider bg-stone-50/50 sticky top-0 z-10">
                      <th className="py-3 px-4 w-24 text-center font-serif">Order</th>
                      <th className="py-3 px-4 w-96 font-serif">Goal (English)</th>
                      <th className="py-3 px-4 w-96 font-serif">Native Description</th>
                      <th className="py-3 px-4 w-24 text-center font-serif">Enabled</th>
                      <th className="py-3 px-4 w-24 text-center font-serif">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRoleplay.goals.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-stone-800 italic text-xs">
                          No goals added. Add grading criteria so the AI can evaluate the student conversation.
                        </td>
                      </tr>
                    ) : (
                      [...currentRoleplay.goals]
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map((goal, idx, arr) => (
                          <tr key={goal.id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors duration-150">
                            {/* Order */}
                            <td className="py-3 px-4 text-center">
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <button
                                  onClick={() => reorderRoleplayGoal(goal.id, "up")}
                                  disabled={idx === 0}
                                  className="text-stone-400 hover:text-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <span className="font-mono text-[10px] font-bold text-stone-600">{goal.orderIndex}</span>
                                <button
                                  onClick={() => reorderRoleplayGoal(goal.id, "down")}
                                  disabled={idx === arr.length - 1}
                                  className="text-stone-400 hover:text-stone-800 disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </div>
                            </td>

                            {/* Goal (English) */}
                            <td className="py-3 px-4">
                              <input
                                ref={element => { goalEnglishRefs.current[goal.id] = element; }}
                                type="text"
                                value={goal.title || goal.successCriteria}
                                onChange={(e) => editRoleplayGoal(goal.id, "title", e.target.value)}
                                placeholder="Goal title"
                                className="w-full bg-transparent border border-stone-200 hover:border-stone-400 focus:border-[#C27A5C] rounded-lg px-2 py-1.5 text-xs font-semibold text-stone-900 focus:outline-none transition-colors mb-2"
                              />
                              <input
                                type="text"
                                value={goal.successCriteria}
                                onChange={(e) => editRoleplayGoal(goal.id, "successCriteria", e.target.value)}
                                placeholder="Success criteria (for AI)"
                                className="w-full bg-transparent border border-stone-200 hover:border-stone-400 focus:border-[#C27A5C] rounded-lg px-2 py-1.5 text-xs text-stone-900 focus:outline-none transition-colors mb-2"
                              />
                              <input
                                type="text"
                                value={goal.descriptionEn}
                                onChange={(e) => editRoleplayGoal(goal.id, "descriptionEn", e.target.value)}
                                placeholder="Description (English) e.g. Speak fluently..."
                                className="w-full bg-stone-50 border border-stone-200 hover:border-stone-400 focus:border-[#C27A5C] rounded-lg px-2 py-1.5 text-[11px] text-stone-700 focus:outline-none transition-colors"
                              />
                            </td>

                            {/* Native Description */}
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={goal.descriptionNative}
                                onChange={(e) => editRoleplayGoal(goal.id, "descriptionNative", e.target.value)}
                                placeholder="Description (Native) e.g. Nói lưu loát..."
                                className="w-full bg-transparent border border-stone-200 hover:border-stone-400 focus:border-[#C27A5C] rounded-lg px-2 py-1.5 text-xs text-stone-900 focus:outline-none transition-colors"
                              />
                            </td>

                            {/* Enabled */}
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => editRoleplayGoal(goal.id, "isEnabled", !goal.isEnabled)}
                                className={`w-8 h-4 rounded-full relative transition-colors duration-200 focus:outline-none ${
                                  goal.isEnabled ? "bg-emerald-500" : "bg-stone-300"
                                }`}
                              >
                                <div
                                  className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-200 ${
                                    goal.isEnabled ? "translate-x-4" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => removeRoleplayGoal(goal.id)}
                                className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer inline-flex"
                                title="Remove Goal"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Status Footer */}
              <div className="p-4 flex justify-between items-center bg-stone-50/50">
                <span className="text-[11px] font-medium text-stone-600">
                  Roleplay configured with <strong className="text-stone-900">{currentRoleplay.goals.filter(g => g.isEnabled).length}</strong> active goals.
                </span>
                {currentRoleplay.goals.filter(g => g.isEnabled).length === 0 && currentRoleplay.goals.length > 0 && (
                  <span className="text-[10px] text-rose-600 font-semibold flex items-center space-x-1">
                    <AlertTriangle size={12} />
                    <span>Warning: You must have at least one enabled goal.</span>
                  </span>
                )}
              </div>
            </div>
          )}

        </section>

      </main>

      {toast && (
        <div role="status" className={`fixed right-6 top-6 z-50 flex max-w-md items-start gap-3 rounded-xl border bg-white px-4 py-3 text-xs shadow-lg ${
          toast.type === "success"
            ? "border-emerald-200 text-emerald-800"
            : toast.type === "warning"
              ? "border-amber-200 text-amber-800"
              : "border-rose-200 text-rose-800"
        }`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span className="leading-relaxed">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-stone-600 hover:text-stone-700" aria-label="Dismiss notification">
            <X size={14} />
          </button>
        </div>
      )}

      {showImportPreview && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-950/35 p-6 backdrop-blur-sm">
          <div className="flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-stone-100 px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-stone-900" />
                  <h3 className="font-serif text-base font-bold text-stone-800">Import Curriculum Preview</h3>
                </div>
                <p className="mt-1 text-[11px] text-stone-800">
                  {importFileName} will append valid records to existing lesson <span className="font-mono font-semibold">{activeLessonCode}</span>.
                </p>
              </div>
              <button onClick={() => setShowImportPreview(false)} className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 hover:text-stone-700">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 border-b border-stone-100 bg-stone-50/70 px-6 py-4">
              <div className="rounded-xl border border-stone-200 bg-white p-3">
                <p className="text-[9px] font-bold uppercase tracking-wide text-stone-800">Rows detected</p>
                <p className="mt-1 text-lg font-bold text-stone-800">{importPreview.length}</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-700">Valid</p>
                <p className="mt-1 text-lg font-bold text-emerald-800">{importPreview.filter(row => row.status === "valid").length}</p>
              </div>
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
                <p className="text-[9px] font-bold uppercase tracking-wide text-rose-700">Errors / Duplicates</p>
                <p className="mt-1 text-lg font-bold text-rose-800">{importPreview.filter(row => row.status !== "valid").length}</p>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-xs">
                <thead className="sticky top-0 bg-white shadow-[0_1px_0_#e7e5e4]">
                  <tr className="text-[9px] font-bold uppercase tracking-wide text-stone-800">
                    <th className="px-5 py-3">Excel Row</th>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Source</th>
                    <th className="px-5 py-3">Meaning (EN)</th>
                    <th className="px-5 py-3">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {importPreview.map(row => (
                    <tr key={`${row.rowNumber}-${row.code}`} className={row.status === "valid" ? "" : "bg-rose-50/30"}>
                      <td className="px-5 py-3 font-mono text-stone-800">{row.rowNumber}</td>
                      <td className="px-5 py-3 font-mono font-semibold text-stone-800">{row.code || "Missing"}</td>
                      <td className="px-5 py-3 capitalize text-stone-900">{row.type.replace("_", " ")}</td>
                      <td className="max-w-xs truncate px-5 py-3 text-stone-900">{row.sourceText || "-"}</td>
                      <td className="max-w-xs truncate px-5 py-3 text-stone-900">{row.meaningEn || "-"}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-bold uppercase ${
                          row.status === "valid"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-rose-200 bg-rose-50 text-rose-700"
                        }`}>
                          {row.status}
                        </span>
                        {row.errors.length > 0 && <p className="mt-1 text-[9px] text-rose-600">{row.errors.join(", ")}</p>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-stone-100 px-6 py-4">
              <p className="text-[10px] text-stone-800">
                Existing and duplicate codes are skipped. Import does not overwrite published data.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowImportPreview(false)} className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50">
                  Cancel
                </button>
                <button
                  onClick={confirmImport}
                  disabled={!importPreview.some(row => row.status === "valid")}
                  className="rounded-lg bg-stone-800 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Confirm {importPreview.filter(row => row.status === "valid").length} Valid Rows
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
