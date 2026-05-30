import {
  NUMBER_TIME_ELAPSED_FOUNDATIONS_ITEM_BANK_KEY,
} from "@/lib/clean/assessments/numberTimeElapsedFoundationsAssessmentItems";
import type {
  NumberPracticeModule,
} from "@/lib/clean/practice/numberPowersRootsPracticeModules";

function safe(value: unknown) {
  return String(value ?? "").trim();
}

export const NUMBER_TIME_ELAPSED_FOUNDATIONS_PRACTICE_MODULE: NumberPracticeModule = {
  id: "number-time-elapsed-foundations-practice-module-v1",
  progressionBandKey: "time-and-elapsed-time-foundations",
  title: "Time and elapsed-time foundations",
  shortTitle: "Time and elapsed time",
  description:
    "Practise reading analogue and digital time, elapsed time, duration, timetables, calendars and practical time contexts.",
  yearBandLabel: "Years 3-5",
  subjectKey: "mathematics",
  strandKey: "number-and-place-value",
  stageKey: "middle-primary",
  stepKey: "time-and-elapsed-time-foundations",
  pathwayStepId:
    "mathematics::number-and-place-value::middle-primary::time-and-elapsed-time-foundations",
  relatedAssessmentBankKey: NUMBER_TIME_ELAPSED_FOUNDATIONS_ITEM_BANK_KEY,
  learnCard: {
    bigIdea:
      "Analogue clocks use hands to show hours and minutes. Digital clocks use numbers to show time. Elapsed time means how much time has passed, and duration means how long something takes. Timetables, schedules and calendars help organise events. Timelines and number lines can help solve time problems by showing start time, end time and duration.",
    keyLanguage: [
      "analogue",
      "digital",
      "hour",
      "minute",
      "elapsed time",
      "duration",
      "start time",
      "end time",
      "am",
      "pm",
      "timetable",
      "schedule",
      "calendar",
    ],
    workedExample:
      "From 1:45 pm to 2:35 pm, jump 15 minutes to 2:00 pm, then 35 minutes to 2:35 pm. The elapsed time is 50 minutes.",
    parentTip:
      "This module helps learners use time in daily life, not just read a clock.",
  },
  sections: [
    {
      id: "reading-and-representing-time",
      type: "understanding",
      title: "Reading and representing time",
      learnerGoal:
        "I can read, match and represent analogue and digital times.",
      tasks: [
        {
          id: "time-reading-match-clock-description",
          title: "Match clock description",
          prompt:
            "A clock has the hour hand just after 6 and the minute hand on 3. What digital time does it show?",
          taskType: "multiple_choice",
          options: ["6:15", "3:30", "6:03", "7:15"],
          expectedAnswer: "6:15",
          acceptableAnswers: ["6:15", "6.15"],
          workedSolution:
            "The hour hand just after 6 means it is after 6. The minute hand on 3 means 15 minutes.",
          supportPrompt:
            "Count around the clock in 5-minute jumps.",
          misconceptionTargets: [
            "analogue-digital-time-match-error",
            "minute-hand-hour-hand-confusion",
          ],
          relatedAssessmentItemIds: [
            "time-elapsed-foundations-analogue-digital-match-001",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use an analogue clock face with the minute hand on 3.",
          },
        },
        {
          id: "time-reading-nearest-five",
          title: "Read nearest 5 minutes",
          prompt:
            "The minute hand is on 9 and the hour hand is between 2 and 3. What time is shown?",
          taskType: "short_answer",
          expectedAnswer: "2:45",
          acceptableAnswers: ["2:45", "2.45"],
          workedSolution:
            "The minute hand on 9 means 45 minutes. The hour hand between 2 and 3 means it is 2:45.",
          supportPrompt:
            "9 groups of 5 minutes is 45 minutes.",
          misconceptionTargets: [
            "five-minute-interval-counting-error",
            "minute-hand-hour-hand-confusion",
          ],
          relatedAssessmentItemIds: [
            "time-elapsed-foundations-nearest-five-002",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use a clock face marked in 5-minute intervals.",
          },
        },
        {
          id: "time-reading-language-to-digital",
          title: "Write time language",
          prompt:
            "Write quarter past 7 in the evening as a digital time with am or pm.",
          taskType: "short_answer",
          expectedAnswer: "7:15 pm",
          acceptableAnswers: ["7:15 pm", "7.15 pm", "19:15", "7:15pm"],
          workedSolution:
            "Quarter past means 15 minutes after the hour. In the evening, the time is 7:15 pm.",
          supportPrompt:
            "Past means after the hour. Evening uses pm.",
          misconceptionTargets: [
            "analogue-digital-time-match-error",
            "am-pm-context-confusion",
          ],
          relatedAssessmentItemIds: [
            "time-elapsed-foundations-time-language-003",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use time-language and digital-time cards side by side.",
          },
        },
      ],
    },
    {
      id: "elapsed-time-and-duration",
      type: "fluency",
      title: "Elapsed time and duration",
      learnerGoal:
        "I can calculate elapsed time, start time, end time and duration.",
      tasks: [
        {
          id: "time-elapsed-calculate-minutes",
          title: "Find elapsed minutes",
          prompt:
            "A music lesson starts at 10:35 and ends at 11:10. How many minutes long is it?",
          taskType: "numeric",
          expectedAnswer: "35",
          acceptableAnswers: ["35", "35 minutes", "35 min"],
          workedSolution:
            "10:35 to 11:00 is 25 minutes. 11:00 to 11:10 is 10 minutes. Total = 35 minutes.",
          supportPrompt:
            "Count to the next hour first, then count on.",
          misconceptionTargets: [
            "elapsed-time-counting-error",
            "crossing-hour-boundary-error",
          ],
          relatedAssessmentItemIds: [
            "time-elapsed-foundations-elapsed-minutes-004",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use an open time number line from 10:35 to 11:10.",
          },
        },
        {
          id: "time-elapsed-find-end-time",
          title: "Find an end time",
          prompt:
            "A game starts at 3:20 pm and lasts 45 minutes. What time does it end?",
          taskType: "short_answer",
          expectedAnswer: "4:05 pm",
          acceptableAnswers: ["4:05 pm", "4.05 pm", "16:05", "4:05pm"],
          workedSolution:
            "3:20 pm plus 40 minutes is 4:00 pm, then plus 5 minutes is 4:05 pm.",
          supportPrompt:
            "Break 45 minutes into 40 minutes and 5 minutes.",
          misconceptionTargets: [
            "start-end-duration-confusion",
            "crossing-hour-boundary-error",
          ],
          relatedAssessmentItemIds: [
            "time-elapsed-foundations-end-time-gap-005",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use a start-time to end-time number line.",
          },
        },
        {
          id: "time-elapsed-correct-working",
          title: "Choose correct working",
          prompt:
            "Which working correctly finds the time from 12:45 pm to 1:20 pm?",
          taskType: "multiple_choice",
          options: [
            "12:45 to 1:00 is 15 minutes, then to 1:20 is 20 minutes, so 35 minutes.",
            "45 - 20 = 25 minutes, so the elapsed time is 25 minutes.",
            "12 + 1 = 13 and 45 + 20 = 65, so 65 minutes.",
            "It must be 1 hour because the hour number changes.",
          ],
          expectedAnswer:
            "12:45 to 1:00 is 15 minutes, then to 1:20 is 20 minutes, so 35 minutes.",
          acceptableAnswers: [
            "12:45 to 1:00 is 15 minutes, then to 1:20 is 20 minutes, so 35 minutes.",
            "35 minutes",
            "35",
          ],
          workedSolution:
            "Count through 1:00. The jumps are 15 minutes and 20 minutes, which total 35 minutes.",
          supportPrompt:
            "Use the next hour as a friendly stopping point.",
          misconceptionTargets: [
            "elapsed-time-counting-error",
            "crossing-hour-boundary-error",
          ],
          relatedAssessmentItemIds: [
            "time-elapsed-foundations-correct-working-006",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use an open number line with jumps to 1:00 and then 1:20.",
          },
        },
      ],
    },
    {
      id: "timetables-and-daily-schedules",
      type: "problem_solving",
      title: "Timetables and daily schedules",
      learnerGoal:
        "I can interpret schedules, timetables and ordered events across a day.",
      tasks: [
        {
          id: "time-schedule-order-events",
          title: "Order schedule events",
          prompt:
            "Type the letters in earliest-to-latest order: A lunch 12:20 pm, B reading 9:05 am, C sport 2:40 pm.",
          taskType: "short_answer",
          expectedAnswer: "B, A, C",
          acceptableAnswers: ["B, A, C", "B A C", "BAC", "B,A,C"],
          workedSolution:
            "9:05 am is in the morning. 12:20 pm is just after midday. 2:40 pm is later in the afternoon.",
          supportPrompt:
            "Separate am and pm, then order the times.",
          misconceptionTargets: [
            "schedule-ordering-error",
            "am-pm-context-confusion",
          ],
          relatedAssessmentItemIds: [
            "time-elapsed-foundations-schedule-order-007",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a daily schedule table with event letters and times.",
          },
        },
        {
          id: "time-timetable-read-duration",
          title: "Read a timetable",
          prompt:
            "A train timetable says: Park 1:10 pm, City 1:35 pm. How many minutes does the trip take?",
          taskType: "numeric",
          expectedAnswer: "25",
          acceptableAnswers: ["25", "25 minutes", "25 min"],
          workedSolution:
            "From 1:10 pm to 1:35 pm is 25 minutes.",
          supportPrompt:
            "Find the difference between the two timetable times.",
          misconceptionTargets: [
            "timetable-reading-error",
            "elapsed-time-counting-error",
          ],
          relatedAssessmentItemIds: [
            "time-elapsed-foundations-timetable-008",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a simple timetable with stop and time columns.",
          },
        },
        {
          id: "time-context-am-pm",
          title: "Choose am or pm",
          prompt:
            "Which option best matches 'finishing homework after dinner'?",
          taskType: "multiple_choice",
          options: [
            "7:15 pm",
            "7:15 am",
            "12:15 am",
            "11:15 am",
          ],
          expectedAnswer: "7:15 pm",
          acceptableAnswers: ["7:15 pm", "7.15 pm"],
          workedSolution:
            "After dinner is usually in the evening, so the time should be pm.",
          supportPrompt:
            "Think about when the event usually happens in a day.",
          misconceptionTargets: [
            "am-pm-context-confusion",
            "schedule-ordering-error",
          ],
          relatedAssessmentItemIds: [
            "time-elapsed-foundations-am-pm-009",
          ],
          visualSupport: {
            type: "context_card",
            description:
              "Use daily context cards for morning, afternoon and evening.",
          },
        },
      ],
    },
    {
      id: "calendars-and-multi-step-time-contexts",
      type: "reasoning",
      title: "Calendars and multi-step time contexts",
      learnerGoal:
        "I can use calendars, dates and multi-step time reasoning in practical contexts.",
      tasks: [
        {
          id: "time-calendar-two-weeks",
          title: "Count weeks on a calendar",
          prompt:
            "An event is on Tuesday 4 June. What date is 3 weeks later?",
          taskType: "short_answer",
          expectedAnswer: "Tuesday 25 June",
          acceptableAnswers: ["Tuesday 25 June", "25 June", "June 25", "25/6"],
          workedSolution:
            "Three weeks is 21 days. 21 days after Tuesday 4 June is Tuesday 25 June.",
          supportPrompt:
            "Each week later lands on the same weekday.",
          misconceptionTargets: [
            "calendar-date-counting-error",
            "time-unit-conversion-error",
          ],
          relatedAssessmentItemIds: [
            "time-elapsed-foundations-calendar-duration-010",
          ],
          visualSupport: {
            type: "table",
            description:
              "Use a June calendar grid and count forward three weeks.",
          },
        },
        {
          id: "time-multi-step-finish-time",
          title: "Combine durations",
          prompt:
            "A club starts at 3:30 pm. Setup takes 15 minutes and the activity takes 50 minutes. What time does it finish?",
          taskType: "short_answer",
          expectedAnswer: "4:35 pm",
          acceptableAnswers: ["4:35 pm", "4.35 pm", "16:35", "4:35pm"],
          workedSolution:
            "15 minutes + 50 minutes = 65 minutes. 3:30 pm plus 1 hour is 4:30 pm, plus 5 more minutes is 4:35 pm.",
          supportPrompt:
            "Add the durations first, then add the total duration to the start time.",
          misconceptionTargets: [
            "start-end-duration-confusion",
            "time-unit-conversion-error",
            "crossing-hour-boundary-error",
          ],
          relatedAssessmentItemIds: [
            "time-elapsed-foundations-multi-step-011",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use a timeline from 3:30 pm to 4:35 pm.",
          },
        },
        {
          id: "time-reasonableness-correction",
          title: "Check a time answer",
          prompt:
            "A learner says 9:50 am plus 30 minutes is 9:80 am. Which correction is best?",
          taskType: "multiple_choice",
          options: [
            "It is 10:20 am because 9:80 is not a valid time.",
            "It is 9:20 am because 50 - 30 = 20.",
            "It is 10:80 am because the hour changes.",
            "It is 9:30 am because only the minutes matter.",
          ],
          expectedAnswer:
            "It is 10:20 am because 9:80 is not a valid time.",
          acceptableAnswers: ["10:20 am", "10.20 am"],
          workedSolution:
            "9:50 to 10:00 is 10 minutes. There are 20 minutes left, so the finish time is 10:20 am.",
          supportPrompt:
            "Minutes reset after 59, so count through the next hour.",
          misconceptionTargets: [
            "time-reasonableness-checking-gap",
            "time-unit-conversion-error",
            "crossing-hour-boundary-error",
          ],
          relatedAssessmentItemIds: [
            "time-elapsed-foundations-reasonableness-012",
          ],
          visualSupport: {
            type: "number_line",
            description:
              "Use an open time number line from 9:50 am to 10:20 am.",
          },
        },
      ],
    },
  ],
  miniCheck: [
    {
      id: "mini-check-time-reading",
      title: "Mini Check: reading time",
      prompt:
        "The hour hand is just after 5 and the minute hand is on 6. What digital time is shown?",
      taskType: "short_answer",
      expectedAnswer: "5:30",
      acceptableAnswers: ["5:30", "5.30"],
      workedSolution:
        "The minute hand on 6 means 30 minutes. The hour hand just after 5 means the time is 5:30.",
      supportPrompt:
        "The number 6 on a clock means 30 minutes.",
      misconceptionTargets: [
        "analogue-digital-time-match-error",
        "minute-hand-hour-hand-confusion",
      ],
      relatedAssessmentItemIds: [
        "time-elapsed-foundations-analogue-digital-match-001",
        "time-elapsed-foundations-nearest-five-002",
      ],
      visualSupport: {
        type: "context_card",
        description:
          "Use an analogue clock face with the minute hand on 6.",
      },
    },
    {
      id: "mini-check-elapsed-time",
      title: "Mini Check: elapsed time",
      prompt:
        "A class starts at 11:40 and ends at 12:15. How many minutes long is it?",
      taskType: "numeric",
      expectedAnswer: "35",
      acceptableAnswers: ["35", "35 minutes", "35 min"],
      workedSolution:
        "11:40 to 12:00 is 20 minutes, and 12:00 to 12:15 is 15 minutes. Total = 35 minutes.",
      supportPrompt:
        "Count through midday first.",
      misconceptionTargets: [
        "elapsed-time-counting-error",
        "crossing-hour-boundary-error",
      ],
      relatedAssessmentItemIds: [
        "time-elapsed-foundations-elapsed-minutes-004",
        "time-elapsed-foundations-correct-working-006",
      ],
      visualSupport: {
        type: "number_line",
        description:
          "Use an open time number line from 11:40 to 12:15.",
      },
    },
    {
      id: "mini-check-timetable-schedule",
      title: "Mini Check: timetable",
      prompt:
        "A ferry timetable says: Wharf 2:05 pm, Island 2:40 pm. How many minutes is the trip?",
      taskType: "numeric",
      expectedAnswer: "35",
      acceptableAnswers: ["35", "35 minutes", "35 min"],
      workedSolution:
        "From 2:05 pm to 2:40 pm is 35 minutes.",
      supportPrompt:
        "Use the timetable times as the start and end times.",
      misconceptionTargets: [
        "timetable-reading-error",
        "elapsed-time-counting-error",
      ],
      relatedAssessmentItemIds: [
        "time-elapsed-foundations-timetable-008",
      ],
      visualSupport: {
        type: "table",
        description:
          "Use a timetable table with two stops and times.",
      },
    },
    {
      id: "mini-check-calendar-context",
      title: "Mini Check: calendar context",
      prompt:
        "A project starts on Friday 3 May and lasts 1 week. What date does it finish?",
      taskType: "short_answer",
      expectedAnswer: "Friday 10 May",
      acceptableAnswers: ["Friday 10 May", "10 May", "May 10", "10/5"],
      workedSolution:
        "One week is 7 days. 7 days after Friday 3 May is Friday 10 May.",
      supportPrompt:
        "One week later is the same weekday.",
      misconceptionTargets: [
        "calendar-date-counting-error",
        "time-unit-conversion-error",
      ],
      relatedAssessmentItemIds: [
        "time-elapsed-foundations-calendar-duration-010",
      ],
      visualSupport: {
        type: "table",
        description:
          "Use a May calendar grid and count forward one week.",
      },
    },
  ],
  evidenceSummaryTemplate:
    "Today, this learner practised time and elapsed-time foundations. They worked on analogue and digital time, elapsed time, duration, timetables, schedules, calendars and practical time contexts.",
};

export const NUMBER_TIME_ELAPSED_FOUNDATIONS_PRACTICE_MODULES = Object.freeze([
  NUMBER_TIME_ELAPSED_FOUNDATIONS_PRACTICE_MODULE,
]);

export function getNumberTimeElapsedFoundationsPracticeModuleById(id: string) {
  const normalizedId = safe(id);
  return (
    NUMBER_TIME_ELAPSED_FOUNDATIONS_PRACTICE_MODULES.find(
      (module) => module.id === normalizedId,
    ) || null
  );
}

export function getNumberTimeElapsedFoundationsPracticeModuleByBandKey(
  progressionBandKey: string,
) {
  return (
    NUMBER_TIME_ELAPSED_FOUNDATIONS_PRACTICE_MODULES.find(
      (module) => module.progressionBandKey === progressionBandKey,
    ) || null
  );
}
