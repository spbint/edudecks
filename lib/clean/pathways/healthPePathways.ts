import type { MathematicsDetailedStrandWorkspace } from "@/lib/clean/pathways/mathematicsDetailedStrands";
import type { PathwayStageKey } from "@/lib/clean/pathways/mathematicsNumberPrototype";
import type { SubjectStrandCard } from "@/lib/clean/pathways/subjectPathwayTypes";

type HealthPeStepInput = {
  id: number;
  title: string;
  meaning: string;
  skillFocus: string;
  practiceActivity: string;
  evidenceExamples: string[];
  nextStep: string;
  reportLanguage: string;
  learningIntention?: string;
  successCriteria?: string[];
  assessmentCheck?: string;
};

type HealthPeStageInput = {
  key: PathwayStageKey;
  helper: string;
  steps: [HealthPeStepInput, HealthPeStepInput];
};

type HealthPeStrandConfig = {
  key: string;
  title: string;
  subtitle: string;
  relationshipTitle: string;
  relationshipCopy: string;
  portfolioSupport: string[];
  reportingSupport: string[];
  stages: HealthPeStageInput[];
};

type StrandBuilder = (currentFocusStageKey: PathwayStageKey) => MathematicsDetailedStrandWorkspace;

const STAGE_TITLES: Record<PathwayStageKey, string> = {
  "foundation-kindergarten": "Foundation / Kindergarten",
  "lower-primary": "Lower Primary",
  "middle-primary": "Middle Primary",
  "upper-primary": "Upper Primary",
  "lower-secondary": "Lower Secondary",
  "years-9-10-consolidation": "Years 9-10 / consolidation",
};

function buildHealthPeStep(step: HealthPeStepInput) {
  return {
    id: step.id,
    title: step.title,
    meaning: step.meaning,
    skillFocus: step.skillFocus,
    learningIntention:
      step.learningIntention ||
      `Develop ${step.skillFocus} through practical movement, reflection, discussion, safe participation, and everyday family routines.`,
    successCriteria: step.successCriteria || [
      "The learner can use this idea in a familiar movement, wellbeing, or participation context.",
      "The learner can show, explain, or describe what was practised, noticed, or improved.",
      "The learner can respond to guidance about safety, confidence, respect, or personal responsibility.",
    ],
    practiceActivity: step.practiceActivity,
    evidenceExamples: step.evidenceExamples,
    assessmentCheck:
      step.assessmentCheck ||
      "Later, check whether the learner can apply this more independently, safely, and confidently across everyday situations.",
    nextStep: step.nextStep,
    reportLanguage: step.reportLanguage,
  };
}

function buildHealthPeWorkspace(
  currentFocusStageKey: PathwayStageKey,
  config: HealthPeStrandConfig,
): MathematicsDetailedStrandWorkspace {
  return {
    key: config.key,
    trackingKey: config.key,
    title: config.title,
    subtitle: config.subtitle,
    pathwayLabel: `${config.title} pathway`,
    relationshipTitle: config.relationshipTitle,
    relationshipCopy: config.relationshipCopy,
    currentFocusStageKey,
    stages: config.stages.map((stage) => ({
      key: stage.key,
      title: STAGE_TITLES[stage.key],
      helper: stage.helper,
      steps: stage.steps.map(buildHealthPeStep),
    })),
    portfolioSupport: config.portfolioSupport,
    reportingSupport: config.reportingSupport,
  };
}

export const DEFAULT_HEALTH_PE_STRAND_KEY = "movement-skills-and-coordination";

export const HEALTH_PE_SUBJECT_OVERVIEW = {
  eyebrow: "Health / PE F-10 / K-10 strand map",
  title: "Health / PE pathway overview",
  description:
    "This first Health / PE build shows movement, fitness, wellbeing, relationships, teamwork, and outdoor learning as connected strands. Each strand uses the same calm stage-based pathway workspace as the other detailed subjects.",
  helper:
    "Choose one strand to explore. The selected strand opens in the focused workspace below, so Health / PE stays practical and readable rather than becoming a clinical checklist or school-sport wall.",
};

export const HEALTH_PE_DOMAIN_CARDS: SubjectStrandCard[] = [
  {
    key: "movement-skills-and-coordination",
    title: "Movement skills and coordination",
    description:
      "Build balance, locomotor movement, object control, rhythm, body awareness, and coordinated movement sequences.",
    whyItMatters:
      "Movement skills support confidence in games, outdoor activities, physical activity, and everyday participation.",
    status: "first-detailed",
  },
  {
    key: "physical-activity-and-fitness",
    title: "Physical activity and fitness",
    description:
      "Develop active play habits, stamina, strength, flexibility, safe effort, and enjoyment of regular movement.",
    whyItMatters:
      "Physical activity connects movement, wellbeing, habits, and personal goals in practical family life.",
    status: "detailed",
  },
  {
    key: "health-safety-and-wellbeing",
    title: "Health, safety and wellbeing",
    description:
      "Explore healthy routines, hygiene, nutrition basics, sleep, emotional wellbeing, safety awareness, and help-seeking.",
    whyItMatters:
      "Health and wellbeing connects safety, routines, self-awareness, and practical decision-making in everyday life.",
    status: "detailed",
  },
  {
    key: "relationships-and-personal-development",
    title: "Relationships and personal development",
    description:
      "Build communication, emotions, friendship, respect, confidence, identity, cooperation, and self-awareness.",
    whyItMatters:
      "Relationships and personal development support teamwork, communication, confidence, and respectful participation.",
    status: "detailed",
  },
  {
    key: "teamwork-games-and-fair-play",
    title: "Teamwork, games and fair play",
    description:
      "Use rules, turn-taking, cooperation, strategy, leadership, problem-solving, and respectful competition in games.",
    whyItMatters:
      "Games and fair play apply movement, strategy, cooperation, and respectful competition in family-friendly ways.",
    status: "detailed",
  },
  {
    key: "outdoor-practical-and-active-learning",
    title: "Outdoor, practical and active learning",
    description:
      "Explore nature walks, outdoor challenges, navigation basics, resilience, environmental awareness, and active projects.",
    whyItMatters:
      "Outdoor learning connects physical activity, safety, environmental awareness, resilience, and practical exploration.",
    status: "detailed",
  },
];

