/**
 * patientStore.ts
 * localStorage-backed patient profile store that mirrors dna.c's file persistence:
 *   profiles.txt          → MUTATRACK_PROFILES  (JSON array of PatientProfile)
 *   mutations_<ID>.txt    → MUTATRACK_MUTS_<ID> (JSON array of StoredMutation)
 */

import { type MutationResult, analyseSequence, type SequenceStats } from "./dnaEngine";

export interface PatientProfile {
  id: string;         // e.g. "P001"
  name: string;
  dna: string;        // normalised uppercase
  createdAt: string;  // ISO date string
}

export interface StoredMutation {
  position: number;
  original: string;
  mutated: string;
  mutType: string;
  aaEffect: string;
  risk: string;
  origCodon: string;
  mutCodon: string;
  origAA: string;
  mutAA: string;
  date: string;
  notes: string;
}

const PROFILES_KEY = "MUTATRACK_PROFILES";

function mutKey(id: string) {
  return `MUTATRACK_MUTS_${id.toUpperCase()}`;
}

// ─── Profile CRUD ─────────────────────────────────────────────────────────────

export function getProfiles(): PatientProfile[] {
  try {
    return JSON.parse(localStorage.getItem(PROFILES_KEY) ?? "[]");
  } catch { return []; }
}

function saveProfiles(profiles: PatientProfile[]) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

export function getProfile(id: string): PatientProfile | null {
  return getProfiles().find(p => p.id.toUpperCase() === id.toUpperCase()) ?? null;
}

export function saveProfile(p: PatientProfile) {
  const profiles = getProfiles().filter(x => x.id.toUpperCase() !== p.id.toUpperCase());
  profiles.push(p);
  saveProfiles(profiles);
}

export function deleteProfile(id: string) {
  saveProfiles(getProfiles().filter(p => p.id.toUpperCase() !== id.toUpperCase()));
  localStorage.removeItem(mutKey(id));
}

// ─── Mutation CRUD ────────────────────────────────────────────────────────────

export function getMutations(id: string): StoredMutation[] {
  try {
    return JSON.parse(localStorage.getItem(mutKey(id)) ?? "[]");
  } catch { return []; }
}

export function appendMutation(id: string, m: StoredMutation) {
  const muts = getMutations(id);
  muts.push(m);
  localStorage.setItem(mutKey(id), JSON.stringify(muts));
}

export function appendMutations(id: string, muts: MutationResult[], notes = "") {
  const today = new Date().toISOString().slice(0, 10);
  for (const m of muts) {
    appendMutation(id, {
      position: m.position,
      original: m.original,
      mutated: m.mutated,
      mutType: m.mutType,
      aaEffect: m.aaEffect,
      risk: m.risk,
      origCodon: m.origCodon,
      mutCodon: m.mutCodon,
      origAA: m.origAA,
      mutAA: m.mutAA,
      date: today,
      notes,
    });
  }
}

// ─── Cancer Risk Summary ──────────────────────────────────────────────────────
// Based on the same amino-acid group theory used in dna.c:
//   CRITICAL + HIGH mutations are the clinically significant signal.
//   Elevated Ts/Tv, STOP-codon introduction, and specific AA changes
//   (charged↔nonpolar) are known oncogenic indicators.

export interface CancerRiskSummary {
  level: "HIGH" | "MODERATE" | "LOW" | "INSUFFICIENT DATA";
  headline: string;
  detail: string;
  indicators: string[];
}

export function computeCancerRisk(
  muts: StoredMutation[],
  stats: SequenceStats
): CancerRiskSummary {
  if (muts.length === 0) {
    return {
      level: "INSUFFICIENT DATA",
      headline: "No mutation history recorded",
      detail: "Run a DNA scan and record mutations to generate a cancer risk assessment.",
      indicators: [],
    };
  }

  const critical = muts.filter(m => m.risk === "CRITICAL").length;
  const high = muts.filter(m => m.risk === "HIGH").length;
  const moderate = muts.filter(m => m.risk === "MODERATE").length;
  const nonSyn = muts.filter(m => m.aaEffect === "Non-synonymous").length;
  const totalMuts = muts.length;
  const mutRate = totalMuts / (stats.length || 1);

  const indicators: string[] = [];

  if (critical > 0) indicators.push(`${critical} STOP-codon mutation${critical > 1 ? "s" : ""} detected — protein truncation risk`);
  if (high > 0) indicators.push(`${high} radical amino acid substitution${high > 1 ? "s" : ""} (cross-group) — functional protein disruption`);
  if (moderate > 0) indicators.push(`${moderate} conservative substitution${moderate > 1 ? "s" : ""} — structural protein stress`);
  if (nonSyn > 0) indicators.push(`${nonSyn} non-synonymous mutation${nonSyn > 1 ? "s" : ""} alter the protein sequence`);
  if (mutRate > 0.05) indicators.push(`High mutation rate (${(mutRate * 100).toFixed(2)}% per base) — genomic instability signal`);
  if (stats.gc < 38 || stats.gc > 62) indicators.push(`GC content ${stats.gc.toFixed(1)}% (${stats.gcLabel}) — atypical genome composition`);
  if (stats.orfs.length > 0) indicators.push(`${stats.orfs.length} open reading frame${stats.orfs.length > 1 ? "s" : ""} detected — active coding regions under mutational pressure`);

  if (critical >= 1 || (high >= 2) || (high >= 1 && critical >= 1)) {
    return {
      level: "HIGH",
      headline: "Elevated oncogenic risk detected",
      detail: `This profile contains ${critical + high} high-severity mutation${critical + high > 1 ? "s" : ""} with direct protein-level consequences. STOP codon introductions truncate proteins critical to cell-cycle regulation, and radical amino acid substitutions can activate oncogenes or silence tumour suppressor pathways. Immediate clinical review is recommended.`,
      indicators,
    };
  }

  if (high >= 1 || moderate >= 3 || (nonSyn / totalMuts) > 0.6) {
    return {
      level: "MODERATE",
      headline: "Moderate mutation burden — clinical monitoring advised",
      detail: `Non-synonymous mutations accumulate across this profile, increasing the probability of progressive protein dysfunction. While no STOP codon event is recorded, the ${nonSyn} non-synonymous change${nonSyn > 1 ? "s" : ""} represent ongoing selective pressure on coding regions associated with oncogenesis if left unmonitored.`,
      indicators,
    };
  }

  return {
    level: "LOW",
    headline: "Low-risk mutation profile",
    detail: "Current records show predominantly synonymous or conservative mutations with low structural impact. Continued periodic monitoring is advised as additional scan data accumulates.",
    indicators,
  };
}
