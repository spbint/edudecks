import type { PathwaySubjectKey } from "@/lib/clean/pathways/pathwaySubjects";

export type MathWorksheetResourceType = "worksheet-pdf";

export type MathWorksheetResource = {
  pathwayStepId: string;
  stepKey: string;
  subjectKey: PathwaySubjectKey;
  strandKey: string;
  stageKey: string;
  stageDisplay?: string;
  stepNumber: number;
  pathwayStepTitle?: string;
  title: string;
  curriculumCode?: string;
  concept?: string;
  includesAnswerSheet?: boolean;
  fileName: string;
  href: string;
  resourceType: MathWorksheetResourceType;
};

export type MathWorksheetStepContext = {
  pathwayStepId?: string | null;
  stepKey?: string | null;
  subjectKey?: string | null;
  strandKey?: string | null;
  stageKey?: string | null;
};

const SMALL_QUANTITIES_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S001-Recognise-Small-Quantities-Without-Counting.pdf";
const NUMBER_WORDS_TO_GROUPS_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S002-Match-Spoken-Number-Names-To-Quantities.pdf";
const IDENTIFY_NUMERALS_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S003-Identify-Numerals-0-10.pdf";
const COUNT_OBJECTS_TO_10_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S004-Count-Objects-Accurately-To-10.pdf";
const COUNT_OBJECTS_TO_20_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S005-Count-Objects-Accurately-To-20.pdf";
const COMPARE_GROUPS_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S006-Compare-Groups-More-Fewer-Or-Same.pdf";
const ORDER_NUMBERS_SEQUENCE_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S007-Order-Numbers-In-A-Short-Sequence.pdf";
const PARTITION_COMBINE_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S008-Partition-And-Combine-Small-Collections-Up-To-10.pdf";
const OBJECT_STORIES_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S009-Represent-Simple-Addition-And-Subtraction-Stories-With-Objects.pdf";
const SHARE_EQUALLY_WORKSHEET_FILE =
  "MYL-MATH-NPV-F-S010-Share-Small-Collections-Equally.pdf";
const COUNT_FORWARDS_BACKWARDS_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S011-Count-Forwards-And-Backwards-Within-100-Or-120.pdf";
const READ_WRITE_ORDER_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S012-Read-Write-And-Order-Numbers-To-100-Or-120.pdf";
const SKIP_COUNT_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S013-Skip-Count-By-2s-5s-And-10s.pdf";
const TEN_ONES_MAKE_TEN_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S014-Understand-That-Ten-Ones-Make-One-Ten.pdf";
const PARTITION_TWO_DIGIT_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S015-Partition-Two-Digit-Numbers-Into-Tens-And-Ones.pdf";
const RENAME_TWO_DIGIT_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S016-Rename-Two-Digit-Numbers-In-Different-Ways.pdf";
const ADD_SUBTRACT_WITHIN_20_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S017-Add-And-Subtract-Within-20-Using-Known-Facts.pdf";
const ADD_SUBTRACT_WITH_SUPPORT_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S018-Add-And-Subtract-One-And-Two-Digit-Numbers-With-Support.pdf";
const EQUAL_GROUPS_ARRAYS_WORKSHEET_FILE =
  "MYL-MATH-NPV-LP-S019-Understand-Simple-Equal-Groups-And-Arrays.pdf";

