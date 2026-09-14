import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  getPathwayStepsByStrand,
  normalizePathwayStepId,
} from "@/lib/clean/pathways/pathwayStepRegistry";
import {
  ENGLISH_WORKSHEET_RESOURCES,
  getEnglishWorksheetResourceForPathwayStep,
} from "@/lib/clean/resources/englishWorksheetResources";

const BATCH_A = [
  ["KF-U001", "kf-u001-beginning-sounds", "Beginning Sounds", "MYL-LIT-MORPH-KF-U001-Beginning-Sounds-Worksheet.pdf"],
  ["KF-U002", "kf-u002-ending-sounds", "Ending Sounds", "MYL-LIT-MORPH-KF-U002-Ending-Sounds-Worksheet.pdf"],
  ["KF-U003", "kf-u003-segment-and-blend", "Segment and Blend", "MYL-LIT-MORPH-KF-U003-Segment-and-Blend-Worksheet.pdf"],
  ["KF-U004", "kf-u004-consonant-sounds", "Consonant Sounds", "MYL-LIT-MORPH-KF-U004-Consonant-Sounds-Worksheet.pdf"],
  ["KF-U005", "kf-u005-short-vowel-a", "Short Vowel A", "MYL-LIT-MORPH-KF-U005-Short-Vowel-A-Worksheet.pdf"],
  ["KF-U006", "kf-u006-short-vowel-i", "Short Vowel I", "MYL-LIT-MORPH-KF-U006-Short-Vowel-I-Worksheet.pdf"],
  ["KF-U011", "kf-u011-cvc-word-match", "CVC Word Match", "MYL-LIT-MORPH-KF-U011-CVC-Word-Match-Worksheet.pdf"],
] as const;

const BATCH_B = [
  ["EE-U001", "ee-u001-consonant-digraphs", "Consonant Digraphs", "MYL-LIT-MORPH-EE-U001-Consonant-Digraphs-Worksheet.pdf"],
  ["EE-U002", "ee-u002-ck-ng-qu", "CK NG QU", "MYL-LIT-MORPH-EE-U002-CK-NG-QU-Worksheet.pdf"],
  ["EE-U003", "ee-u003-initial-consonant-blends", "Initial Consonant Blends", "MYL-LIT-MORPH-EE-U003-Initial-Consonant-Blends-Worksheet.pdf"],
  ["EE-U004", "ee-u004-final-consonant-blends", "Final Consonant Blends", "MYL-LIT-MORPH-EE-U004-Final-Consonant-Blends-Worksheet.pdf"],
  ["EE-U005", "ee-u005-long-vowels-silent-e", "Long Vowels Silent E", "MYL-LIT-MORPH-EE-U005-Long-Vowels-Silent-E-Worksheet.pdf"],
  ["EE-U006", "ee-u006-common-vowel-teams", "Common Vowel Teams", "MYL-LIT-MORPH-EE-U006-Common-Vowel-Teams-Worksheet.pdf"],
  ["EE-U007", "ee-u007-other-vowel-spellings", "Other Vowel Spellings", "MYL-LIT-MORPH-EE-U007-Other-Vowel-Spellings-Worksheet.pdf"],
  ["EE-U008", "ee-u008-two-syllable-word-building", "Two-Syllable Word Building", "MYL-LIT-MORPH-EE-U008-Two-Syllable-Word-Building-Worksheet.pdf"],
  ["EE-U010", "ee-u010-ed-ing", "ED ING", "MYL-LIT-MORPH-EE-U010-ED-ING-Worksheet.pdf"],
  ["EE-U011", "ee-u011-er-est", "ER EST", "MYL-LIT-MORPH-EE-U011-ER-EST-Worksheet.pdf"],
  ["EE-U012", "ee-u012-compound-words-and-base-words", "Compound Words and Base Words", "MYL-LIT-MORPH-EE-U012-Compound-Words-and-Base-Words-Worksheet.pdf"],
  ["EE-U009", "ee-u009-plurals-s-es", "Plurals S ES", "MYL-LIT-MORPH-EE-U009-Plurals-S-ES-Worksheet.pdf"],
] as const;

