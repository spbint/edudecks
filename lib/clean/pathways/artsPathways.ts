import type { MathematicsDetailedStrandWorkspace } from "@/lib/clean/pathways/mathematicsDetailedStrands";
import type { PathwayStageKey } from "@/lib/clean/pathways/mathematicsNumberPrototype";
import type { SubjectStrandCard } from "@/lib/clean/pathways/subjectPathwayTypes";

type ArtsStepInput = {
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

type ArtsStageInput = {
  key: PathwayStageKey;
  helper: string;
  steps: [ArtsStepInput, ArtsStepInput];
};

type ArtsStrandConfig = {
  key: string;
  title: string;
  subtitle: string;
  relationshipTitle: string;
  relationshipCopy: string;
  portfolioSupport: string[];
  reportingSupport: string[];
  stages: ArtsStageInput[];
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

function buildArtsStep(step: ArtsStepInput) {
  return {
    id: step.id,
    title: step.title,
    meaning: step.meaning,
    skillFocus: step.skillFocus,
    learningIntention:
      step.learningIntention ||
      `Develop ${step.skillFocus} through making, noticing, practising, reflecting, and sharing ideas in age-appropriate ways.`,
    successCriteria: step.successCriteria || [
      "The learner can use this idea in a familiar creative task or response.",
      "The learner can show, explain, or describe what was created, noticed, or improved.",
      "The learner can respond to feedback or reflection about choices, meaning, or effect.",
    ],
    practiceActivity: step.practiceActivity,
    evidenceExamples: step.evidenceExamples,
    assessmentCheck:
      step.assessmentCheck ||
      "Later, check whether the learner can use this more independently and explain the creative choice or response more clearly.",
    nextStep: step.nextStep,
    reportLanguage: step.reportLanguage,
  };
}

function buildArtsWorkspace(
  currentFocusStageKey: PathwayStageKey,
  config: ArtsStrandConfig,
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
      steps: stage.steps.map(buildArtsStep),
    })),
    portfolioSupport: config.portfolioSupport,
    reportingSupport: config.reportingSupport,
  };
}

export const DEFAULT_ARTS_STRAND_KEY = "visual-arts-and-design";

export const ARTS_SUBJECT_OVERVIEW = {
  eyebrow: "Arts F-10 / K-10 strand map",
  title: "Arts pathway overview",
  description:
    "This first Arts build shows visual arts, music, drama, dance, media arts, and responding to artworks as connected strands. Each strand uses the same calm stage-based pathway workspace as the other detailed subjects.",
  helper:
    "Choose one strand to explore. The selected strand opens in the focused workspace below, so Arts stays creative and readable rather than becoming a long theory-heavy wall.",
};

export const ARTS_DOMAIN_CARDS: SubjectStrandCard[] = [
  {
    key: "visual-arts-and-design",
    title: "Visual arts and design",
    description:
      "Explore drawing, painting, collage, sculpture, colour, shape, texture, and visual communication.",
    whyItMatters:
      "Visual arts connects observation, design, materials, and personal expression in practical creative work.",
    status: "first-detailed",
  },
  {
    key: "music-and-sound",
    title: "Music and sound",
    description:
      "Build listening, beat, rhythm, pitch, melody, voice, instruments, sound patterns, and simple composing.",
    whyItMatters:
      "Music connects listening, pattern, rhythm, performance, and cultural expression in accessible ways.",
    status: "detailed",
  },
  {
    key: "drama-and-performance",
    title: "Drama and performance",
    description:
      "Develop role play, character, voice, gesture, storytelling, improvisation, scenes, and audience awareness.",
    whyItMatters:
      "Drama supports speaking, listening, storytelling, imagination, and confidence-building through shared creative play.",
    status: "detailed",
  },
  {
    key: "dance-and-movement",
    title: "Dance and movement",
    description:
      "Explore body awareness, rhythm, movement patterns, space, coordination, choreography, and expression.",
    whyItMatters:
      "Dance connects movement, rhythm, expression, and physical awareness in practical, family-friendly ways.",
    status: "detailed",
  },
  {
    key: "media-arts-and-storytelling",
    title: "Media arts and storytelling",
    description:
      "Use images, video, audio, framing, sequence, editing, audience, and multimodal storytelling choices.",
    whyItMatters:
      "Media arts connects visual choices, technology, storytelling, and audience awareness in modern communication.",
    status: "detailed",
  },
  {
    key: "responding-to-artworks-and-creative-choices",
    title: "Responding to artworks and creative choices",
    description:
      "Notice, describe, interpret, compare, and reflect on artworks, meaning, context, and creative decisions.",
    whyItMatters:
      "Responding to artworks supports reflection, vocabulary, interpretation, and respectful discussion about creative work.",
    status: "detailed",
  },
];

