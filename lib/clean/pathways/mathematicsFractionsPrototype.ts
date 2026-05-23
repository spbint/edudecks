import type { MathematicsDetailedStrandWorkspace } from "@/lib/clean/pathways/mathematicsDetailedStrands";

export const FRACTIONS_DECIMALS_PERCENTAGES_WORKSPACE: MathematicsDetailedStrandWorkspace = {
  key: "fractions-decimals-percentages",
  title: "Fractions, decimals, and percentages",
  subtitle:
    "Fractions, decimals, and percentages help learners describe parts, relationships, and proportional thinking with growing confidence. This strand builds naturally from number understanding and calculation, then opens the door to more flexible reasoning about quantity, comparison, scale, and value.",
  pathwayLabel: "Fractions, decimals, and percentages pathway",
  relationshipTitle: "How this grows from Number and Operations",
  relationshipCopy:
    "Once learners can work more confidently with number and calculation, they are better placed to reason about equal parts, proportion, tenths, hundredths, and percentages in practical life.",
  currentFocusStageKey: "equal-parts-and-simple-fractions",
  stages: [
    {
      key: "equal-parts-and-simple-fractions",
      title: "Equal parts and simple fractions",
      helper:
        "This stage begins with parts of real objects and everyday situations where fairness, sharing, and portions can be seen and discussed.",
      steps: [
        {
          id: 1,
          title: "Recognise equal parts in real objects and sets",
          meaning:
            "Notice when a whole has been divided fairly and when parts are not equal, using familiar objects and situations.",
          skillFocus: "seeing equal parts as the foundation for later fraction understanding",
          learningIntention:
            "Understand that a fraction idea depends on equal parts, not simply on cutting something into pieces.",
          successCriteria: [
            "The learner can identify whether parts are equal or unequal.",
            "The learner can explain why equal parts matter.",
            "The learner can show equal parts using objects, food, or drawings.",
          ],
          practiceActivity:
            "Cut fruit, sandwiches, paper shapes, or playdough into parts and discuss whether the shares are fair and equal.",
          evidenceExamples: [
            "photos of equal-part models",
            "a parent note from a sharing discussion",
            "a quick drawing or explanation showing fair and unfair partitions",
          ],
          assessmentCheck:
            "Later, check whether the learner can recognise equal parts in unfamiliar shapes or practical contexts.",
          nextStep:
            "Build on this by naming familiar fractions such as halves and quarters in everyday situations.",
          reportLanguage:
            "The learner is developing a clearer understanding of equal parts and can increasingly explain what makes a fair or useful fraction model.",
        },
        {
          id: 2,
          title: "Use halves, quarters, and simple fractions in practical tasks",
          meaning:
            "Apply familiar fraction language to real portions, measurements, and sharing situations.",
          skillFocus: "using simple fractions meaningfully in practical family life",
          learningIntention:
            "Connect common fraction names to visible quantities rather than treating them as isolated words.",
          successCriteria: [
            "The learner can identify or create halves and quarters.",
            "The learner can use simple fraction language in context.",
            "The learner can explain how the fraction relates to the whole.",
          ],
          practiceActivity:
            "Use recipes, snack portions, paper folding, or container-filling tasks to talk about halves, quarters, and other simple fractions.",
          evidenceExamples: [
            "a cooking or sharing task summary",
            "photos of folded shapes or portioned food",
            "a short learner explanation connecting the part to the whole",
          ],
          assessmentCheck:
            "Later, check whether the learner can use simple fractions without relying only on a memorised picture.",
          nextStep:
            "Move into visual models and number-line thinking so fractions can be compared more flexibly.",
          reportLanguage:
            "The learner is becoming more confident with simple fractions in practical contexts such as sharing, folding, and measuring.",
        },
      ],
    },
    {
      key: "visual-models-and-comparison",
      title: "Visual models and comparison",
      helper:
        "Here the learner uses shapes, strips, sets, and number lines to represent fractions more clearly and compare their size.",
      steps: [
        {
          id: 1,
          title: "Represent fractions with strips, shapes, and number lines",
          meaning:
            "Use visual models to make fraction size, placement, and part-whole relationships easier to see.",
          skillFocus: "using multiple visual fraction models with growing confidence",
          learningIntention:
            "Recognise that fractions can be represented in more than one way while still describing the same kind of idea.",
          successCriteria: [
            "The learner can match a fraction name to a visual model.",
            "The learner can place simple fractions on a line or diagram.",
            "The learner can explain what the whole is in the model being used.",
          ],
          practiceActivity:
            "Build fraction strips, shade diagrams, or mark simple fractions on homemade number lines during practical maths time.",
          evidenceExamples: [
            "photos of fraction strips or shaded models",
            "annotated number-line work",
            "a learner explanation about what the whole represents",
          ],
          assessmentCheck:
            "Later, check whether the learner can choose a useful model independently for a new fraction task.",
          nextStep:
            "Use these models to compare fractions and decide which amounts are larger, smaller, or equal.",
          reportLanguage:
            "Visual models are helping the learner make clearer sense of fractions and explain how different representations relate to the same quantity.",
        },
        {
          id: 2,
          title: "Compare and order familiar fractions",
          meaning:
            "Reason about which fraction is larger, smaller, or the same by thinking about the whole and the size of the parts.",
          skillFocus: "comparing fractions with visual and verbal reasoning",
          learningIntention:
            "Use reasoning and models to compare fractions, rather than guessing from the numbers alone.",
          successCriteria: [
            "The learner can compare familiar fractions using a model or explanation.",
            "The learner can order simple fractions from smaller to larger.",
            "The learner can justify the comparison with sensible language.",
          ],
          practiceActivity:
            "Compare recipe amounts, snack portions, paper strips, or game-based fraction cards and explain the ordering.",
          evidenceExamples: [
            "a comparison task with annotations",
            "a verbal explanation recorded by a parent",
            "photos of ordered fraction models",
          ],
          assessmentCheck:
            "Later, check whether the learner can compare fractions with less scaffolding and explain the reasoning clearly.",
          nextStep:
            "Extend comparison into equivalent fractions and the idea that different-looking representations can describe the same quantity.",
          reportLanguage:
            "The learner is becoming more confident in comparing familiar fractions and is beginning to justify those comparisons more clearly.",
        },
      ],
    },
    {
      key: "equivalence-and-decimal-connections",
      title: "Equivalence and decimal connections",
      helper:
        "This stage helps the learner notice that the same quantity can be represented in different but equivalent ways, including decimal forms.",
      steps: [
        {
          id: 1,
          title: "Notice equivalent fractions and related representations",
          meaning:
            "Recognise that two fractions can describe the same amount even when the numbers look different.",
          skillFocus: "equivalence and flexible representation of the same quantity",
          learningIntention:
            "See equivalence as a meaningful relationship, not just a rule to memorise.",
          successCriteria: [
            "The learner can match simple equivalent fractions with a model.",
            "The learner can explain why the amount stays the same.",
            "The learner can use comparison or visual reasoning to justify equivalence.",
          ],
          practiceActivity:
            "Use shaded diagrams, folded paper, recipe measures, or matching cards to pair equivalent fractions and discuss why they match.",
          evidenceExamples: [
            "a visual equivalence model",
            "a matching task with explanations",
            "parent notes from a discussion about why the quantity stayed the same",
          ],
          assessmentCheck:
            "Later, check whether the learner can recognise familiar equivalences without always needing a provided model.",
          nextStep:
            "Link equivalence to tenths and hundredths so decimal relationships begin to feel more natural.",
          reportLanguage:
            "The learner is beginning to recognise equivalent fractions and can increasingly explain how different representations may describe the same quantity.",
        },
        {
          id: 2,
          title: "Connect fractions to tenths and hundredths as decimals",
          meaning:
            "Use place-value ideas to see decimals as another way of describing parts of a whole, especially in measurement and money.",
          skillFocus: "connecting familiar fractions with decimal place value",
          learningIntention:
            "Understand that decimals belong to the number system and often describe parts in a very practical way.",
          successCriteria: [
            "The learner can connect tenths or hundredths to a decimal representation.",
            "The learner can use decimals in money or measurement contexts.",
            "The learner can explain the connection between the fraction and decimal form.",
          ],
          practiceActivity:
            "Use money amounts, measuring tools, or grid models to connect tenths and hundredths with decimal notation.",
          evidenceExamples: [
            "annotated money or measurement work",
            "a grid or place-value model showing decimal parts",
            "a short explanation comparing a fraction and decimal form",
          ],
          assessmentCheck:
            "Later, check whether the learner can interpret familiar decimals as parts of a whole and connect them to simple fractions.",
          nextStep:
            "Use this confidence to explore percentages as out-of-100 comparisons and move between all three forms more flexibly.",
          reportLanguage:
            "The learner is growing in confidence with tenths and hundredths and is beginning to connect familiar fractions to decimal representations in practical contexts.",
        },
      ],
    },
    {
      key: "percentages-and-proportional-thinking",
      title: "Percentages and proportional thinking",
      helper:
        "This stage helps the learner interpret percentages as out-of-100 comparisons and move more flexibly between related forms.",
      steps: [
        {
          id: 1,
          title: "Understand percentages as out of 100",
          meaning:
            "Use percentages to describe parts, comparisons, and familiar ideas such as scores, discounts, and chances.",
          skillFocus: "reading and interpreting percentages meaningfully",
          learningIntention:
            "Treat percentages as understandable comparisons rather than as isolated symbols seen only in worksheets.",
          successCriteria: [
            "The learner can explain that percent means out of 100.",
            "The learner can interpret a familiar percentage in context.",
            "The learner can connect a percentage to a sensible visual or practical example.",
          ],
          practiceActivity:
            "Look at sports statistics, quiz scores, discounts, or simple hundred grids and discuss what a given percentage means.",
          evidenceExamples: [
            "a percentage interpretation task",
            "parent notes from a shopping or score discussion",
            "a simple visual model showing out-of-100 thinking",
          ],
          assessmentCheck:
            "Later, check whether the learner can explain a familiar percentage clearly without relying on memorised wording alone.",
          nextStep:
            "Move between percentages, decimals, and fractions when the same quantity is represented in different ways.",
          reportLanguage:
            "The learner is beginning to interpret percentages more confidently and can increasingly explain them as out-of-100 comparisons in familiar contexts.",
        },
        {
          id: 2,
          title: "Move between fractions, decimals, and percentages",
          meaning:
            "Recognise that the same quantity can be represented in different forms and choose the one that suits the task best.",
          skillFocus: "linking the three forms flexibly and purposefully",
          learningIntention:
            "Compare, convert, and explain related forms in practical situations where the choice of representation matters.",
          successCriteria: [
            "The learner can match familiar fractions, decimals, and percentages.",
            "The learner can explain which form is most useful in a given context.",
            "The learner can justify a conversion or comparison clearly.",
          ],
          practiceActivity:
            "Use shopping, score sheets, recipe comparisons, or budget tables and ask which form is most useful and why.",
          evidenceExamples: [
            "a conversion or matching task with explanation",
            "annotated practical maths work using more than one form",
            "a learner reflection about choosing a useful representation",
          ],
          assessmentCheck:
            "Later, check whether the learner can move between common representations with more independence and reasoning.",
          nextStep:
            "Apply these connected ideas in scale, finance, data, and richer proportional reasoning.",
          reportLanguage:
            "The learner is becoming more flexible when connecting fractions, decimals, and percentages and is beginning to choose sensible representations for practical problems.",
        },
      ],
    },
    {
      key: "practical-proportion-and-application",
      title: "Practical proportion and application",
      helper:
        "This stage brings the strand together through proportion, estimation, and real-life interpretation in money, scale, data, and comparison tasks.",
      steps: [
        {
          id: 1,
          title: "Use proportional thinking in money, scale, and data",
          meaning:
            "Apply parts, percentages, and comparisons to meaningful tasks such as discounts, map scale, and simple data interpretation.",
          skillFocus: "using proportional ideas in practical reasoning",
          learningIntention:
            "Recognise that these ideas are useful tools for making decisions and interpreting information.",
          successCriteria: [
            "The learner can describe a proportion or comparison in context.",
            "The learner can use a suitable representation to support reasoning.",
            "The learner can explain how the mathematics connects to the real situation.",
          ],
          practiceActivity:
            "Compare sale prices, read simple maps or plans, interpret percentage charts, or reason about portions of a budget.",
          evidenceExamples: [
            "a shopping or budget comparison task",
            "a scale or map reasoning example",
            "notes from a data or percentage discussion",
          ],
          assessmentCheck:
            "Later, check whether the learner can choose and apply a proportional representation appropriately in a new practical task.",
          nextStep:
            "Use estimation and explanation more deliberately so answers are judged for reasonableness as well as correctness.",
          reportLanguage:
            "The learner is increasingly able to apply fractions, decimals, and percentages to practical reasoning tasks such as money, scale, and simple data interpretation.",
        },
        {
          id: 2,
          title: "Estimate and explain whether a comparison makes sense",
          meaning:
            "Use rough proportional thinking to check whether an answer is believable before accepting it.",
          skillFocus: "estimation, proportional judgement, and explanation",
          learningIntention:
            "Treat checking and explaining as part of mathematical thinking, especially when dealing with proportions and comparisons.",
          successCriteria: [
            "The learner can give a sensible estimate for a proportional situation.",
            "The learner can notice when a comparison does not fit the context.",
            "The learner can explain why the final answer is or is not reasonable.",
          ],
          practiceActivity:
            "Estimate discounts, budget portions, probability comparisons, or scale measurements before calculating or recording a final answer.",
          evidenceExamples: [
            "a before-and-after estimate record",
            "a learner explanation about why an answer did not seem reasonable",
            "parent notes from a practical comparison discussion",
          ],
          assessmentCheck:
            "Later, check whether the learner independently uses estimation and reasoning as a checking habit in proportional tasks.",
          nextStep:
            "This supports later ratio, probability, algebraic reasoning, and more mature interpretation of financial and statistical information.",
          reportLanguage:
            "The learner is beginning to use estimation and explanation more purposefully when checking proportional comparisons and practical percentage-based reasoning.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Save one strong visual model and one real-world task so the portfolio shows both concrete understanding and practical application.",
    "Short learner reflections can be especially useful here because they show how the learner is connecting different representations.",
    "Progress-over-time evidence is valuable when it shows movement from simple sharing and visual models toward more flexible proportional reasoning.",
  ],
  reportingSupport: [
    "Reporting can highlight the learner's growing confidence in describing parts, proportions, and equivalent relationships across practical contexts.",
    "Examples from cooking, money, shopping, and data often make the learner's proportional reasoning easier to explain clearly.",
    "Collected evidence can show not only what the learner knows, but how they choose between fractions, decimals, and percentages in real situations.",
  ],
};