const BATCH_C = [
  ["u001-prefix-re", "Prefix re-", "morphology-and-spelling", "upper-elementary", "MYL-LIT-MORPH-UE-U001-Prefix-Re-Worksheet.pdf"],
  ["e-u003-prefix-pre", "Prefix Pre", "morphology-and-spelling", "upper-elementary", "MYL-LIT-MORPH-E-U003-Prefix-Pre-Worksheet.pdf"],
  ["e-u004-prefix-mis", "Prefix Mis", "morphology-and-spelling", "upper-elementary", "MYL-LIT-MORPH-E-U004-Prefix-Mis-Worksheet.pdf"],
  ["e-u005-prefix-dis", "Prefix Dis", "morphology-and-spelling", "upper-elementary", "MYL-LIT-MORPH-E-U005-Prefix-Dis-Worksheet.pdf"],
  ["e-u006-prefix-sub", "Prefix Sub", "morphology-and-spelling", "upper-elementary", "MYL-LIT-MORPH-E-U006-Prefix-Sub-Worksheet.pdf"],
  ["e-u007-prefix-over-under", "Prefix Over Under", "morphology-and-spelling", "upper-elementary", "MYL-LIT-MORPH-E-U007-Prefix-Over-Under-Worksheet.pdf"],
  ["e-u008-suffixes-ful-less", "Suffixes Ful Less", "morphology-and-spelling", "upper-elementary", "MYL-LIT-MORPH-E-U008-Suffixes-Ful-Less-Worksheet.pdf"],
  ["e-u009-suffix-ness", "Suffix Ness", "morphology-and-spelling", "upper-elementary", "MYL-LIT-MORPH-E-U009-Suffix-Ness-Worksheet.pdf"],
  ["e-u010-suffix-ment", "Suffix Ment", "morphology-and-spelling", "upper-elementary", "MYL-LIT-MORPH-E-U010-Suffix-Ment-Worksheet.pdf"],
  ["e-u011-suffix-ly", "Suffix Ly", "morphology-and-spelling", "upper-elementary", "MYL-LIT-MORPH-E-U011-Suffix-Ly-Worksheet.pdf"],
  ["e-u012-suffix-able", "Suffix Able", "morphology-and-spelling", "upper-elementary", "MYL-LIT-MORPH-E-U012-Suffix-Able-Worksheet.pdf"],
  ["ue-u008-prefix-in-im-il-ir", "Prefix In Im Il Ir", "morphology-and-spelling", "upper-elementary", "MYL-LIT-MORPH-UE-U008-Prefix-In-Im-Il-Ir-Worksheet.pdf"],
  ["ue-u009-prefix-con-com-co", "Prefix Con Com Co", "morphology-and-spelling", "upper-elementary", "MYL-LIT-MORPH-UE-U009-Prefix-Con-Com-Co-Worksheet.pdf"],
  ["ue-u010-prefix-trans", "Prefix Trans", "morphology-and-spelling", "upper-elementary", "MYL-LIT-MORPH-UE-U010-Prefix-Trans-Worksheet.pdf"],
  ["ue-u011-prefix-inter", "Prefix Inter", "morphology-and-spelling", "upper-elementary", "MYL-LIT-MORPH-UE-U011-Prefix-Inter-Worksheet.pdf"],
  ["ue-u012-prefix-fore", "Prefix Fore", "morphology-and-spelling", "upper-elementary", "MYL-LIT-MORPH-UE-U012-Prefix-Fore-Worksheet.pdf"],
  ["ue-u013-prefix-mid", "Prefix Mid", "morphology-and-spelling", "upper-elementary", "MYL-LIT-MORPH-UE-U013-Prefix-Mid-Worksheet.pdf"],
  ["ue-u002-drop-final-e", "Drop Final E", "spelling-and-word-study", "lower-primary", "MYL-LIT-MORPH-UE-U002-Drop-Final-E-Worksheet.pdf"],
  ["ue-u003-double-final-consonant", "Double Final Consonant", "spelling-and-word-study", "lower-primary", "MYL-LIT-MORPH-UE-U003-Double-Final-Consonant-Worksheet.pdf"],
  ["ue-u004-change-y-to-i", "Change Y to I", "spelling-and-word-study", "lower-primary", "MYL-LIT-MORPH-UE-U004-Change-Y-to-I-Worksheet.pdf"],
  ["ue-u005-keep-the-base-word", "Keep the Base Word", "spelling-and-word-study", "lower-primary", "MYL-LIT-MORPH-UE-U005-Keep-the-Base-Word-Worksheet.pdf"],
  ["ue-u006-compare-related-words", "Compare Related Words", "spelling-and-word-study", "lower-primary", "MYL-LIT-MORPH-UE-U006-Compare-Related-Words-Worksheet.pdf"],
  ["ue-u007-explain-spelling", "Explain Spelling", "spelling-and-word-study", "lower-primary", "MYL-LIT-MORPH-UE-U007-Explain-Spelling-Worksheet.pdf"],
] as const;

