/*
 * ================================================================
 *   DNA PROFILE & MUTATION TRACKING SYSTEM
 *   Language  : C (C99)
 *   Author    : [Your Name]
 *
 *   Features  :
 *     - Create & store person DNA profiles (files persist)
 *     - Scan a person's new DNA vs. their base for mutations
 *     - Record or discard each detected mutation individually
 *     - Full mutation history with type classification
 *     - Transition vs. Transversion labelling
 *     - Synonymous vs. Non-synonymous mutation (codon level)
 *     - Match any two sequences (manual or from profiles)
 *     - Similarity percentage, GC diff, mutation rate
 *     - Per-person mutation statistics
 *     - Full biochem analysis (nucleotide %, GC, RNA, ORF)
 *     - Delete profiles
 *     - Export person report to .txt file
 *     - Mutation risk classification (Critical / High / Moderate)
 *       based on amino acid group theory (radical vs conservative)
 *     - High-risk mutation filter view per person
 * ================================================================
 */

#include <ctype.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>


/* ── Constants ─────────────────────────────────────────────── */
#define MAX_LEN 10000
#define MAX_NAME 60
#define MAX_ID 20
#define MAX_NOTES 120
#define MAX_PERSONS 100
#define MAX_MUTS 500
#define PROFILES_FILE "profiles.txt"

/* ── Codon Table (all 64 standard codons) ──────────────────── */
typedef struct {
  char codon[4];
  char amino[22];
} CodonEntry;
static CodonEntry CODONS[] = {
    {"TTT", "Phenylalanine"}, {"TTC", "Phenylalanine"},
    {"TTA", "Leucine"},       {"TTG", "Leucine"},
    {"CTT", "Leucine"},       {"CTC", "Leucine"},
    {"CTA", "Leucine"},       {"CTG", "Leucine"},
    {"ATT", "Isoleucine"},    {"ATC", "Isoleucine"},
    {"ATA", "Isoleucine"},    {"ATG", "Methionine(START)"},
    {"GTT", "Valine"},        {"GTC", "Valine"},
    {"GTA", "Valine"},        {"GTG", "Valine"},
    {"TCT", "Serine"},        {"TCC", "Serine"},
    {"TCA", "Serine"},        {"TCG", "Serine"},
    {"CCT", "Proline"},       {"CCC", "Proline"},
    {"CCA", "Proline"},       {"CCG", "Proline"},
    {"ACT", "Threonine"},     {"ACC", "Threonine"},
    {"ACA", "Threonine"},     {"ACG", "Threonine"},
    {"GCT", "Alanine"},       {"GCC", "Alanine"},
    {"GCA", "Alanine"},       {"GCG", "Alanine"},
    {"TAT", "Tyrosine"},      {"TAC", "Tyrosine"},
    {"TAA", "STOP(Ochre)"},   {"TAG", "STOP(Amber)"},
    {"CAT", "Histidine"},     {"CAC", "Histidine"},
    {"CAA", "Glutamine"},     {"CAG", "Glutamine"},
    {"AAT", "Asparagine"},    {"AAC", "Asparagine"},
    {"AAA", "Lysine"},        {"AAG", "Lysine"},
    {"GAT", "Aspartate"},     {"GAC", "Aspartate"},
    {"GAA", "Glutamate"},     {"GAG", "Glutamate"},
    {"TGT", "Cysteine"},      {"TGC", "Cysteine"},
    {"TGA", "STOP(Opal)"},    {"TGG", "Tryptophan"},
    {"CGT", "Arginine"},      {"CGC", "Arginine"},
    {"CGA", "Arginine"},      {"CGG", "Arginine"},
    {"AGT", "Serine"},        {"AGC", "Serine"},
    {"AGA", "Arginine"},      {"AGG", "Arginine"},
    {"GGT", "Glycine"},       {"GGC", "Glycine"},
    {"GGA", "Glycine"},       {"GGG", "Glycine"}};
static const int CODON_COUNT = 64;

/* ── Data Structures ───────────────────────────────────────── */
typedef struct {
  char id[MAX_ID];
  char name[MAX_NAME];
  char base_dna[MAX_LEN];
} Person;

typedef struct {
  int position;       /* 1-based position in sequence     */
  char original;      /* base in reference DNA            */
  char mutated;       /* base in new sample               */
  char mut_type[20];  /* Transition / Transversion        */
  char aa_effect[30]; /* Synonymous / Non-synonymous      */
  char date[20];      /* YYYY-MM-DD                       */
  char notes[MAX_NOTES];
} Mutation;

/* ── Global profile store ──────────────────────────────────── */
static Person persons[MAX_PERSONS];
static int person_count = 0;

/* ─────────────────────────────────────────────────────────────
   UTILITY
   ───────────────────────────────────────────────────────────── */
void toUpper(char *s) {
  for (; *s; s++)
    *s = toupper((unsigned char)*s);
}

int isValidDNA(const char *s) {
  if (!s || strlen(s) == 0)
    return 0;
  for (; *s; s++)
    if (*s != 'A' && *s != 'T' && *s != 'G' && *s != 'C')
      return 0;
  return 1;
}

