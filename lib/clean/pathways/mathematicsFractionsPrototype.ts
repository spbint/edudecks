import type { MathematicsDetailedStrandWorkspace } from "@/lib/clean/pathways/mathematicsDetailedStrands";
import type { PathwayStageKey } from "@/lib/clean/pathways/mathematicsNumberPrototype";

export function buildFractionsDecimalsPercentagesWorkspace(
  currentFocusStageKey: PathwayStageKey,
): MathematicsDetailedStrandWorkspace {
  return {
    key: "fractions-decimals-percentages",
    trackingKey: "fractions-decimals-percentages",
    title: "Fractions, decimals, and percentages",
    subtitle:
      "Fractions, decimals, and percentages help learners describe parts, comparisons, and proportional relationships with growing confidence. This strand builds from number understanding and calculation, then opens the door to more flexible thinking about sharing, scale, value, change, and interpretation.",
    pathwayLabel: "Fractions, decimals, and percentages pathway",
    relationshipTitle: "How this strand develops",
    relationshipCopy:
      "This pathway shows how simple equal-part ideas grow into decimal, percentage, and proportional reasoning across practical life, later mathematics, and more confident interpretation of quantity.",
    currentFocusStageKey,
    stages: [
      {
        key: "foundation-kindergarten",
        title: "Foundation / Kindergarten",
        helper:
          "Fraction thinking begins with fairness, equal parts, and visible sharing in real objects and everyday experiences.",
        steps: [
          {
            id: 1,
            title: "Recognise equal parts in real objects and sharing situations",
            meaning:
              "Notice when a whole has been divided fairly and when parts are unequal, using familiar objects and practical tasks.",
            skillFocus:
              "seeing equal parts as the foundation for later fraction understanding",
            learningIntention:
              "Understand that fraction ideas depend on equal parts, not simply on cutting something into pieces.",
            successCriteria: [
              "The learner can identify whether parts are equal or unequal.",
              "The learner can explain why equal parts matter when sharing fairly.",
              "The learner can show equal parts using food, toys, shapes, or drawings.",
            ],
            practiceActivity:
              "Cut fruit, sandwiches, paper shapes, or playdough into parts and talk about whether the shares are fair and equal.",
            evidenceExamples: [
              "photos of equal-part models",
              "a parent note from a sharing discussion",
              "a quick drawing or explanation showing fair and unfair partitions",
            ],
            assessmentCheck:
              "Later, check whether the learner can recognise equal parts in unfamiliar shapes or practical contexts.",
            nextStep:
              "Build on this by naming familiar halves and simple shares in everyday situations.",
            reportLanguage:
              "The learner is developing a clearer understanding of equal parts and can increasingly explain what makes a fair share or useful fraction model.",
          },
          {
            id: 2,
            title: "Use halves in simple real-world situations",
            meaning:
              "Apply early fraction language to familiar situations such as sharing food, folding shapes, or dividing collections into two equal parts.",
            skillFocus:
              "connecting the language of halves to visible, meaningful quantities",
            learningIntention:
              "Use early fraction language confidently in simple practical contexts.",
            successCriteria: [
              "The learner can make or identify halves in a real object or set.",
              "The learner can explain how the half relates to the whole.",
              "The learner can use half language naturally in familiar tasks.",
            ],
            practiceActivity:
              "Fold paper, share snacks, or split collections into two equal parts and talk about what half means each time.",
            evidenceExamples: [
              "a practical sharing task summary",
              "photos of folded shapes or halved objects",
              "a short learner explanation connecting half to the whole",
            ],
            assessmentCheck:
              "Later, check whether the learner can recognise halves even when the objects or shapes look different.",
            nextStep:
              "Extend this understanding into quarters and other simple fractions in lower primary contexts.",
            reportLanguage:
              "The learner is becoming more confident in recognising and using halves during familiar sharing and partitioning tasks.",
          },
        ],
      },
      {
        key: "lower-primary",
        title: "Lower Primary",
        helper:
          "Learners begin using familiar fractions such as halves and quarters more deliberately in sharing, measurement, folding, and simple practical tasks.",
        steps: [
          {
            id: 1,
            title: "Use halves, quarters, and simple fractions in practical tasks",
            meaning:
              "Apply familiar fraction language to visible quantities, portions, and measurements instead of treating fractions as isolated vocabulary.",
            skillFocus:
              "using simple fractions meaningfully in practical family life",
            learningIntention:
              "Connect common fraction names to real quantities and clear whole-part relationships.",
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
              "Move into visual models so fractions can be seen, represented, and compared more clearly.",
            reportLanguage:
              "The learner is becoming more confident with simple fractions in practical contexts such as sharing, folding, and measuring.",
          },
          {
            id: 2,
            title: "Describe simple fraction situations with confidence",
            meaning:
              "Use spoken and visual explanations to show how simple fractions appear in everyday tasks and comparisons.",
            skillFocus:
              "linking fraction language with practical explanation and reasoning",
            learningIntention:
              "Explain what the whole is and why a fraction description fits the task.",
            successCriteria: [
              "The learner can identify the whole in a practical fraction example.",
              "The learner can explain how the fraction was determined.",
              "The learner can describe a simple fraction situation using sensible mathematical language.",
            ],
            practiceActivity:
              "Use fraction cards, snack plates, measuring cups, or folded paper and ask the learner to explain what each fraction represents.",
            evidenceExamples: [
              "a parent note about the learner's fraction explanation",
              "photos of practical models with annotations",
              "a verbal explanation recorded during a family maths task",
            ],
            assessmentCheck:
              "Later, check whether the learner can identify the whole and explain a simple fraction independently.",
            nextStep:
              "Carry this confidence into fraction strips, number lines, and simple comparison work.",
            reportLanguage:
              "The learner is increasingly able to describe simple fraction situations clearly and identify how the part relates to the whole.",
          },
        ],
      },
      {
        key: "middle-primary",
        title: "Middle Primary",
        helper:
          "Fractions become more visual and comparable here. Learners use strips, shapes, sets, and number lines to compare, order, and notice equivalence.",
        steps: [
          {
            id: 1,
            title: "Represent and compare fractions with visual models",
            meaning:
              "Use fraction strips, diagrams, sets, and number lines to make fraction size easier to see and reason about.",
            skillFocus:
              "using multiple visual fraction models with growing confidence",
            learningIntention:
              "Recognise that fractions can be represented in more than one way while still describing comparable quantities.",
            successCriteria: [
              "The learner can match a fraction name to a visual model.",
              "The learner can compare familiar fractions using a model or explanation.",
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
              "Later, check whether the learner can choose a helpful visual model independently for a new fraction task.",
            nextStep:
              "Extend comparison into ordering and the idea that different-looking fractions can still describe the same quantity.",
            reportLanguage:
              "Visual models are helping the learner make clearer sense of fractions and compare familiar amounts with more confidence.",
          },
          {
            id: 2,
            title: "Notice equivalent fractions and order familiar amounts",
            meaning:
              "Recognise that two fractions can describe the same quantity and use reasoning to order familiar fractions from smaller to larger.",
            skillFocus:
              "equivalence, comparison, and ordering with visual and verbal reasoning",
            learningIntention:
              "See equivalent fractions as meaningful relationships rather than just rules to memorise.",
            successCriteria: [
              "The learner can match simple equivalent fractions with a model.",
              "The learner can order familiar fractions and explain the reasoning.",
              "The learner can justify why two different fraction representations can still be equal.",
            ],
            practiceActivity:
              "Use shaded diagrams, paper folding, recipe measures, or matching cards to compare and pair fractions that represent the same amount.",
            evidenceExamples: [
              "a visual equivalence model",
              "an ordering task with explanation",
              "parent notes from a discussion about why the amount stayed the same",
            ],
            assessmentCheck:
              "Later, check whether the learner can recognise familiar equivalences and comparisons with less scaffolding.",
            nextStep:
              "Link equivalence to tenths and hundredths so decimal relationships begin to feel more natural.",
            reportLanguage:
              "The learner is beginning to recognise equivalent fractions and can increasingly compare and order familiar fractions with sensible reasoning.",
          },
        ],
      },
      {
        key: "upper-primary",
        title: "Upper Primary",
        helper:
          "Fractions connect more strongly with place value here. Learners work with tenths and hundredths, connect fractions to decimals, and use those ideas in money and measurement.",
        steps: [
          {
            id: 1,
            title: "Connect fractions to tenths and hundredths as decimals",
            meaning:
              "Use place-value ideas to understand decimals as another way of describing parts of a whole, especially in money and measurement contexts.",
            skillFocus:
              "connecting familiar fractions with decimal place value",
            learningIntention:
              "Understand that decimals belong to the number system and often describe parts in very practical ways.",
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
              "Use this confidence to explore percentages as out-of-100 comparisons and move between forms more flexibly.",
            reportLanguage:
              "The learner is growing in confidence with tenths and hundredths and is beginning to connect familiar fractions to decimal representations in practical contexts.",
          },
          {
            id: 2,
            title: "Use fraction-decimal connections in practical comparison",
            meaning:
              "Choose between fraction and decimal representations in contexts such as money, measurement, and comparison tasks.",
            skillFocus:
              "using connected fraction and decimal thinking in practical reasoning",
            learningIntention:
              "Recognise when decimals make a comparison clearer and when a fraction model is still helpful.",
            successCriteria: [
              "The learner can compare quantities expressed as simple fractions or decimals.",
              "The learner can explain why one representation is useful in a given context.",
              "The learner can use fraction-decimal connections to support a practical decision or comparison.",
            ],
            practiceActivity:
              "Compare prices, measure lengths, or read simple charts where the learner decides whether a fraction or decimal explanation is most useful.",
            evidenceExamples: [
              "a comparison task using fractions and decimals",
              "a learner reflection about which representation made more sense",
              "parent notes from a practical measurement or money discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can switch between fraction and decimal thinking more independently in a new context.",
            nextStep:
              "Carry this flexibility into percentages and broader proportional reasoning.",
            reportLanguage:
              "The learner is becoming more flexible when using fractions and decimals together in practical comparison and measurement tasks.",
          },
        ],
      },
      {
        key: "lower-secondary",
        title: "Lower Secondary",
        helper:
          "The current focus broadens into percentages and proportional thinking, with growing emphasis on choosing between fractions, decimals, and percentages in meaningful situations.",
        steps: [
          {
            id: 1,
            title: "Understand percentages as out-of-100 comparisons",
            meaning:
              "Interpret percentages as useful comparisons in scores, discounts, proportions, and everyday information.",
            skillFocus:
              "reading and interpreting percentages meaningfully",
            learningIntention:
              "Treat percentages as understandable comparisons rather than isolated symbols seen only in worksheets.",
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
            title: "Move flexibly between fractions, decimals, and percentages",
            meaning:
              "Recognise that the same quantity can be represented in different forms and choose the one that suits the task best.",
            skillFocus:
              "linking the three forms flexibly and purposefully",
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
        key: "years-9-10-consolidation",
        title: "Years 9-10 / consolidation",
        helper:
          "Later consolidation brings these ideas into proportional reasoning, rates, scale, financial percentages, and more mature interpretation of data and comparison.",
        steps: [
          {
            id: 1,
            title: "Use proportional reasoning in scale, rates, and financial contexts",
            meaning:
              "Apply fractions, decimals, and percentages to maps, scale, rates, unit pricing, and percentage change in realistic situations.",
            skillFocus:
              "using proportional ideas in money, measurement, and scale reasoning",
            learningIntention:
              "Recognise these forms as practical tools for comparison, decision-making, and interpretation.",
            successCriteria: [
              "The learner can describe a proportional relationship in context.",
              "The learner can choose a useful representation for a practical task.",
              "The learner can explain how the mathematics supports a real decision or interpretation.",
            ],
            practiceActivity:
              "Compare sale prices, read maps or plans, work with unit pricing, or reason about percentage increase and decrease in everyday examples.",
            evidenceExamples: [
              "a shopping or budget comparison task",
              "a scale or map reasoning example",
              "notes from a percentage or rate discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner can apply a proportional representation appropriately in a new financial or scale-based task.",
            nextStep:
              "Use estimation and judgement more deliberately so answers are checked for reasonableness as well as correctness.",
            reportLanguage:
              "The learner is increasingly able to apply fractions, decimals, and percentages to practical reasoning tasks such as money, scale, and percentage change.",
          },
          {
            id: 2,
            title: "Interpret proportional information in data and real decisions",
            meaning:
              "Use percentages, rates, and comparisons to interpret information, make judgements, and explain whether a result makes sense.",
            skillFocus:
              "estimation, proportional judgement, and interpretation of data-based or contextual information",
            learningIntention:
              "Treat checking and explaining as part of proportional reasoning, especially when dealing with real information.",
            successCriteria: [
              "The learner can estimate whether a proportional comparison seems reasonable.",
              "The learner can interpret percentages or rates in a chart, table, or practical context.",
              "The learner can explain why a conclusion does or does not make sense.",
            ],
            practiceActivity:
              "Interpret simple data displays, compare budget percentages, or review rates and proportions in practical family decisions.",
            evidenceExamples: [
              "a before-and-after estimate record",
              "a learner explanation about why a comparison did or did not seem reasonable",
              "parent notes from a practical data or finance discussion",
            ],
            assessmentCheck:
              "Later, check whether the learner independently uses proportional judgement and explanation as a checking habit in new tasks.",
            nextStep:
              "These habits continue to support later ratio, probability, algebraic reasoning, finance, and more formal interpretation of data.",
            reportLanguage:
              "The learner is strengthening the ability to interpret proportional information thoughtfully and explain whether percentage-based or comparative conclusions are reasonable.",
          },
        ],
      },
    ],
    portfolioSupport: [
      "Keep one strong visual model and one practical proportional task so the portfolio shows both concrete understanding and real-world application.",
      "Short learner reflections are especially useful here because they show how the learner is connecting different representations and deciding which one fits the task best.",
      "Progress-over-time evidence is valuable when it shows movement from simple sharing and equal parts toward percentage and proportional reasoning.",
    ],
    reportingSupport: [
      "Reporting can highlight the learner's growing confidence in describing parts, proportion, and equivalent relationships across practical contexts.",
      "Examples from cooking, money, shopping, maps, and data often make proportional reasoning easier to explain clearly.",
      "Collected evidence can show not only what the learner knows, but how they choose between fractions, decimals, and percentages in real situations.",
    ],
  };
}