const BATCH_D = [
  ["ms-u001-suffix-ion", "Suffix Ion", "upper-primary", "MYL-LIT-MORPH-MS-U001-Suffix-Ion-Worksheet.pdf"],
  ["ms-u002-suffix-ian-an", "Suffix Ian An", "upper-primary", "MYL-LIT-MORPH-MS-U002-Suffix-Ian-An-Worksheet.pdf"],
  ["ms-u003-suffix-ive", "Suffix Ive", "upper-primary", "MYL-LIT-MORPH-MS-U003-Suffix-Ive-Worksheet.pdf"],
  ["ms-u004-suffix-al", "Suffix Al", "upper-primary", "MYL-LIT-MORPH-MS-U004-Suffix-Al-Worksheet.pdf"],
  ["ms-u005-suffix-ic", "Suffix Ic", "upper-primary", "MYL-LIT-MORPH-MS-U005-Suffix-Ic-Worksheet.pdf"],
  ["ms-u006-suffix-ure", "Suffix Ure", "upper-primary", "MYL-LIT-MORPH-MS-U006-Suffix-Ure-Worksheet.pdf"],
  ["ms-u007-suffix-ance-ence", "Suffix Ance Ence", "upper-primary", "MYL-LIT-MORPH-MS-U007-Suffix-Ance-Ence-Worksheet.pdf"],
  ["ms-u008-suffix-ant-ent", "Suffix Ant Ent", "upper-primary", "MYL-LIT-MORPH-MS-U008-Suffix-Ant-Ent-Worksheet.pdf"],
  ["ms-u009-suffix-able-ible", "Suffix Able Ible", "upper-primary", "MYL-LIT-MORPH-MS-U009-Suffix-Able-Ible-Worksheet.pdf"],
  ["ms-u010-prefix-ad-ac-at", "Prefix Ad Ac At", "upper-primary", "MYL-LIT-MORPH-MS-U010-Prefix-Ad-Ac-At-Worksheet.pdf"],
  ["ms-u011-prefix-ex-e", "Prefix Ex E", "upper-primary", "MYL-LIT-MORPH-MS-U011-Prefix-Ex-E-Worksheet.pdf"],
  ["ms-u012-prefix-ob", "Prefix Ob", "upper-primary", "MYL-LIT-MORPH-MS-U012-Prefix-Ob-Worksheet.pdf"],
  ["ms-u013-prefix-per", "Prefix Per", "upper-primary", "MYL-LIT-MORPH-MS-U013-Prefix-Per-Worksheet.pdf"],
  ["ms-u014-prefix-pro", "Prefix Pro", "upper-primary", "MYL-LIT-MORPH-MS-U014-Prefix-Pro-Worksheet.pdf"],
  ["hsf-u001-prefix-contra-counter", "Prefix Contra Counter", "lower-secondary", "MYL-LIT-MORPH-HSF-U001-Prefix-Contra-Counter-Worksheet.pdf"],
  ["hsf-u002-prefix-multi", "Prefix Multi", "lower-secondary", "MYL-LIT-MORPH-HSF-U002-Prefix-Multi-Worksheet.pdf"],
  ["hsf-u003-prefix-super", "Prefix Super", "lower-secondary", "MYL-LIT-MORPH-HSF-U003-Prefix-Super-Worksheet.pdf"],
  ["hsf-u004-prefix-semi", "Prefix Semi", "lower-secondary", "MYL-LIT-MORPH-HSF-U004-Prefix-Semi-Worksheet.pdf"],
  ["hsf-u005-suffix-ary", "Suffix Ary", "lower-secondary", "MYL-LIT-MORPH-HSF-U005-Suffix-Ary-Worksheet.pdf"],
  ["hsf-u006-suffix-ative", "Suffix Ative", "lower-secondary", "MYL-LIT-MORPH-HSF-U006-Suffix-Ative-Worksheet.pdf"],
  ["hsf-u007-suffix-ous", "Suffix Ous", "lower-secondary", "MYL-LIT-MORPH-HSF-U007-Suffix-Ous-Worksheet.pdf"],
  ["hsf-u008-suffix-ate", "Suffix Ate", "lower-secondary", "MYL-LIT-MORPH-HSF-U008-Suffix-Ate-Worksheet.pdf"],
  ["hsf-u009-multiple-affixes", "Multiple Affixes", "lower-secondary", "MYL-LIT-MORPH-HSF-U009-Multiple-Affixes-Worksheet.pdf"],
  ["hsf-u010-unlock-academic-vocabulary", "Unlock Academic Vocabulary", "lower-secondary", "MYL-LIT-MORPH-HSF-U010-Unlock-Academic-Vocabulary-Worksheet.pdf"],
] as const;