void getCurrentDate(char *buf) {
  time_t t = time(NULL);
  struct tm *tm = localtime(&t);
  strftime(buf, 20, "%Y-%m-%d", tm);
}

void printSep(char c, int n) {
  for (int i = 0; i < n; i++)
    putchar(c);
  putchar('\n');
}

void clearInput(void) {
  int ch;
  while ((ch = getchar()) != '\n' && ch != EOF)
    ;
}

/* ─────────────────────────────────────────────────────────────
   CODON LOOKUP
   ───────────────────────────────────────────────────────────── */
const char *lookupCodon(const char *c) {
  for (int i = 0; i < CODON_COUNT; i++)
    if (strcmp(CODONS[i].codon, c) == 0)
      return CODONS[i].amino;
  return "Unknown";
}

/* ─────────────────────────────────────────────────────────────
   MUTATION CLASSIFICATION
   ───────────────────────────────────────────────────────────── */

/* Transition: purine<->purine (A<->G) or pyrimidine<->pyrimidine (C<->T)
   Transversion: purine<->pyrimidine                                     */
void getMutationType(char from, char to, char *buf) {
  int fromPur = (from == 'A' || from == 'G');
  int toPur = (to == 'A' || to == 'G');
  if (fromPur == toPur)
    strcpy(buf, "Transition");
  else
    strcpy(buf, "Transversion");
}

/* ─────────────────────────────────────────────────────────────
   AMINO ACID GROUP & RISK CLASSIFICATION
   Groups (biochemical property):
     0 = Nonpolar/Hydrophobic : A V L I P F W M
     1 = Polar uncharged      : S T C Y N Q G
     2 = Positively charged   : K R H
     3 = Negatively charged   : D E
     4 = STOP / Unknown
   Risk:
     CRITICAL  — mutation introduces a STOP codon
     HIGH      — Non-synonymous, cross-group (radical substitution)
     MODERATE  — Non-synonymous, same group (conservative substitution)
     LOW       — Synonymous (no amino acid change)
   ───────────────────────────────────────────────────────────── */
int getAAGroup(const char *aa) {
  /* Nonpolar */
  if (strncmp(aa, "Alanine", 7) == 0 || strncmp(aa, "Valine", 6) == 0 ||
      strncmp(aa, "Leucine", 7) == 0 || strncmp(aa, "Isoleucine", 10) == 0 ||
      strncmp(aa, "Proline", 7) == 0 || strncmp(aa, "Phenylalanine", 13) == 0 ||
      strncmp(aa, "Tryptophan", 10) == 0 || strncmp(aa, "Methionine", 10) == 0)
    return 0;
  /* Polar uncharged */
  if (strncmp(aa, "Serine", 6) == 0 || strncmp(aa, "Threonine", 9) == 0 ||
      strncmp(aa, "Cysteine", 8) == 0 || strncmp(aa, "Tyrosine", 8) == 0 ||
      strncmp(aa, "Asparagine", 10) == 0 || strncmp(aa, "Glutamine", 9) == 0 ||
      strncmp(aa, "Glycine", 7) == 0)
    return 1;
  /* Positively charged */
  if (strncmp(aa, "Lysine", 6) == 0 || strncmp(aa, "Arginine", 8) == 0 ||
      strncmp(aa, "Histidine", 9) == 0)
    return 2;
  /* Negatively charged */
  if (strncmp(aa, "Aspartate", 9) == 0 || strncmp(aa, "Glutamate", 9) == 0)
    return 3;
  /* STOP or unknown */
  return 4;
}

/* Returns "CRITICAL", "HIGH", "MODERATE", or "LOW" */
void getRiskLevel(const char *base_dna, int pos, char mutated, char *buf) {
  int len = (int)strlen(base_dna);
  int codon_start = (pos / 3) * 3;

  if (codon_start + 2 >= len) {
    strcpy(buf, "LOW");
    return;
  }

  char orig_codon[4], mut_codon[4];
  orig_codon[0] = base_dna[codon_start];
  orig_codon[1] = base_dna[codon_start + 1];
  orig_codon[2] = base_dna[codon_start + 2];
  orig_codon[3] = '\0';
  memcpy(mut_codon, orig_codon, 4);
  mut_codon[pos % 3] = mutated;

  const char *aa1 = lookupCodon(orig_codon);
  const char *aa2 = lookupCodon(mut_codon);

  /* Synonymous = no risk */
  if (strcmp(aa1, aa2) == 0) {
    strcpy(buf, "LOW");
    return;
  }

  /* Introduces a STOP codon = critical */
  if (strncmp(aa2, "STOP", 4) == 0) {
    strcpy(buf, "CRITICAL");
    return;
  }

  /* Removes a STOP (read-through) = high */
  if (strncmp(aa1, "STOP", 4) == 0) {
    strcpy(buf, "HIGH");
    return;
  }

  /* Cross amino-acid group = high (radical), same group = moderate */
  if (getAAGroup(aa1) != getAAGroup(aa2))
    strcpy(buf, "HIGH");
  else
    strcpy(buf, "MODERATE");
}

