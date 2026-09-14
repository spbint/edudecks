import type { WorksheetResource, WorksheetStepContext } from "@/lib/clean/resources/worksheetResources";

const ENGLISH_SUBJECT_KEY = "english" as const;
const ENGLISH_STRAND_KEY = "spelling-and-word-study";
const ENGLISH_STAGE_KEY = "foundation-kindergarten";
const ENGLISH_STAGE_DISPLAY = "Foundation / Kindergarten";
const ENGLISH_LOWER_PRIMARY_STAGE_KEY = "lower-primary";
const ENGLISH_LOWER_PRIMARY_STAGE_DISPLAY = "Lower Primary";
const ENGLISH_MORPHOLOGY_STRAND_KEY = "morphology-and-spelling";
const ENGLISH_MORPHOLOGY_STAGE_KEY = "upper-elementary";
const ENGLISH_MORPHOLOGY_STAGE_DISPLAY = "Upper Elementary";
const ENGLISH_MS_STAGE_KEY = "upper-primary";
const ENGLISH_MS_STAGE_DISPLAY = "Upper Primary";
const ENGLISH_HSF_STAGE_KEY = "lower-secondary";
const ENGLISH_HSF_STAGE_DISPLAY = "Lower Secondary";

function additionalEnglishWorksheetResource(
  stepNumber: number,
  stepKey: string,
  title: string,
  fileName: string,
  stageKey: string = ENGLISH_STAGE_KEY,
  stageDisplay: string = ENGLISH_STAGE_DISPLAY,
  strandKey: string = ENGLISH_STRAND_KEY,
): WorksheetResource {
  const pathwayStepId = `${ENGLISH_SUBJECT_KEY}::${strandKey}::${stageKey}::${stepKey}`;
  const href = `/resources/worksheets/english/${strandKey}/${stageKey}/${fileName}`;
  return {
    pathwayStepId,
    stepKey,
    subjectKey: ENGLISH_SUBJECT_KEY,
    strandKey,
    stageKey,
    stageDisplay,
    stepNumber,
    pathwayStepTitle: title,
    title,
    fileName,
    href,
    resourceType: "worksheet-pdf",
  };
}

const EXTENDED_ENGLISH_WORKSHEET_RESOURCES: WorksheetResource[] = ([
  [3, "ee-u001-consonant-digraphs", "Consonant Digraphs", "MYL-LIT-MORPH-EE-U001-Consonant-Digraphs-Worksheet.pdf"],
  [4, "ee-u002-ck-ng-qu", "CK NG QU", "MYL-LIT-MORPH-EE-U002-CK-NG-QU-Worksheet.pdf"],
  [5, "ee-u003-initial-consonant-blends", "Initial Consonant Blends", "MYL-LIT-MORPH-EE-U003-Initial-Consonant-Blends-Worksheet.pdf"],
  [6, "ee-u004-final-consonant-blends", "Final Consonant Blends", "MYL-LIT-MORPH-EE-U004-Final-Consonant-Blends-Worksheet.pdf"],
  [7, "ee-u005-long-vowels-silent-e", "Long Vowels Silent E", "MYL-LIT-MORPH-EE-U005-Long-Vowels-Silent-E-Worksheet.pdf"],
  [8, "ee-u006-common-vowel-teams", "Common Vowel Teams", "MYL-LIT-MORPH-EE-U006-Common-Vowel-Teams-Worksheet.pdf"],
  [9, "ee-u007-other-vowel-spellings", "Other Vowel Spellings", "MYL-LIT-MORPH-EE-U007-Other-Vowel-Spellings-Worksheet.pdf"],
  [10, "ee-u008-two-syllable-word-building", "Two-Syllable Word Building", "MYL-LIT-MORPH-EE-U008-Two-Syllable-Word-Building-Worksheet.pdf"],
  [11, "ee-u010-ed-ing", "ED ING", "MYL-LIT-MORPH-EE-U010-ED-ING-Worksheet.pdf"],
  [12, "ee-u011-er-est", "ER EST", "MYL-LIT-MORPH-EE-U011-ER-EST-Worksheet.pdf"],
  [13, "ee-u012-compound-words-and-base-words", "Compound Words and Base Words", "MYL-LIT-MORPH-EE-U012-Compound-Words-and-Base-Words-Worksheet.pdf"],
  [14, "ee-u009-plurals-s-es", "Plurals S ES", "MYL-LIT-MORPH-EE-U009-Plurals-S-ES-Worksheet.pdf"],
] as const).map(([stepNumber, stepKey, title, fileName]) =>
  additionalEnglishWorksheetResource(
    stepNumber,
    stepKey,
    title,
    fileName,
    ENGLISH_LOWER_PRIMARY_STAGE_KEY,
    ENGLISH_LOWER_PRIMARY_STAGE_DISPLAY,
  ),
);

