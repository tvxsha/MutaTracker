/**
 * Design reminder for Home.tsx:
 * Every section should reinforce the MUTATRACK Biotech Brutalism language:
 * asymmetric editorial layout, forensic mono metadata, stark black space,
 * white glass panels, and precise red urgency markers.
 */
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  ClipboardList,
  Download,
  Github,
  Linkedin,
  Minus,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  Trash2,
  Twitter,
  UserPlus,
  Users,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import {
  analyseSequence,
  isValidDNA,
  type RiskLevel,
  scanSequences,
  type ScanResult,
} from "../lib/dnaEngine";
import {
  appendMutations,
  computeCancerRisk,
  deleteProfile,
  getMutations,
  getProfile,
  getProfiles,
  saveProfile,
  type StoredMutation,
} from "../lib/patientStore";

const navItems = ["Home", "About", "Analyze", "Patients", "Research", "Contact"];

const checklist = ["Scan & Compare", "Classify Mutations", "Risk Score", "Export Report"];

const services = [
  {
    title: "Transition / Transversion Classification",
    description:
      "Sequence deltas are separated into clinically meaningful substitution classes — purine↔purine or pyrimidine↔pyrimidine transitions versus cross-class transversions.",
  },
  {
    title: "Risk Level Engine",
    description:
      "Each mutation is evaluated in codon context: CRITICAL (introduces STOP), HIGH (radical AA group change), MODERATE (conservative change), LOW (synonymous).",
  },
];

const processSteps = [
  {
    number: "01",
    title: "Input",
    description: "Upload or paste nucleotide sequences and initialize a structured patient session.",
  },
  {
    number: "02",
    title: "Scan",
    description: "Traverse codons and open reading frames at per-base speed to isolate meaningful mutation events.",
  },
  {
    number: "03",
    title: "Classify",
    description: "Determine substitution type, amino-acid impact, and normalized Ts/Tv relationships.",
  },
  {
    number: "04",
    title: "Report",
    description: "Export a clinically structured summary with risk interpretation and persistent records.",
  },
];

const stats = [
  {
    value: "98",
    suffix: "%",
    label: "Risk classification accuracy",
  },
  {
    value: "<1",
    suffix: "ms",
    label: "Per-base scan speed",
  },
  {
    value: "64",
    suffix: "",
    label: "Codon table entries",
  },
  {
    value: "0.04",
    suffix: "%",
    label: "False detection rate",
  },
];

const faqs = [
  {
    question: "What is a transversion versus a transition?",
    answer:
      "A transition is a substitution within the same nucleobase family, such as purine to purine or pyrimidine to pyrimidine. A transversion crosses those families, which generally makes it less frequent and often more disruptive in interpretation workflows.",
  },
  {
    question: "How is risk level assigned?",
    answer:
      "Risk scoring combines mutation type, amino-acid consequence, codon context, and classification heuristics derived from the platform's clinical ruleset. The resulting signal is normalized into CRITICAL, HIGH, MODERATE, or LOW urgency bands for review.",
  },
  {
    question: "What is the Ts/Tv ratio?",
    answer:
      "The transition-to-transversion ratio is a quality and biological interpretation signal that compares the relative frequency of each substitution class. It helps indicate whether observed mutations fit expected genomic behavior or warrant further scrutiny.",
  },
  {
    question: "How does ORF detection work?",
    answer:
      "Open reading frame detection scans the sequence for valid start and stop codon structures, then evaluates reading continuity so protein-coding regions can be interpreted against potential mutation impact.",
  },
  {
    question: "How are records persisted?",
    answer:
      "Sessions are organized into repeatable patient profiles and clinically structured records so analysts can revisit scans, compare progression, and export findings without losing interpretive context.",
  },
];

const viewport = { once: true, amount: 0.25 };
const revealEase = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: revealEase },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const heroReveal = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: revealEase, delay: 0.3 },
  },
};

const heroHeadlineReveal = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: revealEase, delay: 0.5 },
  },
};

function HelixBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 mutatrack-grid opacity-20" />
      <div className="scan-line absolute left-[8%] top-0 h-40 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
      <div className="scan-line absolute right-[12%] top-0 h-56 w-px bg-gradient-to-b from-transparent via-red-500/20 to-transparent [animation-delay:-3s]" />
      <svg
        className="helix-strand left-[-8%] top-[2%] h-[72rem] w-[32rem]"
        viewBox="0 0 320 1200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path d="M60 0C230 120 230 220 60 340C-110 460 -110 560 60 680C230 800 230 900 60 1020C-110 1140 -110 1220 60 1200" stroke="currentColor" strokeWidth="2" />
        <path d="M260 0C90 120 90 220 260 340C430 460 430 560 260 680C90 800 90 900 260 1020C430 1140 430 1220 260 1200" stroke="currentColor" strokeWidth="2" />
        {Array.from({ length: 16 }).map((_, index) => {
          const y = 40 + index * 70;
          return (
            <line
              key={y}
              x1={76}
              y1={y}
              x2={244}
              y2={y + 24}
              stroke="currentColor"
              strokeWidth="1.25"
            />
          );
        })}
      </svg>
      <svg
        className="helix-strand helix-strand--reverse right-[-12%] top-[14%] h-[62rem] w-[30rem]"
        viewBox="0 0 320 1200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path d="M60 0C230 120 230 220 60 340C-110 460 -110 560 60 680C230 800 230 900 60 1020C-110 1140 -110 1220 60 1200" stroke="currentColor" strokeWidth="2" />
        <path d="M260 0C90 120 90 220 260 340C430 460 430 560 260 680C90 800 90 900 260 1020C430 1140 430 1220 260 1200" stroke="currentColor" strokeWidth="2" />
        {Array.from({ length: 14 }).map((_, index) => {
          const y = 60 + index * 74;
          return (
            <line
              key={y}
              x1={82}
              y1={y}
              x2={238}
              y2={y + 22}
              stroke="currentColor"
              strokeWidth="1.25"
            />
          );
        })}
      </svg>
      <div className="ambient-pulse absolute left-1/2 top-40 h-56 w-56 -translate-x-1/2 rounded-full bg-red-500/8 blur-3xl" />
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <p className="micro-label mb-6">{children}</p>;
}

const riskConfig: Record<RiskLevel, { label: string; cls: string }> = {
  CRITICAL: { label: "CRITICAL", cls: "border-red-500/50 bg-red-950/30 text-red-400" },
  HIGH: { label: "HIGH", cls: "border-red-400/35 text-red-300" },
  MODERATE: { label: "MODERATE", cls: "border-yellow-500/35 text-yellow-400" },
  LOW: { label: "LOW", cls: "border-white/12 text-white/40" },
};

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const { label, cls } = riskConfig[risk];
  return (
    <span className={`rounded-none border px-1.5 py-px font-mono text-[10px] tracking-[0.2em] ${cls}`}>
      {label}
    </span>
  );
}