/* Pretty-print risk with a visual indicator */
void printRisk(const char *risk) {
  if (strcmp(risk, "CRITICAL") == 0)
    printf("  [!!!] Risk: CRITICAL  -- protein truncated\n");
  else if (strcmp(risk, "HIGH") == 0)
    printf("  [!! ] Risk: HIGH      -- radical AA change\n");
  else if (strcmp(risk, "MODERATE") == 0)
    printf("  [!  ] Risk: MODERATE  -- conservative AA change\n");
  else
    printf("  [   ] Risk: LOW       -- synonymous, no AA change\n");
}

/* Check if mutation changes the amino acid (uses codon context) */
void getAAEffect(const char *base_dna, int pos, char mutated, char *buf) {
  int len = (int)strlen(base_dna);
  /* Find codon start (0-indexed) */
  int codon_start = (pos / 3) * 3;
  if (codon_start + 2 >= len) {
    strcpy(buf, "N/A");
    return;
  }

  char original_codon[4], mutated_codon[4];
  original_codon[0] = base_dna[codon_start];
  original_codon[1] = base_dna[codon_start + 1];
  original_codon[2] = base_dna[codon_start + 2];
  original_codon[3] = '\0';

  memcpy(mutated_codon, original_codon, 4);
  mutated_codon[pos % 3] = mutated;

  const char *aa1 = lookupCodon(original_codon);
  const char *aa2 = lookupCodon(mutated_codon);

  if (strcmp(aa1, aa2) == 0)
    strcpy(buf, "Synonymous");
  else
    strcpy(buf, "Non-synonymous");
}

/* ─────────────────────────────────────────────────────────────
   FILE I/O — PROFILES
   profiles.txt format:  ID|Name|BaseDNA
   ───────────────────────────────────────────────────────────── */
void loadProfiles(void) {
  FILE *fp = fopen(PROFILES_FILE, "r");
  if (!fp)
    return;

  char line[MAX_LEN + 100];
  person_count = 0;

  while (fgets(line, sizeof(line), fp) && person_count < MAX_PERSONS) {
    line[strcspn(line, "\r\n")] = '\0';
    if (strlen(line) == 0)
      continue;

    char *id = strtok(line, "|");
    char *name = strtok(NULL, "|");
    char *dna = strtok(NULL, "|");

    if (id && name && dna) {
      strncpy(persons[person_count].id, id, MAX_ID - 1);
      strncpy(persons[person_count].name, name, MAX_NAME - 1);
      strncpy(persons[person_count].base_dna, dna, MAX_LEN - 1);
      person_count++;
    }
  }
  fclose(fp);
}

void saveProfiles(void) {
  FILE *fp = fopen(PROFILES_FILE, "w");
  if (!fp) {
    printf("  [!] Could not save profiles.\n");
    return;
  }
  for (int i = 0; i < person_count; i++)
    fprintf(fp, "%s|%s|%s\n", persons[i].id, persons[i].name,
            persons[i].base_dna);
  fclose(fp);
}

/* ─────────────────────────────────────────────────────────────
   FILE I/O — MUTATIONS
   mutations_<ID>.txt format:
   Position|Original|Mutated|Type|AAEffect|Date|Notes
   ───────────────────────────────────────────────────────────── */
void getMutFile(const char *id, char *path) {
  snprintf(path, 60, "mutations_%s.txt", id);
}

int loadMutations(const char *id, Mutation *muts) {
  char path[60];
  getMutFile(id, path);
  FILE *fp = fopen(path, "r");
  if (!fp)
    return 0;

  char line[300];
  int count = 0;
  while (fgets(line, sizeof(line), fp) && count < MAX_MUTS) {
    line[strcspn(line, "\r\n")] = '\0';
    if (strlen(line) == 0)
      continue;

    char *pos = strtok(line, "|");
    char *orig = strtok(NULL, "|");
    char *mut = strtok(NULL, "|");
    char *type = strtok(NULL, "|");
    char *effect = strtok(NULL, "|");
    char *date = strtok(NULL, "|");
    char *notes = strtok(NULL, "|");

    if (pos && orig && mut && type && effect && date) {
      muts[count].position = atoi(pos);
      muts[count].original = orig[0];
      muts[count].mutated = mut[0];
      strncpy(muts[count].mut_type, type, 19);
      strncpy(muts[count].aa_effect, effect, 29);
      strncpy(muts[count].date, date, 19);
      strncpy(muts[count].notes, notes ? notes : "", MAX_NOTES - 1);
      count++;
    }
  }
  fclose(fp);
  return count;
}

void appendMutation(const char *id, const Mutation *m) {
  char path[60];
  getMutFile(id, path);
  FILE *fp = fopen(path, "a");
  if (!fp) {
    printf("  [!] Could not save mutation.\n");
    return;
  }
  fprintf(fp, "%d|%c|%c|%s|%s|%s|%s\n", m->position, m->original, m->mutated,
          m->mut_type, m->aa_effect, m->date, m->notes);
  fclose(fp);
}

void deletePersonFiles(const char *id) {
  char path[60];
  getMutFile(id, path);
  remove(path);
}

/* ─────────────────────────────────────────────────────────────
   PERSON LOOKUP
   ───────────────────────────────────────────────────────────── */