const MORPHOLOGY_ENGLISH_WORKSHEET_RESOURCES: WorksheetResource[] = ([
  [2, "u001-prefix-re", "Prefix re-", "MYL-LIT-MORPH-UE-U001-Prefix-Re-Worksheet.pdf"],
  [3, "e-u003-prefix-pre", "Prefix Pre", "MYL-LIT-MORPH-E-U003-Prefix-Pre-Worksheet.pdf"],
  [4, "e-u004-prefix-mis", "Prefix Mis", "MYL-LIT-MORPH-E-U004-Prefix-Mis-Worksheet.pdf"],
  [5, "e-u005-prefix-dis", "Prefix Dis", "MYL-LIT-MORPH-E-U005-Prefix-Dis-Worksheet.pdf"],
  [6, "e-u006-prefix-sub", "Prefix Sub", "MYL-LIT-MORPH-E-U006-Prefix-Sub-Worksheet.pdf"],
  [7, "e-u007-prefix-over-under", "Prefix Over Under", "MYL-LIT-MORPH-E-U007-Prefix-Over-Under-Worksheet.pdf"],
  [8, "e-u008-suffixes-ful-less", "Suffixes Ful Less", "MYL-LIT-MORPH-E-U008-Suffixes-Ful-Less-Worksheet.pdf"],
  [9, "e-u009-suffix-ness", "Suffix Ness", "MYL-LIT-MORPH-E-U009-Suffix-Ness-Worksheet.pdf"],
  [10, "e-u010-suffix-ment", "Suffix Ment", "MYL-LIT-MORPH-E-U010-Suffix-Ment-Worksheet.pdf"],
  [11, "e-u011-suffix-ly", "Suffix Ly", "MYL-LIT-MORPH-E-U011-Suffix-Ly-Worksheet.pdf"],
  [12, "e-u012-suffix-able", "Suffix Able", "MYL-LIT-MORPH-E-U012-Suffix-Able-Worksheet.pdf"],
  [13, "ue-u008-prefix-in-im-il-ir", "Prefix In Im Il Ir", "MYL-LIT-MORPH-UE-U008-Prefix-In-Im-Il-Ir-Worksheet.pdf"],
  [14, "ue-u009-prefix-con-com-co", "Prefix Con Com Co", "MYL-LIT-MORPH-UE-U009-Prefix-Con-Com-Co-Worksheet.pdf"],
  [15, "ue-u010-prefix-trans", "Prefix Trans", "MYL-LIT-MORPH-UE-U010-Prefix-Trans-Worksheet.pdf"],
  [16, "ue-u011-prefix-inter", "Prefix Inter", "MYL-LIT-MORPH-UE-U011-Prefix-Inter-Worksheet.pdf"],
  [17, "ue-u012-prefix-fore", "Prefix Fore", "MYL-LIT-MORPH-UE-U012-Prefix-Fore-Worksheet.pdf"],
  [18, "ue-u013-prefix-mid", "Prefix Mid", "MYL-LIT-MORPH-UE-U013-Prefix-Mid-Worksheet.pdf"],
] as const).map(([stepNumber, stepKey, title, fileName]) =>
  additionalEnglishWorksheetResource(
    stepNumber,
    stepKey,
    title,
    fileName,
    ENGLISH_MORPHOLOGY_STAGE_KEY,
    ENGLISH_MORPHOLOGY_STAGE_DISPLAY,
    ENGLISH_MORPHOLOGY_STRAND_KEY,
  ),
);

const SPELLING_CONVENTION_ENGLISH_WORKSHEET_RESOURCES: WorksheetResource[] = ([
  [15, "ue-u002-drop-final-e", "Drop Final E", "MYL-LIT-MORPH-UE-U002-Drop-Final-E-Worksheet.pdf"],
  [16, "ue-u003-double-final-consonant", "Double Final Consonant", "MYL-LIT-MORPH-UE-U003-Double-Final-Consonant-Worksheet.pdf"],
  [17, "ue-u004-change-y-to-i", "Change Y to I", "MYL-LIT-MORPH-UE-U004-Change-Y-to-I-Worksheet.pdf"],
  [18, "ue-u005-keep-the-base-word", "Keep the Base Word", "MYL-LIT-MORPH-UE-U005-Keep-the-Base-Word-Worksheet.pdf"],
  [19, "ue-u006-compare-related-words", "Compare Related Words", "MYL-LIT-MORPH-UE-U006-Compare-Related-Words-Worksheet.pdf"],
  [20, "ue-u007-explain-spelling", "Explain Spelling", "MYL-LIT-MORPH-UE-U007-Explain-Spelling-Worksheet.pdf"],
] as const).map(([stepNumber, stepKey, title, fileName]) =>
  additionalEnglishWorksheetResource(
    stepNumber,
    stepKey,
    title,
    fileName,
    ENGLISH_LOWER_PRIMARY_STAGE_KEY,
    ENGLISH_LOWER_PRIMARY_STAGE_DISPLAY,
    ENGLISH_STRAND_KEY,
  ),
);