const BATCH_E1 = [
  ["r-u001-root-bio", "Greek Root bio", "lower-secondary", "MYL-LIT-MORPH-R-U001-Greek-Root-Bio-Worksheet.pdf"],
  ["r-u002-root-geo", "Greek Root geo", "lower-secondary", "MYL-LIT-MORPH-R-U002-Greek-Root-Geo-Worksheet.pdf"],
  ["r-u003-root-graph-gram", "Greek Roots graph / gram", "lower-secondary", "MYL-LIT-MORPH-R-U003-Greek-Roots-Graph-Gram-Worksheet.pdf"],
  ["r-u004-root-phon", "Greek Root phon", "lower-secondary", "MYL-LIT-MORPH-R-U004-Greek-Root-Phon-Worksheet.pdf"],
  ["r-u005-root-tele", "Greek Root tele", "lower-secondary", "MYL-LIT-MORPH-R-U005-Greek-Root-Tele-Worksheet.pdf"],
  ["r-u006-root-chron", "Greek Root chron", "lower-secondary", "MYL-LIT-MORPH-R-U006-Greek-Root-Chron-Worksheet.pdf"],
  ["r-u007-root-morph", "Greek Root morph", "lower-secondary", "MYL-LIT-MORPH-R-U007-Greek-Root-Morph-Worksheet.pdf"],
  ["r-u008-root-micro", "Greek Root micro", "lower-secondary", "MYL-LIT-MORPH-R-U008-Greek-Root-Micro-Worksheet.pdf"],
  ["r-u009-root-macro", "Greek Root macro", "lower-secondary", "MYL-LIT-MORPH-R-U009-Greek-Root-Macro-Worksheet.pdf"],
  ["r-u010-root-photo-phot", "Greek Roots photo / phot", "lower-secondary", "MYL-LIT-MORPH-R-U010-Greek-Root-Photo-Phot-Worksheet.pdf"],
  ["r-u011-root-therm", "Greek Root therm", "lower-secondary", "MYL-LIT-MORPH-R-U011-Greek-Root-Therm-Worksheet.pdf"],
  ["r-u012-root-hydro", "Greek Root hydro", "lower-secondary", "MYL-LIT-MORPH-R-U012-Greek-Root-Hydro-Worksheet.pdf"],
  ["r-u013-root-astro-astr", "Greek Roots astro / astr", "lower-secondary", "MYL-LIT-MORPH-R-U013-Greek-Root-Astro-Worksheet.pdf"],
  ["r-u014-root-metr-meter", "Greek Roots metr / meter", "lower-secondary", "MYL-LIT-MORPH-R-U014-Greek-Root-Metr-Meter-Worksheet.pdf"],
  ["r-u016-root-auto", "Greek Root auto", "lower-secondary", "MYL-LIT-MORPH-R-U016-Greek-Root-Auto-Worksheet.pdf"],
  ["r-u017-root-demo-dem", "Greek Roots demo / dem", "lower-secondary", "MYL-LIT-MORPH-R-U017-Greek-Root-Demo-Dem-Worksheet.pdf"],
  ["r-u018-root-psych", "Greek Root psych", "lower-secondary", "MYL-LIT-MORPH-R-U018-Greek-Root-Psych-Worksheet.pdf"],
  ["r-u019-root-log-logy", "Greek Roots log / logy", "lower-secondary", "MYL-LIT-MORPH-R-U019-Greek-Root-Log-Logy-Worksheet.pdf"],
  ["r-u020-root-path", "Greek Root path", "lower-secondary", "MYL-LIT-MORPH-R-U020-Greek-Root-Path-Worksheet.pdf"],
] as const;