int findPersonByID(const char *id) {
  for (int i = 0; i < person_count; i++)
    if (strcmp(persons[i].id, id) == 0)
      return i;
  return -1;
}

/* Interactive: print list, user picks index */
int selectPerson(const char *prompt) {
  if (person_count == 0) {
    printf("\n  [!] No profiles stored yet.\n");
    return -1;
  }
  printf("\n  %s\n", prompt);
  printSep('-', 50);
  for (int i = 0; i < person_count; i++)
    printf("  [%d] %-12s  %s  (%d bp)\n", i + 1, persons[i].id, persons[i].name,
           (int)strlen(persons[i].base_dna));
  printSep('-', 50);
  printf("  Enter number: ");
  int ch;
  scanf("%d", &ch);
  clearInput();
  if (ch < 1 || ch > person_count) {
    printf("  [!] Invalid selection.\n");
    return -1;
  }
  return ch - 1;
}

/* ─────────────────────────────────────────────────────────────
   DNA ANALYSIS HELPERS (used internally + report)
   ───────────────────────────────────────────────────────────── */
void analyseSequence(const char *dna) {
  int len = (int)strlen(dna);
  int A = 0, T = 0, G = 0, C = 0;
  for (int i = 0; i < len; i++) {
    switch (dna[i]) {
    case 'A':
      A++;
      break;
    case 'T':
      T++;
      break;
    case 'G':
      G++;
      break;
    case 'C':
      C++;
      break;
    }
  }
  double gc = (double)(G + C) / len * 100.0;
  printf("\n  Sequence length : %d bp\n", len);
  printf("  A: %d (%.1f%%)  T: %d (%.1f%%)"
         "  G: %d (%.1f%%)  C: %d (%.1f%%)\n",
         A, (double)A / len * 100, T, (double)T / len * 100, G,
         (double)G / len * 100, C, (double)C / len * 100);
  printf("  GC Content      : %.2f%%", gc);
  if (gc < 40.0)
    printf("  [AT-rich]\n");
  else if (gc > 60.0)
    printf("  [GC-rich]\n");
  else
    printf("  [Balanced]\n");
}

void findORFs(const char *dna) {
  int len = (int)strlen(dna), found = 0;
  printf("\n  Open Reading Frames (ATG -> STOP):\n");
  for (int i = 0; i + 2 < len; i++) {
    if (dna[i] == 'A' && dna[i + 1] == 'T' && dna[i + 2] == 'G') {
      for (int j = i; j + 2 < len; j += 3) {
        char c[4] = {dna[j], dna[j + 1], dna[j + 2], '\0'};
        if (!strcmp(c, "TAA") || !strcmp(c, "TAG") || !strcmp(c, "TGA")) {
          printf("  ORF: start=%d, stop=%d, length=%d bp\n", i + 1, j + 3,
                 j + 3 - i);
          found = 1;
          break;
        }
      }
    }
  }
  if (!found)
    printf("  No complete ORFs found.\n");
}

/* ─────────────────────────────────────────────────────────────
   FEATURE A : CREATE NEW PERSON PROFILE
   ───────────────────────────────────────────────────────────── */
void createProfile(void) {
  if (person_count >= MAX_PERSONS) {
    printf("  [!] Maximum profile limit reached (%d).\n", MAX_PERSONS);
    return;
  }

  Person p;
  memset(&p, 0, sizeof(p));

  printSep('=', 50);
  printf("  CREATE NEW PERSON PROFILE\n");
  printSep('-', 50);

  printf("  Person ID (no spaces, e.g. P001): ");
  scanf("%19s", p.id);
  clearInput();
  toUpper(p.id);

  if (findPersonByID(p.id) >= 0) {
    printf("  [!] ID '%s' already exists.\n", p.id);
    return;
  }

  printf("  Full Name: ");
  fgets(p.name, MAX_NAME, stdin);
  p.name[strcspn(p.name, "\r\n")] = '\0';
  if (strlen(p.name) == 0)
    strcpy(p.name, "Unknown");

  printf("  Base DNA Sequence (A, T, G, C): ");
  scanf("%9999s", p.base_dna);
  clearInput();
  toUpper(p.base_dna);

  if (!isValidDNA(p.base_dna)) {
    printf("  [!] Invalid DNA. Only A, T, G, C allowed.\n");
    return;
  }

  persons[person_count++] = p;
  saveProfiles();

  printf("\n  Profile created successfully!\n");
  printf("  ID: %s | Name: %s | Length: %d bp\n", p.id, p.name,
         (int)strlen(p.base_dna));
  analyseSequence(p.base_dna);
}

/* ─────────────────────────────────────────────────────────────
   FEATURE B : VIEW ALL PROFILES
   ───────────────────────────────────────────────────────────── */
void viewAllProfiles(void) {
  printSep('=', 60);
  printf("  STORED PROFILES (%d total)\n", person_count);
  printSep('-', 60);
  if (person_count == 0) {
    printf("  No profiles found.\n");
    return;
  }
  printf("  %-10s %-25s %-8s %-10s\n", "ID", "Name", "Bases", "GC%");
  printSep('-', 60);
  for (int i = 0; i < person_count; i++) {
    int len = (int)strlen(persons[i].base_dna);
    int gc = 0;
    for (int j = 0; j < len; j++)
      if (persons[i].base_dna[j] == 'G' || persons[i].base_dna[j] == 'C')
        gc++;
    printf("  %-10s %-25s %-8d %.1f%%\n", persons[i].id, persons[i].name, len,
           (double)gc / len * 100);
  }
  printSep('-', 60);
}