const MS_ENGLISH_WORKSHEET_RESOURCES: WorksheetResource[] = ([
  [1, "ms-u001-suffix-ion", "Suffix Ion", "MYL-LIT-MORPH-MS-U001-Suffix-Ion-Worksheet.pdf"],
  [2, "ms-u002-suffix-ian-an", "Suffix Ian An", "MYL-LIT-MORPH-MS-U002-Suffix-Ian-An-Worksheet.pdf"],
  [3, "ms-u003-suffix-ive", "Suffix Ive", "MYL-LIT-MORPH-MS-U003-Suffix-Ive-Worksheet.pdf"],
  [4, "ms-u004-suffix-al", "Suffix Al", "MYL-LIT-MORPH-MS-U004-Suffix-Al-Worksheet.pdf"],
  [5, "ms-u005-suffix-ic", "Suffix Ic", "MYL-LIT-MORPH-MS-U005-Suffix-Ic-Worksheet.pdf"],
  [6, "ms-u006-suffix-ure", "Suffix Ure", "MYL-LIT-MORPH-MS-U006-Suffix-Ure-Worksheet.pdf"],
  [7, "ms-u007-suffix-ance-ence", "Suffix Ance Ence", "MYL-LIT-MORPH-MS-U007-Suffix-Ance-Ence-Worksheet.pdf"],
  [8, "ms-u008-suffix-ant-ent", "Suffix Ant Ent", "MYL-LIT-MORPH-MS-U008-Suffix-Ant-Ent-Worksheet.pdf"],
  [9, "ms-u009-suffix-able-ible", "Suffix Able Ible", "MYL-LIT-MORPH-MS-U009-Suffix-Able-Ible-Worksheet.pdf"],
  [10, "ms-u010-prefix-ad-ac-at", "Prefix Ad Ac At", "MYL-LIT-MORPH-MS-U010-Prefix-Ad-Ac-At-Worksheet.pdf"],
  [11, "ms-u011-prefix-ex-e", "Prefix Ex E", "MYL-LIT-MORPH-MS-U011-Prefix-Ex-E-Worksheet.pdf"],
  [12, "ms-u012-prefix-ob", "Prefix Ob", "MYL-LIT-MORPH-MS-U012-Prefix-Ob-Worksheet.pdf"],
  [13, "ms-u013-prefix-per", "Prefix Per", "MYL-LIT-MORPH-MS-U013-Prefix-Per-Worksheet.pdf"],
  [14, "ms-u014-prefix-pro", "Prefix Pro", "MYL-LIT-MORPH-MS-U014-Prefix-Pro-Worksheet.pdf"],
] as const).map(([stepNumber, stepKey, title, fileName]) =>
  additionalEnglishWorksheetResource(
    stepNumber,
    stepKey,
    title,
    fileName,
    ENGLISH_MS_STAGE_KEY,
    ENGLISH_MS_STAGE_DISPLAY,
    ENGLISH_MORPHOLOGY_STRAND_KEY,
  ),
);

