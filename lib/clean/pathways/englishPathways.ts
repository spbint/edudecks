import type { MathematicsDetailedStrandWorkspace } from "@/lib/clean/pathways/mathematicsDetailedStrands";
import type {
  PathwayStageKey,
} from "@/lib/clean/pathways/mathematicsNumberPrototype";
import type { SubjectStrandCard } from "@/lib/clean/pathways/subjectPathwayTypes";

type EnglishStepInput = {
  id: number;
  stepKey?: string;
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

type EnglishStageInput = {
  key: PathwayStageKey;
  helper: string;
  steps: EnglishStepInput[];
};

type EnglishStrandConfig = {
  key: string;
  title: string;
  subtitle: string;
  relationshipTitle: string;
  relationshipCopy: string;
  portfolioSupport: string[];
  reportingSupport: string[];
  stages: EnglishStageInput[];
};

type StrandBuilder = (currentFocusStageKey: PathwayStageKey) => MathematicsDetailedStrandWorkspace;

const STAGE_TITLES: Record<PathwayStageKey, string> = {
  "foundation-kindergarten": "Foundation / Kindergarten",
  "lower-primary": "Lower Primary",
  "middle-primary": "Middle Primary",
  "upper-elementary": "Upper Elementary",
  "upper-primary": "Upper Primary",
  "lower-secondary": "Lower Secondary",
  "years-9-10-consolidation": "Years 9-10 / consolidation",
};

function buildEnglishStep(step: EnglishStepInput) {
  return {
    id: step.id,
    stepKey: step.stepKey,
    title: step.title,
    meaning: step.meaning,
    skillFocus: step.skillFocus,
    learningIntention:
      step.learningIntention ||
      `Develop ${step.skillFocus} through meaningful reading, discussion, speaking, writing, and reflection.`,
    successCriteria: step.successCriteria || [
      "The learner can use this skill in a familiar English task.",
      "The learner can explain, show, or demonstrate what is working.",
      "The learner can respond to questions, feedback, or reflection about the task.",
    ],
    practiceActivity: step.practiceActivity,
    evidenceExamples: step.evidenceExamples,
    assessmentCheck:
      step.assessmentCheck ||
      "Later, check whether the learner can use this more independently and explain the thinking behind it.",
    nextStep: step.nextStep,
    reportLanguage: step.reportLanguage,
  };
}

function buildEnglishWorkspace(
  currentFocusStageKey: PathwayStageKey,
  config: EnglishStrandConfig,
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
      steps: stage.steps.map(buildEnglishStep),
    })),
    portfolioSupport: config.portfolioSupport,
    reportingSupport: config.reportingSupport,
  };
}

export const DEFAULT_ENGLISH_STRAND_KEY = "morphology-and-spelling";

export const ENGLISH_SUBJECT_OVERVIEW = {
  eyebrow: "English F-10 / K-10 strand map",
  title: "English pathway overview",
  description:
    "This first English build shows reading, writing, speaking, spelling, grammar, vocabulary, literature, and research/media as connected strands. Each strand uses the same calm stage-based pathway workspace as Mathematics.",
  helper:
    "Choose one strand to explore. The selected strand opens in the focused workspace below, so English stays guided and readable rather than turning into a curriculum wall.",
};

export const ENGLISH_DOMAIN_CARDS: SubjectStrandCard[] = [
  {
    key: "morphology-and-spelling",
    title: "Morphology & Spelling",
    description:
      "Build word knowledge through meaningful prefixes, suffixes, base words, spelling patterns, and vocabulary connections.",
    whyItMatters:
      "Morphology helps learners see how words are built, which supports spelling, reading, vocabulary, and stronger writing.",
    status: "first-detailed",
  },
  {
    key: "reading-and-comprehension",
    title: "Reading and comprehension",
    description: "Build decoding, fluency, understanding, inference, text comparison, and independent reading confidence.",
    whyItMatters:
      "Reading builds the foundation for learning across every subject and supports discussion, writing, research, and interpretation.",
    status: "detailed",
  },
  {
    key: "writing-and-composition",
    title: "Writing and composition",
    description: "Develop message-making, sentence writing, drafting, revising, and purposeful text creation.",
    whyItMatters:
      "Writing helps learners communicate clearly, organise thinking, and create meaningful records of learning and reflection.",
    status: "detailed",
  },
  {
    key: "speaking-and-listening",
    title: "Speaking and listening",
    description: "Strengthen conversation, retelling, explanation, discussion, presentation, and listening for meaning.",
    whyItMatters:
      "Speaking and listening supports comprehension, relationships, confidence, discussion, and later writing quality.",
    status: "detailed",
  },
  {
    key: "spelling-and-word-study",
    title: "Spelling and word study",
    description: "Build sound-letter knowledge, phonics, patterns, morphology, spelling strategies, and word awareness.",
    whyItMatters:
      "Spelling and word study supports reading, writing, vocabulary growth, and confidence with language patterns.",
    status: "detailed",
  },
  {
    key: "grammar-punctuation-and-language",
    title: "Grammar, punctuation and language",
    description: "Develop sentence control, punctuation, tense, cohesion, and language choices for clarity and effect.",
    whyItMatters:
      "Grammar and punctuation supports clearer reading, stronger writing, and more thoughtful language use.",
    status: "detailed",
  },
  {
    key: "vocabulary-and-word-meaning",
    title: "Vocabulary and word meaning",
    description: "Grow oral vocabulary, word knowledge, context understanding, figurative language, and precise word choice.",
    whyItMatters:
      "Vocabulary connects reading, writing, speaking, comprehension, and confidence across every subject.",
    status: "detailed",
  },
  {
    key: "literature-and-text-response",
    title: "Literature and text response",
    description: "Explore stories, poems, themes, character, author choices, and thoughtful personal and comparative response.",
    whyItMatters:
      "Literature response strengthens comprehension, empathy, interpretation, and richer engagement with texts.",
    status: "detailed",
  },
  {
    key: "research-media-and-digital-texts",
    title: "Research, media and digital texts",
    description: "Find information, take notes, evaluate sources, interpret media, and create digital or multimodal texts.",
    whyItMatters:
      "Research and media work connects reading, writing, speaking, digital literacy, and evidence-based communication.",
    status: "detailed",
  },
];