/* ─────────────────────────────────────────────────────────────
   FEATURE C : DELETE PROFILE
   ───────────────────────────────────────────────────────────── */
void deleteProfile(void) {
  int idx = selectPerson("Select profile to delete:");
  if (idx < 0)
    return;

  printf("\n  Are you sure you want to delete '%s - %s'? (y/n): ",
         persons[idx].id, persons[idx].name);
  char ch;
  scanf(" %c", &ch);
  clearInput();
  if (ch != 'y' && ch != 'Y') {
    printf("  Cancelled.\n");
    return;
  }

  deletePersonFiles(persons[idx].id);

  /* Shift array */
  for (int i = idx; i < person_count - 1; i++)
    persons[i] = persons[i + 1];
  person_count--;
  saveProfiles();
  printf("  Profile deleted.\n");
}

/* ─────────────────────────────────────────────────────────────
   FEATURE D : MATCH DNA
   Compare two sequences — manual input or from profiles
   ───────────────────────────────────────────────────────────── */
void printMatchResult(const char *label1, const char *seq1, const char *label2,
                      const char *seq2) {
  int len1 = (int)strlen(seq1), len2 = (int)strlen(seq2);
  int minLen = len1 < len2 ? len1 : len2;

  printSep('=', 60);
  printf("  DNA MATCH RESULT\n");
  printSep('-', 60);
  printf("  Seq A : %s (%d bp)\n", label1, len1);
  printf("  Seq B : %s (%d bp)\n", label2, len2);

  if (len1 != len2) {
    printf("\n  [NOTE] Sequences are different lengths.\n");
    printf("  Comparing first %d bases only.\n", minLen);
  }

  /* GC content for each */
  int gc1 = 0, gc2 = 0;
  for (int i = 0; i < len1; i++)
    if (seq1[i] == 'G' || seq1[i] == 'C')
      gc1++;
  for (int i = 0; i < len2; i++)
    if (seq2[i] == 'G' || seq2[i] == 'C')
      gc2++;

  printf("\n  GC%%  A: %.2f%%   B: %.2f%%   Diff: %.2f%%\n",
         (double)gc1 / len1 * 100, (double)gc2 / len2 * 100,
         fabs((double)gc1 / len1 - (double)gc2 / len2) * 100);

  /* Mutation positions */
  int muts = 0;
  printf("\n  Differences:\n");
  for (int i = 0; i < minLen; i++) {
    if (seq1[i] != seq2[i]) {
      char mtype[20];
      getMutationType(seq1[i], seq2[i], mtype);
      printf("  Pos %5d : %c -> %c  [%s]\n", i + 1, seq1[i], seq2[i], mtype);
      muts++;
      if (muts >= 50) {
        printf("  ... (showing first 50 differences)\n");
        break;
      }
    }
  }

  if (muts == 0)
    printf("  Sequences are identical in compared region.\n");

  double sim = (double)(minLen - muts) / minLen * 100.0;
  printf("\n  Total differences : %d\n", muts);
  printf("  Similarity        : %.2f%%\n", sim);

  if (len1 != len2)
    printf("  Length difference : %d bp\n", abs(len1 - len2));
  printSep('-', 60);
}

void matchDNA(void) {
  printSep('=', 50);
  printf("  MATCH DNA\n");
  printSep('-', 50);
  printf("  1. Manual entry (type both sequences)\n");
  printf("  2. From stored profiles\n");
  printf("  3. One manual + one from profile\n");
  printf("  Enter choice: ");
  int ch;
  scanf("%d", &ch);
  clearInput();

  char seq1[MAX_LEN], seq2[MAX_LEN];
  char lbl1[MAX_NAME], lbl2[MAX_NAME];

  if (ch == 1) {
    printf("  Sequence A: ");
    scanf("%9999s", seq1);
    clearInput();
    toUpper(seq1);
    printf("  Sequence B: ");
    scanf("%9999s", seq2);
    clearInput();
    toUpper(seq2);
    if (!isValidDNA(seq1) || !isValidDNA(seq2)) {
      printf("  [!] Invalid DNA.\n");
      return;
    }
    strcpy(lbl1, "Seq A");
    strcpy(lbl2, "Seq B");
  } else if (ch == 2) {
    int i1 = selectPerson("Select first person:");
    if (i1 < 0)
      return;
    int i2 = selectPerson("Select second person:");
    if (i2 < 0)
      return;
    strcpy(seq1, persons[i1].base_dna);
    strcpy(lbl1, persons[i1].name);
    strcpy(seq2, persons[i2].base_dna);
    strcpy(lbl2, persons[i2].name);
  } else if (ch == 3) {
    int i1 = selectPerson("Select person for Seq A:");
    if (i1 < 0)
      return;
    strcpy(seq1, persons[i1].base_dna);
    strcpy(lbl1, persons[i1].name);
    printf("  Enter Seq B manually: ");
    scanf("%9999s", seq2);
    clearInput();
    toUpper(seq2);
    if (!isValidDNA(seq2)) {
      printf("  [!] Invalid DNA.\n");
      return;
    }
    strcpy(lbl2, "Manual");
  } else {
    printf("  Invalid choice.\n");
    return;
  }

  printMatchResult(lbl1, seq1, lbl2, seq2);
}