const HSF_ENGLISH_WORKSHEET_RESOURCES: WorksheetResource[] = ([
  [1, "hsf-u001-prefix-contra-counter", "Prefix Contra Counter", "MYL-LIT-MORPH-HSF-U001-Prefix-Contra-Counter-Worksheet.pdf"],
  [2, "hsf-u002-prefix-multi", "Prefix Multi", "MYL-LIT-MORPH-HSF-U002-Prefix-Multi-Worksheet.pdf"],
  [2, "hsf-u003-prefix-super", "Prefix Super", "MYL-LIT-MORPH-HSF-U003-Prefix-Super-Worksheet.pdf"],
  [3, "hsf-u004-prefix-semi", "Prefix Semi", "MYL-LIT-MORPH-HSF-U004-Prefix-Semi-Worksheet.pdf"],
  [4, "hsf-u005-suffix-ary", "Suffix Ary", "MYL-LIT-MORPH-HSF-U005-Suffix-Ary-Worksheet.pdf"],
  [5, "hsf-u006-suffix-ative", "Suffix Ative", "MYL-LIT-MORPH-HSF-U006-Suffix-Ative-Worksheet.pdf"],
  [6, "hsf-u007-suffix-ous", "Suffix Ous", "MYL-LIT-MORPH-HSF-U007-Suffix-Ous-Worksheet.pdf"],
  [7, "hsf-u008-suffix-ate", "Suffix Ate", "MYL-LIT-MORPH-HSF-U008-Suffix-Ate-Worksheet.pdf"],
  [8, "hsf-u009-multiple-affixes", "Multiple Affixes", "MYL-LIT-MORPH-HSF-U009-Multiple-Affixes-Worksheet.pdf"],
  [9, "hsf-u010-unlock-academic-vocabulary", "Unlock Academic Vocabulary", "MYL-LIT-MORPH-HSF-U010-Unlock-Academic-Vocabulary-Worksheet.pdf"],
] as const).map(([stepNumber, stepKey, title, fileName]) =>
  additionalEnglishWorksheetResource(
    stepNumber,
    stepKey,
    title,
    fileName,
    ENGLISH_HSF_STAGE_KEY,
    ENGLISH_HSF_STAGE_DISPLAY,
    ENGLISH_MORPHOLOGY_STRAND_KEY,
  ),
);

const ROOTS_E1_ENGLISH_WORKSHEET_RESOURCES: WorksheetResource[] = ([
  [10, "r-u001-root-bio", "Greek Root bio", "MYL-LIT-MORPH-R-U001-Greek-Root-Bio-Worksheet.pdf"],
  [11, "r-u002-root-geo", "Greek Root geo", "MYL-LIT-MORPH-R-U002-Greek-Root-Geo-Worksheet.pdf"],
  [12, "r-u003-root-graph-gram", "Greek Roots graph / gram", "MYL-LIT-MORPH-R-U003-Greek-Roots-Graph-Gram-Worksheet.pdf"],
  [13, "r-u004-root-phon", "Greek Root phon", "MYL-LIT-MORPH-R-U004-Greek-Root-Phon-Worksheet.pdf"],
  [14, "r-u005-root-tele", "Greek Root tele", "MYL-LIT-MORPH-R-U005-Greek-Root-Tele-Worksheet.pdf"],
  [15, "r-u006-root-chron", "Greek Root chron", "MYL-LIT-MORPH-R-U006-Greek-Root-Chron-Worksheet.pdf"],
  [16, "r-u007-root-morph", "Greek Root morph", "MYL-LIT-MORPH-R-U007-Greek-Root-Morph-Worksheet.pdf"],
  [17, "r-u009-root-macro", "Greek Root macro", "MYL-LIT-MORPH-R-U009-Greek-Root-Macro-Worksheet.pdf"],
  [18, "r-u010-root-photo-phot", "Greek Roots photo / phot", "MYL-LIT-MORPH-R-U010-Greek-Root-Photo-Phot-Worksheet.pdf"],
  [19, "r-u011-root-therm", "Greek Root therm", "MYL-LIT-MORPH-R-U011-Greek-Root-Therm-Worksheet.pdf"],
  [20, "r-u013-root-astro-astr", "Greek Roots astro / astr", "MYL-LIT-MORPH-R-U013-Greek-Root-Astro-Worksheet.pdf"],
  [21, "r-u014-root-metr-meter", "Greek Roots metr / meter", "MYL-LIT-MORPH-R-U014-Greek-Root-Metr-Meter-Worksheet.pdf"],
  [22, "r-u016-root-auto", "Greek Root auto", "MYL-LIT-MORPH-R-U016-Greek-Root-Auto-Worksheet.pdf"],
  [23, "r-u017-root-demo-dem", "Greek Roots demo / dem", "MYL-LIT-MORPH-R-U017-Greek-Root-Demo-Dem-Worksheet.pdf"],
  [24, "r-u018-root-psych", "Greek Root psych", "MYL-LIT-MORPH-R-U018-Greek-Root-Psych-Worksheet.pdf"],
  [25, "r-u019-root-log-logy", "Greek Roots log / logy", "MYL-LIT-MORPH-R-U019-Greek-Root-Log-Logy-Worksheet.pdf"],
  [26, "r-u020-root-path", "Greek Root path", "MYL-LIT-MORPH-R-U020-Greek-Root-Path-Worksheet.pdf"],
  [65, "r-u008-root-micro", "Greek Root micro", "MYL-LIT-MORPH-R-U008-Greek-Root-Micro-Worksheet.pdf"],
  [66, "r-u012-root-hydro", "Greek Root hydro", "MYL-LIT-MORPH-R-U012-Greek-Root-Hydro-Worksheet.pdf"],
  [67, "r-u037-root-pend-pens", "Latin Roots pend / pens", "MYL-LIT-MORPH-R-U037-Latin-Roots-Pend-Pens-Worksheet.pdf"],
  [68, "r-u058-root-mont", "Latin Root mont", "MYL-LIT-MORPH-R-U058-Latin-Root-Mont-Worksheet.pdf"],
] as const).map(([stepNumber, stepKey, title, fileName]) =>
  additionalEnglishWorksheetResource(
    stepNumber,
    stepKey,
    title,
    fileName,
    ENGLISH_HSF_STAGE_KEY,
    ENGLISH_HSF_STAGE_DISPLAY,
    ENGLISH_MORPHOLOGY_STRAND_KEY,
  ),
);