const BATCH_E2 = [
  ["r-u021-root-gen", "Greek Root gen", "lower-secondary", "MYL-LIT-MORPH-R-U021-Greek-Root-Gen-Worksheet.pdf"],
  ["r-u022-root-cycl", "Greek Root cycl", "lower-secondary", "MYL-LIT-MORPH-R-U022-Greek-Root-Cycl-Worksheet.pdf"],
  ["r-u023-root-poly", "Greek Root poly", "lower-secondary", "MYL-LIT-MORPH-R-U023-Greek-Root-Poly-Worksheet.pdf"],
  ["r-u024-root-mono", "Greek Root mono", "lower-secondary", "MYL-LIT-MORPH-R-U024-Greek-Root-Mono-Worksheet.pdf"],
  ["r-u025-root-techn-techno", "Greek Roots techn / techno", "lower-secondary", "MYL-LIT-MORPH-R-U025-Greek-Root-Techn-Techno-Worksheet.pdf"],
  ["r-u026-root-port", "Latin Root port", "lower-secondary", "MYL-LIT-MORPH-R-U026-Latin-Root-Port-Worksheet.pdf"],
  ["r-u027-root-struct", "Latin Root struct", "lower-secondary", "MYL-LIT-MORPH-R-U027-Latin-Root-Struct-Worksheet.pdf"],
  ["r-u028-root-spect", "Latin Root spect", "lower-secondary", "MYL-LIT-MORPH-R-U028-Latin-Root-Spect-Worksheet.pdf"],
  ["r-u029-root-scrib-script", "Latin Roots scrib / script", "lower-secondary", "MYL-LIT-MORPH-R-U029-Latin-Roots-Scrib-Script-Worksheet.pdf"],
  ["r-u030-root-tract", "Latin Root tract", "lower-secondary", "MYL-LIT-MORPH-R-U030-Latin-Root-Tract-Worksheet.pdf"],
  ["r-u031-root-ject", "Latin Root ject", "lower-secondary", "MYL-LIT-MORPH-R-U031-Latin-Root-Ject-Worksheet.pdf"],
  ["r-u032-root-dict", "Latin Root dict", "lower-secondary", "MYL-LIT-MORPH-R-U032-Latin-Root-Dict-Worksheet.pdf"],
  ["r-u033-root-rupt", "Latin Root rupt", "lower-secondary", "MYL-LIT-MORPH-R-U033-Latin-Root-Rupt-Worksheet.pdf"],
  ["r-u034-root-mit-miss", "Latin Roots mit / miss", "lower-secondary", "MYL-LIT-MORPH-R-U034-Latin-Roots-Mit-Miss-Worksheet.pdf"],
  ["r-u035-root-duc-duct", "Latin Roots duc / duct", "lower-secondary", "MYL-LIT-MORPH-R-U035-Latin-Roots-Duc-Duct-Worksheet.pdf"],
  ["r-u036-root-fer", "Latin Root fer", "lower-secondary", "MYL-LIT-MORPH-R-U036-Latin-Root-Fer-Worksheet.pdf"],
  ["r-u037-root-pend-pens", "Latin Roots pend / pens", "lower-secondary", "MYL-LIT-MORPH-R-U037-Latin-Roots-Pend-Pens-Worksheet.pdf"],
  ["r-u038-root-cred", "Latin Root cred", "lower-secondary", "MYL-LIT-MORPH-R-U038-Latin-Root-Cred-Worksheet.pdf"],
  ["r-u039-root-vid-vis", "Latin Roots vid / vis", "lower-secondary", "MYL-LIT-MORPH-R-U039-Latin-Roots-Vid-Vis-Worksheet.pdf"],
  ["r-u040-root-voc-vok", "Latin Roots voc / vok", "lower-secondary", "MYL-LIT-MORPH-R-U040-Latin-Roots-Voc-Vok-Worksheet.pdf"],
  ["r-u058-root-mont", "Latin Root mont", "lower-secondary", "MYL-LIT-MORPH-R-U058-Latin-Root-Mont-Worksheet.pdf"],
] as const;