const VISUAL_ARTS_AND_DESIGN: ArtsStrandConfig = {
  key: "visual-arts-and-design",
  title: "Visual arts and design",
  subtitle:
    "Visual arts and design helps learners notice the world carefully, make visual choices, and communicate through drawing, painting, collage, sculpture, and design. It grows from playful mark-making into more deliberate composition, material choice, and visual explanation.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on observation, fine-motor practice, and imagination. It connects to design, materials, media arts, and personal expression through visual choices.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early visual arts begins with mark-making, colour play, shape noticing, and using everyday materials to represent ideas.",
      steps: [
        {
          id: 1,
          title: "Make marks, lines, and shapes to share an idea",
          meaning:
            "Use drawing, painting, or collage play to show something noticed, imagined, or felt.",
          skillFocus: "early visual expression",
          practiceActivity:
            "Draw a pet, paint weather colours, or use collage to show a favourite place using simple materials.",
          evidenceExamples: [
            "a photo of an early art piece",
            "a learner explanation of what the picture shows",
            "a parent note about colour or shape choices",
          ],
          nextStep:
            "Build from playful mark-making into talking about colour, shape, and what an artwork is trying to show.",
          reportLanguage:
            "The learner is beginning to use lines, shapes, and colour to represent ideas and share personal meaning through visual work.",
        },
        {
          id: 2,
          title: "Notice colour, texture, and material differences",
          meaning:
            "See that different materials and colours create different effects in an artwork.",
          skillFocus: "early visual noticing",
          practiceActivity:
            "Compare crayons, paint, torn paper, clay, or natural materials and talk about how each changes the picture or object.",
          evidenceExamples: [
            "a material comparison note",
            "a learner statement about colour or texture choice",
            "a parent note from a simple art discussion",
          ],
          nextStep:
            "Carry this into lower-primary work on choosing materials and arranging artworks more deliberately.",
          reportLanguage:
            "The learner is developing early awareness that colours, textures, and materials can change how an artwork looks and feels.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin choosing materials more deliberately and arranging artworks with clearer subject, colour, and shape choices.",
      steps: [
        {
          id: 1,
          title: "Choose materials to suit a simple visual idea",
          meaning:
            "Match crayons, paint, collage, clay, or mixed media to what the artwork needs to show.",
          skillFocus: "material choice in visual art",
          practiceActivity:
            "Choose one or two materials for a picture, poster, mask, or sculpture and explain why they fit the idea.",
          evidenceExamples: [
            "a labelled artwork or sketch",
            "a learner explanation of material choice",
            "a parent note about how choices supported the idea",
          ],
          nextStep:
            "Use material choice to support stronger composition and detail decisions.",
          reportLanguage:
            "The learner is increasingly able to choose simple materials to suit a visual idea and explain those choices with growing confidence.",
        },
        {
          id: 2,
          title: "Arrange shapes, objects, or images with a purpose",
          meaning:
            "Think about where things go on the page or in the artwork so the picture or object makes more sense.",
          skillFocus: "early composition",
          practiceActivity:
            "Arrange a collage, poster, drawing, or small sculpture and talk about why one object went in one place rather than another.",
          evidenceExamples: [
            "a photo of an arranged artwork",
            "a learner comment about where the eye goes first",
            "a parent note on layout or arrangement choices",
          ],
          nextStep:
            "Carry this into middle-primary work on viewpoint, detail, and stronger design decisions.",
          reportLanguage:
            "The learner is beginning to arrange visual elements more deliberately and can explain simple choices about placement and composition.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary learning strengthens observation, composition, design intention, and how visual choices affect the viewer.",
      steps: [
        {
          id: 1,
          title: "Use observation to add detail and intention",
          meaning:
            "Look more carefully at objects, people, or places so the artwork includes clearer shape, pattern, or proportion choices.",
          skillFocus: "observational art and design",
          practiceActivity:
            "Draw from a plant, object, room, or photograph and discuss what was noticed more carefully the second time.",
          evidenceExamples: [
            "an observational sketch",
            "a learner explanation of details added",
            "a parent note about noticing and refinement",
          ],
          nextStep:
            "Use stronger observation to support more deliberate composition and visual communication.",
          reportLanguage:
            "The learner is increasingly able to use observation to strengthen detail, shape, and intention in visual artworks.",
        },
        {
          id: 2,
          title: "Explain how a visual choice changes the effect",
          meaning:
            "Recognise that colour, line, size, contrast, or placement can make an artwork feel different or communicate more clearly.",
          skillFocus: "effect of visual choices",
          practiceActivity:
            "Compare two versions of a drawing or poster and discuss how colour, spacing, or contrast changes the message.",
          evidenceExamples: [
            "a comparison of two visual choices",
            "a learner explanation of artistic effect",
            "a parent summary of a discussion about visual impact",
          ],
          nextStep:
            "Carry this into upper-primary refinement of style, composition, and design purpose.",
          reportLanguage:
            "The learner is beginning to explain how visual choices such as colour, line, and placement change the effect of an artwork.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin refining style, composition, and design choices more deliberately while considering audience and meaning.",
      steps: [
        {
          id: 1,
          title: "Plan a visual work for a clearer purpose or audience",
          meaning:
            "Think about who will see the artwork and what idea, feeling, or message it should communicate.",
          skillFocus: "audience and purpose in visual design",
          practiceActivity:
            "Create a poster, illustration, artwork series, or sculpture with a clear purpose and explain who it is for.",
          evidenceExamples: [
            "a sketch plan with audience notes",
            "a learner explanation of intended message",
            "a parent note about purpose-driven design choices",
          ],
          nextStep:
            "Use audience awareness to support stronger refinement, evaluation, and visual problem-solving.",
          reportLanguage:
            "The learner is increasingly able to plan visual work with a clearer sense of purpose and audience.",
        },
        {
          id: 2,
          title: "Refine an artwork after reviewing how it looks and feels",
          meaning:
            "Use self-review or feedback to improve balance, detail, contrast, clarity, or visual impact.",
          skillFocus: "visual refinement and review",
          practiceActivity:
            "Review an artwork after a break, ask what stands out or feels unclear, and change one part intentionally.",
          evidenceExamples: [
            "before-and-after artwork photos",
            "a learner note about a visual improvement",
            "a parent summary of a reflection discussion",
          ],
          nextStep:
            "Carry this into lower-secondary evaluation of style, materials, and visual communication choices.",
          reportLanguage:
            "The learner is beginning to refine visual work more thoughtfully after review and can explain how changes strengthen the final piece.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens style choices, visual communication, and more deliberate evaluation of how an artwork uses materials, composition, and meaning.",
      steps: [
        {
          id: 1,
          title: "Use style and visual conventions more deliberately",
          meaning:
            "Recognise that different approaches to image-making can help create different effects or messages.",
          skillFocus: "style and visual convention awareness",
          practiceActivity:
            "Try two visual approaches to the same idea and explain how the style changed the meaning or mood.",
          evidenceExamples: [
            "a comparison of two visual styles",
            "a learner explanation of style choice",
            "a parent note about mood, message, or design effect",
          ],
          nextStep:
            "Use style awareness to support later critical comparison and stronger visual evaluation.",
          reportLanguage:
            "The learner is increasingly able to use style and visual conventions more deliberately to shape meaning and effect.",
        },
        {
          id: 2,
          title: "Evaluate how well visual choices communicate the idea",
          meaning:
            "Look critically at whether composition, material, and design choices actually support the intended message.",
          skillFocus: "evaluation of visual communication",
          practiceActivity:
            "Review an artwork or design and explain which choices communicated clearly and which parts could be stronger.",
          evidenceExamples: [
            "a visual evaluation note",
            "a learner explanation of strengths and changes",
            "a parent summary of critical art reflection",
          ],
          nextStep:
            "Build toward later consolidation where artworks and design responses are compared more critically and communicated more clearly.",
          reportLanguage:
            "The learner is developing stronger skill in evaluating how effectively visual choices communicate meaning and intention.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together observation, style, design purpose, material choice, and clearer communication about visual decision-making.",
      steps: [
        {
          id: 1,
          title: "Compare visual responses more critically",
          meaning:
            "Weigh how different artworks or design responses communicate, use materials, and affect an audience.",
          skillFocus: "critical comparison of visual responses",
          practiceActivity:
            "Compare two artworks, posters, or design responses and explain which one communicates more effectively and why.",
          evidenceExamples: [
            "a comparison of visual responses",
            "a learner explanation of stronger communication choices",
            "a parent note from a reflective discussion",
          ],
          nextStep:
            "Use this evaluative habit across media, design, portfolio curation, and future arts study.",
          reportLanguage:
            "The learner is consolidating the ability to compare visual responses critically and explain which choices create stronger communication and impact.",
        },
        {
          id: 2,
          title: "Communicate visual process and intention clearly",
          meaning:
            "Present how an artwork or design developed, what choices were made, and what the final work aims to communicate.",
          skillFocus: "clear visual-art communication",
          practiceActivity:
            "Create a short artist statement, visual journal, display card, or presentation explaining process, choices, and meaning.",
          evidenceExamples: [
            "an artist statement or process journal",
            "a learner explanation of visual choices and message",
            "a visual timeline of drafts, refinements, and final work",
          ],
          nextStep:
            "These habits continue to support stronger portfolio evidence, reporting, and creative confidence.",
          reportLanguage:
            "The learner is strengthening the ability to communicate visual process and intention clearly, using reflection and explanation with growing confidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early playful artwork, one mid-stage observational or composition example, and one later reflection on visual choices so growth in visual expression is visible over time.",
    "Photos of drafts, experiments, finished pieces, and short learner explanations often make stronger portfolio evidence than a final image alone.",
    "A portfolio becomes stronger when it shows how the learner moved from playful making into observation, refinement, and clearer visual communication.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in observation, composition, material use, design intention, and reflection rather than only naming media used.",
    "Examples are strongest when the learner explains what an artwork was trying to communicate and how visual choices supported that purpose.",
    "Collected evidence can show a clear shift from early image-making into more deliberate and reflective visual design decisions.",
  ],
};

const MUSIC_AND_SOUND: ArtsStrandConfig = {
  key: "music-and-sound",
  title: "Music and sound",
  subtitle:
    "Music and sound helps learners listen carefully, recognise beat and rhythm, use voice and instruments, create patterns, and respond to how music feels and communicates. It grows from playful sound-making into more deliberate composing, performing, and reflection.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on listening, pattern, movement, and expression. It connects to mathematics through rhythm and sequence, to performance confidence, and to cultural expression through song and sound.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early music begins with listening, echoing sound patterns, moving to beat, and using voice or simple objects to make sound.",
      steps: [
        {
          id: 1,
          title: "Listen and respond to beat and sound changes",
          meaning:
            "Notice loud and quiet, fast and slow, high and low, and simple beat patterns in music and sound play.",
          skillFocus: "early music listening",
          practiceActivity:
            "Clap along to a beat, move to fast and slow music, or play a listening game using voices and everyday sounds.",
          evidenceExamples: [
            "a parent note about beat-following or listening response",
            "a short video of movement to music",
            "a learner explanation of a sound difference noticed",
          ],
          nextStep:
            "Build from listening into echoing rhythms and creating simple sound patterns.",
          reportLanguage:
            "The learner is beginning to listen closely to music and sound and respond to simple beat, speed, and sound changes.",
        },
        {
          id: 2,
          title: "Use voice or simple instruments to copy a pattern",
          meaning:
            "Echo a short rhythm or sound idea using clapping, tapping, singing, or safe household instruments.",
          skillFocus: "early rhythm and pattern making",
          practiceActivity:
            "Copy short clap patterns, echo voice sounds, or tap simple repeated beats with kitchen or classroom objects.",
          evidenceExamples: [
            "a video or note about echoing a rhythm",
            "a learner demonstration of a repeated sound pattern",
            "a parent note about using voice or instruments confidently",
          ],
          nextStep:
            "Carry this into lower-primary pattern creation and simple song or rhythm performance.",
          reportLanguage:
            "The learner is developing early confidence in using voice or simple instruments to copy and share short sound patterns.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin keeping a steadier beat, noticing pitch and rhythm more clearly, and creating short musical ideas of their own.",
      steps: [
        {
          id: 1,
          title: "Keep a simple beat and join in short musical patterns",
          meaning:
            "Use body percussion, singing, or simple instruments to stay with a repeated beat or pattern for longer.",
          skillFocus: "steady beat and participation",
          practiceActivity:
            "Sing or chant with beat, use hand percussion, or keep time during a short piece with adult guidance.",
          evidenceExamples: [
            "a parent note about keeping beat",
            "a learner recording of a simple rhythm task",
            "a short reflection on joining in music confidently",
          ],
          nextStep:
            "Use steadier beat awareness to support rhythm creation and comparison.",
          reportLanguage:
            "The learner is increasingly able to keep a simple beat and participate in short musical patterns with growing confidence.",
        },
        {
          id: 2,
          title: "Create a short rhythm or sound idea",
          meaning:
            "Make a simple musical pattern using claps, voice, percussion, or found sounds and explain the choice.",
          skillFocus: "early composing",
          practiceActivity:
            "Create a short rhythm phrase, call-and-response, or sound pattern and share it with a family member or small group if comfortable.",
          evidenceExamples: [
            "a recording or notation of a simple pattern",
            "a learner explanation of how the pattern was made",
            "a parent note about a short composing activity",
          ],
          nextStep:
            "Carry this into middle-primary melody, structure, and response to music.",
          reportLanguage:
            "The learner is beginning to create simple rhythm or sound ideas and can explain basic choices made during the process.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary music strengthens rhythm, pitch, performance confidence, and simple composition with clearer structure and reflection.",
      steps: [
        {
          id: 1,
          title: "Use rhythm and pitch more deliberately",
          meaning:
            "Notice and shape how a musical idea sounds by changing note direction, pattern length, repetition, or contrast.",
          skillFocus: "rhythm and pitch control",
          practiceActivity:
            "Sing a short phrase, play a simple melody pattern, or vary a rhythm to change the feel of the piece.",
          evidenceExamples: [
            "a short recording of a melody or rhythm variation",
            "a learner explanation of how the sound changed",
            "a parent note from a music-making discussion",
          ],
          nextStep:
            "Use stronger rhythm and pitch control to support upper-primary structure and audience awareness.",
          reportLanguage:
            "The learner is increasingly able to use rhythm and pitch more deliberately and notice how changes affect the musical result.",
        },
        {
          id: 2,
          title: "Reflect on how music creates mood or response",
          meaning:
            "Notice that tempo, dynamics, repetition, and instrument or voice choices can change how music feels.",
          skillFocus: "responding to musical effect",
          practiceActivity:
            "Compare two pieces or versions of a piece and talk about which sounds calm, energetic, serious, playful, or dramatic and why.",
          evidenceExamples: [
            "a learner response to two music examples",
            "a parent note about mood or effect discussion",
            "a simple reflection on a favourite sound choice",
          ],
          nextStep:
            "Carry this into upper-primary composition and performance choices with clearer audience awareness.",
          reportLanguage:
            "The learner is beginning to explain how musical choices can shape mood, energy, and audience response.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin organising musical ideas more deliberately and choosing how to share or perform them with more confidence if comfortable.",
      steps: [
        {
          id: 1,
          title: "Organise a short musical piece with a clearer structure",
          meaning:
            "Arrange a beginning, repeated section, change, or ending so the music feels more complete.",
          skillFocus: "musical structure and organisation",
          practiceActivity:
            "Create or adapt a short piece with a simple pattern such as intro, repeat, contrast, and ending using voice, percussion, or accessible instruments.",
          evidenceExamples: [
            "a recording or plan of a short structured piece",
            "a learner explanation of how the piece was organised",
            "a parent note about choices in structure",
          ],
          nextStep:
            "Use structure to support lower-secondary refinement, rehearsal, and evaluation.",
          reportLanguage:
            "The learner is increasingly able to organise short musical ideas into a clearer structure and explain how the parts fit together.",
        },
        {
          id: 2,
          title: "Share music with growing confidence and reflection",
          meaning:
            "Use optional performance or sharing opportunities to build confidence, expression, and audience awareness without making public performance compulsory.",
          skillFocus: "confidence-building performance and reflection",
          practiceActivity:
            "Share a short piece with family, record it privately, or explain it verbally if performing live is not the best fit.",
          evidenceExamples: [
            "a private recording or family sharing note",
            "a learner reflection on how it felt to share or perform",
            "a parent note about confidence and expression",
          ],
          nextStep:
            "Carry this into lower-secondary evaluation of musical choices and stronger communication of intention.",
          reportLanguage:
            "The learner is beginning to share musical work with more confidence and can reflect on how musical choices and audience awareness shaped the experience.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens composition, interpretation, rehearsal, and more deliberate explanation of musical choices and their effects.",
      steps: [
        {
          id: 1,
          title: "Refine musical choices through rehearsal or revision",
          meaning:
            "Use repeated listening or practice to improve timing, expression, balance, or clarity in a piece.",
          skillFocus: "refinement through repetition and review",
          practiceActivity:
            "Rehearse a short performance, revise a recording, or alter a composition after listening back and noting what could improve.",
          evidenceExamples: [
            "a before-and-after recording or reflection",
            "a learner explanation of one musical improvement",
            "a parent note about rehearsal and refinement",
          ],
          nextStep:
            "Use refinement to support later critical comparison and stronger artistic intention.",
          reportLanguage:
            "The learner is increasingly able to refine musical work through rehearsal or review and explain how changes improved the final result.",
        },
        {
          id: 2,
          title: "Explain how musical choices support meaning or effect",
          meaning:
            "Describe how rhythm, tempo, pitch, voice, repetition, or sound colour contribute to a musical idea.",
          skillFocus: "analysis of musical effect",
          practiceActivity:
            "Discuss or compare two pieces and explain how one musical choice shapes the energy, feeling, or message more clearly.",
          evidenceExamples: [
            "a short analysis of a music example",
            "a learner explanation of one intentional sound choice",
            "a parent summary of a reflective music discussion",
          ],
          nextStep:
            "Build toward later consolidation where musical responses are compared more critically and communicated more clearly.",
          reportLanguage:
            "The learner is developing stronger understanding of how musical choices support meaning, mood, and audience response.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together listening, composition, optional performance, reflection, and clearer communication about musical intention and effect.",
      steps: [
        {
          id: 1,
          title: "Compare musical responses and choices critically",
          meaning:
            "Weigh how different pieces, versions, or performances use rhythm, sound, and structure to create effect.",
          skillFocus: "critical comparison of musical responses",
          practiceActivity:
            "Compare two performances or pieces and explain which one communicates more clearly or effectively and why.",
          evidenceExamples: [
            "a comparison of musical responses",
            "a learner explanation of stronger musical effect",
            "a parent note from a reflective listening discussion",
          ],
          nextStep:
            "Use this evaluative habit across portfolio curation, arts reporting, and future music learning.",
          reportLanguage:
            "The learner is consolidating the ability to compare musical responses critically and explain which choices create stronger communication and effect.",
        },
        {
          id: 2,
          title: "Communicate music-making and response clearly",
          meaning:
            "Present how a musical piece was created, chosen, performed, or interpreted and what shaped the final result.",
          skillFocus: "clear musical communication",
          practiceActivity:
            "Create a short reflection, artist statement, listening response, or presentation about a musical process or response.",
          evidenceExamples: [
            "a music reflection or presentation",
            "a learner explanation of musical choices and intention",
            "a short record of process, revision, or response",
          ],
          nextStep:
            "These habits continue to support stronger portfolio evidence, reporting, and confident musical engagement.",
          reportLanguage:
            "The learner is strengthening the ability to communicate music-making and musical response clearly, using reflection and explanation with growing confidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early listening or rhythm example, one mid-stage composition or response, and one later reflection on musical choices so growth is visible over time.",
    "Short recordings, rhythm patterns, reflection notes, and learner explanations often make stronger portfolio evidence than a polished performance alone.",
    "A portfolio becomes stronger when it shows how the learner moved from sound play into listening, organising, refining, and explaining musical ideas.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in listening, beat, rhythm, composition, response, and confidence rather than only naming songs or pieces completed.",
    "Examples are strongest when the learner explains how a musical choice affected the result or how listening led to a stronger performance or composition.",
    "Collected evidence can show a clear shift from early sound exploration into more deliberate and reflective musical thinking.",
  ],
};

const DRAMA_AND_PERFORMANCE: ArtsStrandConfig = {
  key: "drama-and-performance",
  title: "Drama and performance",
  subtitle:
    "Drama and performance helps learners explore role play, character, story, voice, gesture, and audience awareness. It grows from imaginative play into more deliberate scene-making, interpretation, and reflection, with sharing used as a confidence-building option rather than a compulsory public task.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on speaking, listening, storytelling, and imagination. It supports confidence, communication, empathy, and expressive interpretation across many learning areas.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early drama begins with pretend play, role taking, simple story action, and using voice or movement to show an idea.",
      steps: [
        {
          id: 1,
          title: "Use pretend play to explore characters and situations",
          meaning:
            "Take on a simple role and show what that role might do, say, or feel in a playful context.",
          skillFocus: "early role play and imagination",
          practiceActivity:
            "Act out a shop, animal, family routine, story scene, or make-believe journey using simple props or gestures.",
          evidenceExamples: [
            "a parent note about role play or imaginative story action",
            "a short video or photo of dramatic play",
            "a learner explanation of who they were pretending to be",
          ],
          nextStep:
            "Build from pretend play into short scenes and clearer use of voice and gesture.",
          reportLanguage:
            "The learner is beginning to use pretend play and simple roles to explore ideas, feelings, and stories with growing confidence.",
        },
        {
          id: 2,
          title: "Use voice and movement to show a simple idea",
          meaning:
            "Change expression, sound, or body movement to make a character or story moment easier to understand.",
          skillFocus: "early dramatic expression",
          practiceActivity:
            "Use facial expression, movement, and voice to act out happy, worried, sleepy, excited, or story-based moments.",
          evidenceExamples: [
            "a learner demonstration of an emotion or role",
            "a parent note about voice or gesture choices",
            "a short reflection on how movement helped tell the story",
          ],
          nextStep:
            "Carry this into lower-primary scene work and storytelling with clearer audience awareness.",
          reportLanguage:
            "The learner is developing early dramatic expression and can use simple voice and movement choices to make an idea clearer.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin shaping short scenes, taking turns in role, and using story sequence, gesture, and voice more deliberately.",
      steps: [
        {
          id: 1,
          title: "Build a short scene from a story or idea",
          meaning:
            "Use beginning, middle, and end to act out a brief moment or sequence with one or more roles.",
          skillFocus: "simple scene building",
          practiceActivity:
            "Act out a storybook moment, family situation, historical scene, or imagined event with simple actions and dialogue.",
          evidenceExamples: [
            "a photo or note from a short scene",
            "a learner explanation of what happened first, next, and last",
            "a parent note about dramatic sequencing",
          ],
          nextStep:
            "Use scene-building to support stronger character choices and audience awareness.",
          reportLanguage:
            "The learner is increasingly able to build short scenes and use sequence to make a dramatic idea easier to follow.",
        },
        {
          id: 2,
          title: "Show a character through voice, gesture, or movement",
          meaning:
            "Make role choices more visible so another person can tell who the character is or how the character feels.",
          skillFocus: "character expression",
          practiceActivity:
            "Choose a story or role and decide how that character might sound, stand, move, or react.",
          evidenceExamples: [
            "a learner explanation of character choices",
            "a parent note about a role becoming clearer",
            "a simple reflection on what helped the audience understand",
          ],
          nextStep:
            "Carry this into middle-primary improvisation, interpretation, and stronger dramatic choices.",
          reportLanguage:
            "The learner is beginning to use voice, gesture, and movement more deliberately to communicate character and feeling.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary drama strengthens improvisation, character development, and reflection on what helps a scene communicate effectively.",
      steps: [
        {
          id: 1,
          title: "Improvise ideas and responses in role",
          meaning:
            "Stay in role more steadily and respond creatively when a scene changes or a new prompt is introduced.",
          skillFocus: "improvisation and role development",
          practiceActivity:
            "Use a prompt card, scene starter, or story problem and improvise what a character might say or do next.",
          evidenceExamples: [
            "a parent note about improvisation confidence",
            "a learner explanation of how a role was developed",
            "a short video or summary of an improvised scene",
          ],
          nextStep:
            "Use improvisation to support stronger scene shaping and clearer dramatic intention.",
          reportLanguage:
            "The learner is increasingly able to improvise in role and develop character ideas with growing confidence and flexibility.",
        },
        {
          id: 2,
          title: "Reflect on what helps a scene make sense",
          meaning:
            "Notice how voice, pace, movement, and simple staging affect whether a scene is clear to others.",
          skillFocus: "dramatic reflection and clarity",
          practiceActivity:
            "Watch back a short scene or discuss it afterwards and decide what helped the audience understand the moment better.",
          evidenceExamples: [
            "a learner reflection on scene clarity",
            "a parent note about dramatic choices that helped",
            "a short discussion summary about what to change next time",
          ],
          nextStep:
            "Carry this into upper-primary audience awareness and stronger interpretation choices.",
          reportLanguage:
            "The learner is beginning to reflect more thoughtfully on what makes a dramatic scene clear, expressive, and engaging.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin considering audience, interpretation, and rehearsal more deliberately while choosing how or whether to share work.",
      steps: [
        {
          id: 1,
          title: "Shape a performance for a clearer audience response",
          meaning:
            "Think about how a scene, role, or voice choice will be understood by the intended audience.",
          skillFocus: "audience awareness in drama",
          practiceActivity:
            "Adapt a scene for younger children, family members, or a small group and explain how the performance choices changed.",
          evidenceExamples: [
            "a note about audience-focused choices",
            "a learner explanation of how the scene was adapted",
            "a parent summary of rehearsal decisions",
          ],
          nextStep:
            "Use audience awareness to support lower-secondary evaluation of dramatic effect and interpretation.",
          reportLanguage:
            "The learner is increasingly able to shape dramatic work with a clearer sense of audience and how performance choices affect understanding.",
        },
        {
          id: 2,
          title: "Rehearse and refine a short dramatic piece",
          meaning:
            "Use practice and feedback to make voice, movement, timing, or scene transitions clearer and more effective.",
          skillFocus: "dramatic refinement and rehearsal",
          practiceActivity:
            "Rehearse a short monologue, reader's theatre section, or small-group scene and improve one or two choices after review.",
          evidenceExamples: [
            "a before-and-after rehearsal note",
            "a learner reflection on one performance improvement",
            "a parent note on clearer voice, gesture, or pacing",
          ],
          nextStep:
            "Carry this into lower-secondary explanation of interpretation, effect, and performance choices.",
          reportLanguage:
            "The learner is beginning to refine dramatic work through rehearsal and can explain how practice improved clarity or expression.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens interpretation, performance choices, and more deliberate evaluation of how drama communicates meaning.",
      steps: [
        {
          id: 1,
          title: "Explain how dramatic choices shape meaning",
          meaning:
            "Describe how voice, pacing, gesture, space, and character choices change how a scene is understood.",
          skillFocus: "analysis of dramatic effect",
          practiceActivity:
            "Compare two performances or two ways of staging a scene and discuss which communicates the idea more clearly and why.",
          evidenceExamples: [
            "a comparison of performance choices",
            "a learner explanation of one dramatic effect",
            "a parent summary of a reflective discussion",
          ],
          nextStep:
            "Use effect analysis to support later critical comparison of performances and interpretations.",
          reportLanguage:
            "The learner is increasingly able to explain how dramatic choices shape meaning, mood, and audience response.",
        },
        {
          id: 2,
          title: "Use feedback to strengthen dramatic interpretation",
          meaning:
            "Reflect on whether a role or scene communicated well and adjust the interpretation more intentionally.",
          skillFocus: "interpretation and feedback use",
          practiceActivity:
            "Review a scene or role after sharing it privately or publicly and decide what choice would make the interpretation stronger next time.",
          evidenceExamples: [
            "a learner reflection on interpretation",
            "a parent note about feedback and dramatic improvement",
            "a short summary of what changed after review",
          ],
          nextStep:
            "Build toward later consolidation where dramatic responses are compared more critically and communicated more clearly.",
          reportLanguage:
            "The learner is developing stronger dramatic interpretation and can increasingly use feedback to refine how a role or scene is communicated.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together role, interpretation, reflection, and clearer communication about dramatic choices and audience effect.",
      steps: [
        {
          id: 1,
          title: "Compare dramatic responses and performances critically",
          meaning:
            "Weigh how different performances or staging choices create different meanings or effects.",
          skillFocus: "critical comparison of dramatic responses",
          practiceActivity:
            "Compare two performances or interpretations of a scene and explain which one communicates more effectively and why.",
          evidenceExamples: [
            "a comparison of dramatic interpretations",
            "a learner explanation of stronger performance choices",
            "a parent note from a reflective performance discussion",
          ],
          nextStep:
            "Use this evaluative habit across portfolio curation, arts reporting, and future creative work.",
          reportLanguage:
            "The learner is consolidating the ability to compare dramatic responses critically and explain which choices create stronger communication and effect.",
        },
        {
          id: 2,
          title: "Communicate dramatic process and intention clearly",
          meaning:
            "Present how a role, scene, or performance developed and what choices shaped the final communication.",
          skillFocus: "clear dramatic communication",
          practiceActivity:
            "Create a process reflection, performance note, or presentation showing how interpretation, rehearsal, and audience choices shaped the final piece.",
          evidenceExamples: [
            "a drama reflection or presentation",
            "a learner explanation of role or scene development",
            "a simple timeline of rehearsal and refinement choices",
          ],
          nextStep:
            "These habits continue to support stronger portfolio evidence, reporting, and expressive confidence.",
          reportLanguage:
            "The learner is strengthening the ability to communicate dramatic process and intention clearly, using reflection and explanation with growing confidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early role-play example, one mid-stage scene or improvisation note, and one later reflection on performance choices so growth in dramatic expression is visible.",
    "Photos, short recordings, rehearsal notes, character reflections, and learner explanations often make stronger portfolio evidence than a polished performance alone.",
    "A portfolio becomes stronger when it shows how the learner moved from imaginative play into character, interpretation, audience awareness, and reflection.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in role play, voice, gesture, storytelling, audience awareness, and reflection rather than only listing performances completed.",
    "Examples are strongest when the learner explains how dramatic choices helped a scene communicate more clearly.",
    "Collected evidence can show a clear shift from playful role-taking into more deliberate and reflective dramatic communication.",
  ],
};

const DANCE_AND_MOVEMENT: ArtsStrandConfig = {
  key: "dance-and-movement",
  title: "Dance and movement",
  subtitle:
    "Dance and movement helps learners use body awareness, rhythm, space, pattern, and expression to communicate ideas through movement. It grows from playful movement exploration into more deliberate sequencing, choreography, and reflection on how movement choices affect meaning.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on rhythm, coordination, physical awareness, and expression. It connects to music, wellbeing, confidence, and creative communication through the body.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early dance begins with moving to music, exploring shape and level, and using the body to show ideas or feelings.",
      steps: [
        {
          id: 1,
          title: "Move in different ways through space",
          meaning:
            "Explore walking, jumping, turning, stretching, or stillness and notice how the body changes in space.",
          skillFocus: "early body and space awareness",
          practiceActivity:
            "Move like weather, animals, vehicles, or story characters and talk about high, low, near, far, fast, and slow choices.",
          evidenceExamples: [
            "a short video or note about movement exploration",
            "a learner explanation of one movement choice",
            "a parent note about body awareness and confidence",
          ],
          nextStep:
            "Build from movement exploration into matching movement to beat and simple expression.",
          reportLanguage:
            "The learner is beginning to explore movement through space and is developing early awareness of body shape, level, and direction.",
        },
        {
          id: 2,
          title: "Use movement to show a simple feeling or idea",
          meaning:
            "Let movement communicate something such as happy, heavy, gentle, excited, or sleepy.",
          skillFocus: "movement expression",
          practiceActivity:
            "Move to a short piece of music or a story prompt and show a chosen feeling or action with the body.",
          evidenceExamples: [
            "a learner demonstration of expressive movement",
            "a parent note about a feeling shown through dance",
            "a simple reflection on what the movement meant",
          ],
          nextStep:
            "Carry this into lower-primary movement patterns and short sequence building.",
          reportLanguage:
            "The learner is developing early confidence in using movement to express simple feelings, actions, or ideas.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin repeating patterns, moving to steady pulse, and organising short movement ideas in simple sequences.",
      steps: [
        {
          id: 1,
          title: "Follow and repeat simple movement patterns",
          meaning:
            "Use the body to copy or build a short repeated pattern of actions.",
          skillFocus: "movement pattern and sequence",
          practiceActivity:
            "Create a clap-step-turn or jump-reach-freeze sequence and practise repeating it with a clear rhythm.",
          evidenceExamples: [
            "a parent note about repeating a movement pattern",
            "a short recording of a simple sequence",
            "a learner explanation of the order used",
          ],
          nextStep:
            "Use repeated patterns to support longer phrase making and stronger coordination.",
          reportLanguage:
            "The learner is increasingly able to follow and repeat simple movement patterns with growing coordination and memory.",
        },
        {
          id: 2,
          title: "Match movement to beat or mood",
          meaning:
            "Notice that movement can respond differently to steady beat, tempo, or the feeling of music.",
          skillFocus: "movement response to sound",
          practiceActivity:
            "Try the same movement idea with different music and discuss what changed in speed, shape, or energy.",
          evidenceExamples: [
            "a learner explanation of how music changed movement",
            "a parent note about beat or mood response",
            "a short movement reflection",
          ],
          nextStep:
            "Carry this into middle-primary phrase building and expressive choice.",
          reportLanguage:
            "The learner is beginning to match movement to beat, speed, and musical mood in more deliberate ways.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary dance strengthens coordination, phrasing, expression, and reflection on how movement choices help an audience understand the idea.",
      steps: [
        {
          id: 1,
          title: "Create a short movement phrase with a clear idea",
          meaning:
            "Organise several actions into a small dance phrase that communicates something more than a single move.",
          skillFocus: "phrase creation and choreography",
          practiceActivity:
            "Build a short movement phrase about seasons, an emotion, a story, or a place and practise the order until it feels clear.",
          evidenceExamples: [
            "a short video or note about a dance phrase",
            "a learner explanation of what the movement phrase meant",
            "a parent summary of planning and sequencing choices",
          ],
          nextStep:
            "Use phrase creation to support stronger audience awareness and refinement.",
          reportLanguage:
            "The learner is increasingly able to create short movement phrases and connect sequence choices to a clear artistic idea.",
        },
        {
          id: 2,
          title: "Reflect on how movement communicates meaning",
          meaning:
            "Notice which actions, shapes, levels, or pathways helped the movement idea come across more clearly.",
          skillFocus: "reflection on expressive movement",
          practiceActivity:
            "Watch back a movement sequence or discuss it afterwards and decide which movement choices communicated most clearly.",
          evidenceExamples: [
            "a learner reflection on one movement choice",
            "a parent note about expressive clarity discussion",
            "a simple compare-and-improve movement note",
          ],
          nextStep:
            "Carry this into upper-primary choreographic refinement and audience awareness.",
          reportLanguage:
            "The learner is beginning to reflect on how movement choices affect meaning and how a phrase can be made clearer for an audience.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin refining movement choices more deliberately and considering audience, purpose, and variation in choreography.",
      steps: [
        {
          id: 1,
          title: "Refine movement choices for a clearer effect",
          meaning:
            "Adjust timing, spacing, level, energy, or shape so a movement phrase feels more intentional and expressive.",
          skillFocus: "refinement of movement effect",
          practiceActivity:
            "Try a phrase in two different ways and decide which version better matches the chosen idea or music.",
          evidenceExamples: [
            "a before-and-after movement reflection",
            "a learner explanation of why one version worked better",
            "a parent note about movement refinement",
          ],
          nextStep:
            "Use refinement to support lower-secondary explanation of choreographic choices and performance communication.",
          reportLanguage:
            "The learner is increasingly able to refine movement choices and explain how timing, shape, or space changes the artistic effect.",
        },
        {
          id: 2,
          title: "Share or record movement work with growing confidence",
          meaning:
            "Use optional performance or recording opportunities to build confidence and review movement choices without making live performance compulsory.",
          skillFocus: "confidence-building sharing and review",
          practiceActivity:
            "Share a short movement piece with family, record it privately, or describe it verbally if live performance is not the best fit.",
          evidenceExamples: [
            "a private recording or parent note about sharing",
            "a learner reflection on confidence and expression",
            "a simple explanation of what the movement was trying to show",
          ],
          nextStep:
            "Carry this into lower-secondary evaluation of movement communication and style.",
          reportLanguage:
            "The learner is beginning to share movement work with more confidence and reflect on how the body communicates ideas to others.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens choreographic reasoning, expressive choices, and more deliberate evaluation of how movement communicates meaning.",
      steps: [
        {
          id: 1,
          title: "Explain how choreographic choices shape meaning",
          meaning:
            "Describe how rhythm, spacing, levels, direction, repetition, or stillness affect what the audience sees and understands.",
          skillFocus: "analysis of choreographic effect",
          practiceActivity:
            "Compare two movement phrases or performances and discuss which choices created a stronger idea or mood.",
          evidenceExamples: [
            "a short analysis of movement effect",
            "a learner explanation of one choreographic choice",
            "a parent summary of a reflective movement discussion",
          ],
          nextStep:
            "Use effect analysis to support later critical comparison of dance responses and communication.",
          reportLanguage:
            "The learner is increasingly able to explain how choreographic choices shape meaning, energy, and audience response.",
        },
        {
          id: 2,
          title: "Use feedback to strengthen a movement work",
          meaning:
            "Reflect on clarity, coordination, and expression and change a movement phrase to communicate more effectively.",
          skillFocus: "feedback-based choreographic refinement",
          practiceActivity:
            "Watch, discuss, and revise a short movement work after feedback from an adult, sibling, or self-review.",
          evidenceExamples: [
            "a revision note after feedback",
            "a learner explanation of one movement improvement",
            "a parent note about stronger clarity after revision",
          ],
          nextStep:
            "Build toward later consolidation where dance works are compared more critically and communicated more clearly.",
          reportLanguage:
            "The learner is developing stronger reflection and revision habits and can increasingly improve movement work using feedback and review.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together choreography, expression, reflection, and clearer communication about movement choices and their effects.",
      steps: [
        {
          id: 1,
          title: "Compare dance responses and movement choices critically",
          meaning:
            "Weigh how different movement approaches create different meanings, moods, or audience effects.",
          skillFocus: "critical comparison of dance responses",
          practiceActivity:
            "Compare two movement works or two versions of a phrase and explain which one communicates more strongly and why.",
          evidenceExamples: [
            "a comparison of movement responses",
            "a learner explanation of stronger dance communication",
            "a parent note from a reflective discussion",
          ],
          nextStep:
            "Use this evaluative habit across portfolio curation, arts reporting, and future movement learning.",
          reportLanguage:
            "The learner is consolidating the ability to compare dance responses critically and explain which movement choices create stronger communication and effect.",
        },
        {
          id: 2,
          title: "Communicate movement process and intention clearly",
          meaning:
            "Present how a movement piece developed, what choices were made, and how those choices shaped the final communication.",
          skillFocus: "clear communication about dance-making",
          practiceActivity:
            "Create a movement reflection, process journal, short presentation, or annotated sequence showing how the work developed.",
          evidenceExamples: [
            "a dance reflection or process summary",
            "a learner explanation of movement intention and revision",
            "a visual or written sequence of development choices",
          ],
          nextStep:
            "These habits continue to support strong portfolio evidence, reporting, and creative confidence.",
          reportLanguage:
            "The learner is strengthening the ability to communicate movement process and intention clearly, using reflection and explanation with growing confidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early movement exploration, one mid-stage phrase or pattern example, and one later reflection on movement choices so growth in dance communication is visible.",
    "Short videos, movement plans, reflections, and learner explanations often make stronger evidence than a single polished sharing moment alone.",
    "A portfolio becomes stronger when it shows how the learner moved from exploration into choreography, refinement, and reflection.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in body awareness, rhythm, sequencing, expression, coordination, and reflection rather than only naming dances completed.",
    "Examples are strongest when the learner explains how movement choices changed meaning or improved communication.",
    "Collected evidence can show a clear shift from playful movement into more deliberate and reflective dance-making.",
  ],
};

const MEDIA_ARTS_AND_STORYTELLING: ArtsStrandConfig = {
  key: "media-arts-and-storytelling",
  title: "Media arts and storytelling",
  subtitle:
    "Media arts and storytelling helps learners use images, sound, sequence, framing, editing, and audience awareness to share stories and messages. It grows from simple picture sequencing into more deliberate multimodal communication using accessible digital or non-digital tools.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on visual arts, storytelling, speaking, listening, and digital confidence. It connects to audience, technology, sequencing, and clear communication through images, sound, and multimodal choices.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early media arts begins with picture sequences, voice recordings, simple photos, and noticing that images and sounds can tell a story.",
      steps: [
        {
          id: 1,
          title: "Use pictures or sounds to show a simple story",
          meaning:
            "Recognise that a small sequence of images, sounds, or actions can communicate what happened.",
          skillFocus: "early media storytelling",
          practiceActivity:
            "Take two or three photos, draw a short sequence, or record a simple retelling with a parent and discuss what each part shows.",
          evidenceExamples: [
            "a photo or drawing sequence",
            "a short audio retelling",
            "a parent note about how the learner linked images or sounds to story",
          ],
          nextStep:
            "Build from simple sequences into clearer ordering, framing, and audience awareness.",
          reportLanguage:
            "The learner is beginning to use pictures and sounds to tell simple stories and is growing in awareness of sequence and meaning.",
        },
        {
          id: 2,
          title: "Notice what the audience sees first",
          meaning:
            "Begin recognising that where the camera, picture, or sound starts can shape what another person notices.",
          skillFocus: "early framing and audience noticing",
          practiceActivity:
            "Compare two photos or two drawings and ask which one makes the main idea easier to notice first.",
          evidenceExamples: [
            "a learner explanation of what stood out in an image",
            "a parent note about a simple framing discussion",
            "a compare-two-images reflection",
          ],
          nextStep:
            "Carry this into lower-primary work on framing, sequencing, and choosing stronger story details.",
          reportLanguage:
            "The learner is developing early awareness that visual or sound choices affect what an audience notices and understands.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin ordering media sequences more deliberately and using simple image, text, and sound choices to strengthen a message.",
      steps: [
        {
          id: 1,
          title: "Sequence images or clips to make a clearer story",
          meaning:
            "Use order to help the audience understand what happened first, next, and last.",
          skillFocus: "sequencing in media storytelling",
          practiceActivity:
            "Make a photo story, mini slideshow, stop-motion attempt, or simple comic and arrange the order clearly.",
          evidenceExamples: [
            "a small media sequence",
            "a learner explanation of why the order mattered",
            "a parent note about storytelling flow",
          ],
          nextStep:
            "Use sequencing to support stronger framing, titles, and audio choices.",
          reportLanguage:
            "The learner is increasingly able to sequence images or clips clearly so a visual story makes sense to an audience.",
        },
        {
          id: 2,
          title: "Add simple text, sound, or titles with purpose",
          meaning:
            "Choose a caption, sound effect, voice note, or title because it helps the audience understand more clearly.",
          skillFocus: "supporting media meaning",
          practiceActivity:
            "Add a label, short narration, or sound effect to a media piece and explain what it helps the audience notice.",
          evidenceExamples: [
            "a media piece with added text or sound",
            "a learner explanation of one added media choice",
            "a parent note about why the extra feature helped",
          ],
          nextStep:
            "Carry this into middle-primary discussion of message, audience, and editing choices.",
          reportLanguage:
            "The learner is beginning to use simple text, title, or sound choices to make a media story clearer and more purposeful.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary media arts strengthens planning, audience awareness, editing, and reflection on how visual and sound choices shape a message.",
      steps: [
        {
          id: 1,
          title: "Plan a media story for a simple audience or purpose",
          meaning:
            "Think ahead about who the media piece is for and what the audience should understand, feel, or notice.",
          skillFocus: "audience and purpose in media",
          practiceActivity:
            "Plan a short video, slideshow, comic, or audio story for family, younger children, or a learning topic and explain the goal.",
          evidenceExamples: [
            "a media storyboard or plan",
            "a learner explanation of audience and purpose",
            "a parent summary of planning choices",
          ],
          nextStep:
            "Use clearer purpose to support editing and stronger message choices.",
          reportLanguage:
            "The learner is increasingly able to plan a media piece for a clear audience or purpose and explain that intention.",
        },
        {
          id: 2,
          title: "Edit a media sequence to improve clarity",
          meaning:
            "Notice when a section is too long, unclear, repetitive, or missing and change it so the story works better.",
          skillFocus: "editing for clarity",
          practiceActivity:
            "Review a media sequence and shorten, reorder, retake, or relabel one section to make the story easier to follow.",
          evidenceExamples: [
            "a before-and-after edit example",
            "a learner explanation of one editing decision",
            "a parent note about how the media piece became clearer",
          ],
          nextStep:
            "Carry this into upper-primary message, framing, and response choices with stronger intentionality.",
          reportLanguage:
            "The learner is beginning to edit media work more thoughtfully and can explain how changes improve clarity and communication.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin making more deliberate choices about framing, pacing, message, and how different media features affect the audience.",
      steps: [
        {
          id: 1,
          title: "Use framing, angle, or pacing to shape meaning",
          meaning:
            "Recognise that where the viewer looks, how long something stays on screen, or how a shot is framed affects interpretation.",
          skillFocus: "media framing and pacing choices",
          practiceActivity:
            "Compare two photo angles, page layouts, or clip orders and explain which one communicates more clearly and why.",
          evidenceExamples: [
            "a framing or pacing comparison",
            "a learner explanation of a stronger media choice",
            "a parent note from a media reflection discussion",
          ],
          nextStep:
            "Use framing awareness to support lower-secondary evaluation of message, audience, and media effect.",
          reportLanguage:
            "The learner is increasingly able to use framing and pacing choices more deliberately to shape how a media message is understood.",
        },
        {
          id: 2,
          title: "Reflect on how a media piece affects an audience",
          meaning:
            "Consider whether the intended message, feeling, or information came through clearly and respectfully.",
          skillFocus: "audience effect and reflection",
          practiceActivity:
            "Share a media piece with a small audience, ask what they noticed, and compare that with the original intention.",
          evidenceExamples: [
            "a learner reflection on audience response",
            "a parent summary of what viewers understood",
            "a short note about what would be improved next time",
          ],
          nextStep:
            "Carry this into lower-secondary evaluation of multimodal choices and media communication.",
          reportLanguage:
            "The learner is beginning to reflect more thoughtfully on how media choices affect audience understanding and response.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens multimodal design, message clarity, and more deliberate evaluation of how media choices shape communication and interpretation.",
      steps: [
        {
          id: 1,
          title: "Explain how multimodal choices shape a message",
          meaning:
            "Describe how image, sound, text, pace, or sequence work together to create a particular effect.",
          skillFocus: "analysis of multimodal communication",
          practiceActivity:
            "Break down a short video, slideshow, comic, or audio-visual story and explain how the parts support the message.",
          evidenceExamples: [
            "a short multimodal analysis",
            "a learner explanation of how media features worked together",
            "a parent note from a reflective discussion",
          ],
          nextStep:
            "Use this analysis to support later comparison of media responses and audience impact.",
          reportLanguage:
            "The learner is increasingly able to explain how multimodal choices shape meaning, tone, and audience response in a media work.",
        },
        {
          id: 2,
          title: "Refine a media piece after review",
          meaning:
            "Use feedback or self-review to improve sequence, framing, sound, clarity, or audience fit.",
          skillFocus: "media refinement after review",
          practiceActivity:
            "Review a media piece and revise one or two choices so the message becomes clearer or more effective.",
          evidenceExamples: [
            "a before-and-after media revision",
            "a learner explanation of a refinement decision",
            "a parent note on stronger audience clarity after revision",
          ],
          nextStep:
            "Build toward later consolidation where media works are compared more critically and communicated more clearly.",
          reportLanguage:
            "The learner is developing stronger media refinement habits and can increasingly improve work after review and reflection.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together sequence, framing, editing, audience, and clearer communication about media choices and storytelling effect.",
      steps: [
        {
          id: 1,
          title: "Compare media responses and storytelling choices critically",
          meaning:
            "Weigh how different media works or versions use sequencing, framing, sound, and editing to create effect.",
          skillFocus: "critical comparison of media responses",
          practiceActivity:
            "Compare two media pieces or two versions of a story and explain which communicates more effectively and why.",
          evidenceExamples: [
            "a comparison of media responses",
            "a learner explanation of stronger storytelling choices",
            "a parent note from a reflective media discussion",
          ],
          nextStep:
            "Use this evaluative habit across portfolio curation, arts reporting, and future digital storytelling work.",
          reportLanguage:
            "The learner is consolidating the ability to compare media responses critically and explain which choices create stronger storytelling and audience impact.",
        },
        {
          id: 2,
          title: "Communicate media process and intention clearly",
          meaning:
            "Present how a media work was planned, edited, refined, and shaped for an audience or purpose.",
          skillFocus: "clear media communication",
          practiceActivity:
            "Create a short reflection, storyboard summary, presentation, or process journal showing how the media work developed.",
          evidenceExamples: [
            "a media process journal or presentation",
            "a learner explanation of message and editing choices",
            "a simple record of drafts, changes, and final communication goals",
          ],
          nextStep:
            "These habits continue to support strong portfolio evidence, reporting, and purposeful multimodal communication.",
          reportLanguage:
            "The learner is strengthening the ability to communicate media process and intention clearly, using reflection and explanation with growing confidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early image-or-sound sequence, one mid-stage edit or storyboard example, and one later reflection on audience and message so media growth is visible over time.",
    "Screenshots, storyboards, recordings, caption choices, and learner explanations often make stronger portfolio evidence than a final media file alone.",
    "A portfolio becomes stronger when it shows how the learner moved from simple sequencing into planning, editing, audience awareness, and media reflection.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in sequencing, framing, editing, audience awareness, multimodal communication, and reflection rather than only naming digital tools used.",
    "Examples are strongest when the learner explains how media choices shaped the message and improved audience understanding.",
    "Collected evidence can show a clear shift from simple picture or sound sequences into more deliberate media storytelling and communication.",
  ],
};

const RESPONDING_TO_ARTWORKS_AND_CREATIVE_CHOICES: ArtsStrandConfig = {
  key: "responding-to-artworks-and-creative-choices",
  title: "Responding to artworks and creative choices",
  subtitle:
    "Responding to artworks and creative choices helps learners notice, describe, interpret, compare, and reflect on creative work. It grows from simple personal responses into more thoughtful vocabulary, interpretation, respectful discussion, and explanation of artistic choices and context.",
  relationshipTitle: "What this strand builds on",
  relationshipCopy:
    "This strand builds on noticing, discussion, and personal response. It supports reflection, vocabulary, interpretation, and respectful conversation across every arts strand.",
  stages: [
    {
      key: "foundation-kindergarten",
      helper:
        "Early response begins with noticing what stands out, saying what is liked, and naming simple colours, sounds, movements, or feelings.",
      steps: [
        {
          id: 1,
          title: "Notice and name what stands out",
          meaning:
            "Look, listen, or watch carefully enough to say what was most obvious or interesting first.",
          skillFocus: "early noticing and naming",
          practiceActivity:
            "Look at a picture, listen to a short piece, or watch a movement clip and ask what was noticed first.",
          evidenceExamples: [
            "a learner statement about what stood out",
            "a parent note about first responses to an artwork",
            "a simple picture or sound response note",
          ],
          nextStep:
            "Build from noticing into describing colour, sound, movement, or story details more clearly.",
          reportLanguage:
            "The learner is beginning to notice what stands out in artworks and can share simple responses about what was seen, heard, or felt.",
        },
        {
          id: 2,
          title: "Share a simple personal response respectfully",
          meaning:
            "Say what was liked, surprising, funny, calm, loud, bright, or interesting in a kind and open way.",
          skillFocus: "early personal response",
          practiceActivity:
            "Talk about a favourite part of a picture, song, movement, or story clip and why it felt interesting or enjoyable.",
          evidenceExamples: [
            "a learner explanation of a favourite part",
            "a parent note about respectful response talk",
            "a short drawing or sentence linked to a response",
          ],
          nextStep:
            "Carry this into lower-primary describing and comparing creative features more clearly.",
          reportLanguage:
            "The learner is developing early confidence in sharing personal responses to artworks in simple and respectful ways.",
        },
      ],
    },
    {
      key: "lower-primary",
      helper:
        "Learners begin describing what they see, hear, or notice in more detail and comparing simple artistic features or choices.",
      steps: [
        {
          id: 1,
          title: "Describe simple artistic features",
          meaning:
            "Use words such as bright, soft, loud, slow, bold, smooth, busy, or calm to describe what was experienced.",
          skillFocus: "descriptive arts vocabulary",
          practiceActivity:
            "Look at or listen to a work and collect words that describe the colour, sound, movement, texture, or mood.",
          evidenceExamples: [
            "a list of descriptive arts words",
            "a learner explanation using feature language",
            "a parent note about descriptive discussion",
          ],
          nextStep:
            "Use descriptive vocabulary to support clearer comparison and interpretation.",
          reportLanguage:
            "The learner is increasingly able to use simple descriptive language to talk about artistic features and how a work feels or sounds.",
        },
        {
          id: 2,
          title: "Compare two artworks or performances simply",
          meaning:
            "Notice one or two ways that two works are similar or different and explain a preference kindly.",
          skillFocus: "early comparison and preference",
          practiceActivity:
            "Compare two pictures, songs, performances, or movement pieces and discuss what felt different about each one.",
          evidenceExamples: [
            "a same-and-different arts comparison",
            "a learner explanation of a respectful preference",
            "a parent summary of a comparison discussion",
          ],
          nextStep:
            "Carry this into middle-primary work on meaning, intention, and stronger response language.",
          reportLanguage:
            "The learner is beginning to compare artworks and performances and explain preferences in more thoughtful and respectful ways.",
        },
      ],
    },
    {
      key: "middle-primary",
      helper:
        "Middle-primary response strengthens interpretation, feature comparison, and discussing how a work may create a certain feeling or message.",
      steps: [
        {
          id: 1,
          title: "Explain how an artistic choice affects the response",
          meaning:
            "Connect a colour, sound, movement, role, image, or pacing choice to the way the work feels or communicates.",
          skillFocus: "linking choice to effect",
          practiceActivity:
            "Discuss one feature from an artwork or performance and explain how it changed the mood, meaning, or attention of the audience.",
          evidenceExamples: [
            "a learner explanation of artistic effect",
            "a parent note about connecting features to meaning",
            "a short written or oral response using evidence from the work",
          ],
          nextStep:
            "Use effect explanation to support upper-primary interpretation and context discussion.",
          reportLanguage:
            "The learner is increasingly able to explain how an artistic choice can shape mood, meaning, and audience response.",
        },
        {
          id: 2,
          title: "Use simple evidence from the work when responding",
          meaning:
            "Point to a feature in the work rather than speaking only from general feeling or opinion.",
          skillFocus: "evidence in arts response",
          practiceActivity:
            "Respond to a work by naming the image, sound, movement, or character detail that supported the idea.",
          evidenceExamples: [
            "an arts response using one supporting detail",
            "a learner explanation linked to a feature in the work",
            "a parent note from a reflective arts discussion",
          ],
          nextStep:
            "Carry this into upper-primary interpretation, comparison, and context.",
          reportLanguage:
            "The learner is beginning to use simple evidence from a work to support interpretations and personal responses.",
        },
      ],
    },
    {
      key: "upper-primary",
      helper:
        "Learners now begin discussing context, interpretation, and different audience responses more thoughtfully while using stronger vocabulary.",
      steps: [
        {
          id: 1,
          title: "Interpret meaning with more than one idea in mind",
          meaning:
            "Recognise that a work may suggest more than one possible meaning or feeling and that responses can vary respectfully.",
          skillFocus: "interpretation and openness",
          practiceActivity:
            "Discuss two possible readings of an artwork, song, scene, dance, or media piece and explain what supports each view.",
          evidenceExamples: [
            "a learner comparison of two interpretations",
            "a parent note about respectful difference in response",
            "a short reflection on why more than one meaning may fit",
          ],
          nextStep:
            "Use open interpretation to support lower-secondary comparison of context, intention, and audience effect.",
          reportLanguage:
            "The learner is increasingly able to interpret artworks thoughtfully and recognise that respectful differences in response can be valid.",
        },
        {
          id: 2,
          title: "Discuss how context may shape an artwork or response",
          meaning:
            "Notice that time, place, culture, purpose, or tradition can influence how a work is made and understood.",
          skillFocus: "context awareness in arts response",
          practiceActivity:
            "Talk about who made a work, when, where, or for what purpose and how that may shape interpretation.",
          evidenceExamples: [
            "a learner note about cultural or historical context",
            "a parent summary of a context discussion",
            "a short response linking context and meaning",
          ],
          nextStep:
            "Carry this into lower-secondary critical comparison of artistic choices, context, and response.",
          reportLanguage:
            "The learner is beginning to discuss how context can shape an artwork and influence how it may be understood or responded to.",
        },
      ],
    },
    {
      key: "lower-secondary",
      helper:
        "Current focus strengthens interpretation, comparison, context, and more deliberate use of evidence and vocabulary when responding to creative work.",
      steps: [
        {
          id: 1,
          title: "Compare artistic responses and choices more critically",
          meaning:
            "Weigh how two works or performances use different choices to communicate meaning, mood, or audience effect.",
          skillFocus: "critical comparison in arts response",
          practiceActivity:
            "Compare two works from the same or different strands and explain which choices seem stronger, clearer, or more affecting and why.",
          evidenceExamples: [
            "a critical arts comparison",
            "a learner explanation of stronger artistic effect",
            "a parent note from a reflective comparison discussion",
          ],
          nextStep:
            "Use comparison to support later synthesis of interpretation, context, and evaluation.",
          reportLanguage:
            "The learner is increasingly able to compare artistic responses critically and explain how different choices shape effect and meaning.",
        },
        {
          id: 2,
          title: "Use clearer arts vocabulary and evidence in response",
          meaning:
            "Support interpretation with precise references to features, techniques, structure, or context.",
          skillFocus: "precise arts response",
          practiceActivity:
            "Write or speak about a work using more specific terms and direct references to what was seen, heard, or experienced.",
          evidenceExamples: [
            "a more developed arts response",
            "a learner explanation using specific artistic language",
            "a parent note about growing precision in reflection",
          ],
          nextStep:
            "Build toward later consolidation where responses are compared more critically and communicated more clearly.",
          reportLanguage:
            "The learner is developing stronger arts vocabulary and can increasingly support responses with more precise references to artistic choices and context.",
        },
      ],
    },
    {
      key: "years-9-10-consolidation",
      helper:
        "Later consolidation brings together description, interpretation, comparison, context, and clearer communication about how and why creative works affect people.",
      steps: [
        {
          id: 1,
          title: "Evaluate creative responses and interpretations critically",
          meaning:
            "Compare how different interpretations or artworks are supported by features, context, and audience effect.",
          skillFocus: "critical evaluation in arts response",
          practiceActivity:
            "Compare two responses to a work or two similar works and explain which interpretation seems more convincing and why.",
          evidenceExamples: [
            "an evaluation of artistic interpretations",
            "a learner explanation using features and context",
            "a parent note from a reflective arts discussion",
          ],
          nextStep:
            "Use this evaluative habit across portfolio curation, arts reporting, and future creative study.",
          reportLanguage:
            "The learner is consolidating the ability to evaluate artistic responses critically and explain which interpretations are more strongly supported.",
        },
        {
          id: 2,
          title: "Communicate reflection on creative work clearly",
          meaning:
            "Present a thoughtful response to a work, showing what was noticed, how it was interpreted, and what evidence supported the conclusion.",
          skillFocus: "clear reflective arts communication",
          practiceActivity:
            "Create a short review, gallery card, artist response, or presentation that explains a clear and respectful interpretation.",
          evidenceExamples: [
            "a reflective arts response or presentation",
            "a learner explanation connecting observation, interpretation, and evidence",
            "a comparison note showing how understanding deepened over time",
          ],
          nextStep:
            "These habits continue to support stronger reflection, portfolio evidence, and communication across all arts strands.",
          reportLanguage:
            "The learner is strengthening the ability to communicate reflection on creative work clearly, using observation, interpretation, and evidence with growing confidence.",
        },
      ],
    },
  ],
  portfolioSupport: [
    "Keep one early personal response, one mid-stage evidence-based comparison, and one later reflective explanation so growth in arts response is visible over time.",
    "Response notes, recordings, gallery-style captions, and learner explanations often make strong portfolio evidence because they show how artistic understanding is deepening.",
    "A portfolio becomes stronger when it shows how the learner moved from noticing and preference into interpretation, context, and respectful comparison.",
  ],
  reportingSupport: [
    "Reporting can highlight growth in noticing, descriptive vocabulary, interpretation, comparison, and respectful discussion rather than only listing artworks encountered.",
    "Examples are strongest when the learner explains how an artistic choice shaped the response and what evidence supported the interpretation.",
    "Collected evidence can show a clear shift from simple personal reactions into more thoughtful and well-supported artistic reflection.",
  ],
};

const ARTS_STRAND_CONFIGS: ArtsStrandConfig[] = [
  VISUAL_ARTS_AND_DESIGN,
  MUSIC_AND_SOUND,
  DRAMA_AND_PERFORMANCE,
  DANCE_AND_MOVEMENT,
  MEDIA_ARTS_AND_STORYTELLING,
  RESPONDING_TO_ARTWORKS_AND_CREATIVE_CHOICES,
];

export const ARTS_STRAND_WORKSPACE_BUILDERS: Record<string, StrandBuilder> = Object.fromEntries(
  ARTS_STRAND_CONFIGS.map((config) => [
    config.key,
    (currentFocusStageKey: PathwayStageKey) => buildArtsWorkspace(currentFocusStageKey, config),
  ]),
);
