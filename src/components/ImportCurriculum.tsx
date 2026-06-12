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
  Info
} from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";

type ContentType = "overall" | "vocab" | "sentence" | "grammar" | "guided_script";

interface ParsedRow {
  id: string; // Internal generated ID
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

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const col0 = String(row[0] || "").trim();

      if (!col0) continue; // Skip empty rows

      // Section detection
      if (col0.toLowerCase() === "overall info") {
        currentSection = "overall";
        continue;
      }
      if (col0.toLowerCase() === "vocabulary") {
        currentSection = "vocab";
        continue;
      }
      if (col0.toLowerCase() === "sentences") {
        currentSection = "sentence";
        continue;
      }
      if (col0.toLowerCase() === "grammar") {
        currentSection = "grammar";
        continue;
      }
      if (col0.toLowerCase() === "guided script") {
        currentSection = "guided_script";
        continue;
      }

      // Extract lesson code from second row if it matches "Lesson code"
      if (col0.toLowerCase() === "lesson code" && row[1]) {
        extractedLessonCode = String(row[1]).trim();
        setLessonCode(extractedLessonCode);
        continue;
      }

      if (col0.toLowerCase() === "code") continue; // Skip header row

      // Parse data rows
      if (currentSection !== "overall") {
        const oldCode = col0;
        const source = String(row[1] || "").trim();
        const reading = String(row[2] || "").trim();
        const en = String(row[3] || "").trim();

        // Very basic mapping rules
        const prefix = currentSection === "vocab" ? "_V" : currentSection === "sentence" ? "_S" : currentSection === "grammar" ? "_G" : "_A";
        const newCode = `${extractedLessonCode}${prefix}${newRows.filter(r => r.type === currentSection).length + 1}`;

        const impact: string[] = [];
        if (currentSection === "vocab") impact.push("Impacts Drills & Audio");
        if (currentSection === "sentence") impact.push("Impacts Roleplays & Audio");

        newRows.push({
          id: `imp-${Date.now()}-${i}`,
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

  // Rule Analysis
  const vocabCount = parsedData.filter(r => r.type === "vocab").length;
  const sentenceCount = parsedData.filter(r => r.type === "sentence").length;
  const minimumVocabRule = 5;
  const isValid = vocabCount >= minimumVocabRule;

  return (
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
                    <p className="text-xs text-stone-500 mb-4">Lesson Code: <span className="font-mono font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded">{lessonCode}</span></p>
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
                        <th className="py-3 px-4 w-32">Impacts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {parsedData.map((row) => (
                        <tr key={row.id} className="hover:bg-stone-50/50 transition-colors">
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-stone-100 text-stone-600 uppercase">
                              {row.type}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-stone-500">{row.oldCode}</td>
                          <td className="py-3 px-4 font-mono font-bold text-stone-800 bg-sky-50/30">{row.newCode}</td>
                          <td className="py-3 px-4 text-stone-800">{row.source}</td>
                          <td className="py-3 px-4 text-stone-600">{row.reading}</td>
                          <td className="py-3 px-4 text-stone-800">{row.en}</td>
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
                            {row.impact.map((imp, idx) => (
                              <span key={idx} className="inline-block text-[9px] text-amber-700 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 mb-1 mr-1">
                                {imp}
                              </span>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}