const ROOTS_E2_ENGLISH_WORKSHEET_RESOURCES: WorksheetResource[] = ([
  [27, "r-u021-root-gen", "Greek Root gen", "MYL-LIT-MORPH-R-U021-Greek-Root-Gen-Worksheet.pdf"],
  [28, "r-u022-root-cycl", "Greek Root cycl", "MYL-LIT-MORPH-R-U022-Greek-Root-Cycl-Worksheet.pdf"],
  [29, "r-u023-root-poly", "Greek Root poly", "MYL-LIT-MORPH-R-U023-Greek-Root-Poly-Worksheet.pdf"],
  [30, "r-u024-root-mono", "Greek Root mono", "MYL-LIT-MORPH-R-U024-Greek-Root-Mono-Worksheet.pdf"],
  [31, "r-u025-root-techn-techno", "Greek Roots techn / techno", "MYL-LIT-MORPH-R-U025-Greek-Root-Techn-Techno-Worksheet.pdf"],
  [32, "r-u026-root-port", "Latin Root port", "MYL-LIT-MORPH-R-U026-Latin-Root-Port-Worksheet.pdf"],
  [33, "r-u027-root-struct", "Latin Root struct", "MYL-LIT-MORPH-R-U027-Latin-Root-Struct-Worksheet.pdf"],
  [34, "r-u028-root-spect", "Latin Root spect", "MYL-LIT-MORPH-R-U028-Latin-Root-Spect-Worksheet.pdf"],
  [35, "r-u029-root-scrib-script", "Latin Roots scrib / script", "MYL-LIT-MORPH-R-U029-Latin-Roots-Scrib-Script-Worksheet.pdf"],
  [36, "r-u030-root-tract", "Latin Root tract", "MYL-LIT-MORPH-R-U030-Latin-Root-Tract-Worksheet.pdf"],
  [37, "r-u031-root-ject", "Latin Root ject", "MYL-LIT-MORPH-R-U031-Latin-Root-Ject-Worksheet.pdf"],
  [38, "r-u032-root-dict", "Latin Root dict", "MYL-LIT-MORPH-R-U032-Latin-Root-Dict-Worksheet.pdf"],
  [39, "r-u033-root-rupt", "Latin Root rupt", "MYL-LIT-MORPH-R-U033-Latin-Root-Rupt-Worksheet.pdf"],
  [40, "r-u034-root-mit-miss", "Latin Roots mit / miss", "MYL-LIT-MORPH-R-U034-Latin-Roots-Mit-Miss-Worksheet.pdf"],
  [41, "r-u035-root-duc-duct", "Latin Roots duc / duct", "MYL-LIT-MORPH-R-U035-Latin-Roots-Duc-Duct-Worksheet.pdf"],
  [42, "r-u036-root-fer", "Latin Root fer", "MYL-LIT-MORPH-R-U036-Latin-Root-Fer-Worksheet.pdf"],
  [43, "r-u038-root-cred", "Latin Root cred", "MYL-LIT-MORPH-R-U038-Latin-Root-Cred-Worksheet.pdf"],
  [44, "r-u039-root-vid-vis", "Latin Roots vid / vis", "MYL-LIT-MORPH-R-U039-Latin-Roots-Vid-Vis-Worksheet.pdf"],
  [45, "r-u040-root-voc-vok", "Latin Roots voc / vok", "MYL-LIT-MORPH-R-U040-Latin-Roots-Voc-Vok-Worksheet.pdf"],
] as const).map(([stepNumber, stepKey, title, fileName]) =>
  additionalEnglishWorksheetResource(
    stepNumber,
    stepKey,
    title,
    fileName,
    ENGLISH_HSF_STAGE_KEY,
    ENGLISH_HSF_STAGE_DISPLAY,
    ENGLISH_MORPHOLOGY_STRAND_KEY,
  ),
);