export const MATH_WORKSHEET_RESOURCES: MathWorksheetResource[] = [
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::recognise-small-quantities-without-counting",
    stepKey: "recognise-small-quantities-without-counting",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 1,
    pathwayStepTitle: "Recognise small quantities without counting",
    title: "Recognise Small Quantities Without Counting",
    fileName: SMALL_QUANTITIES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${SMALL_QUANTITIES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::match-spoken-number-names-to-quantities",
    stepKey: "match-spoken-number-names-to-quantities",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 2,
    pathwayStepTitle: "Match spoken number names to quantities",
    title: "Match Number Words to Groups",
    curriculumCode: "AC9MFN02",
    concept: "Match spoken number names to quantities",
    fileName: NUMBER_WORDS_TO_GROUPS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${NUMBER_WORDS_TO_GROUPS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::identify-numerals-0-10",
    stepKey: "identify-numerals-0-10",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 3,
    pathwayStepTitle: "Identify numerals 0-10",
    title: "Identify Numerals 0 to 10",
    concept: "Recognise numerals from 0 to 10",
    fileName: IDENTIFY_NUMERALS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${IDENTIFY_NUMERALS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::count-objects-accurately-to-10",
    stepKey: "count-objects-accurately-to-10",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 4,
    pathwayStepTitle: "Count objects accurately to 10",
    title: "Count Objects to 10",
    concept: "Count objects accurately to 10",
    fileName: COUNT_OBJECTS_TO_10_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${COUNT_OBJECTS_TO_10_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::count-objects-accurately-to-20",
    stepKey: "count-objects-accurately-to-20",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 5,
    pathwayStepTitle: "Count objects accurately to 20",
    title: "Count Objects to 20",
    concept: "Count objects accurately to 20",
    fileName: COUNT_OBJECTS_TO_20_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${COUNT_OBJECTS_TO_20_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::compare-groups-as-more-fewer-or-same",
    stepKey: "compare-groups-as-more-fewer-or-same",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 6,
    pathwayStepTitle: "Compare groups as more, fewer or same",
    title: "Compare Groups: More, Fewer or Same",
    concept: "Compare groups as more, fewer or the same",
    fileName: COMPARE_GROUPS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${COMPARE_GROUPS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::order-numbers-in-a-short-sequence",
    stepKey: "order-numbers-in-a-short-sequence",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 7,
    pathwayStepTitle: "Order numbers in a short sequence",
    title: "Order Numbers in a Short Sequence",
    concept: "Order numbers in a short sequence",
    fileName: ORDER_NUMBERS_SEQUENCE_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${ORDER_NUMBERS_SEQUENCE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::partition-and-combine-small-collections-up-to-10",
    stepKey: "partition-and-combine-small-collections-up-to-10",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 8,
    pathwayStepTitle: "Partition and combine small collections up to 10",
    title: "Partition and Combine Small Collections up to 10",
    concept: "Partition and combine small collections up to 10",
    fileName: PARTITION_COMBINE_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${PARTITION_COMBINE_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::represent-simple-addition-and-subtraction-stories-with-objects",
    stepKey: "represent-simple-addition-and-subtraction-stories-with-objects",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 9,
    pathwayStepTitle: "Represent simple addition and subtraction stories with objects",
    title: "Represent Addition and Subtraction Stories with Objects",
    concept: "Use objects to represent simple addition and subtraction stories",
    fileName: OBJECT_STORIES_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${OBJECT_STORIES_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::foundation-kindergarten::share-small-collections-equally",
    stepKey: "share-small-collections-equally",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "foundation-kindergarten",
    stepNumber: 10,
    pathwayStepTitle: "Share small collections equally",
    title: "Share Small Collections Equally",
    concept: "Share small collections equally into groups",
    fileName: SHARE_EQUALLY_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/foundation/${SHARE_EQUALLY_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::count-forwards-and-backwards-within-100-or-120",
    stepKey: "count-forwards-and-backwards-within-100-or-120",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 11,
    pathwayStepTitle: "Count forwards and backwards within 100 or 120",
    title: "Count Forwards and Backwards",
    concept: "Count forwards and backwards within 120",
    includesAnswerSheet: true,
    fileName: COUNT_FORWARDS_BACKWARDS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${COUNT_FORWARDS_BACKWARDS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::read-write-and-order-numbers-to-100-or-120",
    stepKey: "read-write-and-order-numbers-to-100-or-120",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 12,
    pathwayStepTitle: "Read, write and order numbers to 100 or 120",
    title: "Read, Write and Order Numbers to 100 or 120",
    concept: "Read, write and order numbers to 100 or 120",
    includesAnswerSheet: true,
    fileName: READ_WRITE_ORDER_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${READ_WRITE_ORDER_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::skip-count-by-2s-5s-and-10s",
    stepKey: "skip-count-by-2s-5s-and-10s",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 13,
    pathwayStepTitle: "Skip count by 2s, 5s and 10s",
    title: "Skip Count by 2s, 5s and 10s",
    concept: "Skip count by 2s, 5s and 10s",
    includesAnswerSheet: true,
    fileName: SKIP_COUNT_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${SKIP_COUNT_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::understand-that-ten-ones-make-one-ten",
    stepKey: "understand-that-ten-ones-make-one-ten",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 14,
    pathwayStepTitle: "Understand that ten ones make one ten",
    title: "Understand that Ten Ones Make One Ten",
    concept: "Understand that 10 ones can be grouped as 1 ten",
    includesAnswerSheet: false,
    fileName: TEN_ONES_MAKE_TEN_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${TEN_ONES_MAKE_TEN_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::partition-two-digit-numbers-into-tens-and-ones",
    stepKey: "partition-two-digit-numbers-into-tens-and-ones",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 15,
    pathwayStepTitle: "Partition two-digit numbers into tens and ones",
    title: "Partition Two-Digit Numbers into Tens and Ones",
    concept: "Partition two-digit numbers into tens and ones",
    includesAnswerSheet: false,
    fileName: PARTITION_TWO_DIGIT_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${PARTITION_TWO_DIGIT_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::rename-two-digit-numbers-in-different-ways",
    stepKey: "rename-two-digit-numbers-in-different-ways",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 16,
    pathwayStepTitle: "Rename two-digit numbers in different ways",
    title: "Rename Two-Digit Numbers in Different Ways",
    concept: "Rename two-digit numbers using different tens-and-ones combinations",
    includesAnswerSheet: false,
    fileName: RENAME_TWO_DIGIT_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${RENAME_TWO_DIGIT_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::add-and-subtract-within-20-using-known-facts",
    stepKey: "add-and-subtract-within-20-using-known-facts",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 17,
    pathwayStepTitle: "Add and subtract within 20 using known facts",
    title: "Add and Subtract Within 20 Using Known Facts",
    concept: "Use known facts to add and subtract within 20",
    includesAnswerSheet: false,
    fileName: ADD_SUBTRACT_WITHIN_20_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${ADD_SUBTRACT_WITHIN_20_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::add-and-subtract-one-and-two-digit-numbers-with-support",
    stepKey: "add-and-subtract-one-and-two-digit-numbers-with-support",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 18,
    pathwayStepTitle: "Add and subtract one- and two-digit numbers with support",
    title: "Add and Subtract One- and Two-Digit Numbers",
    concept: "Add and subtract one- and two-digit numbers using visual support",
    includesAnswerSheet: false,
    fileName: ADD_SUBTRACT_WITH_SUPPORT_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${ADD_SUBTRACT_WITH_SUPPORT_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
  {
    pathwayStepId:
      "mathematics::number-and-place-value::lower-primary::understand-simple-equal-groups-and-arrays",
    stepKey: "understand-simple-equal-groups-and-arrays",
    subjectKey: "mathematics",
    strandKey: "number-and-place-value",
    stageKey: "lower-primary",
    stageDisplay: "Lower Primary",
    stepNumber: 19,
    pathwayStepTitle: "Understand simple equal groups and arrays",
    title: "Understand Simple Equal Groups and Arrays",
    concept: "Recognise equal groups and simple arrays as structured collections",
    includesAnswerSheet: false,
    fileName: EQUAL_GROUPS_ARRAYS_WORKSHEET_FILE,
    href: `/resources/worksheets/maths/number-and-place-value/lower-primary/${EQUAL_GROUPS_ARRAYS_WORKSHEET_FILE}`,
    resourceType: "worksheet-pdf",
  },
];

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export function getWorksheetResourceForPathwayStep(
  context: MathWorksheetStepContext,
): MathWorksheetResource | null {
  const pathwayStepId = safe(context.pathwayStepId);
  const stepKey = safe(context.stepKey);
  const subjectKey = safe(context.subjectKey);
  const strandKey = safe(context.strandKey);
  const stageKey = safe(context.stageKey);

  return (
    MATH_WORKSHEET_RESOURCES.find((resource) => {
      if (pathwayStepId && resource.pathwayStepId === pathwayStepId) {
        return true;
      }

      return (
        Boolean(stepKey) &&
        resource.stepKey === stepKey &&
        resource.subjectKey === subjectKey &&
        resource.strandKey === strandKey &&
        resource.stageKey === stageKey
      );
    }) ?? null
  );
}
