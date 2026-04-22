/**
 * dnaEngine.ts — TypeScript port of dna.c
 * Implements: codon table, mutation type, risk level, AA effect,
 * sequence analysis, ORF detection, and DNA comparison.
 */

// ─── Codon Table (all 64 standard codons) ────────────────────────────────────
const CODONS: Record<string, string> = {
  TTT: "Phenylalanine", TTC: "Phenylalanine",
  TTA: "Leucine",       TTG: "Leucine",
  CTT: "Leucine",       CTC: "Leucine",
  CTA: "Leucine",       CTG: "Leucine",
  ATT: "Isoleucine",    ATC: "Isoleucine",
  ATA: "Isoleucine",    ATG: "Methionine(START)",
  GTT: "Valine",        GTC: "Valine",
  GTA: "Valine",        GTG: "Valine",
  TCT: "Serine",        TCC: "Serine",
  TCA: "Serine",        TCG: "Serine",
  CCT: "Proline",       CCC: "Proline",
  CCA: "Proline",       CCG: "Proline",
  ACT: "Threonine",     ACC: "Threonine",
  ACA: "Threonine",     ACG: "Threonine",
  GCT: "Alanine",       GCC: "Alanine",
  GCA: "Alanine",       GCG: "Alanine",
  TAT: "Tyrosine",      TAC: "Tyrosine",
  TAA: "STOP(Ochre)",   TAG: "STOP(Amber)",
  CAT: "Histidine",     CAC: "Histidine",
  CAA: "Glutamine",     CAG: "Glutamine",
  AAT: "Asparagine",    AAC: "Asparagine",
  AAA: "Lysine",        AAG: "Lysine",
  GAT: "Aspartate",     GAC: "Aspartate",
  GAA: "Glutamate",     GAG: "Glutamate",
  TGT: "Cysteine",      TGC: "Cysteine",
  TGA: "STOP(Opal)",    TGG: "Tryptophan",
  CGT: "Arginine",      CGC: "Arginine",
  CGA: "Arginine",      CGG: "Arginine",
  AGT: "Serine",        AGC: "Serine",
  AGA: "Arginine",      AGG: "Arginine",
  GGT: "Glycine",       GGC: "Glycine",
  GGA: "Glycine",       GGG: "Glycine",
};

export function lookupCodon(codon: string): string {
  return CODONS[codon] ?? "Unknown";
}

// ─── Validation ───────────────────────────────────────────────────────────────
export function isValidDNA(s: string): boolean {
  if (!s || s.length === 0) return false;
  return /^[ATGC]+$/i.test(s);
}

export function normalizeDNA(s: string): string {
  return s.toUpperCase().replace(/[^ATGC]/g, "");
}

// ─── Mutation Type: Transition vs Transversion ────────────────────────────────
export function getMutationType(from: string, to: string): "Transition" | "Transversion" {
  const purines = new Set(["A", "G"]);
  const fromPur = purines.has(from);
  const toPur = purines.has(to);
  return fromPur === toPur ? "Transition" : "Transversion";
}

// ─── Amino Acid Group ─────────────────────────────────────────────────────────
// 0=Nonpolar/Hydrophobic, 1=Polar uncharged, 2=Positively charged,
// 3=Negatively charged, 4=STOP/Unknown
function getAAGroup(aa: string): number {
  if (["Alanine","Valine","Leucine","Isoleucine","Proline",
       "Phenylalanine","Tryptophan","Methionine(START)"].some(x => aa.startsWith(x.split("(")[0]))) return 0;
  if (["Serine","Threonine","Cysteine","Tyrosine","Asparagine","Glutamine","Glycine"]
       .some(x => aa.startsWith(x))) return 1;
  if (["Lysine","Arginine","Histidine"].some(x => aa.startsWith(x))) return 2;
  if (["Aspartate","Glutamate"].some(x => aa.startsWith(x))) return 3;
  return 4; // STOP or unknown
}

// ─── Risk Level ───────────────────────────────────────────────────────────────
export type RiskLevel = "CRITICAL" | "HIGH" | "MODERATE" | "LOW";

export function getRiskLevel(baseDNA: string, pos: number, mutated: string): RiskLevel {
  // pos is 0-indexed
  const len = baseDNA.length;
  const codonStart = Math.floor(pos / 3) * 3;
  if (codonStart + 2 >= len) return "LOW";

  const origCodon = baseDNA.slice(codonStart, codonStart + 3);
  const mutCodonArr = origCodon.split("");
  mutCodonArr[pos % 3] = mutated;
  const mutCodon = mutCodonArr.join("");

  const aa1 = lookupCodon(origCodon);
  const aa2 = lookupCodon(mutCodon);

  if (aa1 === aa2) return "LOW";
  if (aa2.startsWith("STOP")) return "CRITICAL";
  if (aa1.startsWith("STOP")) return "HIGH";
  if (getAAGroup(aa1) !== getAAGroup(aa2)) return "HIGH";
  return "MODERATE";
}

// ─── Amino Acid Effect ────────────────────────────────────────────────────────
export function getAAEffect(baseDNA: string, pos: number, mutated: string): string {
  const len = baseDNA.length;
  const codonStart = Math.floor(pos / 3) * 3;
  if (codonStart + 2 >= len) return "N/A";

  const origCodon = baseDNA.slice(codonStart, codonStart + 3);
  const mutCodonArr = origCodon.split("");
  mutCodonArr[pos % 3] = mutated;
  const mutCodon = mutCodonArr.join("");

  const aa1 = lookupCodon(origCodon);
  const aa2 = lookupCodon(mutCodon);
  return aa1 === aa2 ? "Synonymous" : "Non-synonymous";
}

