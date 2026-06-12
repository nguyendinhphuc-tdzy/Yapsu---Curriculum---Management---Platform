"use client";

import React, { useState, useRef } from "react";
import { 
  ArrowLeft, 
  Upload, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Info,
  Pencil,
  Check,
  X
} from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";

type ContentType = "overall" | "vocab" | "sentence" | "grammar" | "guided_script";

interface ParsedRow {
  id: string; // Internal generated ID
  lessonCode: string;
  lessonName: string;
  level: string;
  oldCode: string; // From the excel sheet
  newCode: string; // Generated for the system
  type: ContentType;
  source: string;
  reading: string;
  en: string;
  nativeTranslations: Record<string, string>;
  impact: string[]; // Impact warnings
}

export default function ImportCurriculum() {
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [nativeColumns, setNativeColumns] = useState<string[]>(["VN", "KR", "ES"]);
  const [newColumnName, setNewColumnName] = useState("");
  const [fileName, setFileName] = useState("");
  const [lessonCode, setLessonCode] = useState("");
  const [importedLessonsCount, setImportedLessonsCount] = useState(0);
  const [level, setLevel] = useState("Unknown");
  const [warningPopup, setWarningPopup] = useState<{ isOpen: boolean, message: string, onConfirm: () => void, onCancel?: () => void } | null>(null);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, defval: "" });

    const newRows: ParsedRow[] = [];
    let currentSection: ContentType = "overall";
    let extractedLessonCode = "NEW_LESSON";
    let currentLessonCode = "";
    let currentLessonName = "";
    let currentLevel = "Unknown";

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const col0 = String(row[0] || "").trim();

      if (!col0) continue; // Skip empty rows

      // Is it a Lesson Name header? e.g. "L5-01 Sharing a Home"
      if (col0.match(/^L\d+-\d+/) || (i < jsonData.length - 1 && String(jsonData[i+1][0]).trim().toLowerCase() === "lesson code")) {
        currentLessonName = col0;
        currentSection = "overall"; // Reset section for new lesson
        continue;
      }

      // Extract lesson code
      if (col0.toLowerCase() === "lesson code" && row[1]) {
        extractedLessonCode = String(row[1]).trim();
        currentLessonCode = extractedLessonCode;
        if (!lessonCode) setLessonCode(extractedLessonCode);
        continue;
      }

      // Section detection
      if (col0.toLowerCase() === "overall info") { currentSection = "overall"; continue; }
      if (col0.toLowerCase() === "vocabulary") { currentSection = "vocab"; continue; }
      if (col0.toLowerCase() === "sentences") { currentSection = "sentence"; continue; }
      if (col0.toLowerCase() === "grammar") { currentSection = "grammar"; continue; }
      if (col0.toLowerCase() === "guided script") { currentSection = "guided_script"; continue; }

      // Detect Level
      if (col0.toLowerCase().includes("_hsk") && row[3]) {
        currentLevel = String(row[3]).trim();
        if (level === "Unknown") setLevel(currentLevel);
        continue;
      }

      if (col0.toLowerCase() === "code") continue; // Skip header row

      // Parse data rows
      if (currentSection !== "overall") {
        // Skip rogue headers without underscores
        if (!col0.includes("_") && col0.length > 5) {
          if (col0.match(/^L\d+-\d+/)) {
            currentLessonName = col0;
          }
          continue;
        }

        const oldCode = col0;
        const source = String(row[1] || "").trim();
        const reading = String(row[2] || "").trim();
        const en = String(row[3] || "").trim();

        // Very basic mapping rules
        const prefix = currentSection === "vocab" ? "_V" : currentSection === "sentence" ? "_S" : currentSection === "grammar" ? "_G" : "_A";
        const newCode = ""; // Currently empty. Will be populated when new lessons are added.

        const impact: string[] = [];
        if (currentSection === "vocab") impact.push("Impacts Drills & Audio");
        if (currentSection === "sentence") impact.push("Impacts Roleplays & Audio");

        newRows.push({
          id: `imp-${Date.now()}-${i}`,
          lessonCode: currentLessonCode,
          lessonName: currentLessonName,
          level: currentLevel,
          oldCode,
          newCode,
          type: currentSection,
          source,
          reading,
          en,
          nativeTranslations: {
            "VN": "",
            "KR": "",
            "ES": ""
          },
          impact
        });
      }
    }

    // Detect unique lessons from the old codes
    const lessonSet = new Set<string>();
    newRows.forEach(row => {
      // E.g. CN_L401_V1 -> CN_L401
      const match = row.oldCode.match(/^(.*?)_[VSGA]\d+$/);
      if (match) {
        lessonSet.add(match[1]);
      } else if (row.oldCode.includes("_")) {
        lessonSet.add(row.oldCode.split("_").slice(0, 2).join("_"));
      } else {
        lessonSet.add(row.oldCode);
      }
    });

    setImportedLessonsCount(lessonSet.size);
    setParsedData(newRows);
  };

  const addNativeColumn = () => {
    if (!newColumnName.trim()) return;
    const colUpper = newColumnName.trim().toUpperCase();
    if (!nativeColumns.includes(colUpper)) {
      setNativeColumns([...nativeColumns, colUpper]);
      setParsedData(prev => prev.map(row => ({
        ...row,
        nativeTranslations: { ...row.nativeTranslations, [colUpper]: "" }
      })));
    }
    setNewColumnName("");
  };

  const removeNativeColumn = (col: string) => {
    setNativeColumns(prev => prev.filter(c => c !== col));
    setParsedData(prev => prev.map(row => {
      const newTranslations = { ...row.nativeTranslations };
      delete newTranslations[col];
      return { ...row, nativeTranslations: newTranslations };
    }));
  };

  const handleTranslationChange = (rowId: string, col: string, value: string) => {
    setParsedData(prev => prev.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          nativeTranslations: { ...row.nativeTranslations, [col]: value }
        };
      }
      return row;
    }));
  };

  const handleDataChange = (rowId: string, field: keyof ParsedRow, value: string) => {
    setParsedData(prev => prev.map(row => {
      if (row.id === rowId) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const handleEditClick = (row: ParsedRow, isEditing: boolean) => {
    if (!isEditing) {
      setEditingRowId(row.id);
      return;
    }
    
    // Check if lessonName changed and differs from others in the same lesson
    const othersInLesson = parsedData.filter(r => r.lessonCode === row.lessonCode && r.id !== row.id);
    const othersWithDifferentName = othersInLesson.filter(r => r.lessonName !== row.lessonName);
    
    if (othersWithDifferentName.length > 0) {
      setWarningPopup({
        isOpen: true,
        message: `You've changed the lesson name to "${row.lessonName}". Do you want to apply this new name to all other items in lesson ${row.lessonCode}?`,
        onConfirm: () => {
          setParsedData(prev => prev.map(r => 
            r.lessonCode === row.lessonCode ? { ...r, lessonName: row.lessonName } : r
          ));
          setWarningPopup(null);
          setEditingRowId(null);
        },
        onCancel: () => {
          setWarningPopup(null);
          setEditingRowId(null);
        }
      });
    } else {
      setEditingRowId(null);
    }
  };

  // Rule Analysis
  const vocabCount = parsedData.filter(r => r.type === "vocab").length;
  const sentenceCount = parsedData.filter(r => r.type === "sentence").length;
  const minimumVocabRule = 5;
  const isValid = vocabCount >= minimumVocabRule;

  return (
    <>
      {warningPopup?.isOpen && (
        <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-stone-800 mb-2">Confirm Action</h3>
                <p className="text-xs text-stone-600 leading-relaxed mb-6">{warningPopup.message}</p>
                <div className="flex justify-end gap-3">
                  <button 
                    onClick={() => {
                      if (warningPopup.onCancel) warningPopup.onCancel();
                      setWarningPopup(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={warningPopup.onConfirm}
                    className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors shadow-sm"
                  >
                    Proceed
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex h-screen bg-[#F8F7F5] text-stone-800 overflow-hidden font-sans">
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-stone-200/80 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="p-2 hover:bg-stone-50 rounded-lg transition-colors border border-stone-200">
              <ArrowLeft size={16} className="text-stone-600" />
            </Link>
            <div>
              <h1 className="text-xl font-medium font-serif text-stone-800">Import Curriculum</h1>
              <p className="text-[10px] text-stone-500 uppercase tracking-wider font-bold">Data Mapping & Impact Analysis</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <FileSpreadsheet size={14} />
              <span>{fileName ? "Change File" : "Upload File"}</span>
            </button>
            <button
              disabled={parsedData.length === 0 || !isValid}
              className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-800 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 size={14} />
              <span>Confirm Import</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <section className="flex-1 overflow-y-auto p-8 relative">
          
          {parsedData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-white border border-stone-200 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Upload className="text-stone-400" size={24} />
              </div>
              <h3 className="text-lg font-serif font-bold text-stone-800 mb-2">Upload Curriculum Sheet</h3>
              <p className="text-xs text-stone-500 mb-6 leading-relaxed">
                Import your curriculum data (Lesson, Vocabulary, Sentences, Grammar) from a single Excel file. The system will automatically parse and map the data for mobile app deployment.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-stone-800 px-6 py-2.5 text-xs font-bold text-white hover:bg-stone-700 transition-colors"
              >
                Browse Files
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Analytics & Rules Panel */}
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 bg-white rounded-2xl border border-stone-200/80 p-6 flex items-start space-x-6">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold font-serif mb-1">Import Summary</h3>
                    <p className="text-xs text-stone-500 mb-4">
                      Lesson Code: <span className="font-mono font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded">{lessonCode}</span>
                      <span className="mx-3 text-stone-300">|</span>
                      Importing: <span className="font-bold text-stone-800">{importedLessonsCount} Lessons</span>
                      <span className="mx-3 text-stone-300">|</span>
                      Level: <span className="font-bold text-stone-800">{level}</span>
                    </p>
                    <div className="flex space-x-6 text-xs">
                      <div><span className="font-bold text-stone-800">{vocabCount}</span> Vocabulary</div>
                      <div><span className="font-bold text-stone-800">{sentenceCount}</span> Sentences</div>
                      <div><span className="font-bold text-stone-800">{parsedData.filter(r => r.type === "grammar").length}</span> Grammar</div>
                    </div>
                  </div>
                  <div className="w-px h-16 bg-stone-100"></div>
                  <div className="flex-1">
                    <h3 className="text-[10px] uppercase tracking-wider font-bold text-stone-500 mb-3">Rules Validation</h3>
                    {!isValid ? (
                      <div className="flex items-start space-x-2 text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                        <div className="text-xs">
                          <span className="font-bold block mb-0.5">Minimum Vocabulary Rule Failed</span>
                          A lesson must have at least {minimumVocabRule} vocabulary words. Currently has {vocabCount}.
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                        <CheckCircle2 size={14} />
                        <span className="text-xs font-medium">All rules passed</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-span-1 bg-amber-50 rounded-2xl border border-amber-200/60 p-6">
                  <h3 className="text-xs font-bold text-amber-800 flex items-center space-x-2 mb-3">
                    <Info size={14} />
                    <span>Impact Analysis</span>
                  </h3>
                  <ul className="text-[11px] text-amber-700 space-y-2 list-disc pl-4">
                    <li>Adding new vocabulary will invalidate generated audio for related sentences.</li>
                    <li>Removing sentences may break existing Roleplay goals.</li>
                    <li>Modifying lesson codes updates the mapping table automatically.</li>
                  </ul>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-sm flex flex-col" style={{ height: "calc(100vh - 280px)" }}>
                
                {/* Table Toolbar */}
                <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
                  <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">Data Mapping Preview</h3>
                  
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Add Native Column (e.g. TH)"
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        className="border border-stone-200 rounded-lg pl-3 pr-8 py-1.5 text-xs focus:outline-none focus:border-stone-400"
                        onKeyDown={(e) => { if (e.key === "Enter") addNativeColumn(); }}
                      />
                      <button 
                        onClick={addNativeColumn}
                        className="absolute right-1.5 top-1.5 text-stone-400 hover:text-stone-800"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table Container */}
                <div className="flex-1 overflow-auto">
                  <table className="w-full min-w-[1200px] text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-stone-50 z-10">
                      <tr className="border-b border-stone-200 text-[10px] text-stone-500 uppercase font-semibold tracking-wider">
                        <th className="py-3 px-4 w-16">No.</th>
                        <th className="py-3 px-4 w-32">Level</th>
                        <th className="py-3 px-4 w-48">Lesson</th>
                        <th className="py-3 px-4 w-24">Type</th>
                        <th className="py-3 px-4 w-32">Old Code</th>
                        <th className="py-3 px-4 w-32">New Code</th>
                        <th className="py-3 px-4 w-48">Source (CN)</th>
                        <th className="py-3 px-4 w-32">Reading (PIN)</th>
                        <th className="py-3 px-4 w-48">Meaning (EN)</th>
                        {nativeColumns.map(col => (
                          <th key={col} className="py-3 px-4 w-40 relative group">
                            <div className="flex items-center justify-between">
                              <span>Native ({col})</span>
                              <button 
                                onClick={() => removeNativeColumn(col)}
                                className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-500 transition-opacity"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </th>
                        ))}
                        <th className="py-3 px-4 w-40">Impacts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {parsedData.map((row, idx) => {
                        const isEditing = editingRowId === row.id;
                        return (
                        <tr 
                          key={row.id} 
                          className="hover:bg-stone-50/50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => handleEditClick(row, isEditing)}
                                className={`p-1.5 rounded-lg transition-colors ${isEditing ? "bg-emerald-100 text-emerald-700" : "text-stone-400 hover:bg-stone-100 hover:text-stone-800"}`}
                              >
                                {isEditing ? <Check size={14} /> : <Pencil size={14} />}
                              </button>
                              <span className="font-mono font-bold text-stone-400">{idx + 1}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-stone-600">{row.level}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col space-y-1">
                              <span className="font-mono text-[10px] text-stone-500">{row.lessonCode}</span>
                              {isEditing ? (
                                <input
                                  value={row.lessonName}
                                  onChange={(e) => handleDataChange(row.id, "lessonName", e.target.value)}
                                  className="w-40 bg-white border border-stone-300 rounded px-2 py-1 text-xs focus:border-stone-500 focus:outline-none"
                                />
                              ) : (
                                <span className="text-xs font-medium text-stone-800 truncate w-40" title={row.lessonName}>{row.lessonName}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-stone-100 text-stone-600 uppercase">
                              {row.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-stone-500">{row.oldCode}</td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input 
                                value={row.newCode} 
                                onChange={(e) => handleDataChange(row.id, "newCode", e.target.value)}
                                className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-xs focus:border-stone-500 focus:outline-none"
                              />
                            ) : (
                              <span className="font-mono font-bold text-stone-800 bg-sky-50/30 px-1 rounded">{row.newCode || "-"}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input 
                                value={row.source} 
                                onChange={(e) => handleDataChange(row.id, "source", e.target.value)}
                                className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-xs focus:border-stone-500 focus:outline-none"
                              />
                            ) : (
                              <span className="text-stone-800">{row.source}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input 
                                value={row.reading} 
                                onChange={(e) => handleDataChange(row.id, "reading", e.target.value)}
                                className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-xs focus:border-stone-500 focus:outline-none"
                              />
                            ) : (
                              <span className="text-stone-600">{row.reading}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <input 
                                value={row.en} 
                                onChange={(e) => handleDataChange(row.id, "en", e.target.value)}
                                className="w-full bg-white border border-stone-300 rounded px-2 py-1 text-xs focus:border-stone-500 focus:outline-none"
                              />
                            ) : (
                              <span className="text-stone-800">{row.en}</span>
                            )}
                          </td>
                          {nativeColumns.map(col => (
                            <td key={`${row.id}-${col}`} className="py-2 px-4">
                              <input
                                type="text"
                                value={row.nativeTranslations[col] || ""}
                                onChange={(e) => handleTranslationChange(row.id, col, e.target.value)}
                                placeholder={`Translate to ${col}...`}
                                className="w-full bg-transparent border border-transparent hover:border-stone-200 focus:border-stone-400 rounded px-2 py-1 focus:outline-none transition-colors"
                              />
                            </td>
                          ))}
                          <td className="py-3 px-4">
                            {row.impact.map((imp, idxImp) => (
                              <span key={idxImp} className="inline-block text-[9px] text-amber-700 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 mb-1 mr-1">
                                {imp}
                              </span>
                            ))}
                          </td>
                        </tr>
                      )})}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

        </section>
      </main>
    </div>
    </>
  );
}