// ── Toast system ─────────────────────────────────────────────
type Toast = { id: number; msg: string; type: "success" | "error" };
let _toastId = 0;
function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (msg: string, type: Toast["type"] = "success") => {
    const id = ++_toastId;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  };
  return { toasts, push };
}
function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 items-end">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-center gap-3 rounded-sm border-l-2 bg-zinc-900 px-4 py-3 font-mono text-xs text-white/80 shadow-none transition-all duration-300 ${t.type === "success" ? "border-green-500" : "border-red-500"
            }`}
          style={{ minWidth: 260, maxWidth: 380 }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // ── DNA Analyzer state ──────────────────────────────────────
  const [analyzeTab, setAnalyzeTab] = useState<"compare" | "recorder" | "match" | "single">("compare");
  const resultsRef = useRef<HTMLDivElement>(null);

  // Compare by Patient ID
  const [cmpId1, setCmpId1] = useState("");
  const [cmpId2, setCmpId2] = useState("");
  const [cmpLabel, setCmpLabel] = useState<{ a: string; b: string }>({ a: "", b: "" });

  // Mutation Recorder
  const [recId, setRecId] = useState("");
  const [recDna, setRecDna] = useState("");
  const [recSaved, setRecSaved] = useState(false);

  // Manual match
  const [baseSeq, setBaseSeq] = useState("");
  const [sampleSeq, setSampleSeq] = useState("");

  // Single sequence
  const [singleSeq, setSingleSeq] = useState("");
  const [singleStats, setSingleStats] = useState<ReturnType<typeof analyseSequence> | null>(null);

  // Shared scan result
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  function resetAnalyzer() {
    setBaseSeq(""); setSampleSeq(""); setSingleSeq("");
    setCmpId1(""); setCmpId2(""); setRecId(""); setRecDna("");
    setScanResult(null); setSingleStats(null);

    setRecSaved(false); setCmpLabel({ a: "", b: "" });
  }

  function handleCompareByID() {
    setScanResult(null);
    const p1 = getProfile(cmpId1.trim());
    const p2 = getProfile(cmpId2.trim());
    if (!p1) { toast(`Patient "${cmpId1.trim()}" not found.`, "error"); return; }
    if (!p2) { toast(`Patient "${cmpId2.trim()}" not found.`, "error"); return; }
    if (!p1.dna || p1.dna.length < 3) { toast(`${p1.name} has no DNA sequence on file.`, "error"); return; }
    if (!p2.dna || p2.dna.length < 3) { toast(`${p2.name} has no DNA sequence on file.`, "error"); return; }
    setCmpLabel({ a: p1.name, b: p2.name });
    setScanResult(scanSequences(p1.dna, p2.dna));
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function handleMutationRecord() {
    setScanResult(null); setRecSaved(false);
    const p = getProfile(recId.trim());
    if (!p) { toast(`Patient "${recId.trim()}" not found.`, "error"); return; }
    if (!p.dna || p.dna.length < 3) { toast(`${p.name} has no baseline DNA on file.`, "error"); return; }
    const newDna = recDna.trim().toUpperCase().replace(/[^ATGC]/g, "");
    if (!isValidDNA(newDna) || newDna.length < 3) { toast("Invalid DNA — only A, T, G, C. Min 3 bases.", "error"); return; }
    setCmpLabel({ a: `${p.name} (Baseline)`, b: `${p.name} (New Sample)` });
    setScanResult(scanSequences(p.dna, newDna));
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function handleSaveMutations() {
    if (!scanResult || !recId.trim()) return;
    const p = getProfile(recId.trim());
    if (!p) return;
    appendMutations(p.id, scanResult.mutations, "Recorded via Mutation Recorder");
    setRecSaved(true);
    toast(`${scanResult.mutations.length} mutation${scanResult.mutations.length > 1 ? "s" : ""} saved to ${p.id}.`);
  }

  function handleManualScan() {
    setScanResult(null);
    const b = baseSeq.trim().toUpperCase().replace(/[^ATGC]/g, "");
    const s = sampleSeq.trim().toUpperCase().replace(/[^ATGC]/g, "");
    if (!isValidDNA(b)) { toast("Reference sequence is invalid.", "error"); return; }
    if (!isValidDNA(s)) { toast("Sample sequence is invalid.", "error"); return; }
    if (b.length < 3 || s.length < 3) { toast("Sequences must be at least 3 bases long.", "error"); return; }
    setCmpLabel({ a: "Reference", b: "Sample" });
    setScanResult(scanSequences(b, s));
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function handleSingleAnalyze() {
    setSingleStats(null);
    const s = singleSeq.trim().toUpperCase().replace(/[^ATGC]/g, "");
    if (!isValidDNA(s)) { toast("Sequence invalid — only A, T, G, C allowed.", "error"); return; }
    if (s.length < 3) { toast("Sequence must be at least 3 bases long.", "error"); return; }
    setSingleStats(analyseSequence(s));
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function handleDownload() {
    if (!scanResult) return;
    const lines: string[] = [
      "MUTATRACK — DNA MUTATION SCAN REPORT",
      "=====================================",
      `${cmpLabel.a} vs ${cmpLabel.b}`,
      `Similarity  : ${scanResult.similarity.toFixed(2)}%`,
      `Ref length  : ${scanResult.lengthA} bp   GC: ${scanResult.gcA.toFixed(1)}%`,
      `Sample len  : ${scanResult.lengthB} bp   GC: ${scanResult.gcB.toFixed(1)}%`,
      `Transitions : ${scanResult.tsCount}   Transversions: ${scanResult.tvCount}   Ts/Tv: ${scanResult.tsTvRatio.toFixed(2)}`,
      `Risk — CRITICAL: ${scanResult.criticalCount}  HIGH: ${scanResult.highCount}  MODERATE: ${scanResult.moderateCount}  LOW: ${scanResult.lowCount}`,
      "",
      "MUTATION TABLE",
      "--------------",
      "#    Pos    Change  Type          AA Effect       Risk      Orig Codon  AA → Mutant AA",
      ...scanResult.mutations.map((m, i) =>
        `${String(i + 1).padEnd(5)} ${String(m.position).padEnd(7)} ${m.original}->${m.mutated}   ${m.mutType.padEnd(14)} ${m.aaEffect.padEnd(16)} ${m.risk.padEnd(10)} ${m.origCodon} ${m.origAA} → ${m.mutAA}`
      )
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "mutatrack_report.txt"; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Toast ──────────────────────────────────────────────────────
  const { toasts, push: toast } = useToast();

  // ── Patients state ────────────────────────────────────────────
  const [patientTab, setPatientTab] = useState<"lookup" | "register">("lookup");
  const [lookupId, setLookupId] = useState("");
  const [foundProfile, setFoundProfile] = useState<ReturnType<typeof getProfile> | null | undefined>(undefined);
  const [foundMuts, setFoundMuts] = useState<ReturnType<typeof getMutations> | null>(null);
  const [regId, setRegId] = useState("");
  const [regName, setRegName] = useState("");
  const [regDna, setRegDna] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const patResultsRef = useRef<HTMLDivElement>(null);

  function handleLookup() {
    setFoundProfile(undefined); setFoundMuts(null); setShowDeleteConfirm(false);
    const id = lookupId.trim();
    if (!id) { toast("Enter a Patient ID.", "error"); return; }
    const p = getProfile(id);
    if (!p) { setFoundProfile(null); toast(`No patient found with ID "${id}".`, "error"); return; }
    setFoundProfile(p);
    setFoundMuts(getMutations(id));
    setTimeout(() => patResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  function handleRegister() {
    const id = regId.trim().toUpperCase();
    const name = regName.trim();
    const dna = regDna.trim().toUpperCase().replace(/[^ATGC]/g, "");
    if (!id || !name) { toast("Patient ID and Name are required.", "error"); return; }
    if (!dna) { toast("Reference DNA sequence is required.", "error"); return; }
    if (!isValidDNA(dna)) { toast("DNA invalid — only A, T, G, C allowed.", "error"); return; }
    if (getProfile(id)) { toast(`Patient ID "${id}" is already registered.`, "error"); return; }

    saveProfile({ id, name, dna, createdAt: new Date().toISOString() });
    toast(`${id} — ${name} registered.`);
    setRegId(""); setRegName(""); setRegDna("");
  }

  function handleDeletePatient() {
    if (!foundProfile) return;
    deleteProfile(foundProfile.id);
    setFoundProfile(undefined); setFoundMuts(null);
    setShowDeleteConfirm(false);
    toast(`Patient ${foundProfile.id} deleted.`);
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <ToastContainer toasts={toasts} />
      <HelixBackground />

      <div className="relative z-10">
        <header id="home" className="sticky top-0 z-50 border-b border-white/10 bg-black/55 backdrop-blur-2xl">
          <div className="container flex h-20 items-center justify-between gap-6 px-8 md:px-16">
            <a href="#home" className="flex items-center gap-3 text-sm font-semibold tracking-[0.24em] uppercase">
              <span className="red-dot text-xl leading-none">●</span>
              <span className="font-display text-lg tracking-[0.18em]">MUTATRACK</span>
            </a>

            <nav className="hidden items-center gap-8 text-xs uppercase tracking-[0.24em] text-white/70 md:flex">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="transition-colors duration-300 hover:text-white">
                  {item}
                </a>
              ))}
            </nav>

            <a
              href="#analyze"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-[11px] uppercase tracking-[0.24em] text-white transition-all duration-300 hover:border-white/30 hover:bg-white/10">
              Run Analysis
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </div>
        </header>

        <main>
          {/* ══════════════════ HERO — FIRST SCREEN ══════════════════ */}
          <section
            id="home"
            className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 md:px-10"
          >
            {/* Full-bleed background image */}
            <div className="absolute inset-0">
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663569425099/AbQHjmSbxmpJKKAMyBKBDv/mutatrack-hero-biotech-editorial-MS6Mh9JoB4dQicZbFxdYax.webp"
                alt="DNA scan background"
                className="h-full w-full object-cover object-[68%_center] opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
            </div>

            {/* Decorative nav arrows */}
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/60 backdrop-blur-sm transition hover:border-white/30 hover:text-white"
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white/60 backdrop-blur-sm transition hover:border-white/30 hover:text-white"
              aria-label="Next"
            >
              ›
            </button>

            {/* Hero content */}
            <div className="relative z-10 flex flex-col items-center gap-8 text-center">
              <motion.p
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="micro-label text-white/70"
              >
                READY TO ANALYZE?
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease: revealEase, delay: 0.35 }}
                className="font-display text-[clamp(2rem,6vw,5rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.04em] text-white"
              >
                LET'S FIND THE{" "}
                <span className="text-red-500">MUTATION</span>
              </motion.h1>

              <motion.a
                href="#patients"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.65 }}
                className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-black/50 px-8 py-4 text-sm uppercase tracking-[0.28em] text-white backdrop-blur-sm transition-all duration-300 hover:border-red-500/50 hover:bg-red-500/15 hover:text-red-200"
              >
                START ANALYSIS
                <ArrowUpRight className="h-5 w-5" />
              </motion.a>
            </div>

            {/* Bottom metadata strip */}
            <div className="absolute inset-x-10 bottom-10 flex items-end justify-between gap-6 border-t border-white/10 pt-5">
              <div>
                <p className="micro-label mb-1">Operating field</p>
                <p className="font-display text-xl uppercase tracking-[-0.04em] text-white/80">Clinical signal map</p>
              </div>
              <div className="hidden text-right text-xs uppercase tracking-[0.24em] text-white/50 md:block">
                <p>Ts/Tv monitored</p>
                <p>Codon impact indexed</p>
              </div>
            </div>
          </section>

          {/* ═══════════════════ PATIENTS ═══════════════════ */}
          <section id="patients" className="section-shell px-8 md:px-16">
            <div className="container">
              <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={stagger} className="space-y-10">

                <motion.div variants={fadeUp} className="mx-auto max-w-3xl text-center">
                  <SectionLabel>Patient Records</SectionLabel>
                  <h2 className="font-display text-5xl font-bold uppercase tracking-[-0.08em] md:text-7xl">
                    Find a <span className="text-red-500">Patient</span>
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-white/60">
                    Access a patient's DNA profile, full mutation history, and AI-derived cancer risk assessment by their unique Patient ID.
                  </p>
                </motion.div>

                {/* Tab switcher */}
                <motion.div variants={fadeUp} className="flex justify-center gap-2">
                  {(["lookup", "register"] as const).map(tab => (
                    <button key={tab} onClick={() => { setPatientTab(tab); setFoundProfile(undefined); setFoundMuts(null); }}
                      className={`rounded-full border px-6 py-2.5 text-xs uppercase tracking-[0.22em] transition-all duration-200 ${patientTab === tab ? "border-white/30 bg-white/10 text-white" : "border-white/10 bg-transparent text-white/50 hover:text-white"
                        }`}>
                      {tab === "lookup" ? "Lookup by ID" : "Register Patient"}
                    </button>
                  ))}
                </motion.div>

                <motion.div variants={fadeUp} className="mutatrack-glass rounded-[1.75rem] p-6 md:p-10">
                  {patientTab === "lookup" ? (
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                      <div className="flex-1 space-y-2">
                        <label className="micro-label">Patient ID</label>
                        <input
                          value={lookupId}
                          onChange={e => setLookupId(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleLookup()}
                          placeholder="e.g. P001"
                          className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-sm text-white/90 placeholder-white/20 outline-none focus:border-white/30"
                        />
                      </div>
                      <button onClick={handleLookup}
                        className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-6 py-3 text-xs uppercase tracking-[0.22em] text-red-300 transition hover:bg-red-500/20">
                        <Search className="h-4 w-4" />
                        Lookup
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="micro-label">Patient ID</label>
                          <input value={regId} onChange={e => setRegId(e.target.value)} placeholder="e.g. P001"
                            className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-sm text-white/90 placeholder-white/20 outline-none focus:border-white/30" />
                        </div>
                        <div className="space-y-2">
                          <label className="micro-label">Full Name</label>
                          <input value={regName} onChange={e => setRegName(e.target.value)} placeholder="e.g. Jane Smith"
                            className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white/90 placeholder-white/20 outline-none focus:border-white/30" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="micro-label">Reference DNA Sequence</label>
                        <textarea value={regDna} onChange={e => setRegDna(e.target.value)} rows={3}
                          placeholder="Paste baseline DNA — only A, T, G, C (required)"
                          className="w-full resize-none rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-xs text-white/90 placeholder-white/20 outline-none focus:border-white/30" />
                      </div>
                      <button onClick={handleRegister}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-6 py-3 text-xs uppercase tracking-[0.22em] text-white transition hover:bg-white/12">
                        <UserPlus className="h-4 w-4" />
                        Register
                      </button>
                    </div>
                  )}

                </motion.div>

                {/* ── Patient Profile Results ── */}
                <AnimatePresence>
                  {foundProfile && (() => {
                    const stats = foundProfile.dna ? analyseSequence(foundProfile.dna) : null;
                    const muts = foundMuts ?? [];
                    const risk = computeCancerRisk(muts, stats ?? { length: 0, gc: 50, gcLabel: "Balanced" as const, a: 0, t: 0, g: 0, c: 0, aPct: 0, tPct: 0, gPct: 0, cPct: 0, rnaTranscript: "", codons: [], orfs: [] });
                    const riskColor = risk.level === "HIGH" ? "border-red-500/50 bg-red-500/8" : risk.level === "MODERATE" ? "border-yellow-500/40 bg-yellow-500/6" : risk.level === "LOW" ? "border-green-500/30 bg-green-500/5" : "border-white/10 bg-white/2";
                    const riskTextColor = risk.level === "HIGH" ? "text-red-400" : risk.level === "MODERATE" ? "text-yellow-300" : risk.level === "LOW" ? "text-green-400" : "text-white/40";
                    return (
                      <motion.div ref={patResultsRef} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: revealEase }} className="space-y-6">

                        {/* Header card */}
                        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-5">
                          <div>
                            <p className="micro-label mb-1">Patient Record</p>
                            <h3 className="font-display text-3xl font-bold uppercase tracking-[-0.06em]">{foundProfile.name}</h3>
                            <p className="mt-1 font-mono text-xs text-white/50">ID: {foundProfile.id} &nbsp;·&nbsp; Registered: {foundProfile.createdAt.slice(0, 10)}</p>
                          </div>
                          <button onClick={() => setShowDeleteConfirm(v => !v)}
                            className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/5 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-red-400/70 transition hover:bg-red-500/15">
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete Record
                          </button>
                        </div>

                        {showDeleteConfirm && (
                          <div className="flex items-center justify-between gap-4 rounded-xl border border-red-500/40 bg-red-500/10 px-6 py-4">
                            <p className="text-sm text-red-300">Permanently delete <strong>{foundProfile.id}</strong> and all their mutation history?</p>
                            <div className="flex gap-2">
                              <button onClick={handleDeletePatient} className="rounded-full border border-red-500/60 bg-red-500/20 px-4 py-2 text-xs uppercase tracking-[0.18em] text-red-300 transition hover:bg-red-500/30">Confirm Delete</button>
                              <button onClick={() => setShowDeleteConfirm(false)} className="rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/50 transition hover:text-white">Cancel</button>
                            </div>
                          </div>
                        )}

                        {/* DNA Stats */}
                        {stats && (
                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {[
                              { label: "Sequence Length", value: `${stats.length} bp` },
                              { label: "GC Content", value: `${stats.gc.toFixed(1)}%`, sub: stats.gcLabel },
                              { label: "ORFs Found", value: String(stats.orfs.length) },
                              { label: "Total Mutations", value: String(muts.length), sub: "recorded events" },
                            ].map(s => (
                              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                                <p className="micro-label mb-3">{s.label}</p>
                                <p className="font-display text-3xl font-bold tracking-[-0.06em]">{s.value}</p>
                                {s.sub && <p className="mt-1 text-xs text-white/45">{s.sub}</p>}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ── Cancer Risk Card ── */}
                        <div className={`rounded-2xl border p-6 md:p-8 ${riskColor}`}>
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-3 mb-3">
                                <ShieldAlert className={`h-6 w-6 ${riskTextColor}`} />
                                <p className="micro-label m-0">Oncogenic Risk Assessment</p>
                              </div>
                              <p className={`font-display text-2xl font-bold uppercase tracking-[-0.05em] ${riskTextColor}`}>{risk.headline}</p>
                            </div>
                            <span className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] font-mono font-bold ${riskTextColor} ${risk.level === "HIGH" ? "border-red-500/40" : risk.level === "MODERATE" ? "border-yellow-500/30" : "border-white/15"
                              }`}>{risk.level}</span>
                          </div>
                          <p className="mt-5 text-sm leading-7 text-white/75">{risk.detail}</p>
                          {risk.indicators.length > 0 && (
                            <div className="mt-6 space-y-2 border-t border-white/10 pt-5">
                              <p className="micro-label mb-3">Clinical Indicators</p>
                              {risk.indicators.map((ind, i) => (
                                <div key={i} className="flex items-start gap-3">
                                  <ArrowRight className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${riskTextColor}`} />
                                  <p className="text-xs leading-5 text-white/65">{ind}</p>
                                </div>
                              ))}
                            </div>
                          )}

                        </div>

                        {/* Mutation History Table */}
                        {muts.length > 0 ? (
                          <div className="mutatrack-glass overflow-hidden rounded-2xl">
                            <div className="border-b border-white/10 px-6 py-4">
                              <p className="micro-label m-0">Mutation History ({muts.length} recorded events)</p>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left font-mono text-xs">
                                <thead>
                                  <tr className="border-b border-white/8 text-white/40">
                                    {["#", "Date", "Pos", "Change", "Type", "AA Effect", "Risk", "AA Change"].map(h => (
                                      <th key={h} className="px-4 py-3 font-normal uppercase tracking-[0.18em]">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {muts.map((m: StoredMutation, i: number) => (
                                    <tr key={i} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                                      <td className="px-4 py-2.5 text-white/30">{i + 1}</td>
                                      <td className="px-4 py-2.5 text-white/50">{m.date}</td>
                                      <td className="px-4 py-2.5 text-white/70">{m.position}</td>
                                      <td className="px-4 py-2.5 font-semibold text-white">{m.original}→{m.mutated}</td>
                                      <td className="px-4 py-2.5 text-white/60">{m.mutType}</td>
                                      <td className="px-4 py-2.5 text-white/60">{m.aaEffect}</td>
                                      <td className="px-4 py-2.5"><RiskBadge risk={m.risk as RiskLevel} /></td>
                                      <td className="px-4 py-2.5 text-white/50">{m.origAA}→{m.mutAA}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-5">
                            <Check className="h-5 w-5 text-white/30" />
                            <p className="text-sm text-white/50">No mutations recorded for this patient yet. Run a scan in the Analyzer and save mutations to this profile.</p>
                          </div>
                        )}
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>

              </motion.div>
            </div>
          </section>


          <section id="analyze" className="section-shell px-8 md:px-16">
            <div className="container">
              <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={stagger} className="space-y-10">
                <motion.div variants={fadeUp} className="mx-auto max-w-3xl text-center">
                  <SectionLabel>Analyze</SectionLabel>
                  <h2 className="font-display text-5xl font-bold uppercase tracking-[-0.08em] md:text-7xl">
                    DNA <span className="text-red-500">Analyzer</span>
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-white/60">Compare patient profiles, record new mutations, or analyse raw sequences — all backed by codon-level risk classification and cancer detection heuristics.</p>
                </motion.div>

                {/* ── 4 Tab switcher ── */}
                <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-2">
                  {([
                    { key: "compare" as const, label: "Compare Patients", icon: <Users className="h-3.5 w-3.5" /> },
                    { key: "recorder" as const, label: "Mutation Recorder", icon: <Activity className="h-3.5 w-3.5" /> },
                    { key: "match" as const, label: "Manual DNA Match", icon: <Zap className="h-3.5 w-3.5" /> },
                    { key: "single" as const, label: "Sequence Analysis", icon: <ClipboardList className="h-3.5 w-3.5" /> },
                  ]).map(tab => (
                    <button key={tab.key} onClick={() => { setAnalyzeTab(tab.key); resetAnalyzer(); }}
                      className={`inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs uppercase tracking-[0.18em] transition-all duration-200 ${analyzeTab === tab.key ? "border-red-500/40 bg-red-500/10 text-red-300 tab-active-glow" : "border-white/10 bg-transparent text-white/50 hover:text-white hover:border-white/20"
                        }`}>
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </motion.div>

                <motion.div variants={fadeUp} className="mutatrack-glass rounded-[1.75rem] p-6 md:p-10">

                  {/* ─── Tab: Compare by Patient ID ─── */}
                  {analyzeTab === "compare" && (
                    <div className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="micro-label">Patient A</label>
                          <select value={cmpId1} onChange={e => setCmpId1(e.target.value)}
                            className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-sm text-white/90 outline-none focus:border-white/30">
                            <option value="">Select patient…</option>
                            {getProfiles().map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="micro-label">Patient B</label>
                          <select value={cmpId2} onChange={e => setCmpId2(e.target.value)}
                            className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-sm text-white/90 outline-none focus:border-white/30">
                            <option value="">Select patient…</option>
                            {getProfiles().map(p => <option key={p.id} value={p.id}>{p.id} — {p.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <button onClick={handleCompareByID}
                        className="inline-flex items-center gap-2 rounded-sm border border-red-500/60 bg-transparent px-5 py-2.5 text-[11px] uppercase tracking-[0.25em] text-red-400 transition hover:bg-red-500/10">
                        <Zap className="size-3" />
                        Compare DNA
                      </button>
                    </div>
                  )}

                  {/* ─── Tab: Mutation Recorder ─── */}
                  {analyzeTab === "recorder" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="micro-label">Select Patient</label>
                        <select value={recId} onChange={e => setRecId(e.target.value)}
                          className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-sm text-white/90 outline-none focus:border-white/30">
                          <option value="">Select patient…</option>
                          {getProfiles().filter(p => p.dna && p.dna.length >= 3).map(p => <option key={p.id} value={p.id}>{p.id} — {p.name} ({p.dna.length} bp)</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="micro-label">New DNA Sample</label>
                        <textarea value={recDna} onChange={e => setRecDna(e.target.value)} rows={4}
                          placeholder="Paste the patient's latest DNA sequence — only A, T, G, C"
                          className="w-full resize-none rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-xs text-white/90 placeholder-white/20 outline-none focus:border-white/30" />
                      </div>
                      <button onClick={handleMutationRecord}
                        className="inline-flex items-center gap-2 rounded-sm border border-red-500/60 bg-transparent px-5 py-2.5 text-[11px] uppercase tracking-[0.25em] text-red-400 transition hover:bg-red-500/10">
                        <Activity className="size-3" />
                        Scan for Mutations
                      </button>
                    </div>
                  )}

                  {/* ─── Tab: Manual DNA Match ─── */}
                  {analyzeTab === "match" && (
                    <div className="space-y-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="micro-label">Reference Sequence</label>
                          <textarea value={baseSeq} onChange={e => setBaseSeq(e.target.value)} rows={4}
                            placeholder="Paste reference DNA — only A, T, G, C"
                            className="w-full resize-none rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-xs text-white/90 placeholder-white/20 outline-none focus:border-white/30" />
                        </div>
                        <div className="space-y-2">
                          <label className="micro-label">Sample Sequence</label>
                          <textarea value={sampleSeq} onChange={e => setSampleSeq(e.target.value)} rows={4}
                            placeholder="Paste sample DNA — only A, T, G, C"
                            className="w-full resize-none rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-xs text-white/90 placeholder-white/20 outline-none focus:border-white/30" />
                        </div>
                      </div>
                      <button onClick={handleManualScan}
                        className="inline-flex items-center gap-2 rounded-sm border border-red-500/60 bg-transparent px-5 py-2.5 text-[11px] uppercase tracking-[0.25em] text-red-400 transition hover:bg-red-500/10">
                        <Zap className="size-3" />
                        Scan Mutations
                      </button>
                    </div>
                  )}

                  {/* ─── Tab: Single Sequence ─── */}
                  {analyzeTab === "single" && (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="micro-label">DNA Sequence</label>
                        <textarea value={singleSeq} onChange={e => setSingleSeq(e.target.value)} rows={4}
                          placeholder="Paste a DNA sequence for nucleotide, codon, and ORF analysis"
                          className="w-full resize-none rounded-xl border border-white/15 bg-black/40 px-4 py-3 font-mono text-xs text-white/90 placeholder-white/20 outline-none focus:border-white/30" />
                      </div>
                      <button onClick={handleSingleAnalyze}
                        className="inline-flex items-center gap-2 rounded-sm border border-red-500/60 bg-transparent px-5 py-2.5 text-[11px] uppercase tracking-[0.25em] text-red-400 transition hover:bg-red-500/10">
                        <ClipboardList className="size-3" />
                        Analyze Sequence
                      </button>
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button onClick={resetAnalyzer}
                      className="inline-flex items-center gap-2 bg-transparent px-0 py-2 text-[11px] uppercase tracking-[0.22em] text-white/30 transition hover:text-white/60">
                      <RotateCcw className="size-3" />
                      Reset
                    </button>
                  </div>
                </motion.div>

                {/* ═══════════ Results ═══════════ */}
                <AnimatePresence>
                  {(scanResult || singleStats) && (
                    <motion.div ref={resultsRef} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: revealEase }} className="space-y-6">

                      {/* ── Scan results (compare / recorder / manual) ── */}
                      {scanResult && (
                        <>
                          {/* Label bar */}
                          {(cmpLabel.a || cmpLabel.b) && (
                            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                              <span>{cmpLabel.a}</span>
                              <span className="text-white/20">vs</span>
                              <span>{cmpLabel.b}</span>
                            </div>
                          )}

                          {/* Summary stats — terminal card style */}
                          <div className="grid gap-px sm:grid-cols-2 xl:grid-cols-4 border border-white/[0.08]">
                            {[
                              { label: "SIMILARITY", value: `${scanResult.similarity.toFixed(1)}%`, sub: `${scanResult.mutations.length} mut` },
                              { label: "TS/TV", value: scanResult.tsTvRatio.toFixed(2), sub: `Ts:${scanResult.tsCount} Tv:${scanResult.tvCount}` },
                              { label: cmpLabel.a ? cmpLabel.a.substring(0, 12).toUpperCase() : "REF", value: `${scanResult.lengthA}bp`, sub: `GC ${scanResult.gcA.toFixed(1)}%` },
                              { label: cmpLabel.b ? cmpLabel.b.substring(0, 12).toUpperCase() : "SAMPLE", value: `${scanResult.lengthB}bp`, sub: `GC ${scanResult.gcB.toFixed(1)}%` },
                            ].map(s => (
                              <div key={s.label} className="border-r border-white/[0.08] last:border-r-0 p-4">
                                <p className="font-mono text-[9px] tracking-[0.3em] text-white/35 uppercase mb-2">{s.label}</p>
                                <p className="font-mono text-2xl font-bold text-white leading-none">{s.value}</p>
                                <p className="font-mono text-[10px] text-white/30 mt-1">{s.sub}</p>
                              </div>
                            ))}
                          </div>

                          {/* Risk tally */}
                          <div className="flex flex-wrap gap-2">
                            {([
                              { risk: "CRITICAL" as RiskLevel, count: scanResult.criticalCount },
                              { risk: "HIGH" as RiskLevel, count: scanResult.highCount },
                              { risk: "MODERATE" as RiskLevel, count: scanResult.moderateCount },
                              { risk: "LOW" as RiskLevel, count: scanResult.lowCount },
                            ]).map(({ risk, count }) => (
                              <div key={risk} className={`flex items-center gap-2 border px-2.5 py-1 rounded-none ${riskConfig[risk].cls}`}>
                                <span className="font-mono text-[10px] tracking-[0.2em]">{risk}</span>
                                <span className="font-mono text-[10px] text-white/40">{count}</span>
                              </div>
                            ))}
                          </div>

                          {/* Cancer risk warning */}
                          {(scanResult.criticalCount > 0 || scanResult.highCount > 0) && (
                            <div className="border-l-2 border-red-500/60 pl-4 py-1">
                              <p className="font-mono text-[11px] text-red-400/80 tracking-wide">Oncogenic risk detected — {scanResult.criticalCount} CRITICAL, {scanResult.highCount} HIGH. Clinical review recommended.</p>
                            </div>
                          )}

                          {/* Mutation Recorder: save to patient button */}
                          {analyzeTab === "recorder" && scanResult.mutations.length > 0 && !recSaved && (
                            <div className="flex items-center gap-4 border border-white/[0.08] px-4 py-3">
                              <span className="font-mono text-[11px] text-white/50 flex-1">{scanResult.mutations.length} mutation{scanResult.mutations.length > 1 ? "s" : ""} — save to patient record?</span>
                              <button onClick={handleSaveMutations}
                                className="inline-flex items-center gap-1.5 rounded-sm border border-white/20 px-4 py-1.5 font-mono text-[11px] tracking-[0.2em] text-white/60 transition hover:border-white/40 hover:text-white/80">
                                <Save className="size-3" />
                                Save
                              </button>
                            </div>
                          )}

                          {/* Mutation table */}
                          {scanResult.mutations.length > 0 ? (
                            <div className="mutatrack-glass overflow-hidden rounded-2xl">
                              <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                                <p className="micro-label m-0">Mutation Table ({scanResult.mutations.length} events)</p>
                                <button onClick={handleDownload} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white/70 transition hover:text-white">
                                  <Download className="h-3.5 w-3.5" />
                                  Export .txt
                                </button>
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-left font-mono text-xs">
                                  <thead>
                                    <tr className="border-b border-white/8 text-white/40">
                                      {["#", "Pos", "Change", "Type", "AA Effect", "Risk", "Codon", "AA Change"].map(h => (
                                        <th key={h} className="px-4 py-3 font-normal uppercase tracking-[0.18em]">{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {scanResult.mutations.slice(0, 50).map((m, i) => (
                                      <tr key={i} className="border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                                        <td className="px-4 py-2.5 text-white/30">{i + 1}</td>
                                        <td className="px-4 py-2.5 text-white/70">{m.position}</td>
                                        <td className="px-4 py-2.5 font-semibold text-white">{m.original}→{m.mutated}</td>
                                        <td className="px-4 py-2.5 text-white/60">{m.mutType}</td>
                                        <td className="px-4 py-2.5 text-white/60">{m.aaEffect}</td>
                                        <td className="px-4 py-2.5"><RiskBadge risk={m.risk} /></td>
                                        <td className="px-4 py-2.5 text-white/50">{m.origCodon}→{m.mutCodon}</td>
                                        <td className="px-4 py-2.5 text-white/50 max-w-[180px] truncate">{m.origAA}→{m.mutAA}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {scanResult.mutations.length > 50 && (
                                  <p className="px-6 py-3 text-[11px] text-white/35">Showing first 50 of {scanResult.mutations.length} mutations. Export for full report.</p>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="border-l-2 border-white/15 pl-4 py-1">
                              <p className="font-mono text-[11px] text-white/40">No mutations detected — sequences are identical.</p>
                            </div>
                          )}
                        </>
                      )}

                      {/* ── Single sequence stats ── */}
                      {singleStats && (
                        <div className="space-y-6">
                          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {[
                              { label: "Length", value: `${singleStats.length} bp` },
                              { label: "GC Content", value: `${singleStats.gc.toFixed(1)}%`, sub: singleStats.gcLabel },
                              { label: "ORFs found", value: String(singleStats.orfs.length) },
                              { label: "Codons", value: String(singleStats.codons.length), sub: "(first 20)" },
                            ].map(s => (
                              <div key={s.label} className="stat-card rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                                <p className="micro-label mb-3">{s.label}</p>
                                <p className="font-display text-3xl font-bold tracking-[-0.06em]">{s.value}</p>
                                {s.sub && <p className="mt-1 text-xs text-white/45">{s.sub}</p>}
                              </div>
                            ))}
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="mutatrack-glass rounded-2xl p-6">
                              <p className="micro-label mb-4">Nucleotide Composition</p>
                              <div className="space-y-2">
                                {(["a", "t", "g", "c"] as const).map(n => (
                                  <div key={n} className="flex items-center gap-3">
                                    <span className="w-4 font-mono text-xs uppercase text-white/50">{n}</span>
                                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                                      <div className={`absolute inset-y-0 left-0 rounded-full ${n === "g" || n === "c" ? "bg-gradient-to-r from-red-500/60 to-red-400/30" : "bg-gradient-to-r from-white/40 to-white/20"}`} style={{ width: `${singleStats[`${n}Pct` as 'aPct' | 'tPct' | 'gPct' | 'cPct']}%` }} />
                                    </div>
                                    <span className="w-12 text-right font-mono text-xs text-white/60">{singleStats[`${n}Pct` as 'aPct' | 'tPct' | 'gPct' | 'cPct'].toFixed(1)}%</span>
                                  </div>
                                ))}
                              </div>
                              <p className="mt-5 font-mono text-xs text-white/40 leading-relaxed">RNA: {singleStats.rnaTranscript}</p>
                            </div>

                            <div className="mutatrack-glass rounded-2xl p-6">
                              <p className="micro-label mb-4">Codon Translation (first 20)</p>
                              <div className="max-h-48 overflow-y-auto space-y-1">
                                {singleStats.codons.map((c, i) => (
                                  <div key={i} className="flex items-center gap-3 font-mono text-xs">
                                    <span className="text-white/40">{String(i + 1).padStart(2, '0')}</span>
                                    <span className="text-white/80">{c.codon}</span>
                                    <span className="text-white/40">→</span>
                                    <span className={c.aa.startsWith("STOP") ? "text-red-400" : "text-white/60"}>{c.aa}</span>
                                  </div>
                                ))}
                              </div>
                              {singleStats.orfs.length > 0 && (
                                <div className="mt-5 border-t border-white/10 pt-4">
                                  <p className="micro-label mb-2">Open Reading Frames</p>
                                  {singleStats.orfs.slice(0, 4).map((o, i) => (
                                    <p key={i} className="font-mono text-xs text-white/50">ORF {i + 1}: start={o.start} stop={o.stop} len={o.length}bp</p>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </section>

          <section id="about" className="section-shell px-8 md:px-16">
            <div className="container">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                variants={stagger}
                className="mutatrack-glass relative overflow-hidden rounded-[2rem] px-7 py-10 md:px-12 md:py-14">
                <div className="absolute right-6 top-6 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-red-400 md:right-10 md:top-10 risk-pulse">
                  Cancer Detection Engine
                </div>
                <div className="absolute inset-y-0 right-0 hidden w-[38%] bg-gradient-to-l from-red-500/10 via-transparent to-transparent lg:block" />

                <motion.div variants={fadeUp}>
                  <SectionLabel>About</SectionLabel>
                  <h2 className="font-display max-w-4xl text-5xl font-bold uppercase leading-[0.9] tracking-[-0.08em] md:text-7xl lg:text-8xl">
                    Detect / Classify / <span className="text-red-500">Act</span>
                  </h2>
                </motion.div>

                <motion.div variants={stagger} className="mt-12 grid gap-6 lg:grid-cols-[0.95fr_0.85fr_1.1fr]">
                  <motion.div variants={fadeUp} className="mutatrack-glass rounded-2xl p-8">
                    <p className="micro-label">Freshness index</p>
                    <p className="mt-5 font-display text-6xl font-bold tracking-[-0.08em]">98%</p>
                    <p className="mt-2 text-sm uppercase tracking-[0.22em] text-white/60">Accuracy in risk classification</p>
                    <a
                      href="#research"
                      className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-[11px] uppercase tracking-[0.22em] text-white transition hover:border-white/30 hover:bg-white/8">
                      Learn more
                      <ChevronRight className="h-4 w-4 text-red-500" />
                    </a>
                  </motion.div>

                  <motion.div variants={fadeUp} className="mutatrack-glass rounded-2xl p-8">
                    <p className="micro-label mb-6">Feature checklist</p>
                    <div className="space-y-4">
                      {checklist.map((item) => (
                        <div key={item} className="flex items-center justify-between border-b border-white/8 pb-4 last:border-b-0 last:pb-0">
                          <span className="font-display text-2xl uppercase tracking-[-0.05em]">{item}</span>
                          <Check className="h-5 w-5 text-red-500" />
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div variants={fadeUp} className="relative overflow-hidden rounded-2xl border border-white/15">
                    <img
                      src="https://d2xsxph8kpxj0f.cloudfront.net/310519663569425099/AbQHjmSbxmpJKKAMyBKBDv/mutatrack-feature-specimen-panel-HwE5LH3PMKoz8EiWUf9USp.webp"
                      alt="Mutation specimen visualization"
                      className="h-full min-h-[24rem] w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/32 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-4 p-7">
                      <p className="max-w-md text-sm leading-7 text-white/78">
                        Run your first mutation scan and get a free genomic risk report.
                      </p>
                      <a
                        href="#analyze"
                        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 transition hover:-translate-y-1 hover:border-red-500/40 hover:bg-red-500/10">
                        <ArrowUpRight className="h-5 w-5 text-white" />
                      </a>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </section>


          <section id="research" className="section-shell px-8 md:px-16">
            <div className="container">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                variants={stagger}
                className="space-y-12">
                <motion.div variants={fadeUp} className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
                  <div>
                    <SectionLabel>Research</SectionLabel>
                    <h2 className="font-display text-5xl font-bold uppercase leading-[0.9] tracking-[-0.08em] md:text-7xl">
                      The Pipeline
                    </h2>
                    <p className="mt-4 font-display text-3xl uppercase tracking-[-0.05em] text-red-500 md:text-5xl">
                      From sequence to clinical insight
                    </p>
                  </div>
                  <p className="max-w-xl text-sm leading-7 text-white/70 lg:justify-self-end">
                    A disciplined analysis path keeps results interpretable. MUTATRACK moves from raw sequence input to
                    clinically structured reporting without losing provenance at any stage.
                  </p>
                </motion.div>

                <motion.div variants={stagger} className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {processSteps.map((step) => (
                    <motion.div
                      key={step.number}
                      variants={fadeUp}
                      className="group mutatrack-glass relative overflow-hidden rounded-2xl p-8">
                      <span className="absolute left-0 top-0 h-[2px] w-full origin-left scale-x-0 bg-red-500 transition-transform duration-500 group-hover:scale-x-100" />
                      <p className="text-xs uppercase tracking-[0.24em] text-red-500">{step.number}</p>
                      <h3 className="mt-5 font-display text-3xl uppercase tracking-[-0.05em]">{step.title}</h3>
                      <p className="mt-4 text-sm leading-7 text-white/70">{step.description}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </section>

          <section className="section-shell px-8 md:px-16">
            <div className="container">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                variants={stagger}
                className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-8 md:p-10">
                <motion.div variants={fadeUp} className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div>
                    <SectionLabel>System metrics</SectionLabel>
                    <h2 className="font-display text-4xl font-bold uppercase tracking-[-0.07em] md:text-6xl">
                      Trusted performance, measured precisely
                    </h2>
                  </div>
                </motion.div>

                <motion.div variants={stagger} className="grid gap-px overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">
                  {stats.map((stat) => (
                    <motion.div key={stat.label} variants={fadeUp} className="bg-black/90 p-8 md:p-10">
                      <div className="flex items-start text-5xl font-bold tracking-[-0.08em] text-white md:text-7xl">
                        <span>{stat.value}</span>
                        {stat.suffix && <span className="text-red-500">{stat.suffix}</span>}
                      </div>
                      <p className="mt-5 max-w-[16rem] text-sm leading-7 text-white/68">{stat.label}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </section>

          <section className="section-shell px-8 md:px-16">
            <div className="container">
              <div className="grid gap-12 lg:grid-cols-[0.38fr_0.62fr]">
                <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={fadeUp}>
                  <SectionLabel>FAQ</SectionLabel>
                  <h2 className="font-display text-5xl font-bold uppercase tracking-[-0.07em] md:text-7xl">
                    Common questions
                  </h2>
                </motion.div>

                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={viewport}
                  variants={stagger}
                  className="border-t border-white/10 lg:border-t-0">
                  {faqs.map((faq, index) => {
                    const isOpen = openIndex === index;
                    return (
                      <motion.div key={faq.question} variants={fadeUp} className="border-b border-white/10 py-6">
                        <button
                          type="button"
                          onClick={() => setOpenIndex(isOpen ? null : index)}
                          className="flex w-full items-start justify-between gap-6 text-left">
                          <span className="font-display pr-4 text-2xl uppercase leading-tight tracking-[-0.05em] md:text-3xl">
                            {faq.question}
                          </span>
                          <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/5">
                            {isOpen ? <Minus className="h-5 w-5 text-red-500" /> : <Plus className="h-5 w-5 text-white" />}
                          </span>
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.35, ease: revealEase }}
                              className="overflow-hidden">
                              <p className="max-w-3xl pt-5 text-sm leading-7 text-white/72">{faq.answer}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </div>
          </section>

          <section id="contact" className="section-shell px-8 pb-16 md:px-16 md:pb-24">
            <div className="container">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                variants={stagger}
                className="mutatrack-glass rounded-[2rem] px-8 py-14 md:px-14">
                <motion.div variants={fadeUp} className="mb-12 text-center">
                  <SectionLabel>Contact</SectionLabel>
                  <h2 className="font-display text-4xl font-bold uppercase tracking-[-0.06em] md:text-5xl">Get in touch</h2>
                  <p className="mt-4 text-sm text-white/55">Questions about MutaTrack or want to collaborate with the team?</p>
                </motion.div>

                <motion.div variants={stagger} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                  {[
                    { name: "Tvisha Thakur",     email: "tvisha.thakur2025@vitstudent.ac.in",      initials: "TT" },
                    { name: "Aryan Kothekar",   email: "aryan.kothekar2025@vitstudent.ac.in",     initials: "AK" },
                    { name: "Someshwar",         email: "someshwar.2025@vitstudent.ac.in",         initials: "S"  },
                    { name: "Arjun Mishra",      email: "arjun.mishra2025@vitstudent.ac.in",       initials: "AM" },
                    { name: "Harsha Kaditya",    email: "harshakaditya.k2025@vitstudent.ac.in",   initials: "HK" },
                  ].map(({ name, email, initials }) => (
                    <motion.a
                      key={email}
                      variants={fadeUp}
                      href={`mailto:${email}`}
                      className="group flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-8 text-center transition-all duration-300 hover:border-red-500/30 hover:bg-red-500/[0.04]"
                    >
                      {/* Avatar */}
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/15 bg-white/8 font-display text-lg font-bold uppercase tracking-wider text-white/80 transition-all duration-300 group-hover:border-red-500/40 group-hover:bg-red-500/10 group-hover:text-red-300">
                        {initials}
                      </div>
                      {/* Name */}
                      <div>
                        <p className="font-display text-base font-semibold uppercase tracking-[-0.02em] text-white/90">{name}</p>
                        <p className="mt-2 break-all font-mono text-[11px] leading-5 text-white/40 transition-colors group-hover:text-red-400/70">{email}</p>
                      </div>
                      {/* Arrow */}
                      <ArrowUpRight className="h-4 w-4 text-white/20 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-red-400/60" />
                    </motion.a>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </section>
        </main>

        <footer className="border-t border-white/10 px-8 py-10 md:px-16">
          <div className="container">
            <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <a href="#home" className="flex items-center gap-3 text-sm font-semibold tracking-[0.24em] uppercase">
                  <span className="red-dot text-xl leading-none">●</span>
                  <span className="font-display text-lg tracking-[0.18em]">MUTATRACK</span>
                </a>
                <p className="mt-5 max-w-xs text-sm leading-7 text-white/68">Sequence. Detect. Protect.</p>
              </div>

              <div>
                <p className="micro-label mb-5">Analysis</p>
                <div className="space-y-3 text-sm text-white/70">
                  <a href="#analyze" className="block transition-colors hover:text-white">Mutation Scanning</a>
                  <a href="#research" className="block transition-colors hover:text-white">Pipeline</a>
                  <a href="#about" className="block transition-colors hover:text-white">Risk Classification</a>
                </div>
              </div>

              <div>
                <p className="micro-label mb-5">Research</p>
                <div className="space-y-3 text-sm text-white/70">
                  <a href="#research" className="block transition-colors hover:text-white">ORF Detection</a>
                  <a href="#research" className="block transition-colors hover:text-white">Codon Analysis</a>
                  <a href="#about" className="block transition-colors hover:text-white">Cancer Detection</a>
                </div>
              </div>

              <div>
                <p className="micro-label mb-5">Support</p>
                <div className="space-y-3 text-sm text-white/70">
                  <a href="#contact" className="block transition-colors hover:text-white">Contact</a>
                  <a href="#home" className="block transition-colors hover:text-white">Run Analysis</a>
                  <a href="#home" className="block transition-colors hover:text-white">Documentation</a>
                </div>
              </div>
            </div>

            <div className="mt-12 flex flex-col gap-5 border-t border-white/10 pt-6 text-xs uppercase tracking-[0.2em] text-white/52 md:flex-row md:items-center md:justify-between">
              <p>© 2026 MutaTrack</p>
              <div className="flex items-center gap-6">
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
                  Twitter
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
                  LinkedIn
                  <Linkedin className="h-4 w-4" />
                </a>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white">
                  GitHub
                  <Github className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