const ROOTS_E3_ENGLISH_WORKSHEET_RESOURCES: WorksheetResource[] = ([
  [46, "r-u041-root-aud", "Latin Root aud", "MYL-LIT-MORPH-R-U041-Latin-Root-Aud-Worksheet.pdf"],
  [47, "r-u042-root-cap-cept-cip", "Latin Roots cap / cept / cip", "MYL-LIT-MORPH-R-U042-Latin-Roots-Cap-Cept-Cip-Worksheet.pdf"],
  [48, "r-u043-root-fac-fect-fic", "Latin Roots fac / fect / fic", "MYL-LIT-MORPH-R-U043-Latin-Roots-Fac-Fect-Fic-Worksheet.pdf"],
  [49, "r-u044-root-grad-gress", "Latin Roots grad / gress", "MYL-LIT-MORPH-R-U044-Latin-Roots-Grad-Gress-Worksheet.pdf"],
  [50, "r-u045-root-pos-pon", "Latin Roots pos / pon", "MYL-LIT-MORPH-R-U045-Latin-Roots-Pos-Pon-Worksheet.pdf"],
  [51, "r-u046-root-ten-tain", "Latin Roots ten / tain", "MYL-LIT-MORPH-R-U046-Latin-Roots-Ten-Tain-Worksheet.pdf"],
  [52, "r-u047-root-ven-vent", "Latin Roots ven / vent", "MYL-LIT-MORPH-R-U047-Latin-Roots-Ven-Vent-Worksheet.pdf"],
  [53, "r-u048-root-ced-ceed-cess", "Latin Roots ced / ceed / cess", "MYL-LIT-MORPH-R-U048-Latin-Roots-Ced-Ceed-Cess-Worksheet.pdf"],
  [54, "r-u049-root-form", "Latin Root form", "MYL-LIT-MORPH-R-U049-Latin-Root-Form-Worksheet.pdf"],
  [55, "r-u050-root-terr", "Latin Root terr", "MYL-LIT-MORPH-R-U050-Latin-Root-Terr-Worksheet.pdf"],
  [56, "r-u051-root-aqu-aqua", "Latin Roots aqu / aqua", "MYL-LIT-MORPH-R-U051-Latin-Roots-Aqu-Aqua-Worksheet.pdf"],
  [57, "r-u052-root-ped", "Latin Root ped", "MYL-LIT-MORPH-R-U052-Latin-Root-Ped-Worksheet.pdf"],
  [58, "r-u053-root-man-manu", "Latin Roots man / manu", "MYL-LIT-MORPH-R-U053-Latin-Roots-Man-Manu-Worksheet.pdf"],
  [59, "r-u054-root-mar", "Latin Root mar", "MYL-LIT-MORPH-R-U054-Latin-Root-Mar-Worksheet.pdf"],
  [60, "r-u055-root-loc", "Latin Root loc", "MYL-LIT-MORPH-R-U055-Latin-Root-Loc-Worksheet.pdf"],
  [61, "r-u056-root-mov-mot", "Latin Roots mov / mot", "MYL-LIT-MORPH-R-U056-Latin-Roots-Mov-Mot-Worksheet.pdf"],
  [62, "r-u057-root-nov", "Latin Root nov", "MYL-LIT-MORPH-R-U057-Latin-Root-Nov-Worksheet.pdf"],
  [63, "r-u059-root-anim-anima", "Latin Roots anim / anima", "MYL-LIT-MORPH-R-U059-Latin-Roots-Anim-Anima-Worksheet.pdf"],
  [64, "r-u060-root-bene", "Latin Root bene", "MYL-LIT-MORPH-R-U060-Latin-Root-Bene-Worksheet.pdf"],
] as const).map(([stepNumber, stepKey, title, fileName]) =>
  additionalEnglishWorksheetResource(
    stepNumber,
    stepKey,
    title,
    fileName,
    ENGLISH_HSF_STAGE_KEY,
    ENGLISH_HSF_STAGE_DISPLAY,
    ENGLISH_MORPHOLOGY_STRAND_KEY,
  ),
);