const BATCH_E3 = [
  ["r-u041-root-aud", "Latin Root aud", "lower-secondary", "MYL-LIT-MORPH-R-U041-Latin-Root-Aud-Worksheet.pdf"],
  ["r-u042-root-cap-cept-cip", "Latin Roots cap / cept / cip", "lower-secondary", "MYL-LIT-MORPH-R-U042-Latin-Roots-Cap-Cept-Cip-Worksheet.pdf"],
  ["r-u043-root-fac-fect-fic", "Latin Roots fac / fect / fic", "lower-secondary", "MYL-LIT-MORPH-R-U043-Latin-Roots-Fac-Fect-Fic-Worksheet.pdf"],
  ["r-u044-root-grad-gress", "Latin Roots grad / gress", "lower-secondary", "MYL-LIT-MORPH-R-U044-Latin-Roots-Grad-Gress-Worksheet.pdf"],
  ["r-u045-root-pos-pon", "Latin Roots pos / pon", "lower-secondary", "MYL-LIT-MORPH-R-U045-Latin-Roots-Pos-Pon-Worksheet.pdf"],
  ["r-u046-root-ten-tain", "Latin Roots ten / tain", "lower-secondary", "MYL-LIT-MORPH-R-U046-Latin-Roots-Ten-Tain-Worksheet.pdf"],
  ["r-u047-root-ven-vent", "Latin Roots ven / vent", "lower-secondary", "MYL-LIT-MORPH-R-U047-Latin-Roots-Ven-Vent-Worksheet.pdf"],
  ["r-u048-root-ced-ceed-cess", "Latin Roots ced / ceed / cess", "lower-secondary", "MYL-LIT-MORPH-R-U048-Latin-Roots-Ced-Ceed-Cess-Worksheet.pdf"],
  ["r-u049-root-form", "Latin Root form", "lower-secondary", "MYL-LIT-MORPH-R-U049-Latin-Root-Form-Worksheet.pdf"],
  ["r-u050-root-terr", "Latin Root terr", "lower-secondary", "MYL-LIT-MORPH-R-U050-Latin-Root-Terr-Worksheet.pdf"],
  ["r-u051-root-aqu-aqua", "Latin Roots aqu / aqua", "lower-secondary", "MYL-LIT-MORPH-R-U051-Latin-Roots-Aqu-Aqua-Worksheet.pdf"],
  ["r-u052-root-ped", "Latin Root ped", "lower-secondary", "MYL-LIT-MORPH-R-U052-Latin-Root-Ped-Worksheet.pdf"],
  ["r-u053-root-man-manu", "Latin Roots man / manu", "lower-secondary", "MYL-LIT-MORPH-R-U053-Latin-Roots-Man-Manu-Worksheet.pdf"],
  ["r-u054-root-mar", "Latin Root mar", "lower-secondary", "MYL-LIT-MORPH-R-U054-Latin-Root-Mar-Worksheet.pdf"],
  ["r-u055-root-loc", "Latin Root loc", "lower-secondary", "MYL-LIT-MORPH-R-U055-Latin-Root-Loc-Worksheet.pdf"],
  ["r-u056-root-mov-mot", "Latin Roots mov / mot", "lower-secondary", "MYL-LIT-MORPH-R-U056-Latin-Roots-Mov-Mot-Worksheet.pdf"],
  ["r-u057-root-nov", "Latin Root nov", "lower-secondary", "MYL-LIT-MORPH-R-U057-Latin-Root-Nov-Worksheet.pdf"],
  ["r-u059-root-anim-anima", "Latin Roots anim / anima", "lower-secondary", "MYL-LIT-MORPH-R-U059-Latin-Roots-Anim-Anima-Worksheet.pdf"],
  ["r-u060-root-bene", "Latin Root bene", "lower-secondary", "MYL-LIT-MORPH-R-U060-Latin-Root-Bene-Worksheet.pdf"],
] as const;