/* ─────────────────────────────────────────────────────────────
   FEATURE E : PERSON MUTATION ANALYSIS
   ───────────────────────────────────────────────────────────── */

/* E1 — Scan new DNA for mutations, offer record/discard per site */
void scanNewDNA(int pidx) {
  Person *p = &persons[pidx];
  printf("\n  SCANNING NEW DNA SAMPLE FOR: %s (%s)\n", p->name, p->id);
  printSep('-', 50);

  char new_dna[MAX_LEN];
  printf("  Enter new DNA sample: ");
  scanf("%9999s", new_dna);
  clearInput();
  toUpper(new_dna);
  if (!isValidDNA(new_dna)) {
    printf("  [!] Invalid DNA.\n");
    return;
  }

  int blen = (int)strlen(p->base_dna);
  int nlen = (int)strlen(new_dna);

  if (blen != nlen) {
    printf("  [NOTE] Length mismatch: base=%d  new=%d.\n", blen, nlen);
    printf("  Comparing first %d bases.\n", blen < nlen ? blen : nlen);
  }

  int cmp_len = blen < nlen ? blen : nlen;
  int detected = 0, recorded = 0, discarded = 0;
  char today[20];
  getCurrentDate(today);

  for (int i = 0; i < cmp_len; i++) {
    if (p->base_dna[i] == new_dna[i])
      continue;
    detected++;

    char mtype[20], aa_eff[30], risk[12];
    getMutationType(p->base_dna[i], new_dna[i], mtype);
    getAAEffect(p->base_dna, i, new_dna[i], aa_eff);
    getRiskLevel(p->base_dna, i, new_dna[i], risk);

    printSep('-', 50);
    printf("  Mutation #%d detected:\n", detected);
    printf("  Position   : %d\n", i + 1);
    printf("  Change     : %c -> %c\n", p->base_dna[i], new_dna[i]);
    printf("  Type       : %s\n", mtype);
    printf("  AA Effect  : %s\n", aa_eff);
    printRisk(risk);
    printf("\n  [R] Record this mutation\n");
    printf("  [D] Discard (ignore)\n");
    printf("  [Q] Stop scanning\n");
    printf("  Choice: ");

    char opt;
    scanf(" %c", &opt);
    clearInput();
    opt = toupper((unsigned char)opt);

    if (opt == 'R') {
      Mutation m;
      m.position = i + 1;
      m.original = p->base_dna[i];
      m.mutated = new_dna[i];
      strcpy(m.mut_type, mtype);
      strcpy(m.aa_effect, aa_eff);
      strcpy(m.date, today);

      printf("  Notes (optional, press Enter to skip): ");
      fgets(m.notes, MAX_NOTES, stdin);
      m.notes[strcspn(m.notes, "\r\n")] = '\0';

      appendMutation(p->id, &m);
      recorded++;
      printf("  [OK] Mutation recorded.\n");
    } else if (opt == 'Q') {
      printf("  Scanning stopped by user.\n");
      break;
    } else {
      discarded++;
      printf("  Mutation discarded.\n");
    }
  }

  printSep('=', 50);
  printf("  SCAN SUMMARY\n");
  printSep('-', 50);
  printf("  Total detected : %d\n", detected);
  printf("  Recorded       : %d\n", recorded);
  printf("  Discarded      : %d\n", discarded);
  printSep('-', 50);
}

/* E2 — View full mutation history for a person */
void viewMutationHistory(int pidx) {
  Person *p = &persons[pidx];
  Mutation muts[MAX_MUTS];
  int count = loadMutations(p->id, muts);

  printSep('=', 70);
  printf("  MUTATION HISTORY: %s (%s)\n", p->name, p->id);
  printSep('-', 70);

  if (count == 0) {
    printf("  No recorded mutations.\n");
    return;
  }

  printf("  %-5s %-10s %-10s %-15s %-16s %-10s %-12s %s\n", "#", "Position",
         "Change", "Type", "AA Effect", "Risk", "Date", "Notes");
  printSep('-', 70);

  for (int i = 0; i < count; i++) {
    char risk[12];
    getRiskLevel(p->base_dna,
                 muts[i].position - 1, /* 0-indexed for getRiskLevel */
                 muts[i].mutated, risk);
    printf("  %-5d %-10d %c -> %-7c %-15s %-16s %-10s %-12s %s\n", i + 1,
           muts[i].position, muts[i].original, muts[i].mutated,
           muts[i].mut_type, muts[i].aa_effect, risk, muts[i].date,
           muts[i].notes);
  }
  printSep('-', 70);
  printf("  Total mutations recorded: %d\n", count);
}