const MORPHOLOGY_AND_SPELLING: EnglishStrandConfig = {
  key: "morphology-and-spelling",
  title: "Morphology & Spelling",
  subtitle:
    "Morphology & Spelling helps learners understand how meaningful word parts shape spelling, vocabulary, reading, and writing. This first pathway unit begins with the prefix re-.",
  relationshipTitle: "What this pathway builds on",
  relationshipCopy:
    "This pathway builds on sound-letter knowledge, spelling patterns, reading, and oral vocabulary. It connects spelling choices to word meaning so learners can use word parts deliberately.",
  stages: [
    {
      key: "upper-elementary",
      helper:
        "Upper Elementary morphology work focuses on meaningful word parts such as prefixes, suffixes, and base words, and how these parts help learners spell, read, and use vocabulary more confidently.",
      steps: [
        {
          id: 1,
          stepKey: "u001-prefix-re",
          title: "Prefix re-",
          meaning:
            "Understand that the prefix re- usually means again.",
          skillFocus: "using the prefix re- to build and understand words",
          learningIntention:
            "Today I am learning that the prefix re- usually means again.",
          successCriteria: [
            "The learner can explain that re- usually means again.",
            "The learner can build and read re- words.",
            "The learner can use a re- word meaningfully in writing or discussion.",
          ],
          practiceActivity:
            "Use the Prefix re- worksheet sections: Learn the Meaning, Build the Word, Read and Notice, Word Detective, Sort the Words, Use It in Writing, Parent check, and Capture idea.",
          evidenceExamples: [
            "a completed Prefix re- worksheet",
            "a learner explanation of a re- word found in a book or around the home",
            "a sentence or short writing sample using a re- word correctly",
          ],
          assessmentCheck:
            "Use the worksheet's Parent check section to discuss whether the learner can explain and use re- words meaningfully.",
          nextStep:
            "Later morphology units can build from re- into other prefixes, suffixes, and base-word patterns.",
          reportLanguage:
            "The learner is beginning to use morphology to understand that the prefix re- usually means again and can connect this word part to spelling, vocabulary, reading, and writing.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Add the completed Prefix re- worksheet or a short learner explanation to Portfolio so the morphology work is visible as English learning evidence.",
    "A photo, sentence sample, or parent note about a re- word found in reading can show how the learner transferred the word part into real use.",
  ],
  reportingSupport: [
    "Reporting can note that the learner is building morphology and spelling awareness by using the prefix re- to understand and create words.",
    "Evidence is strongest when it shows both word-building and meaningful use in reading, speech, or writing.",
  ],
};

const READING_AND_COMPREHENSION: EnglishStrandConfig = {
  key: "reading-and-comprehension",
  title: "Reading and comprehension",
  subtitle:
    "Reading and comprehension grows from sound awareness and decoding into fluent, thoughtful, independent reading. It builds meaning-making, inference, text analysis, and comparison across a wide range of texts.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on oral language, phonemic awareness, vocabulary, and word study. It connects strongly to writing, literature response, research, and learning across every subject.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early reading begins with listening closely to sounds, enjoying stories, recognising print, and connecting spoken language to books and simple text.",
      steps: [
        {
          id: 1,
          title: "Notice sounds, rhyme, and oral patterns in language",
          meaning:
            "Listen for sound patterns, rhyme, and simple changes in spoken words as a foundation for later decoding.",
          skillFocus: "phonemic awareness and careful listening",
          practiceActivity:
            "Play rhyme games, clap syllables, spot beginning sounds, and retell favourite story phrases during read-aloud time.",
          evidenceExamples: [
            "a parent note about sound play or rhyme recognition",
            "a short oral retelling of a repeated story pattern",
            "a simple record of beginning-sound awareness in a game or song",
          ],
          nextStep:
            "Build on this sound awareness by linking spoken language to print and simple picture-book meaning.",
          reportLanguage:
            "The learner is building early reading foundations through careful listening, rhyme awareness, and growing interest in spoken language patterns.",
        },
        {
          id: 2,
          title: "Connect stories, pictures, and print meaningfully",
          meaning:
            "Use picture books, shared reading, and environmental print to understand that print carries meaning.",
          skillFocus: "early print awareness and story meaning",
          practiceActivity:
            "Read picture books together, track print with a finger, notice labels and signs, and ask what the story or page seems to say.",
          evidenceExamples: [
            "a parent note about how the learner talked about a story or picture book",
            "a photo of shared reading or environmental print noticing",
            "a short oral explanation of what a page, sign, or label means",
          ],
          nextStep:
            "Carry this into early decoding, high-frequency word noticing, and simple comprehension talk.",
          reportLanguage:
            "The learner is growing in awareness that print carries meaning and is beginning to connect stories, pictures, and words more confidently.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin decoding more deliberately, building fluency with simple texts and answering straightforward questions about what they have read or heard.",
      steps: [
        {
          id: 1,
          title: "Decode simple words and read familiar texts with support",
          meaning:
            "Use sound-letter knowledge, pattern noticing, and repeated reading to work through simple texts.",
          skillFocus: "decoding and early reading fluency",
          practiceActivity:
            "Read decodable books, practise high-frequency words, revisit familiar texts, and talk through how unknown words were worked out.",
          evidenceExamples: [
            "a parent note about decoding strategies used",
            "a short reading sample from a familiar text",
            "annotated word work showing how a tricky word was solved",
          ],
          nextStep:
            "Use growing fluency to free up more attention for understanding and retelling.",
          reportLanguage:
            "The learner is building confidence with decoding and is beginning to read familiar texts more smoothly and purposefully.",
        },
        {
          id: 2,
          title: "Retell and answer simple comprehension questions",
          meaning:
            "Show understanding by retelling key events, naming ideas, and responding to direct questions.",
          skillFocus: "literal comprehension and retelling",
          practiceActivity:
            "Pause during reading to ask who, what, where, and why questions, and invite the learner to retell a short text in their own words.",
          evidenceExamples: [
            "a retelling note or audio clip",
            "a parent summary of comprehension responses",
            "a simple drawing or sequence showing key events from a text",
          ],
          nextStep:
            "Build from literal retelling toward prediction, inference, and comparing texts.",
          reportLanguage:
            "The learner is increasingly able to retell familiar texts and respond to simple comprehension questions with growing clarity.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Reading becomes more fluent and meaning-focused here, with growing attention to inference, vocabulary in context, and how ideas connect across a text.",
      steps: [
        {
          id: 1,
          title: "Read with improving fluency and monitor for meaning",
          meaning:
            "Read more smoothly while noticing when meaning breaks down and a fix-up strategy is needed.",
          skillFocus: "fluency and self-monitoring for comprehension",
          practiceActivity:
            "Use repeated reading, paired reading, and short independent reading followed by discussion about confusing or important parts.",
          evidenceExamples: [
            "a parent note about fluency and self-correction",
            "a short reading conference summary",
            "a learner explanation of how meaning was checked during reading",
          ],
          nextStep:
            "Use growing fluency to make deeper inferences and notice author choices more clearly.",
          reportLanguage:
            "The learner is reading with improving fluency and is becoming more aware of when meaning needs to be checked or repaired.",
        },
        {
          id: 2,
          title: "Use evidence from the text to infer and explain",
          meaning:
            "Go beyond direct statements by using clues, context, and prior knowledge to work out what the text suggests.",
          skillFocus: "inference and text-based explanation",
          practiceActivity:
            "Discuss character feelings, implied information, or likely outcomes and ask what clues in the text support the idea.",
          evidenceExamples: [
            "a learner explanation using clues from the text",
            "a parent note from an inference discussion",
            "annotated reading notes showing evidence for an idea or prediction",
          ],
          nextStep:
            "Carry this into upper-primary text comparison, analysis, and more independent interpretation.",
          reportLanguage:
            "The learner is becoming more confident in using clues from the text to infer meaning and explain ideas beyond the directly stated information.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now read more independently across text types, compare texts, and think more carefully about structure, viewpoint, and author choices.",
      steps: [
        {
          id: 1,
          title: "Compare ideas, structure, and viewpoint across texts",
          meaning:
            "Notice how two texts may approach a topic, event, or theme differently and explain what changes.",
          skillFocus: "text comparison and analytical comprehension",
          practiceActivity:
            "Read two texts on a similar topic, then compare the ideas, tone, structure, or point of view in discussion or notes.",
          evidenceExamples: [
            "a comparison note or response",
            "a learner explanation of how two texts differ",
            "a parent summary of a text-comparison discussion",
          ],
          nextStep:
            "Use these comparisons to support stronger analysis and independent reading response.",
          reportLanguage:
            "The learner is increasingly able to compare texts and explain how ideas, structure, or viewpoint change across different reading experiences.",
        },
        {
          id: 2,
          title: "Use strategies independently to understand richer texts",
          meaning:
            "Apply prediction, questioning, summarising, and re-reading more independently when texts become denser or more demanding.",
          skillFocus: "independent comprehension strategy use",
          practiceActivity:
            "Set independent reading goals, pause for summary notes, and ask the learner to explain which strategy helped when a text became more complex.",
          evidenceExamples: [
            "reading journal notes or summaries",
            "a learner reflection on a strategy that helped",
            "a parent note about independent reading stamina or problem solving",
          ],
          nextStep:
            "Build into lower-secondary interpretation, evidence-based analysis, and stronger text response.",
          reportLanguage:
            "The learner is becoming more independent in using comprehension strategies to understand richer texts and explain how those strategies support meaning.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens interpretation, evidence use, and analysis across literary and factual texts, with growing independence and critical reading.",
      steps: [
        {
          id: 1,
          title: "Analyse how texts shape meaning and response",
          meaning:
            "Look at structure, language, viewpoint, and evidence to explain how a text creates meaning or influence.",
          skillFocus: "text analysis and interpretation",
          practiceActivity:
            "Discuss an article, speech, short story, or chapter and ask how the writer shaped the reader's understanding or reaction.",
          evidenceExamples: [
            "an analytical reading response",
            "a learner explanation of how a text created an effect",
            "a parent note from a deeper text discussion",
          ],
          nextStep:
            "Use this analysis to support stronger comparison, research reading, and literature response.",
          reportLanguage:
            "The learner is developing more mature text analysis and can increasingly explain how structure and language shape meaning and response.",
        },
        {
          id: 2,
          title: "Read critically and support ideas with evidence",
          meaning:
            "Use quotations, examples, and careful reasoning to justify an interpretation or response.",
          skillFocus: "critical reading and evidence-based explanation",
          practiceActivity:
            "Discuss what a text suggests, what evidence supports that idea, and whether another interpretation could also make sense.",
          evidenceExamples: [
            "annotated text evidence",
            "a written or oral evidence-based response",
            "a learner explanation showing how evidence supported a conclusion",
          ],
          nextStep:
            "Carry this into later text comparison, synthesis, and independent interpretation across subjects.",
          reportLanguage:
            "The learner is increasingly able to read critically and support interpretations with relevant evidence from the text.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together independence, comparison, synthesis, and thoughtful critique so reading supports mature learning across subjects and real contexts.",
      steps: [
        {
          id: 1,
          title: "Sustain independent reading across varied texts",
          meaning:
            "Read more complex texts with growing stamina, independence, and flexibility across genres and purposes.",
          skillFocus: "independent reading and text adaptability",
          practiceActivity:
            "Use novels, essays, articles, speeches, and informational texts, then reflect on how reading approaches changed between text types.",
          evidenceExamples: [
            "independent reading log or reflection",
            "a learner explanation of how reading changed across text types",
            "a parent note about growing independence with complex reading",
          ],
          nextStep:
            "Use independent reading strength to support stronger synthesis and critique across multiple sources.",
          reportLanguage:
            "The learner is consolidating independent reading habits across varied texts and can increasingly adapt reading strategies to suit purpose and text type.",
        },
        {
          id: 2,
          title: "Synthesize and critique ideas across texts",
          meaning:
            "Bring together ideas from more than one text, compare viewpoints, and evaluate the strength of different interpretations or claims.",
          skillFocus: "synthesis, critique, and comparative reading",
          practiceActivity:
            "Read two or more texts on a common theme or issue and discuss where they agree, differ, or invite different interpretations.",
          evidenceExamples: [
            "a comparative reading response",
            "a learner critique of differing viewpoints",
            "a parent summary of a synthesis discussion",
          ],
          nextStep:
            "These habits continue to support research, literature study, writing, and mature learning across the wider pathway system.",
          reportLanguage:
            "The learner is strengthening the ability to synthesise and critique ideas across texts and communicate thoughtful interpretations with growing maturity.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one reading record or retelling example from an earlier stage and one later evidence-based response so growth from decoding into interpretation is visible.",
    "Short learner reflections about a strategy, book, or text comparison can strengthen the portfolio because they show how comprehension is developing.",
    "Independent reading notes, annotated texts, and discussion summaries often provide stronger evidence than isolated quizzes alone.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in fluency, understanding, inference, and evidence-based response rather than only the difficulty level of texts read.",
    "Examples are often strongest when the learner explains what a text means, what clues supported an idea, and how interpretation has become more confident over time.",
    "Collected evidence can show a shift from listening and retelling toward independent reading, analysis, comparison, and critical response.",
  ],
};

const WRITING_AND_COMPOSITION: EnglishStrandConfig = {
  key: "writing-and-composition",
  title: "Writing and composition",
  subtitle:
    "Writing and composition grows from drawing and message-making into planning, drafting, revising, and shaping purposeful texts. It builds clear communication, reflective thinking, and confidence with narrative, informative, persuasive, and personal writing.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on speaking and listening, reading, vocabulary, spelling, and grammar. It connects strongly to reporting, reflection, research, and communicating learning across every subject.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early writing begins with marks, drawings, oral storytelling, and short written messages that carry meaning.",
      steps: [
        {
          id: 1,
          title: "Draw, dictate, and make marks to share meaning",
          meaning:
            "Use pictures, marks, labels, and oral explanation to communicate an idea, story, or message.",
          skillFocus: "early message-making and written meaning",
          practiceActivity:
            "Invite drawing-and-dictation, labelled pictures, short notes, or family-made books and ask the learner to explain what the message says.",
          evidenceExamples: [
            "a drawing with dictated meaning",
            "a photo of early writing or labelling",
            "a parent note about what the learner intended to communicate",
          ],
          nextStep:
            "Build on this by linking sounds, letters, and words more deliberately in simple written messages.",
          reportLanguage:
            "The learner is using drawing, marks, and early writing to communicate meaning and is beginning to see that written texts can carry a message.",
        },
        {
          id: 2,
          title: "Tell a simple story or message before writing",
          meaning:
            "Use oral language to shape an idea before it is written down or partly recorded.",
          skillFocus: "oral rehearsal for writing",
          practiceActivity:
            "Retell a personal event, make up a short story, or talk through a message first, then help the learner capture part of it in print.",
          evidenceExamples: [
            "a short oral story summary linked to writing",
            "a parent note about how the learner rehearsed the message",
            "a simple drawing-to-writing sequence",
          ],
          nextStep:
            "Carry this oral rehearsal into lower-primary sentence writing and simple sequencing.",
          reportLanguage:
            "The learner is growing in confidence when using oral language to shape simple stories and messages before recording them in writing.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin writing clearer sentences and short linked ideas, using oral rehearsal, simple planning, and familiar text patterns.",
      steps: [
        {
          id: 1,
          title: "Write simple sentences for a clear purpose",
          meaning:
            "Use known words, phonics, and familiar sentence patterns to record a message, idea, or short event.",
          skillFocus: "sentence writing and purpose",
          practiceActivity:
            "Write captions, simple recounts, short stories, or messages linked to family life, books, or practical experiences.",
          evidenceExamples: [
            "a short written message or recount",
            "a learner explanation of what the writing was meant to say",
            "a parent note about growing independence in sentence writing",
          ],
          nextStep:
            "Build from single sentences into linked ideas, sequencing, and early planning.",
          reportLanguage:
            "The learner is beginning to write simple sentences for a clear purpose and is growing in confidence when recording familiar ideas independently.",
        },
        {
          id: 2,
          title: "Sequence ideas in a short text",
          meaning:
            "Put ideas in a sensible order so the writing can be followed more easily by a reader.",
          skillFocus: "simple sequencing and text organisation",
          practiceActivity:
            "Write short stories, recounts, or how-to pieces with a beginning, middle, and end or a simple ordered sequence.",
          evidenceExamples: [
            "a short text showing sequence",
            "a planning sketch or oral rehearsal note",
            "a parent summary of how the learner ordered ideas",
          ],
          nextStep:
            "Carry this into paragraphing, drafting, and genre awareness in middle-primary writing.",
          reportLanguage:
            "The learner is increasingly able to sequence ideas in short writing pieces so the message is easier to follow.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Writing becomes more deliberate here through planning, paragraphing, genre awareness, and clearer revision for meaning and reader understanding.",
      steps: [
        {
          id: 1,
          title: "Plan and draft short texts with clearer structure",
          meaning:
            "Use notes, organisers, or oral rehearsal to shape a text before and during drafting.",
          skillFocus: "planning and drafting",
          practiceActivity:
            "Use simple plans for stories, information reports, letters, or reflections, then turn those notes into a draft with linked paragraphs or sections.",
          evidenceExamples: [
            "a short plan linked to a draft",
            "a learner explanation of how the plan supported the writing",
            "a parent note about growing structure in drafting",
          ],
          nextStep:
            "Use planning to support stronger revision for clarity, detail, and reader understanding.",
          reportLanguage:
            "The learner is beginning to plan and draft writing more deliberately and is showing growing control over text structure and organisation.",
        },
        {
          id: 2,
          title: "Revise writing for detail and clarity",
          meaning:
            "Look back at a draft and improve it so the meaning is clearer, richer, or better matched to the purpose.",
          skillFocus: "revision and reader awareness",
          practiceActivity:
            "Re-read a draft together, add missing detail, change wording, or move ideas so the writing becomes clearer for a reader.",
          evidenceExamples: [
            "a before-and-after revision example",
            "a learner reflection on what was improved",
            "a parent note about revision choices made",
          ],
          nextStep:
            "Build toward upper-primary editing, genre control, and stronger voice across different writing purposes.",
          reportLanguage:
            "The learner is becoming more willing to revise writing for clarity and detail and is beginning to think more carefully about the needs of the reader.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now shape writing more deliberately for genre, voice, audience, and effect, while strengthening revision and editing habits.",
      steps: [
        {
          id: 1,
          title: "Write for different text types and audiences",
          meaning:
            "Adjust writing choices to suit narrative, persuasive, informative, or reflective purposes.",
          skillFocus: "genre choice and audience awareness",
          practiceActivity:
            "Write a story, explanation, persuasive response, or reflection and discuss how the writing changes depending on who it is for and what it needs to do.",
          evidenceExamples: [
            "two contrasting text types by the learner",
            "a learner explanation of audience or purpose choices",
            "a parent note about growing genre awareness",
          ],
          nextStep:
            "Use this purpose awareness to strengthen revision, editing, and control of style.",
          reportLanguage:
            "The learner is increasingly able to shape writing for different purposes and audiences and can explain how those choices affect the final text.",
        },
        {
          id: 2,
          title: "Edit writing for clarity, accuracy, and flow",
          meaning:
            "Review a draft carefully for sentence flow, spelling, punctuation, and meaning before treating it as complete.",
          skillFocus: "editing and polishing writing",
          practiceActivity:
            "Use checklists, peer-style discussion, or self-review to improve wording, punctuation, spelling, and cohesion in a developed draft.",
          evidenceExamples: [
            "an edited draft with visible changes",
            "a learner reflection on what was improved in editing",
            "a parent note about increasing editing independence",
          ],
          nextStep:
            "Carry this into lower-secondary control of argument, style, evidence, and mature drafting habits.",
          reportLanguage:
            "The learner is becoming more confident in editing writing for clarity, accuracy, and flow and is showing stronger ownership of the final piece.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens control of structure, style, argument, reflection, and evidence so writing can communicate more mature thinking across purposes.",
      steps: [
        {
          id: 1,
          title: "Develop and support ideas in sustained writing",
          meaning:
            "Write with clearer control over paragraphs, support, explanation, and cohesion across a longer piece.",
          skillFocus: "sustained composition and idea development",
          practiceActivity:
            "Draft essays, reflective responses, extended stories, or structured explanations where each section develops the main idea more fully.",
          evidenceExamples: [
            "a sustained written response",
            "a learner explanation of how ideas were developed",
            "a parent note about stronger paragraph control or cohesion",
          ],
          nextStep:
            "Build this into more deliberate evidence use, tone, and stylistic control.",
          reportLanguage:
            "The learner is developing more control over sustained writing and can increasingly build and support ideas across a longer piece of composition.",
        },
        {
          id: 2,
          title: "Revise for style, evidence, and effect",
          meaning:
            "Improve how a piece sounds, persuades, informs, or reflects by making more deliberate language and structural choices.",
          skillFocus: "mature revision for purpose and effect",
          practiceActivity:
            "Rework a draft to strengthen argument, explanation, imagery, tone, or supporting evidence, then discuss what changed and why.",
          evidenceExamples: [
            "a revision comparison showing stronger effect",
            "a learner reflection on stylistic or structural changes",
            "a parent note about revision for purpose rather than only correctness",
          ],
          nextStep:
            "Carry this into later independent writing, cross-subject communication, and more mature authorial control.",
          reportLanguage:
            "The learner is increasingly able to revise writing for style, evidence, and effect and can explain how those changes improve the final communication.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together independence, flexibility, and mature voice so writing can serve reflection, argument, information, creativity, and wider learning.",
      steps: [
        {
          id: 1,
          title: "Write independently across varied purposes",
          meaning:
            "Use writing more confidently across narrative, analytical, informative, persuasive, and reflective contexts with less scaffolding.",
          skillFocus: "independent composition across purposes",
          practiceActivity:
            "Develop longer pieces across different genres and reflect on how planning, structure, tone, and evidence shifted between them.",
          evidenceExamples: [
            "a set of varied writing samples",
            "a learner reflection on writing choices across genres",
            "a parent note about increasing independence and control",
          ],
          nextStep:
            "Use independent writing strength to support research, reporting, literature response, and wider subject communication.",
          reportLanguage:
            "The learner is consolidating independent writing across varied purposes and can increasingly adapt structure, tone, and detail to suit the task.",
        },
        {
          id: 2,
          title: "Refine voice, precision, and final communication",
          meaning:
            "Shape the final writing so it is purposeful, clear, and confident in both content and presentation.",
          skillFocus: "mature authorial control and communication",
          practiceActivity:
            "Polish final drafts, explain key writing decisions, and compare earlier and later versions to show how clarity and voice improved.",
          evidenceExamples: [
            "a polished final piece with earlier draft comparison",
            "a learner explanation of voice or wording choices",
            "a parent note about mature writing habits and refinement",
          ],
          nextStep:
            "These habits continue to support confident communication across research, reporting, creative work, and real-world writing.",
          reportLanguage:
            "The learner is strengthening mature writing habits and can communicate with increasing clarity, precision, and confidence across different forms of composition.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one earlier writing sample and one later revised piece so growth from message-making into drafting, revision, and audience awareness is visible.",
    "A short learner reflection about how a piece changed during revision can strengthen the portfolio because it shows writing decisions, not only the final text.",
    "Drafts, annotated edits, and purposeful finished texts often provide stronger evidence than polished final pieces alone.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in confidence, structure, revision habits, and audience awareness rather than only length or surface accuracy.",
    "Examples are often strongest when the learner explains what the text was trying to do, how it was shaped, and what improved between draft and final version.",
    "Collected evidence can show a shift from early message-making toward sustained, reflective, and audience-aware composition.",
  ],
};

const SPEAKING_AND_LISTENING: EnglishStrandConfig = {
  key: "speaking-and-listening",
  title: "Speaking and listening",
  subtitle:
    "Speaking and listening develops from conversation and retelling into explanation, discussion, presentation, questioning, and respectful response. It supports comprehension, writing, relationships, and confidence across the wider English pathway.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on oral language, attention, and confidence. It supports reading comprehension, writing development, discussion, research, and thoughtful participation across every subject.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early speaking and listening begins with conversation, turn-taking, listening for meaning, and retelling simple ideas from stories and family life.",
      steps: [
        {
          id: 1,
          title: "Join conversations and take turns meaningfully",
          meaning:
            "Use conversation to share ideas, listen to others, and respond in a simple but connected way.",
          skillFocus: "conversation and turn-taking",
          practiceActivity:
            "Use book chats, meal conversations, show-and-tell moments, or guided play discussions and encourage taking turns with a shared topic.",
          evidenceExamples: [
            "a parent note about conversation participation",
            "a short audio or summary of turn-taking in discussion",
            "an observation of how the learner listened and responded to someone else",
          ],
          nextStep:
            "Build on this by retelling simple ideas and listening for key details more deliberately.",
          reportLanguage:
            "The learner is building confidence in conversation and is beginning to take turns, listen, and respond more meaningfully in shared discussion.",
        },
        {
          id: 2,
          title: "Retell a simple story or event aloud",
          meaning:
            "Use spoken language to share the key parts of a story, experience, or explanation in a sequence someone else can follow.",
          skillFocus: "oral retelling and sequencing",
          practiceActivity:
            "Retell picture books, family outings, or simple instructions and ask what happened first, next, and last.",
          evidenceExamples: [
            "a short oral retelling summary",
            "a parent note about sequencing in spoken language",
            "a learner explanation of a familiar event or story",
          ],
          nextStep:
            "Carry this into lower-primary questioning, explanation, and clearer listening for meaning.",
          reportLanguage:
            "The learner is increasingly able to retell familiar stories and events aloud with growing confidence and clearer sequencing.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin asking questions, explaining simple ideas, and listening more carefully for details, instructions, and meaning in shared discussions.",
      steps: [
        {
          id: 1,
          title: "Ask and answer simple questions about ideas",
          meaning:
            "Use spoken questions and responses to clarify meaning, extend understanding, and stay engaged in discussion.",
          skillFocus: "questioning and responsive talk",
          practiceActivity:
            "Pause during reading, projects, or family discussions and ask the learner to pose or answer questions that deepen understanding.",
          evidenceExamples: [
            "a parent note about useful questions or responses",
            "a discussion summary showing question-and-answer exchange",
            "a learner explanation sparked by a clarifying question",
          ],
          nextStep:
            "Build toward fuller spoken explanations and more active listening in shared tasks.",
          reportLanguage:
            "The learner is beginning to ask and answer useful questions in discussion and is growing in confidence when using spoken language to clarify ideas.",
        },
        {
          id: 2,
          title: "Listen for key information and respond appropriately",
          meaning:
            "Pay attention to what is said, notice important details, and respond in a way that shows understanding.",
          skillFocus: "active listening for meaning",
          practiceActivity:
            "Use read-alouds, instructions, family planning talk, or simple interviews and ask the learner to explain the key point afterwards.",
          evidenceExamples: [
            "a parent note about listening and response",
            "a short oral summary of what was heard",
            "an observation of following or restating spoken information",
          ],
          nextStep:
            "Carry this into middle-primary discussion, explanation, and respectful exchange of ideas.",
          reportLanguage:
            "The learner is increasingly able to listen for key meaning and respond in ways that show growing understanding of what has been said.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Speaking and listening becomes more deliberate through explanation, discussion, questioning, and clearer responses to different viewpoints.",
      steps: [
        {
          id: 1,
          title: "Explain ideas clearly in discussion",
          meaning:
            "Use spoken language to share thinking, give reasons, and make an idea understandable to someone else.",
          skillFocus: "spoken explanation and reasoning",
          practiceActivity:
            "Discuss book responses, project choices, practical tasks, or opinions and ask the learner to explain the thinking behind an answer or view.",
          evidenceExamples: [
            "a parent note about spoken explanation quality",
            "a short audio or summary of a learner explanation",
            "an observation of how reasons were given in discussion",
          ],
          nextStep:
            "Build toward more organised presentations and stronger discussion skills in upper-primary work.",
          reportLanguage:
            "The learner is becoming more confident in explaining ideas aloud and is beginning to give clearer reasons for thoughts and decisions in discussion.",
        },
        {
          id: 2,
          title: "Listen respectfully and respond to another viewpoint",
          meaning:
            "Hear another person's idea, consider it, and respond in a connected and respectful way.",
          skillFocus: "discussion listening and respectful response",
          practiceActivity:
            "Use family discussion, shared book talk, or simple debates where the learner must listen first, then respond to what someone else actually said.",
          evidenceExamples: [
            "a parent note about respectful response in discussion",
            "a learner summary of another person's idea before responding",
            "a short reflection on how a viewpoint changed or was considered",
          ],
          nextStep:
            "Carry this into presentations, collaborative discussion, and stronger spoken interpretation.",
          reportLanguage:
            "The learner is increasingly able to listen respectfully to another viewpoint and respond in a more thoughtful and connected way.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now organise spoken ideas more deliberately for presentation, collaboration, and deeper discussion across texts, topics, and projects.",
      steps: [
        {
          id: 1,
          title: "Present an idea or information clearly to others",
          meaning:
            "Organise spoken ideas so a listener can follow the purpose, key points, and conclusion.",
          skillFocus: "spoken presentation and organisation",
          practiceActivity:
            "Present a book recommendation, project summary, how-to explanation, or interest topic and discuss how the presentation was organised.",
          evidenceExamples: [
            "a short spoken presentation or summary",
            "a parent note about organisation and clarity",
            "a learner reflection on what helped the presentation work well",
          ],
          nextStep:
            "Use this organisation to support richer discussion, explanation, and listening across subjects.",
          reportLanguage:
            "The learner is becoming more confident in presenting ideas clearly and organising spoken communication for an audience.",
        },
        {
          id: 2,
          title: "Use discussion to explore and refine ideas",
          meaning:
            "Treat discussion as a way to think more deeply, not only to state an answer quickly.",
          skillFocus: "collaborative discussion and idea refinement",
          practiceActivity:
            "Use shared reading, planning tasks, or opinion questions where the learner builds on another person's idea or revises their own after discussion.",
          evidenceExamples: [
            "a discussion summary showing idea development",
            "a learner explanation of how discussion changed thinking",
            "a parent note about building on others' ideas",
          ],
          nextStep:
            "Carry this into lower-secondary discussion, analysis, and more formal spoken interpretation.",
          reportLanguage:
            "The learner is increasingly able to use discussion to explore and refine ideas rather than simply state an immediate answer.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens presentation, discussion, interpretation, and listening with more maturity, evidence use, and responsiveness to audience and purpose.",
      steps: [
        {
          id: 1,
          title: "Use spoken language to interpret and persuade",
          meaning:
            "Speak with clearer purpose when explaining a text, presenting an idea, or persuading an audience.",
          skillFocus: "purposeful spoken interpretation and persuasion",
          practiceActivity:
            "Present a response to a text, argue for a position, or explain a project decision and discuss how audience and purpose shaped the delivery.",
          evidenceExamples: [
            "a spoken interpretation or persuasive response",
            "a parent note about spoken purpose and audience awareness",
            "a learner reflection on how spoken choices affected the message",
          ],
          nextStep:
            "Build toward later confident speaking across discussion, research, and formal communication contexts.",
          reportLanguage:
            "The learner is developing more purposeful spoken communication and can increasingly shape explanations or arguments for audience and purpose.",
        },
        {
          id: 2,
          title: "Listen critically and respond with evidence",
          meaning:
            "Hear a spoken idea, argument, or explanation and respond with thoughtful reference to what was actually said.",
          skillFocus: "critical listening and evidence-based response",
          practiceActivity:
            "Listen to a talk, debate, podcast clip, or discussion and ask the learner to respond using specific details from what was heard.",
          evidenceExamples: [
            "a listener response summary",
            "a learner explanation of which spoken evidence mattered",
            "a parent note about critical listening during discussion",
          ],
          nextStep:
            "Carry this into later presentations, seminars, interviews, and research communication.",
          reportLanguage:
            "The learner is increasingly able to listen critically and respond with clearer reference to evidence from what was heard.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together mature discussion, presentation, listening, and reflection so spoken communication supports learning, interpretation, and leadership across contexts.",
      steps: [
        {
          id: 1,
          title: "Speak with increasing maturity across contexts",
          meaning:
            "Adapt spoken communication more flexibly for discussion, presentation, interview, collaboration, and reflective settings.",
          skillFocus: "adaptable and mature spoken communication",
          practiceActivity:
            "Use presentations, interviews, discussion leadership, or reflective speaking and compare how tone, structure, and detail changed across contexts.",
          evidenceExamples: [
            "a later-stage presentation or discussion role",
            "a learner reflection on adapting spoken communication",
            "a parent note about growing maturity in speaking contexts",
          ],
          nextStep:
            "Use this flexibility to support research, literature response, writing, and real-world communication.",
          reportLanguage:
            "The learner is consolidating adaptable spoken communication and can increasingly shape delivery to suit different contexts and purposes.",
        },
        {
          id: 2,
          title: "Reflect on discussion, listening, and spoken impact",
          meaning:
            "Review how spoken communication affected understanding, relationships, and the clarity of shared thinking.",
          skillFocus: "reflective speaking and listening habits",
          practiceActivity:
            "After a discussion, presentation, or collaborative task, ask what helped communication work well and what could be improved next time.",
          evidenceExamples: [
            "a reflection on a speaking or listening task",
            "a learner critique of their own spoken communication",
            "a parent note about mature listening and reflection habits",
          ],
          nextStep:
            "These habits continue to support confident communication, leadership, and thoughtful collaboration across learning and life.",
          reportLanguage:
            "The learner is strengthening reflective speaking and listening habits and can increasingly evaluate the impact of spoken communication on understanding and collaboration.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early retelling or discussion example and one later presentation or evidence-based response so spoken-language growth is visible over time.",
    "Short parent notes, audio clips, and learner reflections often provide stronger evidence here than formal transcripts alone.",
    "Book talk, project explanation, discussion summaries, and presentation notes often make excellent portfolio evidence because the reasoning is audible and visible.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in confidence, listening, explanation, respectful response, and audience awareness across different speaking contexts.",
    "Examples are strongest when the learner explains an idea clearly, responds thoughtfully to another viewpoint, or reflects on how communication changed understanding.",
    "Collected evidence can show a shift from simple retelling toward organised presentation, discussion, and critical listening.",
  ],
};

const ADDITIONAL_FOUNDATIONAL_WORD_BUILDER_STEPS: EnglishStepInput[] = [
  {
    id: 10,
    stepKey: "kf-u007-short-vowel-o",
    title: "Short Vowel O",
    meaning: "Hear, read, and spell short /o/ in simple CVC words.",
    skillFocus: "short /o/ phonics in CVC words",
    learningIntention: "Today I am learning to hear and use short /o/ in simple words.",
    successCriteria: ["I can hear short /o/ in a simple word.", "I can read or spell a simple CVC word with short /o/."],
    practiceActivity: "Read, build, and spell simple CVC words that use the short /o/ sound.",
    evidenceExamples: ["the completed Short Vowel O worksheet", "a short CVC word-reading or spelling sample", "a parent note about hearing short /o/"],
    assessmentCheck: "Ask the learner to read or build several familiar short /o/ CVC words.",
    nextStep: "Compare short /o/ with other short vowels while reading and building CVC words.",
    reportLanguage: "The learner is beginning to hear, read, and spell short /o/ in simple CVC words.",
  },
  {
    id: 11,
    stepKey: "kf-u008-short-vowel-u",
    title: "Short Vowel U",
    meaning: "Hear, read, and spell short /u/ in simple CVC words.",
    skillFocus: "short /u/ phonics in CVC words",
    learningIntention: "Today I am learning to hear and use short /u/ in simple words.",
    successCriteria: ["I can hear short /u/ in a simple word.", "I can read or spell a simple CVC word with short /u/."],
    practiceActivity: "Read, build, and spell simple CVC words that use the short /u/ sound.",
    evidenceExamples: ["the completed Short Vowel U worksheet", "a short CVC word-reading or spelling sample", "a parent note about hearing short /u/"],
    assessmentCheck: "Ask the learner to read or build several familiar short /u/ CVC words.",
    nextStep: "Compare short /u/ with other short vowels while reading and building CVC words.",
    reportLanguage: "The learner is beginning to hear, read, and spell short /u/ in simple CVC words.",
  },
  {
    id: 12,
    stepKey: "kf-u009-short-vowel-e",
    title: "Short Vowel E",
    meaning: "Hear, read, and spell short /e/ in simple CVC words.",
    skillFocus: "short /e/ phonics in CVC words",
    learningIntention: "Today I am learning to hear and use short /e/ in simple words.",
    successCriteria: ["I can hear short /e/ in a simple word.", "I can read or spell a simple CVC word with short /e/."],
    practiceActivity: "Read, build, and spell simple CVC words that use the short /e/ sound.",
    evidenceExamples: ["the completed Short Vowel E worksheet", "a short CVC word-reading or spelling sample", "a parent note about hearing short /e/"],
    assessmentCheck: "Ask the learner to read or build several familiar short /e/ CVC words.",
    nextStep: "Compare short /e/ with other short vowels while reading and building CVC words.",
    reportLanguage: "The learner is beginning to hear, read, and spell short /e/ in simple CVC words.",
  },
  {
    id: 13,
    stepKey: "kf-u010-cvc-word-practice",
    title: "CVC Word Practice",
    meaning: "Blend sounds to read and spell a growing range of simple CVC words.",
    skillFocus: "CVC word blending and spelling practice",
    learningIntention: "Today I am learning to use sound-by-sound strategies with simple CVC words.",
    successCriteria: ["I can blend sounds to read a simple CVC word.", "I can use the sounds to spell a simple CVC word."],
    practiceActivity: "Build, read, and write simple CVC words, checking each sound as you work.",
    evidenceExamples: ["the completed CVC Word Practice worksheet", "a short CVC reading or spelling sample", "a parent note about blending strategy use"],
    assessmentCheck: "Ask the learner to read and spell several unfamiliar but regular CVC words.",
    nextStep: "Use CVC words in matching, writing, and short sentence activities.",
    reportLanguage: "The learner is practising sound-by-sound blending and spelling with simple CVC words.",
  },
  {
    id: 14,
    stepKey: "kf-u012-cvc-word-write",
    title: "CVC Word Write",
    meaning: "Use sound knowledge to write simple CVC words.",
    skillFocus: "CVC word spelling and early writing",
    learningIntention: "Today I am learning to write simple CVC words by listening for each sound.",
    successCriteria: ["I can listen for the sounds in a CVC word.", "I can write letters in the order I hear the sounds."],
    practiceActivity: "Say simple CVC words slowly, map each sound to a letter, and write the complete word.",
    evidenceExamples: ["the completed CVC Word Write worksheet", "a short dictated CVC word sample", "a parent note about sound-to-letter writing"],
    assessmentCheck: "Dictate several regular CVC words and ask the learner to write them independently.",
    nextStep: "Read and connect written CVC words with pictures, meanings, and short text.",
    reportLanguage: "The learner is using sound-to-letter knowledge to write simple CVC words.",
  },
  {
    id: 15,
    stepKey: "kf-u013-cvc-word-read-and-colour",
    title: "CVC Word Read and Colour",
    meaning: "Read simple CVC words and show understanding by matching them to pictures or actions.",
    skillFocus: "CVC word reading and meaning recognition",
    learningIntention: "Today I am learning to read CVC words and connect them with meaning.",
    successCriteria: ["I can blend sounds to read a CVC word.", "I can choose the picture or action that matches the word."],
    practiceActivity: "Read each CVC word carefully, blend the sounds, and colour or select the matching picture.",
    evidenceExamples: ["the completed CVC Word Read and Colour worksheet", "a short CVC reading sample", "a parent note about word-to-picture matching"],
    assessmentCheck: "Show several regular CVC words and ask the learner to read and match them without prompting.",
    nextStep: "Use CVC words in short phrases and sentences.",
    reportLanguage: "The learner is connecting accurate CVC word reading with picture and meaning recognition.",
  },
  {
    id: 16,
    stepKey: "kf-u014-cvc-word-sentences",
    title: "CVC Word Sentences",
    meaning: "Read and use simple sentences containing familiar CVC words.",
    skillFocus: "CVC words in simple sentence reading",
    learningIntention: "Today I am learning to use CVC words when reading a simple sentence.",
    successCriteria: ["I can read familiar CVC words in a sentence.", "I can show what the sentence means."],
    practiceActivity: "Read short sentences aloud, blend unfamiliar CVC words, and talk about what each sentence means.",
    evidenceExamples: ["the completed CVC Word Sentences worksheet", "a short sentence-reading sample", "a parent note about reading for meaning"],
    assessmentCheck: "Ask the learner to read several short sentences and explain or demonstrate their meaning.",
    nextStep: "Build fluency by spotting and writing familiar CVC words in connected text.",
    reportLanguage: "The learner is beginning to read familiar CVC words in simple sentences and connect text with meaning.",
  },
  {
    id: 17,
    stepKey: "kf-u015-cvc-word-spot-and-write",
    title: "CVC Word Spot and Write",
    meaning: "Find familiar CVC words and write them accurately.",
    skillFocus: "CVC word recognition and writing",
    learningIntention: "Today I am learning to spot and write familiar CVC words.",
    successCriteria: ["I can find a familiar CVC word.", "I can write the word with its sounds in order."],
    practiceActivity: "Spot target CVC words in a group, read them aloud, and write them carefully.",
    evidenceExamples: ["the completed CVC Word Spot and Write worksheet", "a written CVC word sample", "a parent note about word recognition"],
    assessmentCheck: "Ask the learner to find and write several target CVC words among familiar words.",
    nextStep: "Read and write CVC words with increasing fluency and independence.",
    reportLanguage: "The learner is recognising familiar CVC words and writing them with growing accuracy.",
  },
  {
    id: 18,
    stepKey: "kf-u016-cvc-word-practice",
    title: "CVC Word Practice",
    meaning: "Build fluency reading and spelling simple CVC words across repeated practice.",
    skillFocus: "CVC word fluency",
    learningIntention: "Today I am learning to read and spell familiar CVC words more confidently.",
    successCriteria: ["I can read familiar CVC words with less hesitation.", "I can spell familiar CVC words by checking each sound."],
    practiceActivity: "Revisit, read, sort, and write familiar CVC words using games, short practice, and retrieval.",
    evidenceExamples: ["the completed CVC Word Practice worksheet", "a brief fluency or spelling sample", "a parent note about growing confidence"],
    assessmentCheck: "Ask the learner to read and spell a mixed set of familiar CVC words with decreasing support.",
    nextStep: "Use fluent CVC word knowledge while reading short texts and writing simple messages.",
    reportLanguage: "The learner is building confidence and fluency when reading and spelling familiar CVC words.",
  },
  {
    id: 19,
    stepKey: "kf-u017-cvc-word-sounds",
    title: "CVC Word Sounds",
    meaning: "Listen to and identify the individual sounds in simple CVC words.",
    skillFocus: "CVC phoneme awareness",
    learningIntention: "Today I am learning to notice each sound in a simple CVC word.",
    successCriteria: ["I can say the sounds I hear in a CVC word.", "I can connect the sounds to the word I hear or see."],
    practiceActivity: "Stretch CVC words, tap each sound, and compare words that change when one sound changes.",
    evidenceExamples: ["the completed CVC Word Sounds worksheet", "an oral sound-sequencing activity", "a parent note about hearing individual sounds"],
    assessmentCheck: "Ask the learner to identify or sequence the sounds in several simple CVC words.",
    nextStep: "Use sound awareness to read, spell, and compare more CVC words.",
    reportLanguage: "The learner is strengthening awareness of individual sounds within simple CVC words.",
  },
  {
    id: 20,
    stepKey: "kf-u018-cvc-word-match-and-sort",
    title: "CVC Word Match and Sort",
    meaning: "Read simple CVC words and sort or match them by sound and meaning.",
    skillFocus: "CVC word reading, matching, and sorting",
    learningIntention: "Today I am learning to read CVC words and sort them using sound or meaning.",
    successCriteria: ["I can read a simple CVC word.", "I can match or sort it with a word, picture, or sound pattern."],
    practiceActivity: "Read CVC words, match them to pictures, and sort them by a shared sound or pattern.",
    evidenceExamples: ["the completed CVC Word Match and Sort worksheet", "a word sort or matching record", "a parent note about pattern noticing"],
    assessmentCheck: "Give a mixed set of CVC words and ask the learner to read and sort them independently.",
    nextStep: "Use sorted CVC patterns to support reading and spelling new words.",
    reportLanguage: "The learner is using CVC word reading to match meaning and notice shared sound patterns.",
  },
  {
    id: 21,
    stepKey: "kf-u019-cvc-word-build-and-write",
    title: "CVC Word Build and Write",
    meaning: "Build simple CVC words from sounds and write the words accurately.",
    skillFocus: "CVC word building and spelling",
    learningIntention: "Today I am learning to build and write a simple CVC word from its sounds.",
    successCriteria: ["I can put sounds in the right order to build a CVC word.", "I can write the word I built."],
    practiceActivity: "Use letters or tiles to build CVC words, read them, then write them from memory.",
    evidenceExamples: ["the completed CVC Word Build and Write worksheet", "a word-building sample", "a parent note about sound order"],
    assessmentCheck: "Ask the learner to build and write several regular CVC words from spoken sounds.",
    nextStep: "Apply word-building strategies to reading and writing short messages.",
    reportLanguage: "The learner is building and writing simple CVC words by ordering their sounds accurately.",
  },
  {
    id: 22,
    stepKey: "kf-u020-cvc-word-read-and-find",
    title: "CVC Word Read and Find",
    meaning: "Read simple CVC words and find them in a group or short text.",
    skillFocus: "CVC word reading and visual search",
    learningIntention: "Today I am learning to read CVC words and find them in print.",
    successCriteria: ["I can read a familiar CVC word.", "I can find the same word among other printed words."],
    practiceActivity: "Read target CVC words, scan a group or short text, and find each word accurately.",
    evidenceExamples: ["the completed CVC Word Read and Find worksheet", "a short word-finding record", "a parent note about accurate word recognition"],
    assessmentCheck: "Ask the learner to read and locate several target CVC words among distractors.",
    nextStep: "Carry accurate CVC word recognition into short connected reading.",
    reportLanguage: "The learner is becoming more accurate at recognising and locating familiar CVC words in print.",
  },
];

const ADDITIONAL_EXTENDED_WORD_BUILDER_STEPS: EnglishStepInput[] = [
  {
    id: 3,
    stepKey: "ee-u001-consonant-digraphs",
    title: "Consonant Digraphs",
    meaning: "Read and spell words containing common consonant digraphs.",
    skillFocus: "consonant digraph recognition and spelling",
    learningIntention: "Today I am learning to recognise and use common consonant digraphs in words.",
    successCriteria: ["I can identify a consonant digraph in a word.", "I can read or spell words containing a common digraph."],
    practiceActivity: "Sort, read, and write words with common consonant digraphs, noticing the sounds represented by each letter pair.",
    evidenceExamples: ["the completed Consonant Digraphs worksheet", "a digraph word sort or spelling sample", "a parent note about digraph recognition"],
    assessmentCheck: "Ask the learner to read and spell a mixed selection of familiar words containing common consonant digraphs.",
    nextStep: "Use digraph knowledge when reading and spelling longer words and sentences.",
    reportLanguage: "The learner is developing recognition and spelling of common consonant digraphs in familiar words.",
  },
  {
    id: 4,
    stepKey: "ee-u002-ck-ng-qu",
    title: "CK NG QU",
    meaning: "Recognise and use the spelling patterns ck, ng, and qu in familiar words.",
    skillFocus: "ck, ng, and qu spelling patterns",
    learningIntention: "Today I am learning to read and spell words with ck, ng, and qu.",
    successCriteria: ["I can spot ck, ng, or qu in a word.", "I can use the correct pattern when spelling a familiar word."],
    practiceActivity: "Read, sort, and write words containing ck, ng, and qu, comparing the sound and position of each pattern.",
    evidenceExamples: ["the completed CK NG QU worksheet", "a spelling pattern sort", "a parent note about choosing the correct pattern"],
    assessmentCheck: "Dictate familiar words using ck, ng, and qu and ask the learner to explain or check the pattern used.",
    nextStep: "Apply these patterns in connected reading and sentence writing.",
    reportLanguage: "The learner is beginning to use ck, ng, and qu patterns when reading and spelling familiar words.",
  },
  {
    id: 5,
    stepKey: "ee-u003-initial-consonant-blends",
    title: "Initial Consonant Blends",
    meaning: "Read and spell words that begin with common consonant blends.",
    skillFocus: "initial consonant blend reading and spelling",
    learningIntention: "Today I am learning to hear and use consonant blends at the beginning of words.",
    successCriteria: ["I can identify the sounds in an initial blend.", "I can read or spell a word with a common initial blend."],
    practiceActivity: "Build, read, and sort words by their initial consonant blends, keeping each sound in the blend audible.",
    evidenceExamples: ["the completed Initial Consonant Blends worksheet", "a blend word-building sample", "a parent note about blending sounds"],
    assessmentCheck: "Ask the learner to read and spell regular words beginning with several familiar consonant blends.",
    nextStep: "Combine initial and final patterns while reading and spelling a wider range of words.",
    reportLanguage: "The learner is developing confidence reading and spelling words with common initial consonant blends.",
  },
  {
    id: 6,
    stepKey: "ee-u004-final-consonant-blends",
    title: "Final Consonant Blends",
    meaning: "Read and spell words that end with common consonant blends.",
    skillFocus: "final consonant blend reading and spelling",
    learningIntention: "Today I am learning to hear and use consonant blends at the end of words.",
    successCriteria: ["I can hear the sounds in a final blend.", "I can read or spell a word with a common final blend."],
    practiceActivity: "Say, build, read, and write words with final consonant blends, checking that each ending sound is represented.",
    evidenceExamples: ["the completed Final Consonant Blends worksheet", "a final-blend spelling sample", "a parent note about hearing word endings"],
    assessmentCheck: "Ask the learner to read and spell regular words ending with several familiar consonant blends.",
    nextStep: "Use blend knowledge in longer words, sentences, and independent writing.",
    reportLanguage: "The learner is developing accuracy when reading and spelling words with common final consonant blends.",
  },
  {
    id: 7,
    stepKey: "ee-u005-long-vowels-silent-e",
    title: "Long Vowels Silent E",
    meaning: "Recognise how a final silent e can signal a long vowel in familiar words.",
    skillFocus: "silent-e long-vowel pattern",
    learningIntention: "Today I am learning how silent e can change the vowel sound in a word.",
    successCriteria: ["I can notice the silent-e pattern.", "I can read or spell familiar words with a long vowel and final silent e."],
    practiceActivity: "Compare short-vowel and silent-e word pairs, then read and write examples using the pattern.",
    evidenceExamples: ["the completed Long Vowels Silent E worksheet", "a short/long vowel word comparison", "a parent note about noticing silent e"],
    assessmentCheck: "Ask the learner to read and spell familiar short-vowel and silent-e word pairs.",
    nextStep: "Compare silent-e words with other long-vowel spelling patterns.",
    reportLanguage: "The learner is beginning to recognise and use the silent-e pattern for familiar long-vowel words.",
  },
  {
    id: 8,
    stepKey: "ee-u006-common-vowel-teams",
    title: "Common Vowel Teams",
    meaning: "Recognise and use common vowel teams when reading and spelling familiar words.",
    skillFocus: "common vowel team patterns",
    learningIntention: "Today I am learning to notice common vowel teams and the sounds they represent.",
    successCriteria: ["I can spot a common vowel team.", "I can read or spell a familiar word containing a vowel team."],
    practiceActivity: "Sort, read, and write words with common vowel teams, comparing the patterns and sounds you notice.",
    evidenceExamples: ["the completed Common Vowel Teams worksheet", "a vowel-team word sort", "a parent note about applying a team pattern"],
    assessmentCheck: "Ask the learner to read and spell familiar words containing several taught vowel teams.",
    nextStep: "Use vowel-team knowledge to tackle less familiar words in reading and writing.",
    reportLanguage: "The learner is building recognition of common vowel teams and applying them in familiar words.",
  },
  {
    id: 9,
    stepKey: "ee-u007-other-vowel-spellings",
    title: "Other Vowel Spellings",
    meaning: "Notice that familiar vowel sounds can be represented by more than one spelling pattern.",
    skillFocus: "alternative vowel spelling patterns",
    learningIntention: "Today I am learning to compare different spellings that can represent a vowel sound.",
    successCriteria: ["I can identify an alternative vowel spelling in a word.", "I can use a known pattern to read or spell a familiar word."],
    practiceActivity: "Sort and compare words with alternative vowel spellings, discussing what helps you read or remember each word.",
    evidenceExamples: ["the completed Other Vowel Spellings worksheet", "an alternative-pattern word sort", "a parent note about pattern comparison"],
    assessmentCheck: "Ask the learner to read and spell a selection of familiar words using different taught vowel spellings.",
    nextStep: "Use pattern knowledge and checking strategies with unfamiliar vowel spellings.",
    reportLanguage: "The learner is beginning to compare and use alternative vowel spelling patterns in familiar words.",
  },
  {
    id: 10,
    stepKey: "ee-u008-two-syllable-word-building",
    title: "Two-Syllable Word Building",
    meaning: "Build, read, and spell familiar two-syllable words by working with their parts.",
    skillFocus: "two-syllable word segmentation and spelling",
    learningIntention: "Today I am learning to break two-syllable words into parts to help me read and spell them.",
    successCriteria: ["I can hear or mark the syllables in a familiar word.", "I can build, read, or spell a two-syllable word in parts."],
    practiceActivity: "Say, clap, segment, build, and write familiar two-syllable words, then blend the parts together.",
    evidenceExamples: ["the completed Two-Syllable Word Building worksheet", "a segmented word-building sample", "a parent note about using syllable parts"],
    assessmentCheck: "Ask the learner to segment and read or spell several familiar two-syllable words.",
    nextStep: "Use syllable and pattern knowledge with longer words in connected text.",
    reportLanguage: "The learner is beginning to use syllable parts to support reading and spelling familiar two-syllable words.",
  },
  {
    id: 11,
    stepKey: "ee-u010-ed-ing",
    title: "ED ING",
    meaning: "Recognise and use the endings ed and ing in familiar words.",
    skillFocus: "ed and ing inflectional endings",
    learningIntention: "Today I am learning how ed and ing endings change or extend a base word.",
    successCriteria: ["I can identify ed or ing on a word.", "I can read or spell familiar words with these endings."],
    practiceActivity: "Add ed and ing to familiar base words, read the results, and talk about how the meaning or time changes.",
    evidenceExamples: ["the completed ED ING worksheet", "a base-word and ending sort", "a parent note about recognising inflections"],
    assessmentCheck: "Ask the learner to read and spell familiar base words with ed and ing endings.",
    nextStep: "Compare more word endings and notice how base words change in connected writing.",
    reportLanguage: "The learner is beginning to recognise and use ed and ing endings with familiar base words.",
  },
  {
    id: 12,
    stepKey: "ee-u011-er-est",
    title: "ER EST",
    meaning: "Recognise and use er and est endings in familiar comparative words.",
    skillFocus: "er and est comparative endings",
    learningIntention: "Today I am learning how er and est endings can compare people, objects, or actions.",
    successCriteria: ["I can identify er or est on a word.", "I can read or spell familiar comparative words with these endings."],
    practiceActivity: "Build, read, and compare words with er and est endings, using them in simple spoken or written sentences.",
    evidenceExamples: ["the completed ER EST worksheet", "a comparative word-building sample", "a parent note about using comparison endings"],
    assessmentCheck: "Ask the learner to read and spell familiar words using er and est and explain the comparison.",
    nextStep: "Use other meaningful word parts to understand and build related words.",
    reportLanguage: "The learner is beginning to recognise and use er and est endings in familiar comparative words.",
  },
  {
    id: 13,
    stepKey: "ee-u012-compound-words-and-base-words",
    title: "Compound Words and Base Words",
    meaning: "Build and understand compound words by identifying their meaningful base words.",
    skillFocus: "compound word structure and base-word awareness",
    learningIntention: "Today I am learning to find the base words inside compound words.",
    successCriteria: ["I can split a compound word into two meaningful parts.", "I can build or explain a compound word from its base words."],
    practiceActivity: "Match, build, read, and write compound words, then discuss how the two base words contribute to meaning.",
    evidenceExamples: ["the completed Compound Words and Base Words worksheet", "a compound-word matching sample", "a parent note about identifying word parts"],
    assessmentCheck: "Ask the learner to split, build, and explain several familiar compound words.",
    nextStep: "Carry base-word awareness into prefixes, suffixes, and wider word study.",
    reportLanguage: "The learner is beginning to identify base words within familiar compounds and use them to support word understanding.",
  },
  {
    id: 14,
    stepKey: "ee-u009-plurals-s-es",
    title: "Plurals S ES",
    meaning: "Recognise and use s and es endings to make familiar nouns plural.",
    skillFocus: "plural s and es spelling patterns",
    learningIntention: "Today I am learning how s and es can show more than one.",
    successCriteria: ["I can identify s or es on a plural word.", "I can read or spell familiar plural words using s or es."],
    practiceActivity: "Sort singular and plural words, add s or es to familiar nouns, and read the completed words in context.",
    evidenceExamples: ["the completed Plurals S ES worksheet", "a singular and plural word sort", "a parent note about choosing s or es"],
    assessmentCheck: "Ask the learner to read and spell familiar singular and plural words using s and es endings.",
    nextStep: "Notice other meaningful endings and how word parts change meaning and spelling.",
    reportLanguage: "The learner is beginning to recognise and use s and es endings when reading and spelling familiar plural words.",
  },
];

function createWordBuilderStep(
  id: number,
  stepKey: string,
  title: string,
  meaning: string,
  skillFocus: string,
  learningIntention: string,
  successCriteria: string[],
  practiceActivity: string,
  assessmentCheck: string,
  nextStep: string,
  reportLanguage: string,
): EnglishStepInput {
  return {
    id,
    stepKey,
    title,
    meaning,
    skillFocus,
    learningIntention,
    successCriteria,
    practiceActivity,
    evidenceExamples: [`the completed ${title} worksheet`, "a word-building or spelling sample", `a parent note about ${skillFocus}`],
    assessmentCheck,
    nextStep,
    reportLanguage,
  };
}

const ADDITIONAL_MORPHOLOGY_WORD_BUILDER_STEPS: EnglishStepInput[] = [
  createWordBuilderStep(2, "e-u003-prefix-pre", "Prefix Pre", "Understand that pre- can mean before and use it to build related words.", "prefix pre- meaning and word building", "Today I am learning that pre- can mean before.", ["I can explain the meaning of pre- in a familiar word.", "I can build and use a pre- word."], "Sort, build, read, and use pre- words while discussing how the prefix changes meaning.", "Ask the learner to explain and use several familiar pre- words.", "Build from pre- into other prefixes and meaningful word parts.", "The learner is beginning to use pre- to understand and build words connected with the idea of before."),
  createWordBuilderStep(3, "e-u004-prefix-mis", "Prefix Mis", "Understand that mis- can signal wrongly or badly and use it to explore related words.", "prefix mis- meaning and word building", "Today I am learning how mis- can change the meaning of a base word.", ["I can explain mis- in a familiar word.", "I can build or use a word with mis-."], "Build and sort mis- words, then use selected examples in short sentences.", "Ask the learner to explain the meaning of mis- and use familiar examples.", "Compare mis- with other prefixes that change word meaning.", "The learner is beginning to recognise and use mis- as a meaningful prefix in familiar words."),
  createWordBuilderStep(4, "e-u005-prefix-dis", "Prefix Dis", "Explore how dis- can express apart, away, or not in familiar words.", "prefix dis- meaning and vocabulary", "Today I am learning how dis- contributes meaning to a base word.", ["I can identify dis- in a word.", "I can explain or use a familiar dis- word."], "Match dis- words with meanings, build related words, and use them in context.", "Ask the learner to identify dis- and explain the meaning of familiar examples.", "Use prefix knowledge to investigate related vocabulary.", "The learner is developing awareness of dis- as a meaningful prefix and is connecting it with vocabulary."),
  createWordBuilderStep(5, "e-u006-prefix-sub", "Prefix Sub", "Understand that sub- can mean under or below and use it to build related words.", "prefix sub- meaning and word building", "Today I am learning that sub- can mean under or below.", ["I can explain sub- in a familiar word.", "I can build or read a word with sub-."], "Sort and build sub- words, then connect each word to its meaning or a real-world example.", "Ask the learner to explain sub- and use several familiar sub- words.", "Compare sub- with prefixes that describe position or direction.", "The learner is beginning to use sub- meaningfully when building and explaining familiar words."),
  createWordBuilderStep(6, "e-u007-prefix-over-under", "Prefix Over Under", "Explore how over- and under- change the meaning of familiar base words.", "over- and under- prefix meaning", "Today I am learning how over- and under- can change a base word's meaning.", ["I can identify over- or under- in a word.", "I can explain or use a related word."], "Compare, sort, and build over- and under- words, then use them in short contexts.", "Ask the learner to explain the prefix and meaning in several familiar examples.", "Investigate further prefixes that describe position, amount, or direction.", "The learner is developing understanding of over- and under- as meaningful word parts."),
  createWordBuilderStep(7, "e-u008-suffixes-ful-less", "Suffixes Ful Less", "Explore how -ful and -less change a base word to describe having or lacking something.", "-ful and -less suffix meaning", "Today I am learning how -ful and -less change the meaning of a base word.", ["I can identify -ful or -less.", "I can explain the meaning of a familiar word with the suffix."], "Build and compare -ful and -less words, discussing how the suffix changes meaning.", "Ask the learner to explain and use familiar -ful and -less words.", "Compare other suffixes that change word meaning or word class.", "The learner is beginning to use -ful and -less to interpret and build related vocabulary."),
  createWordBuilderStep(8, "e-u009-suffix-ness", "Suffix Ness", "Understand that -ness can turn an adjective idea into a noun describing a quality or state.", "-ness suffix meaning and word class", "Today I am learning how -ness can name a quality or state.", ["I can identify -ness in a word.", "I can connect a -ness word with its base idea."], "Build -ness words from familiar adjectives and discuss the quality or state each word names.", "Ask the learner to explain the relationship between each base word and -ness word.", "Notice how other suffixes change word class and meaning.", "The learner is beginning to recognise -ness as a meaningful suffix that names a quality or state."),
  createWordBuilderStep(9, "e-u010-suffix-ment", "Suffix Ment", "Explore how -ment forms words connected with an action, process, or result.", "-ment suffix meaning and word building", "Today I am learning how -ment contributes meaning to a related word.", ["I can identify -ment.", "I can explain a relationship between a base word and a -ment word."], "Build, sort, and discuss -ment words, connecting each word to its base and meaning.", "Ask the learner to explain several familiar -ment word relationships.", "Use suffix knowledge to explore more derived words in reading and writing.", "The learner is developing awareness of -ment as a meaningful suffix in related words."),
  createWordBuilderStep(10, "e-u011-suffix-ly", "Suffix Ly", "Understand how -ly can help form words that describe how an action happens.", "-ly suffix meaning and word class", "Today I am learning how -ly can describe the way an action happens.", ["I can identify -ly.", "I can use a familiar -ly word to describe an action."], "Build and use -ly words in sentences, comparing each word with its base adjective or idea.", "Ask the learner to identify -ly and use familiar examples in context.", "Explore how suffixes can change word class and sentence function.", "The learner is beginning to use -ly words to describe actions and notice their relationship to base words."),
  createWordBuilderStep(11, "e-u012-suffix-able", "Suffix Able", "Explore how -able can describe something that can be done or is possible.", "-able suffix meaning and word building", "Today I am learning how -able can show that something is possible or can be done.", ["I can identify -able.", "I can explain or use a familiar -able word."], "Build, read, and use -able words, connecting each word to what can be done or is possible.", "Ask the learner to explain the meaning of familiar -able words and their base relationships.", "Compare -able with other suffixes that create related vocabulary.", "The learner is beginning to understand and use -able as a meaningful suffix in familiar words."),
  createWordBuilderStep(12, "ue-u008-prefix-in-im-il-ir", "Prefix In Im Il Ir", "Explore related forms of the prefix meaning not and how spelling reflects the following word part.", "in-, im-, il-, and ir- prefix meaning and spelling", "Today I am learning how in-, im-, il-, and ir- can mean not in related words.", ["I can recognise related forms of the prefix.", "I can connect a prefix form with the meaning of a familiar word."], "Sort and build in-, im-, il-, and ir- words, discussing meaning and the spelling form used.", "Ask the learner to explain the shared meaning and identify the form in familiar examples.", "Compare other prefixes whose spelling changes with the base word.", "The learner is developing understanding of related in-, im-, il-, and ir- forms and their shared meaning."),
  createWordBuilderStep(13, "ue-u009-prefix-con-com-co", "Prefix Con Com Co", "Explore con-, com-, and co- as related forms that can express with or together.", "con-, com-, and co- prefix meaning", "Today I am learning how con-, com-, and co- can express with or together.", ["I can recognise a related prefix form.", "I can explain or use a familiar word with the prefix."], "Sort and build con-, com-, and co- words, connecting each word to its meaning and base.", "Ask the learner to explain the shared idea and identify the prefix form used.", "Investigate other prefixes connected with relationships, direction, or position.", "The learner is beginning to connect con-, com-, and co- forms with the idea of with or together."),
  createWordBuilderStep(14, "ue-u010-prefix-trans", "Prefix Trans", "Understand that trans- can express across or beyond in familiar words.", "prefix trans- meaning and vocabulary", "Today I am learning how trans- can mean across or beyond.", ["I can identify trans- in a word.", "I can explain or use a familiar trans- word."], "Build and sort trans- words, then connect each word to an example of crossing or changing.", "Ask the learner to explain trans- and use several familiar examples.", "Compare prefixes that express movement, direction, or change.", "The learner is beginning to use trans- to understand and build words connected with across or beyond."),
  createWordBuilderStep(15, "ue-u011-prefix-inter", "Prefix Inter", "Understand that inter- can express between or among in familiar words.", "prefix inter- meaning and word building", "Today I am learning how inter- can mean between or among.", ["I can identify inter- in a word.", "I can explain or use a familiar inter- word."], "Build, sort, and use inter- words, connecting them with the idea of between or among.", "Ask the learner to explain inter- and use familiar examples in context.", "Compare prefixes that describe relationships between people or things.", "The learner is developing understanding of inter- as a meaningful prefix connected with between or among."),
  createWordBuilderStep(16, "ue-u012-prefix-fore", "Prefix Fore", "Understand that fore- can express before or in front of in familiar words.", "prefix fore- meaning and vocabulary", "Today I am learning how fore- can mean before or in front of.", ["I can identify fore- in a word.", "I can explain or use a familiar fore- word."], "Build and sort fore- words, then connect each word to the idea of before or in front of.", "Ask the learner to explain fore- and use familiar examples meaningfully.", "Investigate other prefixes that express time or position.", "The learner is beginning to use fore- to understand familiar words connected with before or in front of."),
  createWordBuilderStep(17, "ue-u013-prefix-mid", "Prefix Mid", "Understand that mid- can express the middle of or middle position in familiar words.", "prefix mid- meaning and word building", "Today I am learning how mid- can mean middle.", ["I can identify mid- in a word.", "I can explain or use a familiar mid- word."], "Build and sort mid- words, connecting each word to the idea of a middle position or time.", "Ask the learner to explain mid- and use familiar examples in context.", "Compare prefixes that express position, sequence, or time.", "The learner is beginning to use mid- as a meaningful prefix connected with middle position or time."),
];

const ADDITIONAL_SPELLING_CONVENTION_STEPS: EnglishStepInput[] = [
  createWordBuilderStep(15, "ue-u002-drop-final-e", "Drop Final E", "Apply the convention of dropping a final e before adding selected suffixes.", "drop-final-e spelling convention", "Today I am learning when a base word drops final e before a suffix.", ["I can identify the base word and suffix.", "I can apply the drop-final-e convention in a familiar word."], "Compare base words and suffixed words, then practise dropping final e in the appropriate examples.", "Ask the learner to explain and apply the convention in several familiar words.", "Compare this convention with doubling and y-to-i changes.", "The learner is beginning to apply the drop-final-e convention when building familiar suffixed words."),
  createWordBuilderStep(16, "ue-u003-double-final-consonant", "Double Final Consonant", "Apply the convention of doubling a final consonant in appropriate short-vowel base words.", "double-final-consonant spelling convention", "Today I am learning when a final consonant doubles before a suffix.", ["I can identify the base word and suffix.", "I can apply or explain the doubling convention in a familiar word."], "Sort and build suffixed words, checking vowel, consonant, and suffix patterns before writing each word.", "Ask the learner to explain and apply doubling in several familiar examples.", "Compare doubling with other base-word spelling changes.", "The learner is beginning to use the double-final-consonant convention in familiar suffixed words."),
  createWordBuilderStep(17, "ue-u004-change-y-to-i", "Change Y to I", "Apply the convention of changing final y to i in appropriate suffixed words.", "change-y-to-i spelling convention", "Today I am learning when final y changes to i before a suffix.", ["I can identify the base word and suffix.", "I can apply or explain the y-to-i change in a familiar word."], "Compare base and suffixed words, then practise changing y to i where the convention applies.", "Ask the learner to explain and apply the y-to-i convention in familiar examples.", "Compare y-to-i with keeping y in related words.", "The learner is beginning to apply the change-y-to-i convention when spelling familiar suffixed words."),
  createWordBuilderStep(18, "ue-u005-keep-the-base-word", "Keep the Base Word", "Recognise cases where the base word stays unchanged when a suffix is added.", "base-word preservation in spelling", "Today I am learning when a base word stays the same before a suffix.", ["I can identify the base word and suffix.", "I can keep the base word correctly in a familiar suffixed word."], "Compare related words and sort examples where the base word is preserved rather than changed.", "Ask the learner to identify the base word and explain why it stays unchanged.", "Compare preservation with common suffixing changes.", "The learner is developing awareness of when a base word remains unchanged during suffixing."),
  createWordBuilderStep(19, "ue-u006-compare-related-words", "Compare Related Words", "Use base words and related forms to notice connections in spelling and meaning.", "related-word comparison and base-word reasoning", "Today I am learning to compare related words and notice what stays connected.", ["I can identify a shared base or word part.", "I can explain a spelling or meaning connection between related words."], "Group related words, underline shared parts, and discuss how spelling and meaning connect.", "Ask the learner to explain the relationship between several related word pairs.", "Use related words to support spelling choices and vocabulary growth.", "The learner is beginning to use related words and base-word connections to reason about spelling and meaning."),
  createWordBuilderStep(20, "ue-u007-explain-spelling", "Explain Spelling", "Use base words, suffixes, and known conventions to explain spelling choices.", "spelling explanation and convention reasoning", "Today I am learning to explain why a related word is spelled the way it is.", ["I can identify the relevant base word or suffix.", "I can explain a spelling choice using a known convention."], "Study related word pairs, name the spelling convention, and explain the choice aloud or in writing.", "Ask the learner to explain the spelling of several familiar derived words.", "Use spelling explanations independently when checking writing.", "The learner is beginning to explain familiar spelling choices using base-word and suffix knowledge."),
];

MORPHOLOGY_AND_SPELLING.stages[0].steps.push(...ADDITIONAL_MORPHOLOGY_WORD_BUILDER_STEPS);

const SPELLING_AND_WORD_STUDY: EnglishStrandConfig = {
  key: "spelling-and-word-study",
  title: "Spelling and word study",
  subtitle:
    "Spelling and word study develops from sound-letter awareness into pattern recognition, morphology, word origins, and flexible spelling strategies. It supports reading, writing, vocabulary growth, and confidence with language structure.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on listening, speaking, and early reading. It supports decoding, writing, vocabulary development, and later awareness of how words are built and related.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early spelling begins with hearing sounds, noticing letters, and connecting spoken words to early print in playful and meaningful ways.",
      steps: [
        {
          id: 1,
          title: "Hear and identify sounds in simple words",
          meaning:
            "Listen carefully to spoken words and notice beginning, ending, or prominent sounds.",
          skillFocus: "sound awareness for early spelling",
          practiceActivity:
            "Play sound games, sort picture cards by sound, and talk about the first or last sound in familiar names and objects.",
          evidenceExamples: [
            "a parent note about sound hearing in play",
            "a simple sound-sort or oral word game",
            "a learner explanation of a beginning or ending sound",
          ],
          nextStep:
            "Build on sound awareness by linking those sounds to letters and early word writing.",
          reportLanguage:
            "The learner is beginning to hear and identify sounds in familiar words, building an important foundation for later spelling confidence.",
        },
        {
          id: 2,
          title: "Connect some sounds to letters in meaningful writing",
          meaning:
            "Use early sound-letter knowledge during drawing, labelling, or simple writing attempts.",
          skillFocus: "early sound-letter links in writing",
          practiceActivity:
            "Label drawings, write names, or attempt simple words and talk about which sounds were matched to letters.",
          evidenceExamples: [
            "a photo of early spelling attempts in writing",
            "a parent note about how the learner chose letters for sounds",
            "a simple label or name-writing sample",
          ],
          nextStep:
            "Carry this into lower-primary phonics patterns and high-frequency word work.",
          reportLanguage:
            "The learner is growing in confidence when linking sounds to letters during early writing and labelling tasks.",
        },
        {
          id: 3,
          stepKey: "kf-u001-beginning-sounds",
          title: "Beginning Sounds",
          meaning: "Hear and identify the first sound in a simple spoken word.",
          skillFocus: "beginning-sound awareness and early letter links",
          learningIntention: "Today I am learning to hear the beginning sound in a simple word.",
          successCriteria: [
            "I can say the first sound I hear in a familiar word.",
            "I can match a beginning sound with a letter or picture.",
          ],
          practiceActivity: "Say familiar words slowly, notice their first sounds, and sort pictures or objects by beginning sound.",
          evidenceExamples: [
            "the completed Beginning Sounds worksheet",
            "a parent note about identifying first sounds",
            "a short oral sound-sorting activity",
          ],
          assessmentCheck: "Ask the learner to identify the beginning sound in several familiar words without prompting.",
          nextStep: "Use ending sounds and other sound-letter connections to build fuller word awareness.",
          reportLanguage: "The learner is building early phonics awareness by identifying beginning sounds in familiar words.",
        },
        {
          id: 4,
          stepKey: "kf-u002-ending-sounds",
          title: "Ending Sounds",
          meaning: "Hear and identify the final sound in a simple spoken word.",
          skillFocus: "ending-sound awareness",
          learningIntention: "Today I am learning to hear the ending sound in a simple word.",
          successCriteria: [
            "I can say the last sound I hear in a familiar word.",
            "I can match an ending sound with a letter or picture.",
          ],
          practiceActivity: "Stretch familiar words, listen for their final sounds, and sort words or pictures by ending sound.",
          evidenceExamples: [
            "the completed Ending Sounds worksheet",
            "a parent note about identifying final sounds",
            "a short oral ending-sound sort",
          ],
          assessmentCheck: "Ask the learner to identify the ending sound in several familiar words without prompting.",
          nextStep: "Combine beginning and ending sound awareness while listening to whole simple words.",
          reportLanguage: "The learner is developing phonics awareness by identifying ending sounds in familiar words.",
        },
        {
          id: 5,
          stepKey: "kf-u003-segment-and-blend",
          title: "Segment and Blend",
          meaning: "Break simple words into sounds and blend sounds to make words.",
          skillFocus: "phoneme segmentation and blending",
          learningIntention: "Today I am learning to separate sounds and blend them into a word.",
          successCriteria: [
            "I can say the separate sounds in a simple word.",
            "I can blend separate sounds to say the whole word.",
          ],
          practiceActivity: "Use counters or finger taps to segment simple words, then blend the sounds back together.",
          evidenceExamples: [
            "the completed Segment and Blend worksheet",
            "a parent note about segmenting or blending",
            "a short oral word-building activity",
          ],
          assessmentCheck: "Give several simple words and sounds and ask the learner to segment or blend them independently.",
          nextStep: "Apply sound-by-sound thinking to common consonants and short-vowel words.",
          reportLanguage: "The learner is beginning to segment and blend sounds in simple words as an early phonics strategy.",
        },
        {
          id: 6,
          stepKey: "kf-u004-consonant-sounds",
          title: "Consonant Sounds",
          meaning: "Identify and use common consonant sounds in simple words.",
          skillFocus: "common consonant sound-letter knowledge",
          learningIntention: "Today I am learning to connect common consonant sounds with letters.",
          successCriteria: [
            "I can say a common consonant sound.",
            "I can use a consonant letter when building a simple word.",
          ],
          practiceActivity: "Say, match, and write common consonant sounds in familiar words and simple sound patterns.",
          evidenceExamples: [
            "the completed Consonant Sounds worksheet",
            "a parent note about consonant sound-letter matches",
            "a short consonant sorting or word-building activity",
          ],
          assessmentCheck: "Show common consonant letters and ask the learner to give the sound or use it in a simple word.",
          nextStep: "Combine consonant sounds with short vowels to read and spell simple CVC words.",
          reportLanguage: "The learner is strengthening common consonant sound-letter connections for early word building.",
        },
        {
          id: 7,
          stepKey: "kf-u005-short-vowel-a",
          title: "Short Vowel A",
          meaning: "Hear, read, and spell short /a/ in simple CVC words.",
          skillFocus: "short /a/ phonics in CVC words",
          learningIntention: "Today I am learning to hear and use short /a/ in simple words.",
          successCriteria: [
            "I can hear short /a/ in a simple word.",
            "I can read or spell a simple CVC word with short /a/.",
          ],
          practiceActivity: "Read, build, and spell simple CVC words that use the short /a/ sound.",
          evidenceExamples: [
            "the completed Short Vowel A worksheet",
            "a short CVC word-reading or spelling sample",
            "a parent note about hearing short /a/",
          ],
          assessmentCheck: "Ask the learner to read or build several familiar short /a/ CVC words.",
          nextStep: "Compare short /a/ with another short vowel while reading and building CVC words.",
          reportLanguage: "The learner is beginning to hear, read, and spell short /a/ in simple CVC words.",
        },
        {
          id: 8,
          stepKey: "kf-u006-short-vowel-i",
          title: "Short Vowel I",
          meaning: "Hear, read, and spell short /i/ in simple CVC words.",
          skillFocus: "short /i/ phonics in CVC words",
          learningIntention: "Today I am learning to hear and use short /i/ in simple words.",
          successCriteria: [
            "I can hear short /i/ in a simple word.",
            "I can read or spell a simple CVC word with short /i/.",
          ],
          practiceActivity: "Read, build, and spell simple CVC words that use the short /i/ sound.",
          evidenceExamples: [
            "the completed Short Vowel I worksheet",
            "a short CVC word-reading or spelling sample",
            "a parent note about hearing short /i/",
          ],
          assessmentCheck: "Ask the learner to read or build several familiar short /i/ CVC words.",
          nextStep: "Compare short /i/ with other short vowels while reading and building CVC words.",
          reportLanguage: "The learner is beginning to hear, read, and spell short /i/ in simple CVC words.",
        },
        ...ADDITIONAL_FOUNDATIONAL_WORD_BUILDER_STEPS.slice(0, 4),
        {
          id: 9,
          stepKey: "kf-u011-cvc-word-match",
          title: "CVC Word Match",
          meaning: "Read simple CVC words and match them to meanings or pictures.",
          skillFocus: "CVC word reading and meaning matching",
          learningIntention: "Today I am learning to read simple CVC words and connect them with meaning.",
          successCriteria: [
            "I can read a simple CVC word.",
            "I can match the word to the right picture or meaning.",
          ],
          practiceActivity: "Read simple CVC words, blend carefully, and match each word with its picture or meaning.",
          evidenceExamples: [
            "the completed CVC Word Match worksheet",
            "a short CVC reading sample",
            "a parent note about matching words to meaning",
          ],
          assessmentCheck: "Give several simple CVC words and ask the learner to read and match them independently.",
          nextStep: "Use CVC words in short phrases and sentences while continuing to check sound-by-sound reading.",
          reportLanguage: "The learner is beginning to read simple CVC words and connect them with meaning.",
        },
        ...ADDITIONAL_FOUNDATIONAL_WORD_BUILDER_STEPS.slice(4),
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin using phonics, common patterns, and remembered high-frequency words more deliberately during reading and writing.",
      steps: [
        {
          id: 1,
          title: "Use common sound-letter patterns in familiar words",
          meaning:
            "Apply known phonics patterns when spelling simple words in reading and writing tasks.",
          skillFocus: "phonics patterns and early spelling choices",
          practiceActivity:
            "Use dictated words, simple writing, and pattern-sorting tasks that encourage noticing common letter combinations and sound patterns.",
          evidenceExamples: [
            "a short spelling or dictation sample",
            "a parent note about patterns used in writing",
            "annotated examples of how a word was worked out",
          ],
          nextStep:
            "Use these patterns alongside high-frequency word knowledge and checking habits.",
          reportLanguage:
            "The learner is beginning to use familiar sound-letter patterns more confidently when spelling simple words in reading and writing tasks.",
        },
        {
          id: 2,
          title: "Build confidence with common and high-frequency words",
          meaning:
            "Recognise and spell words that appear often in early reading and writing.",
          skillFocus: "word memory and practical spelling fluency",
          practiceActivity:
            "Use word walls, quick-write tasks, simple dictation, or reading/writing routines that revisit frequent words in meaningful context.",
          evidenceExamples: [
            "a high-frequency word sample",
            "a learner explanation of how a word was remembered or checked",
            "a parent note about greater automaticity in common words",
          ],
          nextStep:
            "Carry this into broader pattern noticing, word families, and spelling strategy use.",
          reportLanguage:
            "The learner is becoming more secure with common and high-frequency words and is showing greater confidence when using them in writing.",
        },
        ...ADDITIONAL_EXTENDED_WORD_BUILDER_STEPS,
        ...ADDITIONAL_SPELLING_CONVENTION_STEPS,
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Spelling grows through pattern awareness, word families, visual memory, and clearer strategy use when a word is unfamiliar or tricky.",
      steps: [
        {
          id: 1,
          title: "Notice word families and common spelling patterns",
          meaning:
            "Use known families, chunks, and related words to support more accurate spelling.",
          skillFocus: "pattern recognition and word-family reasoning",
          practiceActivity:
            "Sort words into families, highlight common chunks, and compare related words during word study or writing conferences.",
          evidenceExamples: [
            "a word-family sort or notebook record",
            "a parent note about pattern reasoning during spelling",
            "a learner explanation of how a related word helped",
          ],
          nextStep:
            "Use pattern knowledge more flexibly alongside checking, editing, and morphology.",
          reportLanguage:
            "The learner is increasingly able to notice word families and common spelling patterns and use them to support more accurate spelling choices.",
        },
        {
          id: 2,
          title: "Use strategies when an unfamiliar word is tricky",
          meaning:
            "Try a word, break it into parts, check patterns, and revise the spelling using available clues.",
          skillFocus: "spelling problem solving and self-correction",
          practiceActivity:
            "Pause during writing when a tricky word appears and talk through options such as stretching sounds, using a known chunk, or checking a resource.",
          evidenceExamples: [
            "an annotated tricky-word attempt and correction",
            "a learner explanation of the strategy used",
            "a parent note about growing persistence in spelling problem solving",
          ],
          nextStep:
            "Build toward prefixes, suffixes, morphology, and more deliberate editing habits.",
          reportLanguage:
            "The learner is becoming more willing to use spelling strategies when an unfamiliar word is challenging and is beginning to self-correct more thoughtfully.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now connect spelling more strongly to morphology, prefixes, suffixes, and how words are built and changed across different contexts.",
      steps: [
        {
          id: 1,
          title: "Use prefixes, suffixes, and base words to support spelling",
          meaning:
            "Recognise how words change when meaningful parts are added or adjusted.",
          skillFocus: "morphology and word-building awareness",
          practiceActivity:
            "Explore root words, add prefixes and suffixes, and discuss how meaning and spelling change together.",
          evidenceExamples: [
            "a morphology or word-building task",
            "a learner explanation of how a word changed",
            "a parent note about morphology use in writing",
          ],
          nextStep:
            "Carry this into wider vocabulary growth, grammar, and more accurate editing.",
          reportLanguage:
            "The learner is increasingly able to use prefixes, suffixes, and base-word knowledge to support more accurate spelling and deeper word understanding.",
        },
        {
          id: 2,
          title: "Edit writing with stronger spelling awareness",
          meaning:
            "Review spelling choices more deliberately during drafting and editing rather than relying only on first attempts.",
          skillFocus: "editing for spelling accuracy",
          practiceActivity:
            "Reread a draft, highlight uncertain words, and use known strategies, word resources, or morphology knowledge to improve spelling.",
          evidenceExamples: [
            "a before-and-after spelling edit example",
            "a learner note about how a spelling was checked",
            "a parent observation of increasing editing independence",
          ],
          nextStep:
            "Build into lower-secondary control of word origins, subject vocabulary, and consistent strategy use.",
          reportLanguage:
            "The learner is becoming more deliberate when editing spelling in writing and is showing stronger awareness of how to improve uncertain words.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens morphology, subject vocabulary, etymology awareness, and more mature spelling strategy use across reading and writing.",
      steps: [
        {
          id: 1,
          title: "Use morphology and word origins to understand spelling",
          meaning:
            "Use roots, affixes, and word history to explain and remember more complex spelling patterns.",
          skillFocus: "morphology, etymology, and complex word awareness",
          practiceActivity:
            "Investigate word origins, related word families, and subject vocabulary to explain why a spelling looks the way it does.",
          evidenceExamples: [
            "a morphology or etymology note",
            "a learner explanation of how word history helped spelling",
            "a parent note about using related words to solve a spelling problem",
          ],
          nextStep:
            "Use this understanding across wider vocabulary, reading, and more precise writing choices.",
          reportLanguage:
            "The learner is developing stronger understanding of morphology and word origins and can increasingly use that knowledge to support more complex spelling.",
        },
        {
          id: 2,
          title: "Use flexible spelling strategies across subjects",
          meaning:
            "Draw on pattern knowledge, morphology, checking habits, and resources when writing unfamiliar or specialised words.",
          skillFocus: "independent strategy use across contexts",
          practiceActivity:
            "Write across subjects, note unfamiliar vocabulary, and discuss which strategies helped spell and check those words accurately.",
          evidenceExamples: [
            "a cross-subject writing sample with spelling strategy notes",
            "a learner reflection on how specialised words were checked",
            "a parent note about independent strategy use in writing",
          ],
          nextStep:
            "Carry this into later precision, style, and confidence across varied writing demands.",
          reportLanguage:
            "The learner is increasingly able to use flexible spelling strategies across subjects and unfamiliar vocabulary with greater independence.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together confidence, precision, and reflective strategy use so spelling supports mature reading, writing, and subject communication.",
      steps: [
        {
          id: 1,
          title: "Use accurate spelling to support clarity and confidence",
          meaning:
            "Treat spelling as part of strong communication, especially when precision matters in formal, analytical, or subject-specific writing.",
          skillFocus: "precision and clarity in later spelling use",
          practiceActivity:
            "Review polished drafts, subject essays, or presentations and discuss how accurate spelling supports clarity, credibility, and reader confidence.",
          evidenceExamples: [
            "a polished later-stage writing sample",
            "a learner reflection on spelling and communication quality",
            "a parent note about precision in final writing",
          ],
          nextStep:
            "Use this precision to support mature writing, presentation, and subject confidence across the wider pathway system.",
          reportLanguage:
            "The learner is consolidating accurate spelling as part of clear and confident communication across a wider range of writing contexts.",
        },
        {
          id: 2,
          title: "Reflect on strategies that support long-term spelling growth",
          meaning:
            "Recognise which habits, patterns, or resources continue to support spelling accuracy and word learning over time.",
          skillFocus: "self-awareness about word learning and spelling strategies",
          practiceActivity:
            "Reflect on tricky words, recurring patterns, personal editing habits, and which strategies are most reliable in longer writing tasks.",
          evidenceExamples: [
            "a learner reflection on spelling strategies",
            "a strategy checklist or notebook entry",
            "a parent note about growing ownership of spelling improvement",
          ],
          nextStep:
            "These habits continue to support vocabulary growth, writing quality, and subject-specific language work in later learning.",
          reportLanguage:
            "The learner is strengthening reflective spelling habits and can increasingly identify which strategies support accurate word use over time.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early spelling or word-study sample and one later edited writing example so the portfolio shows growth from sound-letter awareness into pattern and strategy control.",
    "Annotated writing samples can be especially strong here because they show how spelling decisions were made inside real communication tasks.",
    "Word-study notebooks, morphology work, and reflective editing notes often provide stronger evidence than weekly lists alone.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in pattern awareness, strategy use, self-correction, and confidence with increasingly complex words.",
    "Examples are often strongest when the learner explains how a word was worked out, checked, or improved rather than only showing a correct final spelling.",
    "Collected evidence can show a shift from early sound-letter attempts toward flexible use of morphology, editing, and cross-subject spelling habits.",
  ],
};

const GRAMMAR_PUNCTUATION_AND_LANGUAGE: EnglishStrandConfig = {
  key: "grammar-punctuation-and-language",
  title: "Grammar, punctuation and language",
  subtitle:
    "Grammar, punctuation and language helps learners shape clear sentences, control meaning, and choose language more deliberately. It supports both accurate communication and richer style across speaking, reading, and writing.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on oral language, reading, writing, and vocabulary. It supports comprehension, editing, style, and stronger communication across all strands of English.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early grammar and punctuation begins with oral sentence awareness, simple ideas about what a sentence says, and noticing that print can be grouped meaningfully.",
      steps: [
        {
          id: 1,
          title: "Speak and hear simple complete ideas",
          meaning:
            "Use oral language to notice when a thought feels complete and when more words are needed.",
          skillFocus: "sentence awareness in oral language",
          practiceActivity:
            "Say short complete ideas, expand simple phrases, and discuss whether a spoken message feels finished or still missing something.",
          evidenceExamples: [
            "a parent note about oral sentence awareness",
            "a learner attempt to expand a short phrase into a fuller sentence",
            "a simple oral explanation of what made an idea complete",
          ],
          nextStep:
            "Build on this by matching spoken sentences to early written ones and noticing simple punctuation.",
          reportLanguage:
            "The learner is beginning to notice complete spoken ideas and is growing in awareness that sentences carry a full message.",
        },
        {
          id: 2,
          title: "Notice simple punctuation and sentence boundaries",
          meaning:
            "See that written language is organised into parts and that punctuation helps show where ideas stop or change.",
          skillFocus: "early punctuation awareness",
          practiceActivity:
            "Read shared texts and notice capitals, full stops, question marks, and spaces between words while talking about what they help the reader do.",
          evidenceExamples: [
            "a parent note about punctuation noticing in shared reading",
            "a simple marked-up sentence or text sample",
            "a learner explanation of what a full stop or question mark does",
          ],
          nextStep:
            "Carry this into lower-primary sentence writing and simple punctuation choices.",
          reportLanguage:
            "The learner is growing in awareness that punctuation and sentence boundaries help organise written meaning for a reader.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin using simple sentences, basic punctuation, and core language categories more deliberately in reading and writing.",
      steps: [
        {
          id: 1,
          title: "Build simple sentences with clearer parts",
          meaning:
            "Use people, actions, and details more deliberately so a sentence says what is intended.",
          skillFocus: "basic sentence construction",
          practiceActivity:
            "Write and discuss simple sentences, then add who, what, where, or when details so the meaning becomes clearer.",
          evidenceExamples: [
            "a short sentence-building sample",
            "a learner explanation of how the sentence became clearer",
            "a parent note about sentence growth in writing",
          ],
          nextStep:
            "Build from simple sentences into stronger punctuation and more varied sentence choices.",
          reportLanguage:
            "The learner is beginning to construct clearer sentences and is showing growing control over how ideas are expressed in writing.",
        },
        {
          id: 2,
          title: "Use basic punctuation to support meaning",
          meaning:
            "Apply capitals, full stops, and other early punctuation marks more deliberately in familiar writing.",
          skillFocus: "basic punctuation control",
          practiceActivity:
            "Re-read simple writing together, add missing punctuation, and discuss how the marks help the reader understand the sentence.",
          evidenceExamples: [
            "a punctuation-corrected writing sample",
            "a learner explanation of a punctuation choice",
            "a parent note about growing punctuation awareness",
          ],
          nextStep:
            "Carry this into middle-primary grammar choices, tense control, and clearer paragraph writing.",
          reportLanguage:
            "The learner is increasingly able to use basic punctuation to support clearer written meaning in familiar contexts.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Grammar and punctuation becomes more purposeful here through tense awareness, sentence variety, and clearer connections between ideas in short texts.",
      steps: [
        {
          id: 1,
          title: "Use tense and sentence choices more deliberately",
          meaning:
            "Choose language that fits whether a text is about something happening now, before, or later, and vary sentence structure more thoughtfully.",
          skillFocus: "tense control and sentence variation",
          practiceActivity:
            "Rework short pieces of writing by changing tense, combining ideas, or varying how sentences begin and connect.",
          evidenceExamples: [
            "a tense or sentence-revision sample",
            "a learner explanation of why a language choice changed",
            "a parent note about growing control of sentence variety",
          ],
          nextStep:
            "Use stronger sentence control to support cohesion, punctuation, and audience awareness.",
          reportLanguage:
            "The learner is becoming more confident in controlling tense and varying sentence patterns to make writing clearer and more effective.",
        },
        {
          id: 2,
          title: "Connect ideas more clearly across a short text",
          meaning:
            "Use joining words, punctuation, and sentence flow so a reader can follow how ideas fit together.",
          skillFocus: "cohesion and connection between ideas",
          practiceActivity:
            "Revise a paragraph or short text by adding linking words, adjusting punctuation, or improving the order of ideas.",
          evidenceExamples: [
            "an edited paragraph showing improved cohesion",
            "a learner explanation of how ideas were connected",
            "a parent note about text flow becoming clearer",
          ],
          nextStep:
            "Carry this into upper-primary control of language choices, effect, and more refined editing.",
          reportLanguage:
            "The learner is increasingly able to connect ideas clearly across a short text and is beginning to use grammar and punctuation to guide the reader more effectively.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now use grammar and punctuation more flexibly for style, audience, and effect, rather than only for correctness.",
      steps: [
        {
          id: 1,
          title: "Use language choices to shape tone and effect",
          meaning:
            "Recognise that grammar and sentence choices help a piece sound formal, playful, persuasive, reflective, or informative.",
          skillFocus: "style and effect through language choices",
          practiceActivity:
            "Compare two versions of a passage, change sentence style or language, and discuss how the tone and effect shift for the reader.",
          evidenceExamples: [
            "a before-and-after style example",
            "a learner explanation of language choices",
            "a parent note about growing awareness of tone or effect",
          ],
          nextStep:
            "Use this awareness to support stronger editing and control of audience in later writing.",
          reportLanguage:
            "The learner is beginning to use language choices more deliberately to shape tone and effect for different readers and purposes.",
        },
        {
          id: 2,
          title: "Edit grammar and punctuation for clarity and control",
          meaning:
            "Review a draft with attention to sentence structure, punctuation, and language choices so the final meaning is clearer.",
          skillFocus: "editing for grammar and punctuation control",
          practiceActivity:
            "Use checklists or shared conferences to improve punctuation, sentence clarity, and language flow in a developed draft.",
          evidenceExamples: [
            "an edited draft with visible grammar or punctuation improvements",
            "a learner reflection on why a change helped",
            "a parent note about more independent editing habits",
          ],
          nextStep:
            "Carry this into lower-secondary control of sophistication, cohesion, and precise effect across text types.",
          reportLanguage:
            "The learner is becoming more confident in editing grammar and punctuation so writing communicates with greater clarity and control.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens grammar, punctuation, and language choices across sustained writing, analysis, and purposeful communication.",
      steps: [
        {
          id: 1,
          title: "Use grammar and punctuation to support mature meaning",
          meaning:
            "Make language choices that help organise a longer text, guide the reader, and show more precise relationships between ideas.",
          skillFocus: "mature sentence control and text cohesion",
          practiceActivity:
            "Revise analytical, persuasive, or reflective writing and discuss how sentence structure and punctuation guide emphasis, logic, and tone.",
          evidenceExamples: [
            "a sustained writing sample showing stronger language control",
            "a learner explanation of a punctuation or sentence decision",
            "a parent note about improved cohesion in later writing",
          ],
          nextStep:
            "Build this into later precision, style, and purposeful voice across complex writing contexts.",
          reportLanguage:
            "The learner is developing more mature control of grammar and punctuation and can increasingly use language structure to support clear and purposeful meaning.",
        },
        {
          id: 2,
          title: "Reflect on how language shapes interpretation",
          meaning:
            "Notice how grammatical choices, punctuation, and phrasing influence how a reader understands or responds to a text.",
          skillFocus: "language awareness and interpretive effect",
          practiceActivity:
            "Compare two versions of a sentence or passage and discuss how punctuation, sentence structure, or wording changes the reading experience.",
          evidenceExamples: [
            "a comparison of language choices and their effects",
            "a learner explanation of how a phrase changed interpretation",
            "a parent note from a language-analysis discussion",
          ],
          nextStep:
            "Carry this into later critique, stylistic control, and subject-specific communication.",
          reportLanguage:
            "The learner is increasingly able to notice how language and punctuation shape interpretation and can explain those effects with growing clarity.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together accuracy, flexibility, and style so grammar and language choices strengthen mature communication across reading, writing, and presentation.",
      steps: [
        {
          id: 1,
          title: "Use language control to support mature voice and precision",
          meaning:
            "Shape language choices more deliberately so writing and speaking sound clear, accurate, and appropriate to context.",
          skillFocus: "precision, voice, and control",
          practiceActivity:
            "Refine later-stage pieces for sentence control, emphasis, and style and discuss how those choices improve clarity or authority.",
          evidenceExamples: [
            "a refined final text showing mature language control",
            "a learner reflection on tone or precision choices",
            "a parent note about more deliberate language control",
          ],
          nextStep:
            "Use this precision across research, reporting, literature response, and wider subject communication.",
          reportLanguage:
            "The learner is consolidating more mature control of grammar and language and can increasingly use precise choices to strengthen communication.",
        },
        {
          id: 2,
          title: "Critique and refine language choices thoughtfully",
          meaning:
            "Review whether language choices are effective, clear, and appropriate, then improve them when needed.",
          skillFocus: "critical reflection on language effectiveness",
          practiceActivity:
            "Compare drafts, review sentence choices, and discuss whether the language best fits the purpose, audience, and desired effect.",
          evidenceExamples: [
            "a critique or revision of language choices",
            "a learner explanation of why wording was refined",
            "a parent note about mature editing and reflection habits",
          ],
          nextStep:
            "These habits continue to support confident and thoughtful communication across all later English strands and broader learning.",
          reportLanguage:
            "The learner is strengthening the ability to critique and refine language choices thoughtfully so communication becomes clearer, more precise, and more effective.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one earlier sentence or punctuation sample and one later revised piece so the portfolio shows growth from simple control toward purposeful language choices.",
    "Edited drafts often provide stronger evidence here than polished final pieces alone, because they show how grammar and punctuation improved clarity.",
    "Short learner reflections on why a wording or punctuation choice changed can strengthen portfolio evidence by making the thinking visible.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in sentence control, cohesion, punctuation awareness, and purposeful language choice rather than only surface correctness.",
    "Examples are strongest when the learner can explain how a change improved meaning, flow, tone, or reader understanding.",
    "Collected evidence can show a shift from simple sentence control toward mature, reflective use of grammar and language for effect.",
  ],
};

const VOCABULARY_AND_WORD_MEANING: EnglishStrandConfig = {
  key: "vocabulary-and-word-meaning",
  title: "Vocabulary and word meaning",
  subtitle:
    "Vocabulary and word meaning grows from oral language and naming into flexible understanding of word relationships, context clues, figurative language, subject vocabulary, and precise word choice.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on speaking, listening, reading, and word study. It supports comprehension, writing quality, literature response, and confident learning across every subject.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early vocabulary grows through talk, play, stories, naming, and simple explanation of what words and experiences mean.",
      steps: [
        {
          id: 1,
          title: "Build oral vocabulary through talk and stories",
          meaning:
            "Use conversation, play, and read-alouds to notice and practise new words in meaningful contexts.",
          skillFocus: "oral vocabulary growth",
          practiceActivity:
            "Talk through picture books, routines, nature walks, and play themes and invite the learner to use new words in response.",
          evidenceExamples: [
            "a parent note about new vocabulary used in speech",
            "a short oral explanation using a new word",
            "an observation from story or play-based vocabulary growth",
          ],
          nextStep:
            "Build from oral vocabulary into noticing how words connect to categories, meanings, and early reading.",
          reportLanguage:
            "The learner is growing in oral vocabulary through conversation, stories, and play and is beginning to use new words with greater confidence.",
        },
        {
          id: 2,
          title: "Talk about what familiar words mean",
          meaning:
            "Explain simple meanings and show that words can connect to real experiences, objects, and ideas.",
          skillFocus: "early meaning awareness",
          practiceActivity:
            "Choose words from stories or daily life and ask what they mean, where they have been heard, or what they connect to.",
          evidenceExamples: [
            "a learner explanation of a familiar word meaning",
            "a parent note about meaning talk during reading",
            "a simple picture or example linked to a word",
          ],
          nextStep:
            "Carry this into lower-primary context clues, word groups, and simple comparisons between words.",
          reportLanguage:
            "The learner is beginning to talk about the meaning of familiar words and can increasingly connect words to real experiences and ideas.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin grouping words, noticing similar meanings, and using context from reading and talk to work out what unfamiliar words may mean.",
      steps: [
        {
          id: 1,
          title: "Use context to work out simple unfamiliar words",
          meaning:
            "Look at the surrounding sentence, picture, or situation to make a sensible guess about meaning.",
          skillFocus: "context clues and meaning-making",
          practiceActivity:
            "Pause in shared reading and ask what a new word might mean based on the sentence, picture, or topic being discussed.",
          evidenceExamples: [
            "a parent note about context-clue use",
            "a learner explanation of how a meaning was guessed",
            "a simple reading note showing how context helped",
          ],
          nextStep:
            "Build on this by comparing related words and noticing shades of meaning.",
          reportLanguage:
            "The learner is beginning to use context clues to work out unfamiliar words and is growing in confidence when reading or discussing new language.",
        },
        {
          id: 2,
          title: "Compare words with similar or opposite meanings",
          meaning:
            "Notice that words can be related in meaning and that those relationships help with reading and choice in writing.",
          skillFocus: "word relationships and meaning comparison",
          practiceActivity:
            "Sort words by meaning, play synonym/antonym games, and compare which word sounds stronger, softer, or more precise.",
          evidenceExamples: [
            "a word-sort or comparison sample",
            "a learner explanation of why one word fits better",
            "a parent note about vocabulary comparison in reading or writing",
          ],
          nextStep:
            "Carry this into middle-primary word choice, subject vocabulary, and more precise comprehension.",
          reportLanguage:
            "The learner is increasingly able to compare word meanings and notice relationships such as similarity or contrast when reading and writing.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Vocabulary becomes more deliberate here through subject words, richer text language, and growing awareness that word choice affects precision and meaning.",
      steps: [
        {
          id: 1,
          title: "Learn and use subject-specific vocabulary",
          meaning:
            "Build word knowledge that supports understanding and communication in science, history, mathematics, and other learning areas.",
          skillFocus: "subject vocabulary and transfer",
          practiceActivity:
            "Keep a word notebook, use new terms in explanation, and discuss how a subject word changes understanding of a topic.",
          evidenceExamples: [
            "a subject-vocabulary record or notebook entry",
            "a learner explanation using a new subject term",
            "a parent note about cross-subject word growth",
          ],
          nextStep:
            "Use this wider vocabulary to support richer comprehension and more precise writing choices.",
          reportLanguage:
            "The learner is building stronger subject vocabulary and is beginning to use key terms more confidently across different learning contexts.",
        },
        {
          id: 2,
          title: "Choose more precise words in speaking and writing",
          meaning:
            "Move beyond general words toward language that gives a clearer or more exact meaning.",
          skillFocus: "precision in word choice",
          practiceActivity:
            "Revise a sentence or explanation by replacing vague words with more specific ones and discuss how the meaning improves.",
          evidenceExamples: [
            "a before-and-after word-choice example",
            "a learner reflection on choosing a more precise word",
            "a parent note about growing vocabulary range in expression",
          ],
          nextStep:
            "Build toward figurative language, tone, and nuance in upper-primary and lower-secondary work.",
          reportLanguage:
            "The learner is increasingly able to choose more precise words in speaking and writing and can explain how those choices improve meaning.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now explore nuance, figurative language, and more deliberate word choice across reading, response, and composition.",
      steps: [
        {
          id: 1,
          title: "Interpret figurative and descriptive language",
          meaning:
            "Recognise that some words and phrases are not fully literal and still carry powerful meaning or effect.",
          skillFocus: "figurative language and nuance",
          practiceActivity:
            "Notice similes, metaphors, imagery, or strong description in stories and poems and discuss what the words suggest beyond the literal level.",
          evidenceExamples: [
            "a learner explanation of figurative language in a text",
            "a parent note from a poetry or story discussion",
            "annotated text examples showing figurative meaning",
          ],
          nextStep:
            "Use this awareness to shape stronger tone and language choices in writing and discussion.",
          reportLanguage:
            "The learner is becoming more aware of figurative and descriptive language and can increasingly explain how it shapes meaning or effect.",
        },
        {
          id: 2,
          title: "Use richer vocabulary to shape tone and precision",
          meaning:
            "Choose words more deliberately to influence how a reader or listener understands the message.",
          skillFocus: "tone, precision, and expressive vocabulary",
          practiceActivity:
            "Revise a narrative, response, or explanation by changing word choice and discussing how tone or clarity shifts.",
          evidenceExamples: [
            "a revised writing sample with stronger vocabulary choices",
            "a learner reflection on tone or precision",
            "a parent note about expressive vocabulary growth",
          ],
          nextStep:
            "Carry this into lower-secondary interpretation, analysis, and mature communication across subjects.",
          reportLanguage:
            "The learner is increasingly able to use richer vocabulary to create tone, precision, and stronger effect in speaking and writing.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens interpretation, nuance, and control of vocabulary so learners can explain meaning and choose language more deliberately across contexts.",
      steps: [
        {
          id: 1,
          title: "Analyse how word choice shapes meaning",
          meaning:
            "Look closely at vocabulary in a text and explain how it influences tone, interpretation, and reader response.",
          skillFocus: "analytical vocabulary awareness",
          practiceActivity:
            "Highlight key words in a passage and discuss why those particular choices matter more than simpler alternatives.",
          evidenceExamples: [
            "an annotated passage showing key word choices",
            "a learner explanation of how vocabulary shaped interpretation",
            "a parent note from a language-analysis discussion",
          ],
          nextStep:
            "Use this awareness to support more deliberate word choice in writing, speaking, and analysis.",
          reportLanguage:
            "The learner is developing stronger awareness of how word choice shapes meaning and can increasingly explain the effect of vocabulary in context.",
        },
        {
          id: 2,
          title: "Use precise and adaptable vocabulary across contexts",
          meaning:
            "Choose words that fit the task, subject, tone, and audience more deliberately.",
          skillFocus: "adaptable and precise vocabulary use",
          practiceActivity:
            "Write or speak across different contexts and discuss how vocabulary needs to shift between formal explanation, storytelling, reflection, and analysis.",
          evidenceExamples: [
            "a cross-context vocabulary comparison",
            "a learner reflection on adjusting language for audience",
            "a parent note about broader vocabulary control",
          ],
          nextStep:
            "Carry this into later style, interpretation, and research communication.",
          reportLanguage:
            "The learner is increasingly able to use vocabulary more precisely and adapt word choice to suit different purposes, audiences, and subjects.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together nuance, precision, style, and reflective vocabulary control so language supports mature interpretation and communication.",
      steps: [
        {
          id: 1,
          title: "Use vocabulary with increasing maturity and control",
          meaning:
            "Choose words that support subtle meaning, credibility, style, and confidence across varied communication contexts.",
          skillFocus: "mature vocabulary control",
          practiceActivity:
            "Compare drafts or presentations and discuss how vocabulary choices strengthen clarity, authority, subtlety, or emotional effect.",
          evidenceExamples: [
            "a refined writing or speaking sample with strong vocabulary choices",
            "a learner explanation of why a word was chosen",
            "a parent note about mature precision in language use",
          ],
          nextStep:
            "Use this language control across literature response, research, argument, and wider subject communication.",
          reportLanguage:
            "The learner is consolidating more mature control of vocabulary and can increasingly choose language with greater subtlety, precision, and confidence.",
        },
        {
          id: 2,
          title: "Reflect on how vocabulary shapes understanding and response",
          meaning:
            "Consider how word choices influence interpretation, tone, and the way ideas are received by others.",
          skillFocus: "reflective awareness of language impact",
          practiceActivity:
            "Review language in texts, arguments, and personal writing and discuss how vocabulary affected the message or the reader's response.",
          evidenceExamples: [
            "a reflection on vocabulary effect in a text or draft",
            "a learner critique of word choice and tone",
            "a parent note about reflective language awareness",
          ],
          nextStep:
            "These habits continue to support mature reading, writing, speaking, research, and literature interpretation across the wider English pathway.",
          reportLanguage:
            "The learner is strengthening reflective awareness of how vocabulary shapes understanding, tone, and response across different English contexts.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one earlier vocabulary-growth example and one later precision or analysis example so the portfolio shows growth from oral word learning into nuanced language control.",
    "Annotated reading responses and revised writing samples often provide strong evidence because they show how word choice affects understanding and expression.",
    "Learner reflections about choosing a better word or interpreting a figurative phrase can strengthen the portfolio by making language thinking visible.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in oral vocabulary, context-based understanding, precision, subject language, and the ability to explain word choice more thoughtfully.",
    "Examples are strongest when the learner can show how vocabulary supported comprehension, clearer writing, or richer interpretation of a text.",
    "Collected evidence can show a shift from everyday word learning toward deliberate, nuanced, and context-sensitive vocabulary use.",
  ],
};

const LITERATURE_AND_TEXT_RESPONSE: EnglishStrandConfig = {
  key: "literature-and-text-response",
  title: "Literature and text response",
  subtitle:
    "Literature and text response helps learners engage with stories, poems, characters, themes, voice, and interpretation. It supports empathy, comprehension, vocabulary, and richer written and spoken response.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on reading comprehension, speaking and listening, vocabulary, and writing. It supports interpretation, comparison, reflection, and thoughtful response across literary texts.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early literature response begins with enjoyment, favourite stories, character talk, and simple personal reactions to books, rhymes, and poems.",
      steps: [
        {
          id: 1,
          title: "Talk about favourite stories, characters, and parts",
          meaning:
            "Respond personally to books and poems by sharing what was liked, remembered, or felt important.",
          skillFocus: "personal response to literature",
          practiceActivity:
            "After a story or poem, ask what the learner liked best, which character mattered, or which part should be read again.",
          evidenceExamples: [
            "a parent note about a story response",
            "a short oral comment about a favourite character or part",
            "a drawing linked to a story response",
          ],
          nextStep:
            "Build on personal enjoyment by retelling events and noticing story details more clearly.",
          reportLanguage:
            "The learner is beginning to respond personally to stories and poems and is growing in confidence when talking about favourite parts or characters.",
        },
        {
          id: 2,
          title: "Retell simple literary events or images",
          meaning:
            "Use oral language, drawing, or acting to show what happened or what was imagined in a literary text.",
          skillFocus: "retelling and image response",
          practiceActivity:
            "Retell a story with puppets, drawings, or simple sequencing and talk about the images or events that stood out most.",
          evidenceExamples: [
            "a retelling note or drawing",
            "a parent summary of a poetry or story response",
            "a learner explanation of a key event or image",
          ],
          nextStep:
            "Carry this into lower-primary response, sequencing, and character discussion.",
          reportLanguage:
            "The learner is increasingly able to retell key parts of a story or poem and respond to memorable images and events in a meaningful way.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin discussing characters, settings, and simple themes while giving clearer reasons for what they enjoyed, noticed, or wondered about.",
      steps: [
        {
          id: 1,
          title: "Respond to characters, settings, and story choices",
          meaning:
            "Talk about who is in the text, where it happens, and why certain moments or choices matter.",
          skillFocus: "basic literary discussion and character response",
          practiceActivity:
            "Discuss a storybook or short poem and ask what a character was like, why something happened, or what setting details mattered.",
          evidenceExamples: [
            "a learner comment about character or setting",
            "a parent note from a literature discussion",
            "a simple response drawing or sentence",
          ],
          nextStep:
            "Build on this by comparing texts and using clearer reasons for opinions and responses.",
          reportLanguage:
            "The learner is beginning to respond more thoughtfully to characters, settings, and story choices and can give clearer reasons for personal responses.",
        },
        {
          id: 2,
          title: "Give a reason for a literary opinion or preference",
          meaning:
            "Move beyond 'I liked it' toward explaining why a text, poem, or character felt interesting or important.",
          skillFocus: "reasoned personal response",
          practiceActivity:
            "Ask why a learner preferred one story, poem, or character and encourage one or two clear reasons connected to the text.",
          evidenceExamples: [
            "a short oral or written literary opinion",
            "a parent note about giving reasons from the text",
            "a learner comparison of two favourite texts or parts",
          ],
          nextStep:
            "Carry this into middle-primary comparison, theme noticing, and richer text interpretation.",
          reportLanguage:
            "The learner is increasingly able to give reasons for literary opinions and is beginning to link personal responses more clearly to the text itself.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Literature response becomes more interpretive here through comparison, theme noticing, character motivation, and discussion of author choices.",
      steps: [
        {
          id: 1,
          title: "Notice themes, messages, and character motivation",
          meaning:
            "Look for the deeper ideas, lessons, or emotions that run through a story or poem.",
          skillFocus: "theme and interpretation",
          practiceActivity:
            "Discuss why a character acted a certain way, what message a story might carry, or what a poem seems to suggest.",
          evidenceExamples: [
            "a learner explanation of a theme or message",
            "a parent note from a deeper literature discussion",
            "annotated story or poetry notes",
          ],
          nextStep:
            "Use these interpretations in text comparison and author-choice discussion.",
          reportLanguage:
            "The learner is beginning to notice themes, messages, and character motivation and can increasingly explain ideas that sit beneath the surface of a text.",
        },
        {
          id: 2,
          title: "Compare how two texts create different responses",
          meaning:
            "Notice how different stories, poems, or passages create different feelings, ideas, or interpretations.",
          skillFocus: "comparative literary response",
          practiceActivity:
            "Compare two poems, two stories, or two scenes and discuss what each text made the learner think or feel and why.",
          evidenceExamples: [
            "a comparative literature response",
            "a learner explanation of different reactions to two texts",
            "a parent summary of a comparison discussion",
          ],
          nextStep:
            "Carry this into upper-primary analysis of author choices, viewpoint, and interpretation.",
          reportLanguage:
            "The learner is increasingly able to compare literary texts and explain how different texts create different responses or meanings.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now discuss literature more analytically, noticing author choices, perspective, imagery, and structure while still keeping personal response alive.",
      steps: [
        {
          id: 1,
          title: "Discuss how author choices shape a literary response",
          meaning:
            "Notice how language, structure, imagery, viewpoint, or pacing influences meaning and feeling.",
          skillFocus: "author-choice analysis in literature",
          practiceActivity:
            "Look closely at a passage or poem and discuss what the writer did to create tension, humour, sadness, curiosity, or another response.",
          evidenceExamples: [
            "an annotated passage or poem response",
            "a learner explanation of an author choice",
            "a parent note from a literature-analysis discussion",
          ],
          nextStep:
            "Use this analysis to support richer personal and comparative writing about literature.",
          reportLanguage:
            "The learner is beginning to notice how author choices shape a literary response and can increasingly explain those effects with clarity.",
        },
        {
          id: 2,
          title: "Use evidence to support a literary interpretation",
          meaning:
            "Refer to events, language, or details from the text to support a personal or analytical response.",
          skillFocus: "evidence-based literature response",
          practiceActivity:
            "Ask the learner to explain a literary idea and point to the words, events, or details that support it.",
          evidenceExamples: [
            "a written or spoken literature response using evidence",
            "a learner explanation of which text details mattered",
            "a parent note about evidence use in discussion",
          ],
          nextStep:
            "Carry this into lower-secondary interpretation, comparison, and mature literary critique.",
          reportLanguage:
            "The learner is increasingly able to support literary interpretations with evidence from the text rather than relying only on personal reaction.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens interpretation, comparison, and evidence-based literary response across novels, poems, drama, and wider text forms.",
      steps: [
        {
          id: 1,
          title: "Develop and justify a literary interpretation",
          meaning:
            "Move from a personal response toward a more developed interpretation that can be explained and supported.",
          skillFocus: "mature literary interpretation",
          practiceActivity:
            "Discuss a character arc, theme, symbol, or author choice and ask the learner to explain the interpretation with supporting evidence.",
          evidenceExamples: [
            "a developed literary response",
            "annotated text evidence supporting interpretation",
            "a parent note from a deeper literary discussion",
          ],
          nextStep:
            "Build this into stronger text comparison, perspective analysis, and critique.",
          reportLanguage:
            "The learner is developing more mature literary interpretations and can increasingly justify ideas with clear evidence from the text.",
        },
        {
          id: 2,
          title: "Compare texts through theme, perspective, or style",
          meaning:
            "Use literary language and evidence to compare how different texts explore similar ideas or effects.",
          skillFocus: "comparative literary analysis",
          practiceActivity:
            "Compare two stories, poems, or extracts and discuss how theme, perspective, or style changes the meaning and reader response.",
          evidenceExamples: [
            "a comparative literary paragraph or discussion summary",
            "a learner explanation of how two texts approached a shared idea differently",
            "a parent note about interpretive comparison",
          ],
          nextStep:
            "Carry this into later synthesis, critique, and mature literature response.",
          reportLanguage:
            "The learner is increasingly able to compare literary texts through theme, perspective, and style and can explain those differences with growing confidence.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together interpretation, critique, comparison, and personal insight so literature response becomes more mature, reflective, and well supported.",
      steps: [
        {
          id: 1,
          title: "Sustain thoughtful literary discussion and writing",
          meaning:
            "Respond to literature in ways that are reflective, analytical, and increasingly confident across different forms and texts.",
          skillFocus: "sustained literary engagement",
          practiceActivity:
            "Write or discuss extended responses to novels, poems, drama, or multimodal texts and reflect on how interpretation deepened over time.",
          evidenceExamples: [
            "an extended literature response",
            "a learner reflection on how understanding of a text changed",
            "a parent note about maturity in literary discussion",
          ],
          nextStep:
            "Use this sustained response to support later research, comparative analysis, and cross-text synthesis.",
          reportLanguage:
            "The learner is consolidating thoughtful literary discussion and writing and can increasingly sustain reflective and analytical engagement with a text.",
        },
        {
          id: 2,
          title: "Critique and synthesise literary ideas across texts",
          meaning:
            "Bring together interpretations, comparisons, and critique across several literary experiences rather than treating each text in isolation.",
          skillFocus: "synthesis and critique in literature response",
          practiceActivity:
            "Discuss several texts around a shared theme, author, genre, or idea and ask what deeper patterns or contrasts emerge across them.",
          evidenceExamples: [
            "a cross-text literary synthesis",
            "a learner critique of differing interpretations or author choices",
            "a parent summary of a later-stage literature conversation",
          ],
          nextStep:
            "These habits continue to support mature reading, writing, research, and reflective communication across the whole English pathway.",
          reportLanguage:
            "The learner is strengthening the ability to synthesise and critique literary ideas across texts with growing maturity and confidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early personal response and one later evidence-based interpretation so the portfolio shows growth from enjoyment and retelling into analysis and critique.",
    "Book discussions, annotated passages, and comparison notes often provide stronger evidence here than only final written responses.",
    "Learner reflections about favourite texts, shifting interpretations, or author choices can strengthen the portfolio by showing literary thinking over time.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in confidence, interpretation, comparison, and evidence use when responding to stories, poems, and other literary texts.",
    "Examples are strongest when the learner can explain not only what a text said, but why a theme, character, or author choice seemed important.",
    "Collected evidence can show a shift from simple enjoyment and retelling toward mature literary response, comparison, and critique.",
  ],
};

const RESEARCH_MEDIA_AND_DIGITAL_TEXTS: EnglishStrandConfig = {
  key: "research-media-and-digital-texts",
  title: "Research, media and digital texts",
  subtitle:
    "Research, media and digital texts helps learners ask questions, find information, evaluate sources, summarise clearly, and communicate through print, media, and digital forms. It connects reading, writing, speaking, and critical thinking.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on reading, writing, speaking and listening, vocabulary, and reasoning. It supports evidence-based learning, media literacy, digital composition, and wider communication across subjects.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early research and media awareness begins with asking questions, finding simple information in books or conversation, and talking about pictures, screens, and messages.",
      steps: [
        {
          id: 1,
          title: "Ask simple questions and look for answers",
          meaning:
            "Use curiosity to guide simple information-seeking through books, talk, observation, or shared searching.",
          skillFocus: "questioning and early information seeking",
          practiceActivity:
            "Ask simple what, where, or why questions during projects or story time and look together in books, pictures, or family discussion for an answer.",
          evidenceExamples: [
            "a parent note about a question the learner pursued",
            "a simple record of where an answer was found",
            "a learner explanation of what was discovered",
          ],
          nextStep:
            "Build on this by collecting simple facts and noticing that different sources can help in different ways.",
          reportLanguage:
            "The learner is beginning to ask purposeful questions and is growing in confidence when looking for simple answers through books, talk, or observation.",
        },
        {
          id: 2,
          title: "Talk about messages in pictures, stories, and screens",
          meaning:
            "Notice that images and media can show, suggest, or communicate ideas just as books and speech do.",
          skillFocus: "early media awareness",
          practiceActivity:
            "Look at story illustrations, simple adverts, signs, or educational media and ask what message they seem to be giving.",
          evidenceExamples: [
            "a learner comment about a picture or media message",
            "a parent note from a media-awareness conversation",
            "a simple drawing or explanation of a message noticed",
          ],
          nextStep:
            "Carry this into lower-primary fact finding, note collection, and simple media comparison.",
          reportLanguage:
            "The learner is growing in awareness that pictures, stories, and screens all communicate messages that can be noticed and discussed.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin gathering simple information, keeping short notes or drawings, and noticing that media and digital texts can be read, viewed, and discussed critically.",
      steps: [
        {
          id: 1,
          title: "Find and record simple information",
          meaning:
            "Use a clear question and gather a few relevant facts from shared sources in a manageable way.",
          skillFocus: "early research and note keeping",
          practiceActivity:
            "Use a simple topic inquiry, gather facts from a book or trusted source, and record them in pictures, labels, or short notes.",
          evidenceExamples: [
            "a simple fact page or note set",
            "a learner explanation of where information came from",
            "a parent note about gathering information for a question",
          ],
          nextStep:
            "Build from fact gathering into sorting information and sharing it more clearly with others.",
          reportLanguage:
            "The learner is beginning to find and record simple information and is growing in confidence when gathering facts for a clear purpose.",
        },
        {
          id: 2,
          title: "Notice what a media or digital text is trying to do",
          meaning:
            "Recognise that some texts are meant to inform, persuade, entertain, or direct the viewer or reader in a particular way.",
          skillFocus: "basic media purpose awareness",
          practiceActivity:
            "Look at simple websites, posters, videos, or advertisements and ask what the text seems to want the audience to think or do.",
          evidenceExamples: [
            "a learner explanation of a media purpose",
            "a parent note from a digital-text discussion",
            "a simple comparison of two text purposes",
          ],
          nextStep:
            "Carry this into middle-primary source choice, summary, and stronger media interpretation.",
          reportLanguage:
            "The learner is increasingly able to notice what a media or digital text is trying to do and can give simple reasons for that judgement.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Research and media work becomes more organised here through note-taking, source use, summary, and more careful interpretation of digital and media messages.",
      steps: [
        {
          id: 1,
          title: "Take notes and summarise key information",
          meaning:
            "Separate the most important ideas from extra detail and record them in a clear, usable way.",
          skillFocus: "note-taking and summary",
          practiceActivity:
            "Research a small topic, pull out key facts, and write or speak a short summary using notes rather than copying everything.",
          evidenceExamples: [
            "a set of short notes and a summary",
            "a learner explanation of what counted as the main idea",
            "a parent note about growing independence in research recording",
          ],
          nextStep:
            "Use these summaries to compare sources and shape clearer research communication.",
          reportLanguage:
            "The learner is beginning to take notes and summarise key information more clearly, showing greater awareness of what matters most in a source.",
        },
        {
          id: 2,
          title: "Compare sources and media messages thoughtfully",
          meaning:
            "Notice that two sources or media texts may present information differently and think about why.",
          skillFocus: "source comparison and media interpretation",
          practiceActivity:
            "Compare two books, articles, videos, or websites on a similar topic and discuss what each one emphasises or leaves out.",
          evidenceExamples: [
            "a source comparison note",
            "a learner explanation of how two sources differed",
            "a parent summary of a media-comparison discussion",
          ],
          nextStep:
            "Carry this into upper-primary evaluation, multimodal response, and more deliberate source selection.",
          reportLanguage:
            "The learner is increasingly able to compare sources and media messages and explain how different presentations shape understanding.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now evaluate sources more deliberately and communicate research through written, spoken, visual, and digital forms with clearer structure and purpose.",
      steps: [
        {
          id: 1,
          title: "Choose useful sources and explain why",
          meaning:
            "Select information sources more thoughtfully by considering relevance, clarity, and usefulness for the task.",
          skillFocus: "source selection and evaluation",
          practiceActivity:
            "Use books, websites, videos, or articles and ask the learner which source helped most for the task and why.",
          evidenceExamples: [
            "a source-choice reflection",
            "a learner explanation of which source was most useful",
            "a parent note about growing source awareness",
          ],
          nextStep:
            "Use better source choice to support stronger research communication and digital composition.",
          reportLanguage:
            "The learner is beginning to choose sources more deliberately and can increasingly explain why one source was more useful than another for a task.",
        },
        {
          id: 2,
          title: "Create a clear multimodal or digital response",
          meaning:
            "Communicate research or ideas through combinations of writing, speaking, visuals, and digital elements.",
          skillFocus: "multimodal composition and communication",
          practiceActivity:
            "Create a slideshow, poster, video explanation, or combined written-and-visual response that presents researched information clearly.",
          evidenceExamples: [
            "a multimodal presentation or digital response",
            "a learner explanation of how choices suited the audience",
            "a parent note about organisation and digital communication",
          ],
          nextStep:
            "Carry this into lower-secondary evaluation, synthesis, and critical media literacy.",
          reportLanguage:
            "The learner is increasingly able to communicate research through multimodal and digital forms with growing clarity, structure, and audience awareness.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens evaluation, synthesis, digital communication, and critical media literacy so learners can use and question information more maturely.",
      steps: [
        {
          id: 1,
          title: "Evaluate source quality and usefulness more critically",
          meaning:
            "Look beyond surface appearance and consider whether a source is trustworthy, balanced, current, and well suited to the task.",
          skillFocus: "critical source evaluation",
          practiceActivity:
            "Compare websites, articles, videos, or secondary sources and ask what makes one stronger, weaker, more reliable, or more limited.",
          evidenceExamples: [
            "a source evaluation note or rubric",
            "a learner explanation of why a source was trusted or questioned",
            "a parent note from a research-quality discussion",
          ],
          nextStep:
            "Use stronger evaluation to support more reliable synthesis and evidence-based communication.",
          reportLanguage:
            "The learner is developing stronger source-evaluation habits and can increasingly explain why a source seems more or less useful or trustworthy for a task.",
        },
        {
          id: 2,
          title: "Synthesize information and communicate it clearly",
          meaning:
            "Bring together information from several sources and shape it into a clear response rather than listing facts separately.",
          skillFocus: "synthesis and research communication",
          practiceActivity:
            "Use notes from several sources to produce a report, explanation, or digital response that combines ideas coherently for an audience.",
          evidenceExamples: [
            "a multi-source summary or presentation",
            "a learner explanation of how ideas from different sources were combined",
            "a parent note about evidence-based communication",
          ],
          nextStep:
            "Carry this into later critique of media, argument, and mature research communication across subjects.",
          reportLanguage:
            "The learner is increasingly able to synthesise information from more than one source and communicate it in a clearer, more organised way.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together critique, synthesis, digital composition, and media literacy so learners can use and question information with greater maturity and independence.",
      steps: [
        {
          id: 1,
          title: "Critique media and information claims thoughtfully",
          meaning:
            "Question how a text, platform, or source shapes a message and whether the evidence behind it is strong enough.",
          skillFocus: "critical media literacy and claim analysis",
          practiceActivity:
            "Review articles, posts, videos, or campaigns and discuss what message is being pushed, how it is shaped, and whether the supporting evidence is strong.",
          evidenceExamples: [
            "a critique of a media or information claim",
            "a learner explanation of bias, omission, or persuasive technique",
            "a parent note about mature media analysis",
          ],
          nextStep:
            "Use this critical literacy in later research, reporting, citizenship, and cross-subject communication.",
          reportLanguage:
            "The learner is consolidating stronger media literacy and can increasingly critique information claims with attention to message, evidence, and influence.",
        },
        {
          id: 2,
          title: "Communicate researched ideas clearly across formats",
          meaning:
            "Adapt research communication for written, spoken, visual, and digital settings with clearer judgement about audience and purpose.",
          skillFocus: "mature research communication across formats",
          practiceActivity:
            "Prepare a report, presentation, digital post, or multimodal product and reflect on how the communication changed across formats.",
          evidenceExamples: [
            "a later-stage research communication piece",
            "a learner reflection on audience and format choices",
            "a parent note about independent research communication",
          ],
          nextStep:
            "These habits continue to support literature response, writing, speaking, and confident evidence-based communication across the wider pathway system.",
          reportLanguage:
            "The learner is strengthening the ability to communicate researched ideas across written, spoken, and digital formats with growing maturity and purpose.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early inquiry or note-taking example and one later media critique or multi-source response so the portfolio shows growth from curiosity into mature research communication.",
    "Research notes, source comparisons, and multimodal responses often provide stronger evidence than a finished product alone because they show how information was gathered and shaped.",
    "Learner reflections about why a source was useful or why a media claim was questioned can make the pathway growth especially visible.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in questioning, note-taking, source choice, synthesis, and media literacy rather than only the final project product.",
    "Examples are strongest when the learner explains how information was selected, combined, checked, and communicated for a real purpose.",
    "Collected evidence can show a shift from simple fact-finding toward thoughtful source evaluation, synthesis, and critical media interpretation.",
  ],
};

export const ENGLISH_STRAND_WORKSPACE_BUILDERS: Record<string, StrandBuilder> = {
  "morphology-and-spelling": (currentFocusStageKey) =>
    buildEnglishWorkspace(currentFocusStageKey, MORPHOLOGY_AND_SPELLING),
  "reading-and-comprehension": (currentFocusStageKey) =>
    buildEnglishWorkspace(currentFocusStageKey, READING_AND_COMPREHENSION),
  "writing-and-composition": (currentFocusStageKey) =>
    buildEnglishWorkspace(currentFocusStageKey, WRITING_AND_COMPOSITION),
  "speaking-and-listening": (currentFocusStageKey) =>
    buildEnglishWorkspace(currentFocusStageKey, SPEAKING_AND_LISTENING),
  "spelling-and-word-study": (currentFocusStageKey) =>
    buildEnglishWorkspace(currentFocusStageKey, SPELLING_AND_WORD_STUDY),
  "grammar-punctuation-and-language": (currentFocusStageKey) =>
    buildEnglishWorkspace(currentFocusStageKey, GRAMMAR_PUNCTUATION_AND_LANGUAGE),
  "vocabulary-and-word-meaning": (currentFocusStageKey) =>
    buildEnglishWorkspace(currentFocusStageKey, VOCABULARY_AND_WORD_MEANING),
  "literature-and-text-response": (currentFocusStageKey) =>
    buildEnglishWorkspace(currentFocusStageKey, LITERATURE_AND_TEXT_RESPONSE),
  "research-media-and-digital-texts": (currentFocusStageKey) =>
    buildEnglishWorkspace(currentFocusStageKey, RESEARCH_MEDIA_AND_DIGITAL_TEXTS),
};
