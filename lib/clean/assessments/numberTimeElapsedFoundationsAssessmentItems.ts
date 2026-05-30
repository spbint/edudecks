import type {
  NumberAssessmentAnswerType,
  NumberAssessmentClassificationCategory,
  NumberAssessmentClassificationItem,
  NumberAssessmentItemDifficulty,
  NumberAssessmentMatchingPair,
  NumberAssessmentOpenResponseReview,
  NumberAssessmentStructuredOption,
  NumberAssessmentVisualSupport,
} from "@/lib/clean/assessments/numberApproximationAssessmentItems";

export type NumberTimeElapsedFoundationsProgressionBandKey =
  "time-and-elapsed-time-foundations";

export type NumberTimeElapsedFoundationsProgressionStepKey =
  | "read-and-represent-analogue-and-digital-time"
  | "calculate-elapsed-time-and-duration"
  | "interpret-timetables-and-daily-schedules"
  | "solve-calendar-and-multi-step-time-contexts";

export type NumberTimeElapsedFoundationsAssessmentFormat =
  | "analogue_digital_time_match"
  | "nearest_five_minutes"
  | "twelve_hour_time_language"
  | "elapsed_time_calculation"
  | "end_time_from_duration"
  | "elapsed_time_working"
  | "daily_schedule_ordering"
  | "simple_timetable_reading"
  | "am_pm_context"
  | "calendar_date_duration"
  | "multi_step_time_context"
  | "time_reasonableness_check";

export type NumberTimeElapsedFoundationsMisconceptionCode =
  | "analogue-digital-time-match-error"
  | "minute-hand-hour-hand-confusion"
  | "five-minute-interval-counting-error"
  | "am-pm-context-confusion"
  | "elapsed-time-counting-error"
  | "start-end-duration-confusion"
  | "crossing-hour-boundary-error"
  | "timetable-reading-error"
  | "schedule-ordering-error"
  | "calendar-date-counting-error"
  | "time-unit-conversion-error"
  | "time-reasonableness-checking-gap";

export type NumberTimeElapsedFoundationsAdaptiveRoute = {
  ifIncorrectGoToStepKey?: NumberTimeElapsedFoundationsProgressionStepKey;
  ifCorrectGoToStepKey?: NumberTimeElapsedFoundationsProgressionStepKey;
  practiceRecommendation: string;
  diagnosticNote: string;
};

export type NumberTimeElapsedFoundationsAssessmentItem = {
  id: string;
  progressionBandKey: NumberTimeElapsedFoundationsProgressionBandKey;
  progressionStepKey: NumberTimeElapsedFoundationsProgressionStepKey;
  subElementKey: string;
  subElementTitle: string;
  subElementDescription?: string;
  title: string;
  prompt: string;
  difficulty: NumberAssessmentItemDifficulty;
  answerType: NumberAssessmentAnswerType;
  format: NumberTimeElapsedFoundationsAssessmentFormat;
  options?: string[];
  structuredOptions?: NumberAssessmentStructuredOption[];
  correctOptionIds?: string[];
  matchingPairs?: NumberAssessmentMatchingPair[];
  orderingItems?: string[];
  correctOrder?: string[];
  classificationCategories?: NumberAssessmentClassificationCategory[];
  classificationItems?: NumberAssessmentClassificationItem[];
  gapText?: string;
  gapAnswer?: string;
  gapAcceptableAnswers?: string[];
  trueFalseStatement?: string;
  correctBoolean?: boolean;
  correctionOptions?: string[];
  correctCorrection?: string;
  correctWorkingOptionId?: string;
  bestExplanationOptionId?: string;
  expectedAnswer?: string;
  acceptableAnswers?: string[];
  markingGuide?: string;
  workedSolution?: string;
  misconceptionTargets: NumberTimeElapsedFoundationsMisconceptionCode[];
  adaptiveRoute: NumberTimeElapsedFoundationsAdaptiveRoute;
  visualSupport?: NumberAssessmentVisualSupport;
  openResponseReview?: NumberAssessmentOpenResponseReview;
};

export const NUMBER_TIME_ELAPSED_FOUNDATIONS_ITEM_BANK_KEY =
  "number-time-elapsed-foundations-assessment-items-v1";

export const NUMBER_TIME_ELAPSED_FOUNDATIONS_PROGRESSION_BAND_KEY: NumberTimeElapsedFoundationsProgressionBandKey =
  "time-and-elapsed-time-foundations";