const MOVEMENT_SKILLS_AND_COORDINATION: HealthPeStrandConfig = {
  key: "movement-skills-and-coordination",
  title: "Movement skills and coordination",
  subtitle:
    "Movement skills and coordination helps learners become more confident with balance, locomotor movement, object control, rhythm, and body awareness. It grows from playful whole-body movement into more refined skill combinations, sequences, and confident participation across active settings.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on body awareness, play, and repetition. It supports confidence in games, outdoor learning, fitness habits, and practical participation across the wider Health / PE pathway.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early movement learning begins with playful balance, stopping and starting, moving through space, and noticing how the body works.",
      steps: [
        {
          id: 1,
          title: "Move in different ways with growing body awareness",
          meaning:
            "Practise walking, running, jumping, crawling, hopping, or balancing while noticing space, direction, and control.",
          skillFocus: "early whole-body movement control",
          practiceActivity:
            "Set up a simple home obstacle path using cushions, tape lines, or outdoor markers and talk about how the body moved through each part.",
          evidenceExamples: [
            "a photo or short note from an obstacle course session",
            "a parent observation about balance or movement confidence",
            "a learner comment about which movement felt easiest or hardest",
          ],
          nextStep:
            "Build from broad movement exploration into early throwing, catching, rhythm, and simple movement sequences.",
          reportLanguage:
            "The learner is beginning to move with growing balance, control, and body awareness across simple locomotor activities.",
        },
        {
          id: 2,
          title: "Try simple object and rhythm actions",
          meaning:
            "Use basic throwing, catching, rolling, tapping, clapping, or movement-to-beat actions to build coordination.",
          skillFocus: "early coordination and timing",
          practiceActivity:
            "Roll a ball back and forth, toss scarves, clap patterns, or step to a simple beat during music and movement play.",
          evidenceExamples: [
            "a photo or note from ball or rhythm practice",
            "a parent observation about coordination or timing",
            "a learner demonstration of a favourite action sequence",
          ],
          nextStep:
            "Carry this into lower-primary work on combining movements with better timing and control.",
          reportLanguage:
            "The learner is developing early coordination through simple object control, timing, and movement-to-rhythm activities.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin combining movements more smoothly and using basic object-control skills with clearer direction and control.",
      steps: [
        {
          id: 1,
          title: "Link locomotor movements with more control",
          meaning:
            "Join movements such as running, hopping, skipping, turning, and landing with better balance and coordination.",
          skillFocus: "combined movement patterns",
          practiceActivity:
            "Create a short movement course with run-hop-jump-turn sections and repeat it until the sequence feels smoother.",
          evidenceExamples: [
            "a parent note about improved balance or flow",
            "a simple sequence chart or learner retelling",
            "a photo showing one part of a movement routine",
          ],
          nextStep:
            "Use smoother movement patterns to support middle-primary sequences, games, and skill combinations.",
          reportLanguage:
            "The learner is increasingly able to link locomotor movements with better balance, timing, and control.",
        },
        {
          id: 2,
          title: "Use early throwing, catching, kicking, or striking skills",
          meaning:
            "Practise sending and receiving objects more deliberately while noticing direction, force, and readiness.",
          skillFocus: "early object control",
          practiceActivity:
            "Play simple target throws, gentle kicking games, balloon striking, or partner catch activities with child-safe equipment.",
          evidenceExamples: [
            "a parent note about object-control improvement",
            "a simple target score or repetition count",
            "a learner explanation of how to throw or catch more successfully",
          ],
          nextStep:
            "Carry this into middle-primary movement combinations and game participation with stronger control.",
          reportLanguage:
            "The learner is building confidence with early object-control skills and can increasingly direct movement with purpose.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens coordinated sequences, rhythm, object control, and adapting movement for different tasks.",
      steps: [
        {
          id: 1,
          title: "Perform short movement sequences with rhythm and control",
          meaning:
            "Use a planned order of movements with clearer timing, body control, and smooth transitions.",
          skillFocus: "movement sequencing",
          practiceActivity:
            "Practise a short skipping, balance, dance, or fitness sequence and refine how each part links together.",
          evidenceExamples: [
            "a parent note about a completed sequence",
            "a simple learner reflection on timing or rhythm",
            "a photo set or diagram showing the movement order",
          ],
          nextStep:
            "Use sequencing confidence to support upper-primary refinement and adaptation in games or routines.",
          reportLanguage:
            "The learner is developing stronger coordination through short movement sequences that show growing rhythm and control.",
        },
        {
          id: 2,
          title: "Adjust movement when the task changes",
          meaning:
            "Notice how speed, space, partner actions, or equipment changes require different movement choices.",
          skillFocus: "adaptable coordination",
          practiceActivity:
            "Repeat a throw, balance task, or movement game using different distances, targets, partners, or spaces and discuss what changed.",
          evidenceExamples: [
            "a parent note about adapting to a new challenge",
            "a learner explanation of what changed and why",
            "a simple comparison between two task conditions",
          ],
          nextStep:
            "Carry this into upper-primary work on more refined technique and active participation across different settings.",
          reportLanguage:
            "The learner is beginning to adapt movement choices more thoughtfully when the task, space, or equipment changes.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now refine technique, coordinate more complex actions, and use movement more deliberately in routines, games, and active challenges.",
      steps: [
        {
          id: 1,
          title: "Refine technique for greater consistency",
          meaning:
            "Work on body position, follow-through, timing, and control so repeated movement actions become more reliable.",
          skillFocus: "movement refinement",
          practiceActivity:
            "Choose one skill such as throwing, balancing, kicking, or skipping and repeat it with one improvement focus at a time.",
          evidenceExamples: [
            "a before-and-after note on a movement skill",
            "a learner reflection on one technique change",
            "a parent observation about improved consistency",
          ],
          nextStep:
            "Use growing technique awareness to support lower-secondary strategy and self-directed skill improvement.",
          reportLanguage:
            "The learner is increasingly able to refine movement technique and repeat skills with greater control and consistency.",
        },
        {
          id: 2,
          title: "Use movement confidently across different activities",
          meaning:
            "Apply coordination skills in routines, games, active chores, or outdoor challenges rather than in one narrow setting only.",
          skillFocus: "transfer of movement skill",
          practiceActivity:
            "Use the same coordination skill in a game, a short routine, and an outdoor task, then discuss what transferred well.",
          evidenceExamples: [
            "a note comparing the same skill across activities",
            "a learner explanation of transfer between settings",
            "a parent observation about broader movement confidence",
          ],
          nextStep:
            "Carry this into lower-secondary movement choices, planning, and independent practice.",
          reportLanguage:
            "The learner is beginning to transfer movement skills across a wider range of active contexts with growing confidence.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens self-awareness, strategy, and more independent use of movement skills across fitness, games, and active participation.",
      steps: [
        {
          id: 1,
          title: "Choose movement strategies that fit the task",
          meaning:
            "Notice which technique, pace, position, or sequence works best for a specific activity or goal.",
          skillFocus: "strategic movement choice",
          practiceActivity:
            "Compare two ways of completing a movement challenge and discuss which approach felt more effective and why.",
          evidenceExamples: [
            "a learner explanation of a chosen strategy",
            "a parent note about thoughtful movement decisions",
            "a simple comparison of two movement approaches",
          ],
          nextStep:
            "Use strategic choices to support later consolidation across more varied and demanding activity settings.",
          reportLanguage:
            "The learner is developing stronger skill in choosing movement strategies that suit the demands of an activity or challenge.",
        },
        {
          id: 2,
          title: "Reflect on progress and practise with purpose",
          meaning:
            "Notice strengths, next goals, and which kinds of practice help coordination improve over time.",
          skillFocus: "purposeful movement reflection",
          practiceActivity:
            "Choose one movement skill to improve over several sessions and keep a short reflection on what helped most.",
          evidenceExamples: [
            "a simple movement progress note",
            "a learner goal and reflection record",
            "a parent observation about persistence and improvement",
          ],
          nextStep:
            "Build toward later consolidation where movement skills are used more independently and explained more clearly.",
          reportLanguage:
            "The learner is beginning to reflect on movement progress purposefully and can identify helpful practice approaches with growing independence.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together movement confidence, technique, strategy, and reflection across a wider range of practical and active contexts.",
      steps: [
        {
          id: 1,
          title: "Apply coordinated movement across varied settings",
          meaning:
            "Use balance, timing, control, and skill combinations confidently in games, recreation, outdoor activity, and personal movement goals.",
          skillFocus: "adaptable movement application",
          practiceActivity:
            "Choose different active settings across the week and note how the same coordination strengths supported each one.",
          evidenceExamples: [
            "a weekly movement log across different contexts",
            "a learner explanation of how skills transferred",
            "a parent note about broader movement confidence",
          ],
          nextStep:
            "Use this adaptable movement base to support active living, teamwork, and future physical challenges.",
          reportLanguage:
            "The learner is consolidating coordinated movement skills and can apply them across a wide range of active contexts with growing confidence.",
        },
        {
          id: 2,
          title: "Explain movement choices and next improvement goals",
          meaning:
            "Communicate how a movement was performed, why a strategy worked, and what could be improved next.",
          skillFocus: "clear movement reflection",
          practiceActivity:
            "Review one active challenge, explain what worked well, and identify one realistic next step for improvement.",
          evidenceExamples: [
            "a learner reflection on movement choices",
            "a short video or note explaining technique and next steps",
            "a parent summary of goal-setting discussion",
          ],
          nextStep:
            "These reflection habits continue to support active learning, evidence capture, and reporting over time.",
          reportLanguage:
            "The learner is strengthening the ability to explain movement choices clearly and identify sensible next goals for further improvement.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early balance or movement-play example, one mid-stage sequence or object-control record, and one later reflection on strategy and improvement so growth is visible over time.",
    "Photos, short notes, simple skill charts, and learner reflections often make stronger homeschool evidence than formal performance scores alone.",
    "A portfolio becomes stronger when it shows how the learner moved from playful coordination into more deliberate skill use, adaptation, and self-reflection.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in coordination, control, confidence, rhythm, and adaptable movement rather than focusing only on sport-specific performance.",
    "Examples are strongest when the learner explains what was practised, what improved, and how movement skills transferred across different activities.",
    "Collected evidence can show a clear shift from early movement exploration into more reliable, confident, and reflective participation.",
  ],
};

const PHYSICAL_ACTIVITY_AND_FITNESS: HealthPeStrandConfig = {
  key: "physical-activity-and-fitness",
  title: "Physical activity and fitness",
  subtitle:
    "Physical activity and fitness helps learners build enjoyment of movement, active routines, stamina, strength, flexibility, and healthy participation habits. It grows from active play into more deliberate goal-setting, safe effort, and self-awareness about movement choices over time.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on movement confidence and daily activity habits. It connects movement, wellbeing, routines, and personal goals rather than focusing only on school-sport performance.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early fitness learning begins with active play, short bursts of effort, rest, and noticing that movement can feel enjoyable and energising.",
      steps: [
        {
          id: 1,
          title: "Join in active play with enjoyment",
          meaning:
            "Take part in playful movement that lifts energy, uses the body in different ways, and feels positive.",
          skillFocus: "active play participation",
          practiceActivity:
            "Use dancing, backyard games, active songs, or short family movement breaks to build a positive habit of moving each day.",
          evidenceExamples: [
            "a parent note about favourite active play",
            "a simple weekly movement picture chart",
            "a learner comment about how movement felt",
          ],
          nextStep:
            "Build from active play into noticing effort, recovery, and regular movement habits.",
          reportLanguage:
            "The learner is beginning to participate willingly in active play and shows growing enjoyment of regular movement.",
        },
        {
          id: 2,
          title: "Notice when the body needs rest or a drink",
          meaning:
            "Learn that active movement can raise breathing, warmth, or tiredness and that rest and water help the body recover.",
          skillFocus: "early body response awareness",
          practiceActivity:
            "After active play, pause to notice breathing, heartbeat, thirst, or energy and talk about rest and water in simple terms.",
          evidenceExamples: [
            "a learner explanation of when rest was needed",
            "a parent note about recognising thirst or tiredness",
            "a simple body-feeling discussion record",
          ],
          nextStep:
            "Carry this into lower-primary understanding of safe effort and active habits.",
          reportLanguage:
            "The learner is developing early awareness of body responses during activity and can recognise simple recovery needs such as rest and water.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin building regular activity habits, safe effort, and awareness that different kinds of movement help the body in different ways.",
      steps: [
        {
          id: 1,
          title: "Take part in a range of active movement",
          meaning:
            "Use running, stretching, jumping, climbing, dancing, or active games so the body experiences different kinds of effort.",
          skillFocus: "varied activity participation",
          practiceActivity:
            "Plan a simple week with different movement types such as a walk, game, dance session, stretch time, or outdoor challenge.",
          evidenceExamples: [
            "a weekly activity plan or checklist",
            "a parent note on participation across different activities",
            "a learner reflection on favourite movement types",
          ],
          nextStep:
            "Use varied participation to support middle-primary goal-setting and activity routines.",
          reportLanguage:
            "The learner is increasingly willing to take part in a broader range of physical activities and is building positive movement habits.",
        },
        {
          id: 2,
          title: "Use safe effort during movement",
          meaning:
            "Notice pace, space, warm-up, footwear, and rest so activity stays manageable and safe.",
          skillFocus: "safe physical participation",
          practiceActivity:
            "Before and after a short active session, talk about warm-up, safe space, and what helped the body feel ready and settled.",
          evidenceExamples: [
            "a parent note about safe effort reminders",
            "a learner explanation of a safe activity choice",
            "a short warm-up or cool-down routine record",
          ],
          nextStep:
            "Carry this into middle-primary planning for active goals and sustainable routines.",
          reportLanguage:
            "The learner is beginning to use safe effort and simple preparation habits during physical activity with growing independence.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens active habits, personal goals, persistence, and understanding that fitness grows through consistent practice.",
      steps: [
        {
          id: 1,
          title: "Set a simple personal movement goal",
          meaning:
            "Choose one manageable goal related to stamina, strength, flexibility, or participation and work toward it over time.",
          skillFocus: "goal-setting for physical activity",
          practiceActivity:
            "Set a goal such as walking further, holding a balance longer, doing a short daily stretch, or joining activity more regularly.",
          evidenceExamples: [
            "a simple movement goal chart",
            "a learner reflection on progress toward a goal",
            "a parent note about persistence or effort",
          ],
          nextStep:
            "Use goal-setting habits to support upper-primary planning and self-monitoring.",
          reportLanguage:
            "The learner is beginning to set simple movement goals and shows growing persistence in working toward them.",
        },
        {
          id: 2,
          title: "Notice how regular activity changes energy and confidence",
          meaning:
            "Recognise that moving regularly can influence mood, stamina, sleep readiness, and willingness to join in.",
          skillFocus: "activity-wellbeing connection",
          practiceActivity:
            "Keep a short note on how a walk, game, dance, or movement break changed energy or focus across a week.",
          evidenceExamples: [
            "a learner note about feeling after movement",
            "a parent observation about energy or confidence",
            "a simple week-long movement and feeling log",
          ],
          nextStep:
            "Carry this into upper-primary reflection on routines, effort, and healthy activity choices.",
          reportLanguage:
            "The learner is developing awareness that regular physical activity can support energy, confidence, and wellbeing.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin planning more deliberately for regular activity, using simple reflection and realistic habits rather than one-off effort alone.",
      steps: [
        {
          id: 1,
          title: "Plan active routines with growing independence",
          meaning:
            "Think ahead about when and how movement will fit into family life, learning time, and personal interests.",
          skillFocus: "active routine planning",
          practiceActivity:
            "Help plan a week that includes active breaks, walks, games, stretches, or practice sessions that fit the family's rhythm.",
          evidenceExamples: [
            "a weekly active routine plan",
            "a learner explanation of how activity was fitted into the week",
            "a parent note about follow-through and consistency",
          ],
          nextStep:
            "Use routine planning to support lower-secondary self-management and more deliberate fitness choices.",
          reportLanguage:
            "The learner is increasingly able to plan regular physical activity in realistic ways and follow through with growing independence.",
        },
        {
          id: 2,
          title: "Reflect on what kind of activity helps most",
          meaning:
            "Notice which activities build energy, confidence, flexibility, endurance, or enjoyment most effectively.",
          skillFocus: "reflective activity choice",
          practiceActivity:
            "Compare two or three active options across a fortnight and talk about which ones felt most helpful and why.",
          evidenceExamples: [
            "a learner comparison of active choices",
            "a parent note about thoughtful reflection on activity",
            "a simple activity-preference and benefit record",
          ],
          nextStep:
            "Carry this into lower-secondary choices about goals, consistency, and self-directed activity.",
          reportLanguage:
            "The learner is beginning to reflect thoughtfully on which kinds of physical activity best support personal wellbeing and participation.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens self-directed activity habits, sensible goals, safe effort, and clearer reflection on wellbeing and participation.",
      steps: [
        {
          id: 1,
          title: "Work toward a realistic personal activity plan",
          meaning:
            "Use a manageable plan for movement, recovery, and consistency rather than relying on occasional bursts of effort.",
          skillFocus: "self-directed activity planning",
          practiceActivity:
            "Create a short-term movement plan with a few weekly targets and review how realistic and helpful it felt.",
          evidenceExamples: [
            "a learner activity plan with reflections",
            "a parent note about consistency and adjustments",
            "a simple log showing follow-through over time",
          ],
          nextStep:
            "Build toward later consolidation where activity choices are sustained more independently and evaluated more clearly.",
          reportLanguage:
            "The learner is developing greater independence in planning and sustaining realistic physical activity routines.",
        },
        {
          id: 2,
          title: "Use reflection to adjust effort and habits",
          meaning:
            "Notice when a routine is too much, too little, or just right and make sensible adjustments that support participation.",
          skillFocus: "reflective fitness self-management",
          practiceActivity:
            "Review one activity habit and decide whether pace, frequency, recovery, or variety needs adjusting.",
          evidenceExamples: [
            "a learner reflection on changing an activity habit",
            "a parent note about sensible self-adjustment",
            "a before-and-after record of a routine change",
          ],
          nextStep:
            "Use this reflective habit to support confident long-term movement and wellbeing decisions.",
          reportLanguage:
            "The learner is beginning to use reflection to make sensible adjustments to physical activity habits and effort levels.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together movement enjoyment, active habits, self-management, and clearer communication about healthy physical participation.",
      steps: [
        {
          id: 1,
          title: "Sustain physical activity as part of daily life",
          meaning:
            "Use active habits in ways that support participation, wellbeing, confidence, and realistic family or personal routines.",
          skillFocus: "sustained active living",
          practiceActivity:
            "Track a period of regular activity and reflect on how consistency, enjoyment, and variety supported staying active.",
          evidenceExamples: [
            "a sustained activity log",
            "a learner reflection on maintaining active habits",
            "a parent note about independence and consistency",
          ],
          nextStep:
            "Use this base to support lifelong enjoyment of movement, confidence, and practical self-care.",
          reportLanguage:
            "The learner is consolidating healthy physical activity habits and can sustain movement choices more independently over time.",
        },
        {
          id: 2,
          title: "Explain how activity choices support wellbeing",
          meaning:
            "Communicate how physical activity supports energy, confidence, routine, and practical wellbeing in everyday life.",
          skillFocus: "clear physical wellbeing reflection",
          practiceActivity:
            "Review an active routine and explain which parts most strongly supported wellbeing, confidence, or participation.",
          evidenceExamples: [
            "a learner explanation of wellbeing benefits from activity",
            "a short reflection on active habits and health",
            "a parent summary of an activity and wellbeing discussion",
          ],
          nextStep:
            "These reflection habits continue to support portfolio evidence, reporting, and confident future decision-making.",
          reportLanguage:
            "The learner is strengthening the ability to explain how physical activity choices support wellbeing, confidence, and long-term participation.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early active-play record, one mid-stage goal or routine example, and one later reflection on sustained activity habits so progress is visible over time.",
    "Weekly logs, family movement plans, learner reflections, and parent observations often make stronger evidence than fitness scores alone.",
    "A portfolio becomes stronger when it shows how the learner moved from willing participation into purposeful, reflective, and sustainable activity habits.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in participation, stamina, safe effort, routine-building, and self-reflection rather than focusing on performance ranking or body measures.",
    "Examples are strongest when the learner explains how activity habits changed over time and what kinds of movement best supported wellbeing and confidence.",
    "Collected evidence can show a clear shift from playful movement participation into more deliberate, healthy, and sustainable activity choices.",
  ],
};

const HEALTH_SAFETY_AND_WELLBEING: HealthPeStrandConfig = {
  key: "health-safety-and-wellbeing",
  title: "Health, safety and wellbeing",
  subtitle:
    "Health, safety and wellbeing helps learners build healthy routines, notice emotions, make safe choices, and seek help when needed. It grows from everyday care habits into more thoughtful decision-making, self-awareness, and practical wellbeing responsibility.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on routine, guidance, and family discussion. It connects safety, healthy habits, self-awareness, and practical decision-making across everyday life.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early health learning begins with simple routines, naming basic feelings, and noticing safe and unsafe situations with support.",
      steps: [
        {
          id: 1,
          title: "Use simple healthy routines each day",
          meaning:
            "Practise washing hands, brushing teeth, resting, eating regular meals, and following basic family care routines.",
          skillFocus: "early healthy routines",
          practiceActivity:
            "Use a picture routine for hygiene, meals, water, rest, and getting ready for the day or bedtime.",
          evidenceExamples: [
            "a routine chart with growing independence",
            "a parent note about hygiene or sleep habit progress",
            "a learner explanation of one healthy routine",
          ],
          nextStep:
            "Build from routine participation into understanding why routines matter for safety and wellbeing.",
          reportLanguage:
            "The learner is beginning to use simple daily routines that support health, safety, and personal care.",
        },
        {
          id: 2,
          title: "Name feelings and ask for help when needed",
          meaning:
            "Recognise simple emotions and learn that trusted adults can help with problems, worries, or unsafe situations.",
          skillFocus: "early wellbeing communication",
          practiceActivity:
            "Use stories, feeling cards, or daily check-ins to practise naming emotions and identifying safe helpers.",
          evidenceExamples: [
            "a learner naming a feeling and support need",
            "a parent note about help-seeking language",
            "a simple trusted-helpers list or drawing",
          ],
          nextStep:
            "Carry this into lower-primary decisions about safety, emotions, and healthy choices.",
          reportLanguage:
            "The learner is developing early confidence in naming feelings and seeking help from trusted adults when needed.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin linking routines, safety choices, food, sleep, and emotions with how the body and mind feel each day.",
      steps: [
        {
          id: 1,
          title: "Explain simple choices that support wellbeing",
          meaning:
            "Recognise that rest, food, water, movement, and calm-down routines help the body and mind feel better.",
          skillFocus: "early wellbeing decision-making",
          practiceActivity:
            "Talk through a day and identify choices that helped the learner feel ready, safe, calm, or active.",
          evidenceExamples: [
            "a learner explanation of a healthy choice",
            "a parent note about growing routine awareness",
            "a simple daily wellbeing reflection",
          ],
          nextStep:
            "Use this awareness to support middle-primary planning and more thoughtful self-care choices.",
          reportLanguage:
            "The learner is increasingly able to explain simple choices that support everyday wellbeing and readiness for learning.",
        },
        {
          id: 2,
          title: "Recognise common safety rules and reasons",
          meaning:
            "Use family and community rules around roads, water, food, tools, medicines, or digital devices with clearer understanding.",
          skillFocus: "basic safety awareness",
          practiceActivity:
            "Discuss everyday safety situations and ask what the rule is, why it matters, and who to ask for help.",
          evidenceExamples: [
            "a parent note about safety reasoning",
            "a learner explanation of one safety rule",
            "a simple what-to-do safety discussion record",
          ],
          nextStep:
            "Carry this into middle-primary risk thinking and safer independent choices.",
          reportLanguage:
            "The learner is developing stronger understanding of common safety rules and can increasingly explain why they matter.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens healthy habit planning, emotional self-awareness, and thinking ahead about safe choices in practical situations.",
      steps: [
        {
          id: 1,
          title: "Use simple strategies to support calm and readiness",
          meaning:
            "Notice what helps with stress, tiredness, frustration, or overwhelm and use age-appropriate calming or reset strategies.",
          skillFocus: "practical self-regulation",
          practiceActivity:
            "Build a simple reset plan using movement, breathing, quiet time, outdoor time, or talking with a trusted adult.",
          evidenceExamples: [
            "a learner calm-down or reset plan",
            "a parent note about using a helpful strategy",
            "a reflection on what helped after a challenging moment",
          ],
          nextStep:
            "Use self-regulation awareness to support upper-primary independence and safer decision-making.",
          reportLanguage:
            "The learner is beginning to use practical strategies that support calm, readiness, and emotional self-awareness.",
        },
        {
          id: 2,
          title: "Think through everyday risks before acting",
          meaning:
            "Pause and consider what could go wrong, what support is needed, and what safer choice would make sense.",
          skillFocus: "early risk decision-making",
          practiceActivity:
            "Talk through common family scenarios such as biking, cooking help, outdoor play, or device use and identify safer options.",
          evidenceExamples: [
            "a learner explanation of a safer choice",
            "a parent note about pausing before acting",
            "a simple risk-and-response discussion record",
          ],
          nextStep:
            "Carry this into upper-primary responsibility for routines, safety, and wellbeing planning.",
          reportLanguage:
            "The learner is developing stronger ability to think ahead about everyday risks and choose safer responses.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin taking more responsibility for routines, safe choices, and recognising when support, rest, or adjustment is needed.",
      steps: [
        {
          id: 1,
          title: "Manage routines with growing independence",
          meaning:
            "Take more responsibility for hydration, rest, basic nutrition choices, personal organisation, and everyday self-care habits.",
          skillFocus: "independent wellbeing routines",
          practiceActivity:
            "Use a weekly checklist or reflection to track one or two self-care routines and adjust what helps them happen more consistently.",
          evidenceExamples: [
            "a learner checklist for daily routines",
            "a parent note about growing independence",
            "a short reflection on improving one health habit",
          ],
          nextStep:
            "Use routine independence to support lower-secondary self-management and sensible decision-making.",
          reportLanguage:
            "The learner is increasingly able to manage everyday wellbeing routines with greater independence and personal responsibility.",
        },
        {
          id: 2,
          title: "Identify when help or adjustment is needed",
          meaning:
            "Recognise signs that rest, support, guidance, or a safer choice would help in a practical situation.",
          skillFocus: "help-seeking and adjustment awareness",
          practiceActivity:
            "Reflect on recent situations and identify where asking for help, slowing down, or choosing differently would be wise.",
          evidenceExamples: [
            "a learner explanation of when help was needed",
            "a parent note about sensible self-awareness",
            "a reflection on changing a choice for safety or wellbeing",
          ],
          nextStep:
            "Carry this into lower-secondary wellbeing planning and more mature self-advocacy.",
          reportLanguage:
            "The learner is beginning to recognise when support, rest, or a change of plan is needed to protect wellbeing and safety.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens self-management, help-seeking, routine planning, and clearer reasoning about wellbeing and safety choices.",
      steps: [
        {
          id: 1,
          title: "Plan for wellbeing in realistic ways",
          meaning:
            "Think ahead about routines that support energy, sleep, safety, activity, calm, and participation across a busy week.",
          skillFocus: "realistic wellbeing planning",
          practiceActivity:
            "Review a week and identify where sleep, movement, preparation, breaks, or support could be planned more clearly.",
          evidenceExamples: [
            "a learner wellbeing planning note",
            "a parent summary of a routine-planning conversation",
            "a revised weekly routine showing healthier choices",
          ],
          nextStep:
            "Build toward later consolidation where wellbeing choices are explained more clearly and managed more independently.",
          reportLanguage:
            "The learner is developing stronger skill in planning realistic routines that support wellbeing, safety, and participation.",
        },
        {
          id: 2,
          title: "Explain why a safe or healthy choice makes sense",
          meaning:
            "Use practical reasoning to justify safer, calmer, or more sustainable choices in everyday situations.",
          skillFocus: "wellbeing reasoning",
          practiceActivity:
            "Discuss a common scenario and explain which choice best supports safety, health, or respectful participation and why.",
          evidenceExamples: [
            "a learner explanation of a sensible choice",
            "a parent note on practical reasoning about wellbeing",
            "a simple compare-two-choices reflection",
          ],
          nextStep:
            "Use this reasoning to support long-term self-management and clearer reporting language.",
          reportLanguage:
            "The learner is increasingly able to explain why a safe or healthy choice makes sense in practical everyday contexts.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together routine, self-awareness, safe choices, and clearer communication about practical wellbeing over time.",
      steps: [
        {
          id: 1,
          title: "Use wellbeing habits with greater independence",
          meaning:
            "Sustain routines and choices that support activity, rest, safety, respectful relationships, and practical everyday functioning.",
          skillFocus: "independent wellbeing habits",
          practiceActivity:
            "Review a period of time and identify which practical routines became more settled and which still need support.",
          evidenceExamples: [
            "a learner reflection on long-term habits",
            "a parent note about increasing independence",
            "a simple routine snapshot showing consistency over time",
          ],
          nextStep:
            "Use this independence to support confident participation, practical self-care, and later adult responsibilities.",
          reportLanguage:
            "The learner is consolidating independent wellbeing habits and is increasingly able to use them consistently in everyday life.",
        },
        {
          id: 2,
          title: "Communicate practical wellbeing priorities clearly",
          meaning:
            "Explain which routines, supports, and choices best help with safety, confidence, participation, and healthy daily living.",
          skillFocus: "clear wellbeing reflection",
          practiceActivity:
            "Create a short reflection or discussion summary about the routines and choices that most support healthy daily life.",
          evidenceExamples: [
            "a learner statement about key wellbeing priorities",
            "a parent summary of a reflective conversation",
            "a short written or oral reflection on practical self-care",
          ],
          nextStep:
            "These habits continue to support confident decision-making, portfolio evidence, and later reporting.",
          reportLanguage:
            "The learner is strengthening the ability to communicate practical wellbeing priorities clearly and reflect on choices that support healthy participation.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early routine example, one mid-stage safety or self-regulation reflection, and one later record of practical wellbeing planning so growth is visible over time.",
    "Routine charts, learner reflections, safety discussions, and parent observations often make stronger portfolio evidence than one-off worksheets or quizzes.",
    "A portfolio becomes stronger when it shows how the learner moved from guided routines into more thoughtful self-awareness, safer choices, and independent wellbeing habits.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in routines, self-awareness, safe choices, help-seeking, and practical wellbeing rather than using clinical or diagnostic language.",
    "Examples are strongest when the learner can explain how a routine, support, or safety choice helped participation and daily functioning.",
    "Collected evidence can show a clear shift from simple rule-following into more reflective, responsible, and practical wellbeing decisions.",
  ],
};

const RELATIONSHIPS_AND_PERSONAL_DEVELOPMENT: HealthPeStrandConfig = {
  key: "relationships-and-personal-development",
  title: "Relationships and personal development",
  subtitle:
    "Relationships and personal development helps learners build communication, confidence, self-awareness, respect, and practical ways of working with others. It grows from simple friendship and emotion skills into more thoughtful cooperation, boundaries, reflection, and personal responsibility.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on family relationships, communication, and self-awareness. It supports teamwork, respectful participation, confidence, and practical decision-making across everyday life.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early relationship learning begins with naming feelings, sharing, taking turns, and noticing how words and actions affect others.",
      steps: [
        {
          id: 1,
          title: "Use kind words and simple social routines",
          meaning:
            "Practise greeting, asking, thanking, waiting, and sharing in ways that support positive family and play interactions.",
          skillFocus: "early respectful interaction",
          practiceActivity:
            "Use role play, family games, or everyday routines to practise asking politely, taking turns, and saying what is needed.",
          evidenceExamples: [
            "a parent note about kind interaction during play",
            "a learner role-play example",
            "a simple reflection on sharing or waiting",
          ],
          nextStep:
            "Build from early social routines into clearer communication about feelings, friendship, and cooperation.",
          reportLanguage:
            "The learner is beginning to use kind social routines and shows growing confidence in respectful interaction with others.",
        },
        {
          id: 2,
          title: "Name feelings and respond kindly to others",
          meaning:
            "Notice basic emotions in self and others and begin responding with care, calm, or help-seeking.",
          skillFocus: "early emotional awareness in relationships",
          practiceActivity:
            "Use stories or daily events to name feelings and discuss kind ways to respond when someone is upset or frustrated.",
          evidenceExamples: [
            "a learner explanation of a feeling and response",
            "a parent note about empathy in a real situation",
            "a simple feelings-and-actions chart",
          ],
          nextStep:
            "Carry this into lower-primary friendship, conflict-solving, and clearer respectful communication.",
          reportLanguage:
            "The learner is developing early emotional awareness and can increasingly respond to others with kindness and care.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin building stronger friendship habits, clearer communication, and simple ways to work through everyday disagreements.",
      steps: [
        {
          id: 1,
          title: "Communicate needs and ideas clearly",
          meaning:
            "Say what is needed, wanted, or felt in simple respectful ways that help others understand.",
          skillFocus: "clear respectful communication",
          practiceActivity:
            "Use role play or family routines to practise asking for help, explaining a choice, or telling someone how a situation felt.",
          evidenceExamples: [
            "a learner explanation during a family discussion",
            "a parent note about clearer communication",
            "a simple script or reflection on respectful wording",
          ],
          nextStep:
            "Use clearer communication to support middle-primary cooperation, boundaries, and conflict management.",
          reportLanguage:
            "The learner is increasingly able to communicate needs and ideas clearly in respectful and practical ways.",
        },
        {
          id: 2,
          title: "Use simple strategies when a disagreement happens",
          meaning:
            "Pause, listen, take turns speaking, and look for fair or calm next steps in everyday conflicts.",
          skillFocus: "early conflict management",
          practiceActivity:
            "Talk through a common disagreement and practise listening, restating, and suggesting a fair solution.",
          evidenceExamples: [
            "a parent note about solving a small disagreement",
            "a learner description of a fair solution",
            "a role-play record about taking turns and listening",
          ],
          nextStep:
            "Carry this into middle-primary cooperation, boundaries, and more mature friendship skills.",
          reportLanguage:
            "The learner is beginning to use simple strategies to work through everyday disagreements with growing fairness and self-control.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens empathy, cooperation, boundaries, and more thoughtful responses to social challenges.",
      steps: [
        {
          id: 1,
          title: "Work cooperatively with growing responsibility",
          meaning:
            "Share roles, listen to others, and help a group or family task move forward respectfully.",
          skillFocus: "cooperation and shared responsibility",
          practiceActivity:
            "Use a home project, board game, cooking task, or group activity to practise taking roles and following through.",
          evidenceExamples: [
            "a parent note about cooperative task participation",
            "a learner reflection on helping a group succeed",
            "a simple task-role summary",
          ],
          nextStep:
            "Use cooperation skills to support upper-primary confidence, leadership, and respectful participation.",
          reportLanguage:
            "The learner is developing stronger cooperation skills and can increasingly contribute responsibly in shared tasks and activities.",
        },
        {
          id: 2,
          title: "Recognise personal boundaries and respectful choices",
          meaning:
            "Understand that people have personal space, preferences, and rights to respectful treatment in everyday interactions.",
          skillFocus: "boundaries and respect",
          practiceActivity:
            "Discuss everyday examples of respecting space, asking first, listening to no, and making kind choices in shared settings.",
          evidenceExamples: [
            "a learner explanation of a respectful boundary choice",
            "a parent note about handling space or consent respectfully",
            "a simple discussion record about personal boundaries",
          ],
          nextStep:
            "Carry this into upper-primary self-awareness, confidence, and respectful leadership.",
          reportLanguage:
            "The learner is beginning to show clearer understanding of personal boundaries and respectful participation in shared settings.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin using stronger self-awareness, confidence, and social judgment when working with others or facing challenges.",
      steps: [
        {
          id: 1,
          title: "Reflect on strengths, challenges, and confidence",
          meaning:
            "Notice personal strengths, tricky situations, and what helps with confidence, calm, and follow-through.",
          skillFocus: "self-awareness and confidence building",
          practiceActivity:
            "Keep a short reflection on one challenge, one strength, and one strategy that helped with participation or confidence.",
          evidenceExamples: [
            "a learner self-reflection on strengths and growth",
            "a parent note about confidence in a new situation",
            "a simple goal-setting note linked to personal development",
          ],
          nextStep:
            "Use self-awareness to support lower-secondary self-advocacy, communication, and responsible choices.",
          reportLanguage:
            "The learner is increasingly able to reflect on personal strengths and challenges and use that insight to build confidence.",
        },
        {
          id: 2,
          title: "Respond respectfully when situations feel challenging",
          meaning:
            "Use words, pauses, support, or problem-solving when disappointment, conflict, or discomfort happens.",
          skillFocus: "respectful challenge management",
          practiceActivity:
            "Talk through a recent challenge and identify which respectful response helped or which response would help next time.",
          evidenceExamples: [
            "a learner explanation of a respectful response",
            "a parent note about handling a challenge more calmly",
            "a short reflection on a hard moment and next step",
          ],
          nextStep:
            "Carry this into lower-secondary self-advocacy, mature communication, and relationship responsibility.",
          reportLanguage:
            "The learner is beginning to respond to challenges with greater self-control, reflection, and respectful communication.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens self-advocacy, respectful communication, social judgment, and more deliberate choices about participation and relationships.",
      steps: [
        {
          id: 1,
          title: "Use self-advocacy in practical and respectful ways",
          meaning:
            "Communicate needs, limits, preferences, or support requests clearly without losing respect for others.",
          skillFocus: "self-advocacy and respect",
          practiceActivity:
            "Practise explaining what support, space, or adjustment would help in a learning, family, or group context.",
          evidenceExamples: [
            "a learner explanation of a support need",
            "a parent note about clear self-advocacy",
            "a reflection on a respectful request or boundary statement",
          ],
          nextStep:
            "Use self-advocacy to support later independence, teamwork, and healthy participation.",
          reportLanguage:
            "The learner is developing greater confidence in expressing needs and boundaries respectfully in practical situations.",
        },
        {
          id: 2,
          title: "Reflect on how choices affect relationships",
          meaning:
            "Consider how tone, fairness, follow-through, and honesty influence trust, teamwork, and participation.",
          skillFocus: "relationship impact awareness",
          practiceActivity:
            "Review a group or family situation and discuss which choices helped trust or cooperation and which made things harder.",
          evidenceExamples: [
            "a learner reflection on relationship choices",
            "a parent note about thoughtful social reasoning",
            "a simple cause-and-effect note about participation and trust",
          ],
          nextStep:
            "Build toward later consolidation where relationship choices are evaluated more clearly and handled more independently.",
          reportLanguage:
            "The learner is increasingly able to reflect on how personal choices affect relationships, trust, and respectful participation.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together confidence, self-awareness, communication, boundaries, and more mature participation in relationships and community life.",
      steps: [
        {
          id: 1,
          title: "Use respectful communication across varied situations",
          meaning:
            "Apply listening, self-advocacy, empathy, and calm discussion in family, group, active, and community settings.",
          skillFocus: "adaptable respectful communication",
          practiceActivity:
            "Reflect on different settings across the week and note how communication choices needed to change to stay respectful and clear.",
          evidenceExamples: [
            "a learner reflection on communication across settings",
            "a parent note about adaptable respectful participation",
            "a short comparison of different communication situations",
          ],
          nextStep:
            "Use this communication base to support teamwork, leadership, and healthy future participation.",
          reportLanguage:
            "The learner is consolidating respectful communication skills and can adapt them more confidently across a wider range of situations.",
        },
        {
          id: 2,
          title: "Explain personal growth in confidence and responsibility",
          meaning:
            "Describe how self-awareness, choices, and relationships have developed over time and what next growth goals make sense.",
          skillFocus: "personal development reflection",
          practiceActivity:
            "Create a short reflection on growth in confidence, communication, cooperation, or self-awareness over the year.",
          evidenceExamples: [
            "a learner personal-development reflection",
            "a parent summary of growth in responsibility or confidence",
            "a simple progress note comparing earlier and later participation",
          ],
          nextStep:
            "These reflection habits continue to support portfolio evidence, reporting, and mature participation over time.",
          reportLanguage:
            "The learner is strengthening the ability to reflect on personal growth, communication, and responsibility with increasing insight and confidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early social-routine example, one mid-stage cooperation or boundary reflection, and one later self-advocacy or growth reflection so personal development is visible over time.",
    "Parent observations, learner reflections, role-play notes, and family discussion summaries often make strong portfolio evidence in this strand.",
    "A portfolio becomes stronger when it shows how the learner moved from simple turn-taking into clearer communication, confidence, boundaries, and thoughtful participation.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in communication, self-awareness, cooperation, confidence, and respectful participation rather than using clinical or overly personal language.",
    "Examples are strongest when the learner can describe how a strategy, reflection, or conversation supported healthier participation in relationships or shared tasks.",
    "Collected evidence can show a clear shift from early social routines into more thoughtful, confident, and responsible relationship skills.",
  ],
};

const TEAMWORK_GAMES_AND_FAIR_PLAY: HealthPeStrandConfig = {
  key: "teamwork-games-and-fair-play",
  title: "Teamwork, games and fair play",
  subtitle:
    "Teamwork, games and fair play helps learners use rules, cooperation, strategy, respectful competition, and shared problem-solving. It grows from turn-taking and simple games into more thoughtful leadership, adaptation, and fair participation across active settings.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on movement confidence, communication, and self-control. It applies movement, strategy, cooperation, and respectful competition in family-friendly play and active learning.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early games learning begins with simple rules, turn-taking, waiting, and enjoying play with others.",
      steps: [
        {
          id: 1,
          title: "Follow simple rules during a game",
          meaning:
            "Use one or two basic rules so play stays safe, fair, and enjoyable for everyone.",
          skillFocus: "early rule-following in games",
          practiceActivity:
            "Play a short game with clear start, stop, and turn-taking rules and talk about how the rules helped.",
          evidenceExamples: [
            "a parent note about rule-following during play",
            "a learner explanation of one game rule",
            "a short reflection on why the rule mattered",
          ],
          nextStep:
            "Build from simple rule-following into cooperation and fair turn-taking with others.",
          reportLanguage:
            "The learner is beginning to follow simple rules during games and shows growing awareness of safe and fair play.",
        },
        {
          id: 2,
          title: "Take turns and join shared play kindly",
          meaning:
            "Wait, share, cheer others on, and return to play after a turn in simple cooperative or competitive games.",
          skillFocus: "early fair participation",
          practiceActivity:
            "Use board games, relay tasks, or simple outdoor play to practise waiting, sharing turns, and responding kindly.",
          evidenceExamples: [
            "a parent observation about turn-taking",
            "a learner demonstration of waiting and rejoining play",
            "a short note about kind participation during a game",
          ],
          nextStep:
            "Carry this into lower-primary teamwork, fairness, and simple strategy discussion.",
          reportLanguage:
            "The learner is developing early fair-play habits and can increasingly take turns and join shared games respectfully.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin cooperating more actively, using simple strategy ideas, and noticing how fairness supports enjoyable play.",
      steps: [
        {
          id: 1,
          title: "Work with others toward a shared game goal",
          meaning:
            "Cooperate with a partner or small group rather than playing only for an individual turn or outcome.",
          skillFocus: "early teamwork in games",
          practiceActivity:
            "Use a relay, treasure hunt, or simple team challenge that requires encouragement, sharing roles, or passing.",
          evidenceExamples: [
            "a parent note about teamwork in a game",
            "a learner reflection on helping a team",
            "a simple record of shared roles or turns",
          ],
          nextStep:
            "Use teamwork habits to support middle-primary strategy, problem-solving, and fair competition.",
          reportLanguage:
            "The learner is increasingly able to work with others toward a shared game goal and contribute respectfully in team situations.",
        },
        {
          id: 2,
          title: "Notice what makes play fair or unfair",
          meaning:
            "Recognise when rules, turn-taking, honesty, or inclusion are helping or hurting the game.",
          skillFocus: "fairness awareness",
          practiceActivity:
            "After a game, talk about what felt fair, what felt tricky, and how the game could be adjusted for everyone.",
          evidenceExamples: [
            "a learner explanation of a fairness issue",
            "a parent note about solving an unfair moment",
            "a short discussion record about improving a game",
          ],
          nextStep:
            "Carry this into middle-primary adaptation, respectful competition, and shared problem-solving.",
          reportLanguage:
            "The learner is beginning to recognise what makes play fair and can increasingly discuss how games can be improved for shared participation.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens cooperation, simple tactics, problem-solving in games, and more thoughtful responses to winning, losing, or changing rules.",
      steps: [
        {
          id: 1,
          title: "Use simple tactics or plans in a game",
          meaning:
            "Think ahead about passing, positioning, timing, or turn order to help the game or team go more smoothly.",
          skillFocus: "early game strategy",
          practiceActivity:
            "Play a simple game and pause to discuss what strategy helped most before trying again.",
          evidenceExamples: [
            "a learner explanation of a game strategy",
            "a parent note about planning before acting",
            "a simple compare-and-try-again game reflection",
          ],
          nextStep:
            "Use strategy thinking to support upper-primary leadership, adaptation, and clearer team roles.",
          reportLanguage:
            "The learner is developing stronger game understanding and can increasingly use simple strategies to improve participation.",
        },
        {
          id: 2,
          title: "Respond to winning, losing, or mistakes respectfully",
          meaning:
            "Show self-control, fairness, and perspective whether the game goes well or poorly.",
          skillFocus: "respectful competition",
          practiceActivity:
            "After a game, reflect on how players responded to success, mistakes, or losing and what respectful behaviour looked like.",
          evidenceExamples: [
            "a parent note about sportsmanship",
            "a learner reflection on handling a result",
            "a short discussion on fair play after a game",
          ],
          nextStep:
            "Carry this into upper-primary leadership, role awareness, and adapting games fairly.",
          reportLanguage:
            "The learner is beginning to respond to competitive moments with greater fairness, self-control, and respect for others.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin leading small parts of games, adapting rules, and balancing strategy with inclusion and fair play.",
      steps: [
        {
          id: 1,
          title: "Take on a simple leadership or organising role",
          meaning:
            "Help explain rules, set up teams, track turns, or keep the game moving in a fair and calm way.",
          skillFocus: "leadership in active play",
          practiceActivity:
            "Let the learner help organise a family game, explain a rule, or suggest a fair way to start and continue play.",
          evidenceExamples: [
            "a parent note about leading part of a game",
            "a learner reflection on organising or explaining",
            "a short record of a leadership role during play",
          ],
          nextStep:
            "Use leadership confidence to support lower-secondary strategy, teamwork, and game adaptation.",
          reportLanguage:
            "The learner is increasingly able to take on simple leadership roles in games and support fair, organised participation.",
        },
        {
          id: 2,
          title: "Adapt a game so more people can join successfully",
          meaning:
            "Change space, teams, rules, equipment, or scoring to support inclusion, safety, and enjoyment.",
          skillFocus: "inclusive game adaptation",
          practiceActivity:
            "Choose a familiar game and adjust one or two features so it suits different ages, spaces, or confidence levels.",
          evidenceExamples: [
            "a learner explanation of a game adaptation",
            "a parent note about inclusive decision-making",
            "a simple before-and-after game rules record",
          ],
          nextStep:
            "Carry this into lower-secondary reflection on fairness, strategy, and group participation.",
          reportLanguage:
            "The learner is beginning to adapt games more thoughtfully to support fair, inclusive, and enjoyable participation for others.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens teamwork, role awareness, respectful competition, and deliberate choices about strategy, inclusion, and fair participation.",
      steps: [
        {
          id: 1,
          title: "Use roles and strategy more deliberately in teamwork",
          meaning:
            "Think about what different players or participants contribute and how a plan can help a group work well together.",
          skillFocus: "deliberate teamwork strategy",
          practiceActivity:
            "Play a team game or challenge, then reflect on roles, strategies, and what helped the group work most effectively.",
          evidenceExamples: [
            "a learner explanation of team roles or strategy",
            "a parent note about group problem-solving",
            "a simple review of what helped teamwork succeed",
          ],
          nextStep:
            "Use strategy and role awareness to support later independent organisation and evaluation of games and teamwork.",
          reportLanguage:
            "The learner is developing stronger teamwork judgment and can increasingly use roles and strategy to support group success.",
        },
        {
          id: 2,
          title: "Evaluate fairness and participation more thoughtfully",
          meaning:
            "Consider whether rules, attitudes, and choices supported respectful inclusion and genuine fair play.",
          skillFocus: "critical fair-play reflection",
          practiceActivity:
            "After a game or challenge, reflect on what made participation fair, respectful, and enjoyable and what could improve next time.",
          evidenceExamples: [
            "a learner fair-play evaluation",
            "a parent note about thoughtful participation review",
            "a short reflection on inclusion or game culture",
          ],
          nextStep:
            "Build toward later consolidation where games and group participation are evaluated and improved more independently.",
          reportLanguage:
            "The learner is increasingly able to evaluate fairness, inclusion, and respectful participation with growing maturity and insight.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together teamwork, strategy, fair play, inclusion, and clearer reflection on how games and shared activity work best.",
      steps: [
        {
          id: 1,
          title: "Organise or adapt shared games with purpose",
          meaning:
            "Plan, adjust, or lead games in ways that support safety, strategy, fairness, and enjoyable participation for a group.",
          skillFocus: "purposeful game organisation",
          practiceActivity:
            "Plan a family or group game session, including rules, roles, safety, and one adaptation for the group context.",
          evidenceExamples: [
            "a learner-led game plan",
            "a parent note about organising or adapting activity",
            "a short reflection on what made the game work well",
          ],
          nextStep:
            "Use these habits to support community participation, leadership, and active collaboration in future settings.",
          reportLanguage:
            "The learner is consolidating the ability to organise and adapt shared games purposefully, with strong attention to fairness and participation.",
        },
        {
          id: 2,
          title: "Explain how teamwork and fair play shape outcomes",
          meaning:
            "Reflect on how communication, roles, attitude, rules, and respect influenced the success of a game or challenge.",
          skillFocus: "clear teamwork reflection",
          practiceActivity:
            "Review one team challenge and explain how teamwork, strategy, and fair play affected the final experience and outcome.",
          evidenceExamples: [
            "a learner explanation of teamwork and outcomes",
            "a parent summary of a reflective games discussion",
            "a short written or oral reflection on fair play and success",
          ],
          nextStep:
            "These reflection habits continue to support portfolio evidence, reporting, and healthy participation in group settings.",
          reportLanguage:
            "The learner is strengthening the ability to explain how teamwork, strategy, and fair play influence shared activity outcomes.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early turn-taking example, one mid-stage strategy or teamwork reflection, and one later game adaptation or leadership record so growth is visible over time.",
    "Parent notes, learner reflections, game plans, and short discussion summaries often make stronger evidence than scores or wins alone.",
    "A portfolio becomes stronger when it shows how the learner moved from simple rule-following into cooperation, strategy, inclusion, and fair participation.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in teamwork, fairness, communication, strategy, and respectful participation rather than focusing only on competition outcomes.",
    "Examples are strongest when the learner explains how a rule, role, or adaptation improved participation, fairness, or group success.",
    "Collected evidence can show a clear shift from early turn-taking into more thoughtful leadership, inclusion, and fair-play reasoning.",
  ],
};

const OUTDOOR_PRACTICAL_AND_ACTIVE_LEARNING: HealthPeStrandConfig = {
  key: "outdoor-practical-and-active-learning",
  title: "Outdoor, practical and active learning",
  subtitle:
    "Outdoor, practical and active learning helps learners move, explore, notice the environment, and build resilience through hands-on activity beyond the table. It grows from simple nature play into more thoughtful outdoor safety, planning, navigation, and practical family projects.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on movement confidence, safety awareness, and curiosity. It connects physical activity, resilience, environmental awareness, and practical family learning in real settings.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early outdoor learning begins with walks, nature noticing, safe boundaries, and enjoying movement and exploration outside.",
      steps: [
        {
          id: 1,
          title: "Explore outdoor spaces with curiosity and care",
          meaning:
            "Move, notice, and explore outside while following simple safety guidance and staying with trusted adults.",
          skillFocus: "early outdoor exploration",
          practiceActivity:
            "Take a short walk, visit a park, or explore the yard while noticing sounds, textures, weather, and safe boundaries.",
          evidenceExamples: [
            "a photo or note from an outdoor exploration",
            "a learner comment about something noticed outside",
            "a parent note about safe participation outdoors",
          ],
          nextStep:
            "Build from guided exploration into simple outdoor routines, noticing, and practical movement tasks.",
          reportLanguage:
            "The learner is beginning to explore outdoor spaces with curiosity, movement confidence, and growing awareness of simple safety expectations.",
        },
        {
          id: 2,
          title: "Follow simple outdoor safety expectations",
          meaning:
            "Learn basic ideas such as staying nearby, stopping when called, wearing suitable gear, and asking before trying something risky.",
          skillFocus: "early outdoor safety habits",
          practiceActivity:
            "Before an outdoor activity, review a few simple safety expectations and talk afterwards about which ones helped most.",
          evidenceExamples: [
            "a learner explanation of one outdoor safety rule",
            "a parent note about following boundaries or instructions",
            "a short safety reminder list used before an outing",
          ],
          nextStep:
            "Carry this into lower-primary outdoor tasks, observation, and active family routines.",
          reportLanguage:
            "The learner is developing early outdoor safety habits and can increasingly follow simple expectations during active exploration.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin taking part in more practical outdoor tasks, following routines, and noticing how movement, weather, and environment shape what they do.",
      steps: [
        {
          id: 1,
          title: "Join practical outdoor tasks with confidence",
          meaning:
            "Take part in simple activities such as gardening, carrying, collecting, walking, or setting up outdoor play spaces.",
          skillFocus: "practical outdoor participation",
          practiceActivity:
            "Use a garden task, nature walk, scavenger hunt, or outdoor setup job that requires movement, following directions, and care.",
          evidenceExamples: [
            "a photo or note from a practical outdoor task",
            "a learner explanation of how they helped outside",
            "a parent observation about confidence in outdoor participation",
          ],
          nextStep:
            "Use practical outdoor participation to support middle-primary resilience, planning, and environmental awareness.",
          reportLanguage:
            "The learner is increasingly willing to join practical outdoor tasks and shows growing confidence in active participation outside.",
        },
        {
          id: 2,
          title: "Notice how weather and environment affect activity",
          meaning:
            "Recognise that heat, rain, wind, terrain, and clothing choices change what is safe or comfortable outdoors.",
          skillFocus: "environmental awareness in activity",
          practiceActivity:
            "Before a walk or outdoor session, discuss the weather, ground conditions, and what clothing or changes are needed.",
          evidenceExamples: [
            "a learner explanation of a weather-based choice",
            "a parent note about noticing environmental conditions",
            "a simple outdoor planning note about clothing or timing",
          ],
          nextStep:
            "Carry this into middle-primary outdoor decision-making and practical problem-solving.",
          reportLanguage:
            "The learner is beginning to notice how weather and environment affect outdoor activity choices and preparation.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens resilience, environmental noticing, and more thoughtful participation in active outdoor tasks and challenges.",
      steps: [
        {
          id: 1,
          title: "Persist through manageable outdoor challenges",
          meaning:
            "Keep going through effort, small discomforts, or unfamiliar tasks while using support and sensible pacing.",
          skillFocus: "outdoor resilience",
          practiceActivity:
            "Try a longer walk, simple hike, carrying task, or outdoor project and talk about what helped with persistence.",
          evidenceExamples: [
            "a learner reflection on finishing an outdoor challenge",
            "a parent note about persistence and problem-solving",
            "a short record of what helped when the task felt hard",
          ],
          nextStep:
            "Use resilience to support upper-primary planning, practical responsibility, and safe challenge choices.",
          reportLanguage:
            "The learner is developing greater resilience in outdoor and practical tasks and can increasingly persist through manageable challenge.",
        },
        {
          id: 2,
          title: "Use simple navigation or location language",
          meaning:
            "Begin using directions, landmarks, simple maps, or route talk to understand where to go and how to move safely.",
          skillFocus: "early navigation awareness",
          practiceActivity:
            "Use a park map, backyard course, or street walk to practise left/right, landmarks, route choices, and safe stopping points.",
          evidenceExamples: [
            "a learner explanation of a simple route",
            "a parent note about using landmarks or directions",
            "a simple map or path sketch",
          ],
          nextStep:
            "Carry this into upper-primary practical route planning and outdoor responsibility.",
          reportLanguage:
            "The learner is beginning to use simple navigation language and environmental clues during outdoor activity and exploration.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin planning more deliberately for outdoor tasks, using equipment responsibly, and adjusting to changing conditions with growing confidence.",
      steps: [
        {
          id: 1,
          title: "Prepare thoughtfully for an outdoor activity",
          meaning:
            "Think ahead about clothing, water, timing, route, equipment, and support so the activity is practical and safe.",
          skillFocus: "outdoor preparation and planning",
          practiceActivity:
            "Help prepare for a walk, family outing, outdoor project, or practical task and explain why each item or choice mattered.",
          evidenceExamples: [
            "a learner packing or planning list",
            "a parent note about thoughtful preparation",
            "a short reflection on what helped the outing go well",
          ],
          nextStep:
            "Use preparation habits to support lower-secondary independence and outdoor decision-making.",
          reportLanguage:
            "The learner is increasingly able to prepare thoughtfully for outdoor activities and explain practical choices that support safety and success.",
        },
        {
          id: 2,
          title: "Adjust when outdoor conditions change",
          meaning:
            "Respond sensibly when weather, terrain, energy, or timing changes the original plan.",
          skillFocus: "flexible outdoor decision-making",
          practiceActivity:
            "After an outing or project, identify one condition that changed and discuss how the plan adapted safely.",
          evidenceExamples: [
            "a learner explanation of an outdoor adjustment",
            "a parent note about flexible decision-making",
            "a compare-before-and-after plan record",
          ],
          nextStep:
            "Carry this into lower-secondary outdoor leadership, resilience, and practical judgment.",
          reportLanguage:
            "The learner is beginning to adjust outdoor plans sensibly when conditions change and can explain why those changes were needed.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens practical judgment, outdoor responsibility, environmental awareness, and more independent participation in active projects.",
      steps: [
        {
          id: 1,
          title: "Use practical judgment in outdoor tasks and projects",
          meaning:
            "Think ahead about route, energy, timing, safety, and resources when planning or joining active outdoor learning.",
          skillFocus: "practical outdoor judgment",
          practiceActivity:
            "Plan part of a hike, garden task, outdoor challenge, or active family project and explain the choices made.",
          evidenceExamples: [
            "a learner planning note for an outdoor task",
            "a parent observation about sound outdoor judgment",
            "a short reflection on balancing challenge and safety",
          ],
          nextStep:
            "Use practical judgment to support later independent participation and clearer reflection on outdoor learning.",
          reportLanguage:
            "The learner is developing stronger practical judgment in outdoor and active tasks and can increasingly plan with safety and realism in mind.",
        },
        {
          id: 2,
          title: "Reflect on how outdoor learning builds resilience",
          meaning:
            "Notice how active outdoor experiences can strengthen persistence, confidence, observation, and problem-solving.",
          skillFocus: "outdoor resilience reflection",
          practiceActivity:
            "After an outdoor challenge or project, reflect on what it taught about persistence, problem-solving, or confidence.",
          evidenceExamples: [
            "a learner reflection on resilience outdoors",
            "a parent note about confidence after an outdoor task",
            "a simple summary of challenge, response, and growth",
          ],
          nextStep:
            "Build toward later consolidation where outdoor learning is used more independently and explained more clearly.",
          reportLanguage:
            "The learner is increasingly able to reflect on how outdoor learning supports resilience, confidence, and practical problem-solving.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together active participation, outdoor judgment, resilience, environmental awareness, and clearer communication about practical learning beyond the classroom table.",
      steps: [
        {
          id: 1,
          title: "Apply outdoor learning confidently across real contexts",
          meaning:
            "Use movement, preparation, resilience, observation, and practical judgment across outdoor projects, recreation, and active family life.",
          skillFocus: "confident outdoor application",
          practiceActivity:
            "Compare several outdoor experiences across a term and identify the practical skills and habits that supported each one.",
          evidenceExamples: [
            "a learner comparison of outdoor experiences",
            "a parent note about confident active participation",
            "a simple record showing transfer across outdoor contexts",
          ],
          nextStep:
            "Use this foundation to support lifelong confidence in active, outdoor, and practical learning settings.",
          reportLanguage:
            "The learner is consolidating the ability to apply outdoor learning skills confidently across a wide range of practical and active contexts.",
        },
        {
          id: 2,
          title: "Explain what outdoor learning contributes to growth",
          meaning:
            "Communicate how active outdoor experiences build confidence, resilience, safety awareness, and practical family capability.",
          skillFocus: "clear outdoor learning reflection",
          practiceActivity:
            "Create a short reflection or presentation on what outdoor learning contributed over the year and why it mattered.",
          evidenceExamples: [
            "a learner reflection on outdoor learning growth",
            "a parent summary of an outdoor-learning conversation",
            "a portfolio note linking outdoor experiences over time",
          ],
          nextStep:
            "These reflection habits continue to support portfolio evidence, reporting, and broader active learning confidence.",
          reportLanguage:
            "The learner is strengthening the ability to explain how outdoor learning contributes to resilience, practical judgment, and confident participation.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early outdoor exploration example, one mid-stage resilience or navigation record, and one later reflection on preparation and practical judgment so growth is visible over time.",
    "Photos, route sketches, family project notes, learner reflections, and parent observations often make strong evidence for this strand.",
    "A portfolio becomes stronger when it shows how the learner moved from guided outdoor exploration into more deliberate planning, resilience, and practical outdoor participation.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in resilience, preparation, environmental awareness, practical judgment, and active participation rather than treating outdoor learning as an extra.",
    "Examples are strongest when the learner explains what an outdoor task required, how challenges were handled, and what practical learning followed.",
    "Collected evidence can show a clear shift from simple outdoor exploration into more thoughtful, capable, and reflective active learning outdoors.",
  ],
};

const HEALTH_PE_STRAND_CONFIGS: HealthPeStrandConfig[] = [
  MOVEMENT_SKILLS_AND_COORDINATION,
  PHYSICAL_ACTIVITY_AND_FITNESS,
  HEALTH_SAFETY_AND_WELLBEING,
  RELATIONSHIPS_AND_PERSONAL_DEVELOPMENT,
  TEAMWORK_GAMES_AND_FAIR_PLAY,
  OUTDOOR_PRACTICAL_AND_ACTIVE_LEARNING,
];

export const HEALTH_PE_STRAND_WORKSPACE_BUILDERS: Record<string, StrandBuilder> =
  Object.fromEntries(
    HEALTH_PE_STRAND_CONFIGS.map((config) => [
      config.key,
      (currentFocusStageKey: PathwayStageKey) =>
        buildHealthPeWorkspace(currentFocusStageKey, config),
    ]),
  );