/* E3 — Mutation statistics */
void mutationStats(int pidx) {
  Person *p = &persons[pidx];
  Mutation muts[MAX_MUTS];
  int count = loadMutations(p->id, muts);

  printSep('=', 50);
  printf("  MUTATION STATISTICS: %s (%s)\n", p->name, p->id);
  printSep('-', 50);

  if (count == 0) {
    printf("  No recorded mutations.\n");
    return;
  }

  int transitions = 0, transversions = 0;
  int synonymous = 0, nonsynonymous = 0, na = 0;
  int r_critical = 0, r_high = 0, r_moderate = 0, r_low = 0;

  for (int i = 0; i < count; i++) {
    if (strcmp(muts[i].mut_type, "Transition") == 0)
      transitions++;
    else
      transversions++;
    if (strcmp(muts[i].aa_effect, "Synonymous") == 0)
      synonymous++;
    else if (strcmp(muts[i].aa_effect, "Non-synonymous") == 0)
      nonsynonymous++;
    else
      na++;

    char risk[12];
    getRiskLevel(p->base_dna, muts[i].position - 1, muts[i].mutated, risk);
    if (strcmp(risk, "CRITICAL") == 0)
      r_critical++;
    else if (strcmp(risk, "HIGH") == 0)
      r_high++;
    else if (strcmp(risk, "MODERATE") == 0)
      r_moderate++;
    else
      r_low++;
  }

  int blen = (int)strlen(p->base_dna);
  printf("  Base DNA length      : %d bp\n", blen);
  printf("  Total mutations      : %d\n", count);
  printf("  Mutation rate        : %.4f per bp\n", (double)count / blen);
  printf("\n  By type:\n");
  printf("    Transitions        : %d (%.1f%%)\n", transitions,
         (double)transitions / count * 100);
  printf("    Transversions      : %d (%.1f%%)\n", transversions,
         (double)transversions / count * 100);
  printf("    Ts/Tv ratio        : %.2f\n",
         transversions > 0 ? (double)transitions / transversions : 0.0);
  printf("\n  By amino acid effect:\n");
  printf("    Synonymous         : %d (%.1f%%)\n", synonymous,
         (double)synonymous / count * 100);
  printf("    Non-synonymous     : %d (%.1f%%)\n", nonsynonymous,
         (double)nonsynonymous / count * 100);
  printf("\n  By risk level:\n");
  printf("    [!!!] CRITICAL     : %d\n", r_critical);
  printf("    [!! ] HIGH         : %d\n", r_high);
  printf("    [!  ] MODERATE     : %d\n", r_moderate);
  printf("    [   ] LOW          : %d\n", r_low);
  if (r_critical + r_high > 0)
    printf("\n  ** %d mutation(s) require clinical attention! **\n",
           r_critical + r_high);
  printSep('-', 50);
}

/* E4 — Full biochem analysis on base DNA */
void fullAnalysis(int pidx) {
  Person *p = &persons[pidx];
  printSep('=', 50);
  printf("  FULL ANALYSIS: %s (%s)\n", p->name, p->id);
  printSep('-', 50);

  analyseSequence(p->base_dna);

  printf("\n  RNA Transcript (first 60 bases): ");
  int show = (int)strlen(p->base_dna);
  if (show > 60)
    show = 60;
  for (int i = 0; i < show; i++)
    putchar(p->base_dna[i] == 'T' ? 'U' : p->base_dna[i]);
  if ((int)strlen(p->base_dna) > 60)
    printf("...");
  printf("\n");

  printf("\n  Codon Translation:\n");
  int len = (int)strlen(p->base_dna);
  for (int i = 0; i + 2 < len && i < 60; i += 3) {
    char c[4] = {p->base_dna[i], p->base_dna[i + 1], p->base_dna[i + 2], '\0'};
    const char *aa = lookupCodon(c);
    printf("    %s -> %s\n", c, aa);
    if (strncmp(aa, "STOP", 4) == 0) {
      printf("    [STOP]\n");
      break;
    }
  }
  if (len > 60)
    printf("  (showing first 20 codons only)\n");

  findORFs(p->base_dna);
}

/* E5 — Export person report to file */
void exportReport(int pidx) {
  Person *p = &persons[pidx];
  char filename[80];
  snprintf(filename, 80, "report_%s.txt", p->id);

  FILE *fp = fopen(filename, "w");
  if (!fp) {
    printf("  [!] Could not create report file.\n");
    return;
  }

  Mutation muts[MAX_MUTS];
  int mcount = loadMutations(p->id, muts);

  fprintf(fp, "DNA PROFILE REPORT\n");
  fprintf(fp, "==================\n");
  fprintf(fp, "ID       : %s\n", p->id);
  fprintf(fp, "Name     : %s\n", p->name);
  fprintf(fp, "DNA Len  : %d bp\n", (int)strlen(p->base_dna));
  fprintf(fp, "DNA Seq  : %s\n\n", p->base_dna);

  /* Nucleotide stats */
  int len = strlen(p->base_dna), A = 0, T = 0, G = 0, C = 0;
  for (int i = 0; i < len; i++) {
    switch (p->base_dna[i]) {
    case 'A':
      A++;
      break;
    case 'T':
      T++;
      break;
    case 'G':
      G++;
      break;
    case 'C':
      C++;
      break;
    }
  }
  fprintf(fp,
          "Nucleotides: A=%d(%.1f%%) T=%d(%.1f%%) G=%d(%.1f%%) C=%d(%.1f%%)\n",
          A, (double)A / len * 100, T, (double)T / len * 100, G,
          (double)G / len * 100, C, (double)C / len * 100);
  fprintf(fp, "GC Content : %.2f%%\n\n", (double)(G + C) / len * 100);

  fprintf(fp, "MUTATION HISTORY (%d recorded)\n", mcount);
  fprintf(fp, "--------------------------------\n");
  for (int i = 0; i < mcount; i++) {
    fprintf(fp, "%d. Pos=%d  %c->%c  %s  %s  %s  %s\n", i + 1, muts[i].position,
            muts[i].original, muts[i].mutated, muts[i].mut_type,
            muts[i].aa_effect, muts[i].date, muts[i].notes);
  }
  fclose(fp);
  printf("  Report saved to '%s'\n", filename);
}