export const NUMBER_TIME_ELAPSED_FOUNDATIONS_ASSESSMENT_ITEMS: NumberTimeElapsedFoundationsAssessmentItem[] =
  [
    {
      id: "time-elapsed-foundations-analogue-digital-match-001",
      progressionBandKey: NUMBER_TIME_ELAPSED_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "read-and-represent-analogue-and-digital-time",
      subElementKey: "reading-and-representing-time",
      subElementTitle: "Reading and representing time",
      subElementDescription:
        "Read, match and represent analogue and digital times.",
      title: "Match analogue and digital times",
      prompt:
        "Match each clock description to the digital time it shows.",
      difficulty: "foundation",
      answerType: "matching",
      format: "analogue_digital_time_match",
      matchingPairs: [
        { prompt: "Hour hand just after 3, minute hand on 6", correctMatch: "3:30" },
        { prompt: "Hour hand just after 8, minute hand on 3", correctMatch: "8:15" },
        { prompt: "Hour hand almost at 12, minute hand on 11", correctMatch: "11:55" },
      ],
      expectedAnswer:
        "Hour hand just after 3 = 3:30; hour hand just after 8 = 8:15; hour hand almost at 12 = 11:55.",
      acceptableAnswers: [
        "Hour hand just after 3 = 3:30; hour hand just after 8 = 8:15; hour hand almost at 12 = 11:55.",
      ],
      markingGuide:
        "Award full credit for matching all three analogue descriptions to the correct digital times.",
      workedSolution:
        "The minute hand shows minutes: 6 means 30 minutes, 3 means 15 minutes and 11 means 55 minutes.",
      misconceptionTargets: [
        "analogue-digital-time-match-error",
        "minute-hand-hour-hand-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "read-and-represent-analogue-and-digital-time",
        ifCorrectGoToStepKey: "read-and-represent-analogue-and-digital-time",
        practiceRecommendation:
          "Practise matching clock-hand positions to digital times.",
        diagnosticNote:
          "This item checks whether the learner connects analogue clock hands with digital time notation.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use analogue clock faces beside digital time cards.",
      },
    },
    {
      id: "time-elapsed-foundations-nearest-five-002",
      progressionBandKey: NUMBER_TIME_ELAPSED_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "read-and-represent-analogue-and-digital-time",
      subElementKey: "reading-and-representing-time",
      subElementTitle: "Reading and representing time",
      subElementDescription:
        "Read, match and represent analogue and digital times.",
      title: "Read to the nearest 5 minutes",
      prompt:
        "A clock has the hour hand between 4 and 5 and the minute hand on the 8. What time is shown?",
      difficulty: "foundation",
      answerType: "multiple_choice",
      format: "nearest_five_minutes",
      options: ["4:40", "8:20", "5:40", "4:08"],
      expectedAnswer: "4:40",
      acceptableAnswers: ["4:40", "4.40"],
      markingGuide:
        "Award full credit for 4:40.",
      workedSolution:
        "The hour hand between 4 and 5 means it is after 4. The minute hand on 8 means 8 x 5 = 40 minutes.",
      misconceptionTargets: [
        "five-minute-interval-counting-error",
        "minute-hand-hour-hand-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "read-and-represent-analogue-and-digital-time",
        ifCorrectGoToStepKey: "calculate-elapsed-time-and-duration",
        practiceRecommendation:
          "Practise counting around a clock face in 5-minute jumps.",
        diagnosticNote:
          "This item checks whether the learner reads the minute hand using five-minute intervals.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use a clock face with 5-minute intervals marked around the edge.",
      },
    },
    {
      id: "time-elapsed-foundations-time-language-003",
      progressionBandKey: NUMBER_TIME_ELAPSED_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "read-and-represent-analogue-and-digital-time",
      subElementKey: "reading-and-representing-time",
      subElementTitle: "Reading and representing time",
      subElementDescription:
        "Read, match and represent analogue and digital times.",
      title: "Write time language digitally",
      prompt:
        "Write half past 3 in the afternoon as a digital time with am or pm.",
      difficulty: "foundation",
      answerType: "short_symbolic",
      format: "twelve_hour_time_language",
      expectedAnswer: "3:30 pm",
      acceptableAnswers: ["3:30 pm", "3.30 pm", "15:30", "3:30pm"],
      markingGuide:
        "Award full credit for 3:30 pm or an equivalent 24-hour form.",
      workedSolution:
        "Half past means 30 minutes after the hour. In the afternoon, half past 3 is 3:30 pm.",
      misconceptionTargets: [
        "analogue-digital-time-match-error",
        "am-pm-context-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "read-and-represent-analogue-and-digital-time",
        ifCorrectGoToStepKey: "calculate-elapsed-time-and-duration",
        practiceRecommendation:
          "Practise converting common time language such as half past and quarter past into digital time.",
        diagnosticNote:
          "This item checks whether the learner can connect time language with digital notation and am/pm context.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use paired cards for time language and digital time notation.",
      },
    },
    {
      id: "time-elapsed-foundations-elapsed-minutes-004",
      progressionBandKey: NUMBER_TIME_ELAPSED_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "calculate-elapsed-time-and-duration",
      subElementKey: "elapsed-time-and-duration",
      subElementTitle: "Elapsed time and duration",
      subElementDescription:
        "Calculate elapsed time, start time, end time and duration using timelines and number-line reasoning.",
      title: "Calculate elapsed time",
      prompt:
        "A swimming lesson starts at 9:25 and ends at 10:10. How many minutes long is it?",
      difficulty: "developing",
      answerType: "numeric",
      format: "elapsed_time_calculation",
      expectedAnswer: "45",
      acceptableAnswers: ["45", "45 minutes", "45 min"],
      markingGuide:
        "Award full credit for 45 minutes.",
      workedSolution:
        "From 9:25 to 10:00 is 35 minutes. From 10:00 to 10:10 is 10 minutes. Total = 45 minutes.",
      misconceptionTargets: [
        "elapsed-time-counting-error",
        "crossing-hour-boundary-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "calculate-elapsed-time-and-duration",
        ifCorrectGoToStepKey: "calculate-elapsed-time-and-duration",
        practiceRecommendation:
          "Practise counting elapsed time through the next hour on an open number line.",
        diagnosticNote:
          "This item checks whether the learner can calculate elapsed time across an hour boundary.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use an open time number line from 9:25 to 10:10 through 10:00.",
      },
    },
    {
      id: "time-elapsed-foundations-end-time-gap-005",
      progressionBandKey: NUMBER_TIME_ELAPSED_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "calculate-elapsed-time-and-duration",
      subElementKey: "elapsed-time-and-duration",
      subElementTitle: "Elapsed time and duration",
      subElementDescription:
        "Calculate elapsed time, start time, end time and duration using timelines and number-line reasoning.",
      title: "Find the end time",
      prompt:
        "Complete the time statement.",
      difficulty: "developing",
      answerType: "fill_gap",
      format: "end_time_from_duration",
      gapText: "A movie starts at 1:45 pm and lasts 50 minutes. It ends at __.",
      gapAnswer: "2:35 pm",
      gapAcceptableAnswers: ["2:35 pm", "2.35 pm", "14:35", "2:35pm"],
      expectedAnswer: "2:35 pm",
      acceptableAnswers: ["2:35 pm", "2.35 pm", "14:35", "2:35pm"],
      markingGuide:
        "Award full credit for 2:35 pm or an equivalent 24-hour form.",
      workedSolution:
        "From 1:45 pm to 2:00 pm is 15 minutes. There are 35 minutes left, so the end time is 2:35 pm.",
      misconceptionTargets: [
        "start-end-duration-confusion",
        "crossing-hour-boundary-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "calculate-elapsed-time-and-duration",
        ifCorrectGoToStepKey: "interpret-timetables-and-daily-schedules",
        practiceRecommendation:
          "Practise finding end times by adding duration in useful jumps.",
        diagnosticNote:
          "This item checks whether the learner can add a duration to a start time.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use an open time number line from 1:45 pm to 2:35 pm.",
      },
    },
    {
      id: "time-elapsed-foundations-correct-working-006",
      progressionBandKey: NUMBER_TIME_ELAPSED_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "calculate-elapsed-time-and-duration",
      subElementKey: "elapsed-time-and-duration",
      subElementTitle: "Elapsed time and duration",
      subElementDescription:
        "Calculate elapsed time, start time, end time and duration using timelines and number-line reasoning.",
      title: "Choose elapsed-time working",
      prompt:
        "Which working correctly finds the time from 2:50 pm to 3:25 pm?",
      difficulty: "developing",
      answerType: "select_correct_working",
      format: "elapsed_time_working",
      structuredOptions: [
        {
          id: "count-through-hour",
          label: "2:50 to 3:00 is 10 minutes, then 3:00 to 3:25 is 25 minutes, so 35 minutes.",
        },
        {
          id: "subtract-minutes-only",
          label: "50 - 25 = 25 minutes, so the elapsed time is 25 minutes.",
        },
        {
          id: "add-times",
          label: "2:50 + 3:25 = 5:75, so the elapsed time is 75 minutes.",
        },
        {
          id: "ignore-hour",
          label: "Because 2 and 3 are one apart, the elapsed time must be 1 hour.",
        },
      ],
      correctWorkingOptionId: "count-through-hour",
      expectedAnswer: "35 minutes",
      acceptableAnswers: ["35", "35 minutes", "35 min"],
      markingGuide:
        "Award full credit for selecting the working that counts through 3:00.",
      workedSolution:
        "Count from 2:50 to 3:00, then from 3:00 to 3:25. The jumps are 10 and 25 minutes, so the duration is 35 minutes.",
      misconceptionTargets: [
        "elapsed-time-counting-error",
        "crossing-hour-boundary-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "calculate-elapsed-time-and-duration",
        ifCorrectGoToStepKey: "interpret-timetables-and-daily-schedules",
        practiceRecommendation:
          "Practise choosing elapsed-time jumps that pass through the next hour.",
        diagnosticNote:
          "This item checks whether the learner recognises valid elapsed-time reasoning.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use an open time number line with jumps to 3:00 and then to 3:25.",
      },
    },
    {
      id: "time-elapsed-foundations-schedule-order-007",
      progressionBandKey: NUMBER_TIME_ELAPSED_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "interpret-timetables-and-daily-schedules",
      subElementKey: "timetables-and-daily-schedules",
      subElementTitle: "Timetables and daily schedules",
      subElementDescription:
        "Interpret schedules, timetables and ordered events across a day.",
      title: "Order a daily schedule",
      prompt:
        "Order these events from earliest to latest.",
      difficulty: "developing",
      answerType: "ordering",
      format: "daily_schedule_ordering",
      orderingItems: [
        "Library at 11:15 am",
        "Breakfast at 7:45 am",
        "Sport at 2:05 pm",
        "Assembly at 9:10 am",
      ],
      correctOrder: [
        "Breakfast at 7:45 am",
        "Assembly at 9:10 am",
        "Library at 11:15 am",
        "Sport at 2:05 pm",
      ],
      expectedAnswer:
        "Breakfast at 7:45 am, Assembly at 9:10 am, Library at 11:15 am, Sport at 2:05 pm",
      acceptableAnswers: [
        "Breakfast at 7:45 am, Assembly at 9:10 am, Library at 11:15 am, Sport at 2:05 pm",
      ],
      markingGuide:
        "Award full credit for ordering all four daily events from earliest to latest.",
      workedSolution:
        "Morning times come before afternoon times. In the morning, 7:45 is before 9:10, which is before 11:15.",
      misconceptionTargets: [
        "schedule-ordering-error",
        "am-pm-context-confusion",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "interpret-timetables-and-daily-schedules",
        ifCorrectGoToStepKey: "interpret-timetables-and-daily-schedules",
        practiceRecommendation:
          "Practise ordering daily events using am and pm.",
        diagnosticNote:
          "This item checks whether the learner can order events across a school day.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a daily schedule table with event and time columns.",
      },
    },
    {
      id: "time-elapsed-foundations-timetable-008",
      progressionBandKey: NUMBER_TIME_ELAPSED_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "interpret-timetables-and-daily-schedules",
      subElementKey: "timetables-and-daily-schedules",
      subElementTitle: "Timetables and daily schedules",
      subElementDescription:
        "Interpret schedules, timetables and ordered events across a day.",
      title: "Read a simple timetable",
      prompt:
        "A bus timetable says: Town 8:20 am, School 8:45 am, Pool 9:05 am. How long does the bus take from Town to School?",
      difficulty: "secure",
      answerType: "numeric",
      format: "simple_timetable_reading",
      expectedAnswer: "25",
      acceptableAnswers: ["25", "25 minutes", "25 min"],
      markingGuide:
        "Award full credit for 25 minutes.",
      workedSolution:
        "From 8:20 am to 8:45 am is 25 minutes.",
      misconceptionTargets: [
        "timetable-reading-error",
        "elapsed-time-counting-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "interpret-timetables-and-daily-schedules",
        ifCorrectGoToStepKey: "solve-calendar-and-multi-step-time-contexts",
        practiceRecommendation:
          "Practise reading timetable rows and finding the time between two entries.",
        diagnosticNote:
          "This item checks whether the learner can interpret a simple timetable and calculate a short duration.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a timetable table with stops and departure times.",
      },
    },
    {
      id: "time-elapsed-foundations-am-pm-009",
      progressionBandKey: NUMBER_TIME_ELAPSED_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "interpret-timetables-and-daily-schedules",
      subElementKey: "timetables-and-daily-schedules",
      subElementTitle: "Timetables and daily schedules",
      subElementDescription:
        "Interpret schedules, timetables and ordered events across a day.",
      title: "Classify am and pm contexts",
      prompt:
        "Classify each event as usually am or pm.",
      difficulty: "secure",
      answerType: "classification",
      format: "am_pm_context",
      classificationCategories: [
        { id: "am", label: "am" },
        { id: "pm", label: "pm" },
      ],
      classificationItems: [
        { id: "breakfast", label: "Breakfast before school", correctCategoryId: "am" },
        { id: "afternoon-sport", label: "Sport after lunch", correctCategoryId: "pm" },
        { id: "bedtime-reading", label: "Reading before bedtime", correctCategoryId: "pm" },
      ],
      expectedAnswer:
        "Breakfast before school = am; sport after lunch = pm; reading before bedtime = pm.",
      acceptableAnswers: [
        "Breakfast before school = am; sport after lunch = pm; reading before bedtime = pm.",
      ],
      markingGuide:
        "Award full credit for classifying all three events by am/pm context.",
      workedSolution:
        "am is from midnight to before midday. pm is from midday to before midnight. Breakfast before school is usually am; after lunch and bedtime are pm.",
      misconceptionTargets: [
        "am-pm-context-confusion",
        "schedule-ordering-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "interpret-timetables-and-daily-schedules",
        ifCorrectGoToStepKey: "solve-calendar-and-multi-step-time-contexts",
        practiceRecommendation:
          "Practise using daily context to decide whether a time is am or pm.",
        diagnosticNote:
          "This item checks whether the learner can use everyday context to interpret am and pm.",
      },
      visualSupport: {
        type: "context_card",
        description:
          "Use morning, afternoon and evening context cards.",
      },
    },
    {
      id: "time-elapsed-foundations-calendar-duration-010",
      progressionBandKey: NUMBER_TIME_ELAPSED_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "solve-calendar-and-multi-step-time-contexts",
      subElementKey: "calendars-and-multi-step-time-contexts",
      subElementTitle: "Calendars and multi-step time contexts",
      subElementDescription:
        "Use calendars, dates and multi-step time reasoning in practical contexts.",
      title: "Find a date on a calendar",
      prompt:
        "A project starts on Monday 6 May and lasts 2 weeks. What date does it finish?",
      difficulty: "secure",
      answerType: "short_symbolic",
      format: "calendar_date_duration",
      expectedAnswer: "Monday 20 May",
      acceptableAnswers: ["Monday 20 May", "20 May", "May 20", "20/5"],
      markingGuide:
        "Award full credit for Monday 20 May or an equivalent date.",
      workedSolution:
        "Two weeks is 14 days. 14 days after Monday 6 May is Monday 20 May.",
      misconceptionTargets: [
        "calendar-date-counting-error",
        "time-unit-conversion-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "solve-calendar-and-multi-step-time-contexts",
        ifCorrectGoToStepKey: "solve-calendar-and-multi-step-time-contexts",
        practiceRecommendation:
          "Practise counting days and weeks on a calendar grid.",
        diagnosticNote:
          "This item checks whether the learner can use weeks and dates in a practical calendar context.",
      },
      visualSupport: {
        type: "table",
        description:
          "Use a May calendar grid and count forward two weeks.",
      },
    },
    {
      id: "time-elapsed-foundations-multi-step-011",
      progressionBandKey: NUMBER_TIME_ELAPSED_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "solve-calendar-and-multi-step-time-contexts",
      subElementKey: "calendars-and-multi-step-time-contexts",
      subElementTitle: "Calendars and multi-step time contexts",
      subElementDescription:
        "Use calendars, dates and multi-step time reasoning in practical contexts.",
      title: "Solve a multi-step time context",
      prompt:
        "A rehearsal starts at 4:15 pm. Warm-up takes 20 minutes and practice takes 45 minutes. What time does rehearsal finish?",
      difficulty: "extension",
      answerType: "numeric",
      format: "multi_step_time_context",
      expectedAnswer: "5:20 pm",
      acceptableAnswers: ["5:20 pm", "5.20 pm", "17:20", "5:20pm"],
      markingGuide:
        "Award full credit for 5:20 pm or an equivalent 24-hour form.",
      workedSolution:
        "20 minutes + 45 minutes = 65 minutes. 4:15 pm plus 1 hour is 5:15 pm, plus 5 more minutes is 5:20 pm.",
      misconceptionTargets: [
        "start-end-duration-confusion",
        "time-unit-conversion-error",
        "crossing-hour-boundary-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "solve-calendar-and-multi-step-time-contexts",
        ifCorrectGoToStepKey: "solve-calendar-and-multi-step-time-contexts",
        practiceRecommendation:
          "Practise combining durations before finding the finish time.",
        diagnosticNote:
          "This item checks whether the learner can solve a multi-step time problem by combining durations.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use a start-end-duration timeline from 4:15 pm to 5:20 pm.",
      },
    },
    {
      id: "time-elapsed-foundations-reasonableness-012",
      progressionBandKey: NUMBER_TIME_ELAPSED_FOUNDATIONS_PROGRESSION_BAND_KEY,
      progressionStepKey: "solve-calendar-and-multi-step-time-contexts",
      subElementKey: "calendars-and-multi-step-time-contexts",
      subElementTitle: "Calendars and multi-step time contexts",
      subElementDescription:
        "Use calendars, dates and multi-step time reasoning in practical contexts.",
      title: "Check a time answer",
      prompt:
        "True or false: If a class starts at 10:50 am and runs for 25 minutes, it finishes at 10:75 am. If false, choose the correction.",
      difficulty: "extension",
      answerType: "true_false_correction",
      format: "time_reasonableness_check",
      trueFalseStatement:
        "If a class starts at 10:50 am and runs for 25 minutes, it finishes at 10:75 am.",
      correctBoolean: false,
      correctionOptions: [
        "The class finishes at 11:15 am because 10:75 is not a valid time.",
        "The class finishes at 10:25 am because 50 - 25 = 25.",
        "The class finishes at 11:75 am because the hour changes.",
      ],
      correctCorrection:
        "The class finishes at 11:15 am because 10:75 is not a valid time.",
      expectedAnswer: "False; 11:15 am",
      acceptableAnswers: ["False; 11:15 am", "11:15 am", "false 11:15"],
      markingGuide:
        "Award full credit for identifying the statement as false and correcting the finish time to 11:15 am.",
      workedSolution:
        "From 10:50 to 11:00 is 10 minutes. There are 15 minutes left, so the class finishes at 11:15 am. A time cannot have 75 minutes.",
      misconceptionTargets: [
        "time-reasonableness-checking-gap",
        "time-unit-conversion-error",
        "crossing-hour-boundary-error",
      ],
      adaptiveRoute: {
        ifIncorrectGoToStepKey: "calculate-elapsed-time-and-duration",
        ifCorrectGoToStepKey: "solve-calendar-and-multi-step-time-contexts",
        practiceRecommendation:
          "Practise checking that minutes stay between 00 and 59 when finding end times.",
        diagnosticNote:
          "This item checks whether the learner can reject unreasonable time notation and correct it.",
      },
      visualSupport: {
        type: "number_line",
        description:
          "Use an open time number line from 10:50 am to 11:15 am.",
      },
    },
  ];

export function getNumberTimeElapsedFoundationsAssessmentItemById(id: string) {
  return (
    NUMBER_TIME_ELAPSED_FOUNDATIONS_ASSESSMENT_ITEMS.find(
      (item) => item.id === id,
    ) || null
  );
}

export function getNumberTimeElapsedFoundationsAssessmentItemsByStep(
  stepKey: NumberTimeElapsedFoundationsProgressionStepKey,
) {
  return NUMBER_TIME_ELAPSED_FOUNDATIONS_ASSESSMENT_ITEMS.filter(
    (item) => item.progressionStepKey === stepKey,
  );
}

export function getNumberTimeElapsedFoundationsAssessmentItemsByDifficulty(
  difficulty: NumberAssessmentItemDifficulty,
) {
  return NUMBER_TIME_ELAPSED_FOUNDATIONS_ASSESSMENT_ITEMS.filter(
    (item) => item.difficulty === difficulty,
  );
}

export function getNumberTimeElapsedFoundationsAssessmentItemsBySubElement(
  subElementKey: string,
) {
  return NUMBER_TIME_ELAPSED_FOUNDATIONS_ASSESSMENT_ITEMS.filter(
    (item) => item.subElementKey === subElementKey,
  );
}