function publicPath(resource: { href: string }) {
  return path.join(process.cwd(), "public", resource.href.replace(/^\//, ""));
}

describe("English Word Builders Batch A", () => {
  it("registers the approved explicit foundation identities without duplicates", () => {
    const steps = getPathwayStepsByStrand("english", "spelling-and-word-study");
    const batchSteps = steps.filter((step) => step.stepKey.startsWith("kf-u"));

    expect(batchSteps).toHaveLength(21);
    expect(new Set(batchSteps.map((step) => step.id)).size).toBe(batchSteps.length);

    BATCH_A.forEach(([, stepKey, title]) => {
      expect(batchSteps).toContainEqual(expect.objectContaining({
        stepKey,
        stepTitle: title,
        id: `english::spelling-and-word-study::foundation-kindergarten::${stepKey}`,
        stageKey: "foundation-kindergarten",
      }));
    });
  });

  it("maps only deployed PDFs to their exact registry identities and public files", () => {
    expect(ENGLISH_WORKSHEET_RESOURCES).toHaveLength(139);

    BATCH_A.forEach(([, stepKey, , expectedFileName]) => {
      const resource = getEnglishWorksheetResourceForPathwayStep({
        pathwayStepId: `english::spelling-and-word-study::foundation-kindergarten::${stepKey}`,
        stepKey,
        subjectKey: "english",
        strandKey: "spelling-and-word-study",
        stageKey: "foundation-kindergarten",
      });

      if (!expectedFileName) {
        expect(resource).toBeNull();
        return;
      }

      expect(resource).toMatchObject({ fileName: expectedFileName, subjectKey: "english" });
      expect(existsSync(publicPath(resource!))).toBe(true);
      expect(resource?.href).toContain(`/resources/worksheets/english/spelling-and-word-study/foundation-kindergarten/${expectedFileName}`);
    });
  });

  it("resolves the locally available continuation units without creating U005 or U006 mappings", () => {
    const continuation = [
      ["kf-u007-short-vowel-o", "MYL-LIT-MORPH-KF-U007-Short-Vowel-O-Worksheet.pdf"],
      ["kf-u008-short-vowel-u", "MYL-LIT-MORPH-KF-U008-Short-Vowel-U-Worksheet.pdf"],
      ["kf-u009-short-vowel-e", "MYL-LIT-MORPH-KF-U009-Short-Vowel-E-Worksheet.pdf"],
      ["kf-u010-cvc-word-practice", "MYL-LIT-MORPH-KF-U010-CVC-Word-Practice-Worksheet.pdf"],
      ["kf-u012-cvc-word-write", "MYL-LIT-MORPH-KF-U012-CVC-Word-Write-Worksheet.pdf"],
      ["kf-u013-cvc-word-read-and-colour", "MYL-LIT-MORPH-KF-U013-CVC-Word-Read-and-Colour-Worksheet.pdf"],
      ["kf-u014-cvc-word-sentences", "MYL-LIT-MORPH-KF-U014-CVC-Word-Sentences-Worksheet.pdf"],
      ["kf-u015-cvc-word-spot-and-write", "MYL-LIT-MORPH-KF-U015-CVC-Word-Spot-and-Write-Worksheet.pdf"],
      ["kf-u016-cvc-word-practice", "MYL-LIT-MORPH-KF-U016-CVC-Word-Practice-Worksheet.pdf"],
      ["kf-u017-cvc-word-sounds", "MYL-LIT-MORPH-KF-U017-CVC-Word-Sounds-Worksheet.pdf"],
      ["kf-u018-cvc-word-match-and-sort", "MYL-LIT-MORPH-KF-U018-CVC-Word-Match-and-Sort-Worksheet.pdf"],
      ["kf-u019-cvc-word-build-and-write", "MYL-LIT-MORPH-KF-U019-CVC-Word-Build-and-Write-Worksheet.pdf"],
      ["kf-u020-cvc-word-read-and-find", "MYL-LIT-MORPH-KF-U020-CVC-Word-Read-and-Find-Worksheet.pdf"],
      ["kf-u021-cvc-word-fluency", "MYL-LIT-MORPH-KF-U021-CVC-Word-Fluency-Worksheet.pdf"],
    ] as const;

    continuation.forEach(([stepKey, fileName]) => {
      const resource = getEnglishWorksheetResourceForPathwayStep({
        pathwayStepId: `english::spelling-and-word-study::foundation-kindergarten::${stepKey}`,
        stepKey,
        subjectKey: "english",
        strandKey: "spelling-and-word-study",
        stageKey: "foundation-kindergarten",
      });
      expect(resource?.fileName).toBe(fileName);
      expect(existsSync(publicPath(resource!))).toBe(true);
    });
  });

  it("does not contain malformed or duplicate worksheet filenames", () => {
    const filenames = ENGLISH_WORKSHEET_RESOURCES.map((resource) => resource.fileName);
    expect(new Set(filenames).size).toBe(filenames.length);
    expect(filenames.every((filename) => /^MYL-LIT-MORPH-(KF|EE|E|UE|MS|HSF|R)-U\d{3}-[A-Za-z0-9-]+\.pdf$/.test(filename))).toBe(true);
    expect(filenames.some((filename) => /\.pdf\.pdf|\([123]\)/i.test(filename))).toBe(false);
  });

  it("maps Batch C morphology and spelling resources to their strand contexts", () => {
    const morphologySteps = getPathwayStepsByStrand("english", "morphology-and-spelling");
    const spellingSteps = getPathwayStepsByStrand("english", "spelling-and-word-study");

    BATCH_C.forEach(([stepKey, title, strandKey, stageKey, expectedFileName]) => {
      const steps = strandKey === "morphology-and-spelling" ? morphologySteps : spellingSteps;
      const pathwayStepId = `english::${strandKey}::${stageKey}::${stepKey}`;
      expect(steps).toContainEqual(expect.objectContaining({
        id: pathwayStepId,
        stepKey,
        stepTitle: title,
        stageKey,
      }));

      const resource = getEnglishWorksheetResourceForPathwayStep({
        pathwayStepId,
        stepKey,
        subjectKey: "english",
        strandKey,
        stageKey,
      });
      expect(resource).toMatchObject({
        pathwayStepId,
        stepKey,
        strandKey,
        stageKey,
        fileName: expectedFileName,
        href: `/resources/worksheets/english/${strandKey}/${stageKey}/${expectedFileName}`,
      });
      expect(existsSync(publicPath(resource!))).toBe(true);
    });
  });

  it("keeps Prefix re- on its existing identity and legacy alias", () => {
    expect(normalizePathwayStepId("english::morphology-and-spelling::middle-primary::u001-prefix-re"))
      .toBe("english::morphology-and-spelling::upper-elementary::u001-prefix-re");
    expect(ENGLISH_WORKSHEET_RESOURCES.filter((resource) => resource.stepKey === "u001-prefix-re"))
      .toHaveLength(1);
  });

  it("maps the deployed extended phonics worksheets to lower-primary identities", () => {
    const steps = getPathwayStepsByStrand("english", "spelling-and-word-study");
    const batchSteps = steps.filter((step) => step.stepKey.startsWith("ee-u"));

    expect(batchSteps).toHaveLength(BATCH_B.length);
    expect(new Set(batchSteps.map((step) => step.id)).size).toBe(batchSteps.length);

    BATCH_B.forEach(([, stepKey, title, expectedFileName]) => {
      const pathwayStepId = `english::spelling-and-word-study::lower-primary::${stepKey}`;
      expect(batchSteps).toContainEqual(expect.objectContaining({
        stepKey,
        stepTitle: title,
        id: pathwayStepId,
        stageKey: "lower-primary",
      }));

      const resource = getEnglishWorksheetResourceForPathwayStep({
        pathwayStepId,
        stepKey,
        subjectKey: "english",
        strandKey: "spelling-and-word-study",
        stageKey: "lower-primary",
      });
      expect(resource).toMatchObject({
        pathwayStepId,
        stepKey,
        stageKey: "lower-primary",
        fileName: expectedFileName,
        href: `/resources/worksheets/english/spelling-and-word-study/lower-primary/${expectedFileName}`,
      });
      expect(existsSync(publicPath(resource!))).toBe(true);
  });
  });

  it("maps MS and HSF morphology resources across their selected stages", () => {
    const morphologySteps = getPathwayStepsByStrand("english", "morphology-and-spelling");
    const batchSteps = morphologySteps.filter((step) => step.stepKey.startsWith("ms-u") || step.stepKey.startsWith("hsf-u"));

    expect(batchSteps).toHaveLength(BATCH_D.length);
    expect(new Set(batchSteps.map((step) => step.id)).size).toBe(batchSteps.length);

    BATCH_D.forEach(([stepKey, title, stageKey, expectedFileName]) => {
      const pathwayStepId = `english::morphology-and-spelling::${stageKey}::${stepKey}`;
      expect(batchSteps).toContainEqual(expect.objectContaining({
        id: pathwayStepId,
        stepKey,
        stepTitle: title,
        strandKey: "morphology-and-spelling",
        stageKey,
      }));

      const resource = getEnglishWorksheetResourceForPathwayStep({
        pathwayStepId,
        stepKey,
        subjectKey: "english",
        strandKey: "morphology-and-spelling",
        stageKey,
      });
      expect(resource).toMatchObject({
        pathwayStepId,
        stepKey,
        stageKey,
        fileName: expectedFileName,
        href: `/resources/worksheets/english/morphology-and-spelling/${stageKey}/${expectedFileName}`,
      });
      expect(existsSync(publicPath(resource!))).toBe(true);
    });

    expect(getEnglishWorksheetResourceForPathwayStep({
      pathwayStepId: "english::morphology-and-spelling::lower-secondary::hsf-u002-missing",
      stepKey: "hsf-u002-missing",
      subjectKey: "english",
      strandKey: "morphology-and-spelling",
      stageKey: "lower-secondary",
    })).toBeNull();
  });

  it("maps the available Roots E1, E2, and E3 resources to lower-secondary morphology", () => {
    const morphologySteps = getPathwayStepsByStrand("english", "morphology-and-spelling");
    const rootSteps = morphologySteps.filter((step) => step.stepKey.startsWith("r-u"));

    expect(rootSteps).toHaveLength(BATCH_E1.length + BATCH_E2.length + BATCH_E3.length);
    expect(new Set(rootSteps.map((step) => step.id)).size).toBe(rootSteps.length);

    [...BATCH_E1, ...BATCH_E2, ...BATCH_E3].forEach(([stepKey, title, stageKey, expectedFileName]) => {
      const pathwayStepId = `english::morphology-and-spelling::${stageKey}::${stepKey}`;
      expect(rootSteps).toContainEqual(expect.objectContaining({
        id: pathwayStepId,
        stepKey,
        stepTitle: title,
        strandKey: "morphology-and-spelling",
        stageKey,
      }));

      const resource = getEnglishWorksheetResourceForPathwayStep({
        pathwayStepId,
        stepKey,
        subjectKey: "english",
        strandKey: "morphology-and-spelling",
        stageKey,
      });
      expect(resource).toMatchObject({
        pathwayStepId,
        stepKey,
        stageKey,
        fileName: expectedFileName,
        href: `/resources/worksheets/english/morphology-and-spelling/${stageKey}/${expectedFileName}`,
      });
      expect(existsSync(publicPath(resource!))).toBe(true);
    });

    expect(getEnglishWorksheetResourceForPathwayStep({
      pathwayStepId: "english::morphology-and-spelling::lower-secondary::r-u015-root-scop-scope",
      stepKey: "r-u015-root-scop-scope",
      subjectKey: "english",
      strandKey: "morphology-and-spelling",
      stageKey: "lower-secondary",
    })).toBeNull();
  });
});