const resources: WorksheetResource[] = [
  {
    pathwayStepId: `${ENGLISH_SUBJECT_KEY}::${ENGLISH_STRAND_KEY}::${ENGLISH_STAGE_KEY}::kf-u001-beginning-sounds`,
    stepKey: "kf-u001-beginning-sounds",
    subjectKey: ENGLISH_SUBJECT_KEY,
    strandKey: ENGLISH_STRAND_KEY,
    stageKey: ENGLISH_STAGE_KEY,
    stageDisplay: ENGLISH_STAGE_DISPLAY,
    stepNumber: 3,
    pathwayStepTitle: "Beginning Sounds",
    title: "Beginning Sounds",
    fileName: "MYL-LIT-MORPH-KF-U001-Beginning-Sounds-Worksheet.pdf",
    href: `/resources/worksheets/english/${ENGLISH_STRAND_KEY}/${ENGLISH_STAGE_KEY}/MYL-LIT-MORPH-KF-U001-Beginning-Sounds-Worksheet.pdf`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId: `${ENGLISH_SUBJECT_KEY}::${ENGLISH_STRAND_KEY}::${ENGLISH_STAGE_KEY}::kf-u002-ending-sounds`,
    stepKey: "kf-u002-ending-sounds",
    subjectKey: ENGLISH_SUBJECT_KEY,
    strandKey: ENGLISH_STRAND_KEY,
    stageKey: ENGLISH_STAGE_KEY,
    stageDisplay: ENGLISH_STAGE_DISPLAY,
    stepNumber: 4,
    pathwayStepTitle: "Ending Sounds",
    title: "Ending Sounds",
    fileName: "MYL-LIT-MORPH-KF-U002-Ending-Sounds-Worksheet.pdf",
    href: `/resources/worksheets/english/${ENGLISH_STRAND_KEY}/${ENGLISH_STAGE_KEY}/MYL-LIT-MORPH-KF-U002-Ending-Sounds-Worksheet.pdf`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId: `${ENGLISH_SUBJECT_KEY}::${ENGLISH_STRAND_KEY}::${ENGLISH_STAGE_KEY}::kf-u003-segment-and-blend`,
    stepKey: "kf-u003-segment-and-blend",
    subjectKey: ENGLISH_SUBJECT_KEY,
    strandKey: ENGLISH_STRAND_KEY,
    stageKey: ENGLISH_STAGE_KEY,
    stageDisplay: ENGLISH_STAGE_DISPLAY,
    stepNumber: 5,
    pathwayStepTitle: "Segment and Blend",
    title: "Segment and Blend",
    fileName: "MYL-LIT-MORPH-KF-U003-Segment-and-Blend-Worksheet.pdf",
    href: `/resources/worksheets/english/${ENGLISH_STRAND_KEY}/${ENGLISH_STAGE_KEY}/MYL-LIT-MORPH-KF-U003-Segment-and-Blend-Worksheet.pdf`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId: `${ENGLISH_SUBJECT_KEY}::${ENGLISH_STRAND_KEY}::${ENGLISH_STAGE_KEY}::kf-u004-consonant-sounds`,
    stepKey: "kf-u004-consonant-sounds",
    subjectKey: ENGLISH_SUBJECT_KEY,
    strandKey: ENGLISH_STRAND_KEY,
    stageKey: ENGLISH_STAGE_KEY,
    stageDisplay: ENGLISH_STAGE_DISPLAY,
    stepNumber: 6,
    pathwayStepTitle: "Consonant Sounds",
    title: "Consonant Sounds",
    fileName: "MYL-LIT-MORPH-KF-U004-Consonant-Sounds-Worksheet.pdf",
    href: `/resources/worksheets/english/${ENGLISH_STRAND_KEY}/${ENGLISH_STAGE_KEY}/MYL-LIT-MORPH-KF-U004-Consonant-Sounds-Worksheet.pdf`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId: `${ENGLISH_SUBJECT_KEY}::${ENGLISH_STRAND_KEY}::${ENGLISH_STAGE_KEY}::kf-u011-cvc-word-match`,
    stepKey: "kf-u011-cvc-word-match",
    subjectKey: ENGLISH_SUBJECT_KEY,
    strandKey: ENGLISH_STRAND_KEY,
    stageKey: ENGLISH_STAGE_KEY,
    stageDisplay: ENGLISH_STAGE_DISPLAY,
    stepNumber: 9,
    pathwayStepTitle: "CVC Word Match",
    title: "CVC Word Match",
    fileName: "MYL-LIT-MORPH-KF-U011-CVC-Word-Match-Worksheet.pdf",
    href: `/resources/worksheets/english/${ENGLISH_STRAND_KEY}/${ENGLISH_STAGE_KEY}/MYL-LIT-MORPH-KF-U011-CVC-Word-Match-Worksheet.pdf`,
    resourceType: "worksheet-pdf",
  },
  ...([
    [10, "kf-u007-short-vowel-o", "Short Vowel O", "MYL-LIT-MORPH-KF-U007-Short-Vowel-O-Worksheet.pdf"],
    [11, "kf-u008-short-vowel-u", "Short Vowel U", "MYL-LIT-MORPH-KF-U008-Short-Vowel-U-Worksheet.pdf"],
    [12, "kf-u009-short-vowel-e", "Short Vowel E", "MYL-LIT-MORPH-KF-U009-Short-Vowel-E-Worksheet.pdf"],
    [13, "kf-u010-cvc-word-practice", "CVC Word Practice", "MYL-LIT-MORPH-KF-U010-CVC-Word-Practice-Worksheet.pdf"],
    [14, "kf-u012-cvc-word-write", "CVC Word Write", "MYL-LIT-MORPH-KF-U012-CVC-Word-Write-Worksheet.pdf"],
    [15, "kf-u013-cvc-word-read-and-colour", "CVC Word Read and Colour", "MYL-LIT-MORPH-KF-U013-CVC-Word-Read-and-Colour-Worksheet.pdf"],
    [16, "kf-u014-cvc-word-sentences", "CVC Word Sentences", "MYL-LIT-MORPH-KF-U014-CVC-Word-Sentences-Worksheet.pdf"],
    [17, "kf-u015-cvc-word-spot-and-write", "CVC Word Spot and Write", "MYL-LIT-MORPH-KF-U015-CVC-Word-Spot-and-Write-Worksheet.pdf"],
    [18, "kf-u016-cvc-word-practice", "CVC Word Practice", "MYL-LIT-MORPH-KF-U016-CVC-Word-Practice-Worksheet.pdf"],
    [19, "kf-u017-cvc-word-sounds", "CVC Word Sounds", "MYL-LIT-MORPH-KF-U017-CVC-Word-Sounds-Worksheet.pdf"],
    [20, "kf-u018-cvc-word-match-and-sort", "CVC Word Match and Sort", "MYL-LIT-MORPH-KF-U018-CVC-Word-Match-and-Sort-Worksheet.pdf"],
    [21, "kf-u019-cvc-word-build-and-write", "CVC Word Build and Write", "MYL-LIT-MORPH-KF-U019-CVC-Word-Build-and-Write-Worksheet.pdf"],
    [22, "kf-u020-cvc-word-read-and-find", "CVC Word Read and Find", "MYL-LIT-MORPH-KF-U020-CVC-Word-Read-and-Find-Worksheet.pdf"],
    [7, "kf-u005-short-vowel-a", "Short Vowel A", "MYL-LIT-MORPH-KF-U005-Short-Vowel-A-Worksheet.pdf"],
    [8, "kf-u006-short-vowel-i", "Short Vowel I", "MYL-LIT-MORPH-KF-U006-Short-Vowel-I-Worksheet.pdf"],
    [23, "kf-u021-cvc-word-fluency", "CVC Word Fluency", "MYL-LIT-MORPH-KF-U021-CVC-Word-Fluency-Worksheet.pdf"],
  ] as const).map(([stepNumber, stepKey, title, fileName]) =>
    additionalEnglishWorksheetResource(stepNumber, stepKey, title, fileName),
  ),
  ...EXTENDED_ENGLISH_WORKSHEET_RESOURCES,
  ...MORPHOLOGY_ENGLISH_WORKSHEET_RESOURCES,
  ...SPELLING_CONVENTION_ENGLISH_WORKSHEET_RESOURCES,
  ...MS_ENGLISH_WORKSHEET_RESOURCES,
  ...HSF_ENGLISH_WORKSHEET_RESOURCES,
  ...ROOTS_E1_ENGLISH_WORKSHEET_RESOURCES,
  ...ROOTS_E2_ENGLISH_WORKSHEET_RESOURCES,
  ...ROOTS_E3_ENGLISH_WORKSHEET_RESOURCES,
];

export const ENGLISH_WORKSHEET_RESOURCES = resources;

export function getEnglishWorksheetResourceForPathwayStep(
  context: WorksheetStepContext,
): WorksheetResource | null {
  const pathwayStepId = String(context.pathwayStepId ?? "").trim();
  const stepKey = String(context.stepKey ?? "").trim();
  const subjectKey = String(context.subjectKey ?? "").trim();
  const strandKey = String(context.strandKey ?? "").trim();
  const stageKey = String(context.stageKey ?? "").trim();

  const exactResource = resources.find((resource) => {
    if (pathwayStepId && resource.pathwayStepId === pathwayStepId) return true;
    return Boolean(stepKey) && resource.stepKey === stepKey && resource.subjectKey === subjectKey && resource.strandKey === strandKey && resource.stageKey === stageKey;
  });

  return exactResource || null;
}