// ─── Mutation Result ──────────────────────────────────────────────────────────
export interface MutationResult {
  position: number;      // 1-based
  original: string;
  mutated: string;
  mutType: "Transition" | "Transversion";
  aaEffect: string;
  risk: RiskLevel;
  origCodon: string;
  mutCodon: string;
  origAA: string;
  mutAA: string;
}

// ─── Scan Two Sequences ───────────────────────────────────────────────────────
export interface ScanResult {
  mutations: MutationResult[];
  similarity: number;   // 0–100
  gcA: number;
  gcB: number;
  lengthA: number;
  lengthB: number;
  tsCount: number;
  tvCount: number;
  tsTvRatio: number;
  criticalCount: number;
  highCount: number;
  moderateCount: number;
  lowCount: number;
}

export function scanSequences(baseRaw: string, newRaw: string): ScanResult {
  const base = normalizeDNA(baseRaw);
  const sample = normalizeDNA(newRaw);
  const cmpLen = Math.min(base.length, sample.length);

  const mutations: MutationResult[] = [];
  let tsCount = 0, tvCount = 0;
  let critical = 0, high = 0, moderate = 0, low = 0;

  for (let i = 0; i < cmpLen; i++) {
    if (base[i] === sample[i]) continue;
    const mutType = getMutationType(base[i], sample[i]);
    const aaEffect = getAAEffect(base, i, sample[i]);
    const risk = getRiskLevel(base, i, sample[i]);

    const codonStart = Math.floor(i / 3) * 3;
    const origCodon = base.length >= codonStart + 3 ? base.slice(codonStart, codonStart + 3) : "N/A";
    const mutCodonArr = origCodon !== "N/A" ? origCodon.split("") : [];
    if (mutCodonArr.length === 3) mutCodonArr[i % 3] = sample[i];
    const mutCodon = mutCodonArr.length === 3 ? mutCodonArr.join("") : "N/A";

    mutations.push({
      position: i + 1,
      original: base[i],
      mutated: sample[i],
      mutType,
      aaEffect,
      risk,
      origCodon,
      mutCodon,
      origAA: origCodon !== "N/A" ? lookupCodon(origCodon) : "N/A",
      mutAA: mutCodon !== "N/A" ? lookupCodon(mutCodon) : "N/A",
    });

    if (mutType === "Transition") tsCount++; else tvCount++;
    if (risk === "CRITICAL") critical++;
    else if (risk === "HIGH") high++;
    else if (risk === "MODERATE") moderate++;
    else low++;
  }

  const gcA = calcGC(base);
  const gcB = calcGC(sample);
  const similarity = cmpLen > 0 ? ((cmpLen - mutations.length) / cmpLen) * 100 : 100;

  return {
    mutations,
    similarity,
    gcA,
    gcB,
    lengthA: base.length,
    lengthB: sample.length,
    tsCount,
    tvCount,
    tsTvRatio: tvCount > 0 ? tsCount / tvCount : 0,
    criticalCount: critical,
    highCount: high,
    moderateCount: moderate,
    lowCount: low,
  };
}

// ─── Sequence Analysis ────────────────────────────────────────────────────────
export interface SequenceStats {
  length: number;
  a: number; t: number; g: number; c: number;
  aPct: number; tPct: number; gPct: number; cPct: number;
  gc: number;
  gcLabel: "AT-rich" | "GC-rich" | "Balanced";
  rnaTranscript: string;
  orfs: ORF[];
  codons: { codon: string; aa: string }[];
}

export interface ORF {
  start: number;  // 1-based
  stop: number;   // 1-based
  length: number;
}

export function calcGC(dna: string): number {
  if (!dna.length) return 0;
  const gc = [...dna].filter(b => b === "G" || b === "C").length;
  return (gc / dna.length) * 100;
}

export function analyseSequence(rawDNA: string): SequenceStats {
  const dna = normalizeDNA(rawDNA);
  const len = dna.length;
  let a = 0, t = 0, g = 0, c = 0;
  for (const b of dna) {
    if (b === "A") a++;
    else if (b === "T") t++;
    else if (b === "G") g++;
    else if (b === "C") c++;
  }
  const gc = len > 0 ? ((g + c) / len) * 100 : 0;
  const gcLabel: "AT-rich" | "GC-rich" | "Balanced" = gc < 40 ? "AT-rich" : gc > 60 ? "GC-rich" : "Balanced";

  // RNA transcript (replace T→U, first 60 bases)
  const rnaTranscript = dna.slice(0, 60).replace(/T/g, "U") + (len > 60 ? "…" : "");

  // ORF detection (ATG → STOP)
  const orfs: ORF[] = [];
  for (let i = 0; i + 2 < len; i++) {
    if (dna.slice(i, i + 3) === "ATG") {
      for (let j = i; j + 2 < len; j += 3) {
        const codon = dna.slice(j, j + 3);
        if (codon === "TAA" || codon === "TAG" || codon === "TGA") {
          orfs.push({ start: i + 1, stop: j + 3, length: j + 3 - i });
          break;
        }
      }
    }
  }

  // Codon translation (first 20 codons)
  const codons: { codon: string; aa: string }[] = [];
  for (let i = 0; i + 2 < len && i < 60; i += 3) {
    const codon = dna.slice(i, i + 3);
    const aa = lookupCodon(codon);
    codons.push({ codon, aa });
    if (aa.startsWith("STOP")) break;
  }

  return {
    length: len,
    a, t, g, c,
    aPct: len ? (a / len) * 100 : 0,
    tPct: len ? (t / len) * 100 : 0,
    gPct: len ? (g / len) * 100 : 0,
    cPct: len ? (c / len) * 100 : 0,
    gc,
    gcLabel,
    rnaTranscript,
    orfs,
    codons,
  };
}