/* E5.5 — View only HIGH / CRITICAL risk mutations */
void viewHighRiskMutations(int pidx) {
  Person *p = &persons[pidx];
  Mutation muts[MAX_MUTS];
  int count = loadMutations(p->id, muts);

  printSep('=', 70);
  printf("  HIGH-RISK MUTATIONS: %s (%s)\n", p->name, p->id);
  printSep('-', 70);

  if (count == 0) {
    printf("  No recorded mutations.\n");
    return;
  }

  int shown = 0;
  for (int i = 0; i < count; i++) {
    char risk[12];
    getRiskLevel(p->base_dna, muts[i].position - 1, muts[i].mutated, risk);
    if (strcmp(risk, "CRITICAL") == 0 || strcmp(risk, "HIGH") == 0) {
      if (shown == 0) {
        printf("  %-5s %-10s %-10s %-15s %-16s %-10s %s\n", "#", "Position",
               "Change", "Type", "AA Effect", "Risk", "Date");
        printSep('-', 70);
      }
      printf("  %-5d %-10d %c -> %-7c %-15s %-16s %-10s %s\n", i + 1,
             muts[i].position, muts[i].original, muts[i].mutated,
             muts[i].mut_type, muts[i].aa_effect, risk, muts[i].date);
      shown++;
    }
  }

  if (shown == 0)
    printf("  No CRITICAL or HIGH risk mutations found. All recorded\n"
           "  mutations are MODERATE or LOW risk.\n");
  else {
    printSep('-', 70);
    printf("  %d high-risk mutation(s) out of %d total recorded.\n", shown,
           count);
  }
}

/* E — Person Mutation Analysis hub */
void personMutationMenu(void) {
  int pidx = selectPerson("Select person to analyse:");
  if (pidx < 0)
    return;

  int ch;
  do {
    printSep('=', 55);
    printf("  PERSON: %s -- %s\n", persons[pidx].id, persons[pidx].name);
    printSep('-', 55);
    printf("  1. Scan new DNA sample (detect & record mutations)\n");
    printf("  2. View full mutation history\n");
    printf("  3. Mutation statistics\n");
    printf("  4. Full biochem analysis on base DNA\n");
    printf("  5. Export person report to file\n");
    printf("  6. View HIGH / CRITICAL risk mutations only\n");
    printf("  0. Back\n");
    printf("  Choice: ");
    scanf("%d", &ch);
    clearInput();

    switch (ch) {
    case 1:
      scanNewDNA(pidx);
      break;
    case 2:
      viewMutationHistory(pidx);
      break;
    case 3:
      mutationStats(pidx);
      break;
    case 4:
      fullAnalysis(pidx);
      break;
    case 5:
      exportReport(pidx);
      break;
    case 6:
      viewHighRiskMutations(pidx);
      break;
    case 0:
      break;
    default:
      printf("  Invalid choice.\n");
    }
  } while (ch != 0);
}

/* ─────────────────────────────────────────────────────────────
   MAIN
   ───────────────────────────────────────────────────────────── */
int main(void) {
  loadProfiles();

  printf("\n");
  printSep('=', 55);
  printf("   DNA PROFILE & MUTATION TRACKING SYSTEM\n");
  printSep('=', 55);
  printf("   Profiles loaded: %d\n", person_count);
  printSep('=', 55);

  int choice;
  do {
    printf("\n  MAIN MENU\n");
    printSep('-', 35);
    printf("  1. Match DNA\n");
    printf("  2. Person Mutation Analysis\n");
    printf("  3. Create New Person Profile\n");
    printf("  4. View All Profiles\n");
    printf("  5. Delete a Profile\n");
    printf("  0. Exit\n");
    printSep('-', 35);
    printf("  Choice: ");
    scanf("%d", &choice);
    clearInput();

    switch (choice) {
    case 1:
      matchDNA();
      break;
    case 2:
      personMutationMenu();
      break;
    case 3:
      createProfile();
      break;
    case 4:
      viewAllProfiles();
      break;
    case 5:
      deleteProfile();
      break;
    case 0:
      printf("\n  Goodbye.\n");
      break;
    default:
      printf("  Invalid. Enter 0-5.\n");
    }
  } while (choice != 0);

  return 0;
}