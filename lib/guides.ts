import { TOTAL_DAYS } from "@/lib/curriculum";

// The /guides pages: plain answers to questions people ask an AI assistant before choosing an AI course.
// Every Tensorpath fact restates something the site already says (/faq, /syllabus, /compare, /terms, the home
// page, the certificate flow) or comes straight from content/curriculum. No prices, batch dates, seat counts,
// placement numbers or trainer names: those are not stated here on purpose.

export type GuideBlock =
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "checks"; items: { q: string; a: string }[] }
  /** Renders the curriculum days from..to (titles, subtitles and, with detail, objectives and homework). */
  | { kind: "days"; from: number; to: number; detail?: boolean };

export interface GuideSection {
  heading: string;
  blocks: GuideBlock[];
}

export interface Guide {
  slug: string;
  /** <title> (the layout appends "· Tensorpath"). */
  title: string;
  h1: string;
  description: string;
  /** Short label for the guides index, footer lists and breadcrumbs. */
  label: string;
  intro: string[];
  sections: GuideSection[];
  faqs: { q: string; a: string }[];
}

const STAGES = "Days 1 to 6 build the foundations (attention, the Transformer, embeddings, neural networks, scale); Days 7 to 11 cover foundation models, fine-tuning, chat and prompting; Days 12 to 14 cover image, video, sound and multimodal AI; Days 15 to 18 cover agents, reasoning models, memory and RAG, and tool connections with MCP; Days 19 and 20 cover AI at work and your next step.";

const CERT = `You get a Tensorpath certificate when you complete all ${TOTAL_DAYS} days and a trainer approves your capstone project. The certificate is issued by Tensorpath (Surge Software Solutions Pvt. Ltd.), not by a university, and anyone can check it at tensorpath.in/verify, which also shows the holder's capstone project.`;

const LIVE = "Live and instructor-led. Classes are video sessions inside the Tensorpath portal: your trainer screen-shares and teaches live, with chat. Every session is recorded, and after each class your dashboard shows what was covered and the recording.";

export const GUIDES: Guide[] = [
  {
    slug: "ai-course-syllabus-transformers-to-agents",
    label: "Syllabus from transformers to AI agents",
    title: "AI course syllabus from transformers to AI agents: what to learn, in order",
    h1: "AI course syllabus from transformers to AI agents: what to learn, in order",
    description:
      "A day-by-day order for learning modern AI, from the 2017 attention paper and the Transformer to foundation models, prompting, multimodal AI, reasoning models, memory, MCP and AI agents: the Tensorpath 20-day syllabus.",
    intro: [
      `AI agents are easier to understand once you know what sits underneath them: attention and the Transformer, how a model learns from data, how a raw model becomes a helpful assistant, and how it can see, reason, remember and use tools. This is the order the ${TOTAL_DAYS}-day Tensorpath course teaches it, one live lesson a day.`,
      STAGES,
    ],
    sections: [
      {
        heading: "Stage 1: before the Transformer, attention and how models learn (Days 1 to 6)",
        blocks: [
          { kind: "p", text: "Start with the problem the Transformer solved. By 2016 language AI was stuck: word-by-word models forgot the start of long sentences. Day 2 is the 2017 paper “Attention Is All You Need”; Days 3 to 6 explain the Transformer, how words become numbers, neural networks, and why predicting the next word at huge scale starts to look like intelligence." },
          { kind: "days", from: 1, to: 6 },
        ],
      },
      {
        heading: "Stage 2: foundation models, fine-tuning, chat and prompting (Days 7 to 11)",
        blocks: [
          { kind: "p", text: "Next, how the big models were built and turned into assistants: the compute and data race that produced BERT and GPT, foundation models like GPT, Gemini, Claude and Llama, fine-tuning and human feedback, why ChatGPT felt different, and practical prompting." },
          { kind: "days", from: 7, to: 11 },
        ],
      },
      {
        heading: "Stage 3: images, video, sound and multimodal AI (Days 12 to 14)",
        blocks: [
          { kind: "p", text: "Then the models that draw, move and listen: diffusion for images, text-to-video and AI voices, deepfakes and how to stay sceptical, and multimodal models that read, look and listen at once. Day 14 ends by setting up the step from sensing to acting." },
          { kind: "days", from: 12, to: 14 },
        ],
      },
      {
        heading: "Stage 4: agents, reasoning, memory and tool connections (Days 15 to 18)",
        blocks: [
          { kind: "p", text: "Agents come here, after the foundations: how an agent differs from a chatbot, tools and step-by-step decisions, guardrails and a human in the loop; reasoning models that think in loops; memory, context windows and RAG; and APIs, connectors and MCP." },
          { kind: "days", from: 15, to: 18 },
        ],
      },
      {
        heading: "Stage 5: AI at work and your next step (Days 19 and 20)",
        blocks: [
          { kind: "p", text: "The course ends with where AI already does work today, why human judgment matters more as AI does more, safe and fair use, and a beginner-friendly path to a first project or an AI career. After Day 20 you submit your capstone project for trainer review." },
          { kind: "days", from: 19, to: 20 },
        ],
      },
    ],
    faqs: [
      { q: "In what order should I learn AI, from transformers to agents?", a: STAGES },
      { q: "How long does this syllabus take?", a: `${TOTAL_DAYS} days, one topic a day. Each day is a live lesson of about 60 minutes, and every session is recorded.` },
      { q: "Do I need maths or coding first?", a: "No. The course is built to explain modern AI without heavy maths, and there is no degree or coding requirement. You must be at least 16 years old to enrol." },
      { q: "Where do AI agents come in?", a: "Day 15, From Answering to Doing: AI Agents. It comes after foundation models, chat, prompting and multimodal AI, and is followed by reasoning models (Day 16), memory and RAG (Day 17) and tool connections and MCP (Day 18)." },
    ],
  },
  {
    slug: "instructor-led-ai-course-india-certificate",
    label: "Instructor-led AI course with a certificate: what to look for",
    title: "Instructor-led generative AI and agents course in India with a certificate: what to look for",
    h1: "Instructor-led generative AI and AI agents course in India with a certificate: what to look for",
    description:
      "Eight questions to ask before you choose a live, instructor-led generative AI and AI agents course in India with a certificate, and how Tensorpath's 20-day course answers each.",
    intro: [
      "Many AI programmes in India call themselves live and certified, and they differ a lot in length, entry rules, who issues the certificate and what you must do to earn it. These are the questions worth asking any programme, with Tensorpath's own answers. For IIT and IISc certificate programmes side by side with Tensorpath, see the compare page.",
    ],
    sections: [
      {
        heading: "Eight questions to ask, and Tensorpath's answers",
        blocks: [
          {
            kind: "checks",
            items: [
              { q: "1. Is it actually taught live by a person?", a: LIVE },
              { q: "2. Does the syllabus reach AI agents, or stop at prompting?", a: "Tensorpath runs from the 2017 Transformer paper to agents: Day 15 is AI agents, Day 16 reasoning models, Day 17 memory and RAG, Day 18 tool connections and MCP. The full list is on the syllabus page." },
              { q: "3. How long is it, and how much time each day?", a: `${TOTAL_DAYS} days, one live lesson of about 60 minutes a day.` },
              { q: "4. What do I need before I start?", a: "No degree or coding requirement, and no heavy maths. You must be at least 16 years old to enrol." },
              { q: "5. What must I do to earn the certificate, and who issues it?", a: CERT },
              { q: "6. Is there a project?", a: "Yes. After the 20 days you submit a capstone project for a trainer to review; the trainer can approve it or ask you to revise and resubmit. The certificate is issued only after approval." },
              { q: "7. Is there help between classes and after the course?", a: "Between classes, Genie, your personal AI learning companion, answers questions, gives practice and tells you what to learn next. After you are certified you can visit the Surge office in Bengaluru for one-on-one interview prep, résumé and personal marketing help, and placement support." },
              { q: "8. What does it cost, and is that clear before I pay?", a: "Enrolling is free: you register at tensorpath.in/join at no cost. Tensorpath's Terms say that if a paid offering is ever introduced, it will be shown clearly before any charge. Details are in the FAQ." },
            ],
          },
        ],
      },
      {
        heading: "When a university certificate matters more",
        blocks: [
          { kind: "p", text: "If you need the name of an IIT or IISc on your certificate, Tensorpath is not that: its certificate is Tensorpath's own. The compare page sets Tensorpath next to the IIT Bombay (via Great Learning), CCE-IISc (via TalentSprint) and IIT Delhi CEP generative AI certificates: length, format, eligibility, certificate and fees, checked on each programme's own page." },
        ],
      },
    ],
    faqs: [
      { q: "Is Tensorpath instructor-led?", a: LIVE },
      { q: "Does Tensorpath give a certificate?", a: CERT },
      { q: "Who runs Tensorpath?", a: "Tensorpath is run by Surge Software Solutions Pvt. Ltd. Career help after certification is at the Surge office in Bengaluru." },
      { q: "How do I join a batch?", a: "Register free at tensorpath.in/join and tell us your goal. We approve your account and email your batch dates; you confirm your seat in one click. For team training, use tensorpath.in/enquiry." },
    ],
  },
  {
    slug: "transformers-and-attention-for-beginners",
    label: "Transformers and attention for beginners (Days 1–6)",
    title: "Transformers and attention for beginners: the first 6 days of the course",
    h1: "Transformers and attention for beginners: Days 1 to 6",
    description:
      "How Tensorpath teaches the foundations of modern AI without heavy maths: the problem before 2017, attention, the Transformer, embeddings, neural networks and learning at scale, with each day's objectives and homework.",
    intro: [
      "The first six days explain the engine inside every modern AI model, gently. You start with why older language AI got lost in long sentences, meet the idea of attention from the 2017 paper “Attention Is All You Need”, and see how the Transformer, embeddings and neural networks fit together, without needing to be good at maths.",
    ],
    sections: [
      { heading: "Day by day", blocks: [{ kind: "days", from: 1, to: 6, detail: true }] },
    ],
    faqs: [
      { q: "Can I learn transformers without maths?", a: "Yes, that is how these days are built. Day 4, for example, presents matrix multiplication as mixing piles of numbers to discover relationships, and embeddings as giving every word its own coordinates on a map." },
      { q: "Which paper does the course start from?", a: "“Attention Is All You Need” (2017). Day 2 covers what the paper proposed and why its title was a bold bet; Day 3 explains the Transformer it introduced." },
      { q: "What comes after these six days?", a: "Foundation models, fine-tuning, chat and prompting (Days 7 to 11), then images, video and multimodal AI (Days 12 to 14), then agents, reasoning, memory and MCP (Days 15 to 18)." },
    ],
  },
  {
    slug: "foundation-models-prompting-and-multimodal-ai",
    label: "Foundation models, prompting and multimodal AI (Days 7–14)",
    title: "Foundation models, ChatGPT, prompting and multimodal AI: Days 7 to 14",
    h1: "Foundation models, chat, prompting and multimodal AI: Days 7 to 14",
    description:
      "The middle of the Tensorpath course: how giant models were built, foundation models, fine-tuning and human feedback, chat and prompting, AI images, video and sound, and multimodal models, with each day's objectives and homework.",
    intro: [
      "Days 7 to 14 move from how the giant models were trained to how people actually use them: what a foundation model is, how a raw model becomes a helpful assistant, how to prompt well, and how AI creates images, video and sound and combines reading, seeing and hearing in one model.",
    ],
    sections: [
      { heading: "Foundation models, fine-tuning, chat and prompting (Days 7 to 11)", blocks: [{ kind: "days", from: 7, to: 11, detail: true }] },
      { heading: "Images, video, sound and multimodal AI (Days 12 to 14)", blocks: [{ kind: "days", from: 12, to: 14, detail: true }] },
    ],
    faqs: [
      { q: "Does the course teach prompt engineering?", a: "Yes. Day 10 explains what a prompt is and how chat models work, and Day 11 teaches practical prompting: giving context and an example, asking for steps or a role, and refining a weak answer." },
      { q: "Does it cover fine-tuning and RLHF?", a: "Day 9 covers fine-tuning, instruction tuning and how human thumbs-up and thumbs-down ratings shape a model's behaviour, and why ChatGPT felt so different from earlier AI." },
      { q: "Does it cover image and video generation?", a: "Yes. Day 12 covers text-to-image and diffusion, Day 13 text-to-video, AI voices and music and how to spot deepfakes, and Day 14 multimodal models." },
    ],
  },
  {
    slug: "learn-ai-agents-tools-reasoning-memory-mcp",
    label: "Learn AI agents: tools, reasoning, memory and MCP (Days 15–20)",
    title: "Learn AI agents step by step: tools, reasoning, memory and MCP",
    h1: "Learn AI agents step by step: tools, reasoning, memory and MCP (Days 15 to 20)",
    description:
      "How Tensorpath teaches AI agents after the foundations: agents and tools, reasoning models, memory and RAG, APIs, connectors and MCP, AI at work, and a capstone project reviewed by a trainer.",
    intro: [
      "An AI agent is a model that stops just answering and starts doing: it uses tools, decides its next step, and works towards a goal. Tensorpath teaches agents in Days 15 to 18, once you already know how the models underneath work, and finishes with how AI is used at work and a capstone project.",
      "These lessons explain agents in plain language and do not assume you can code. The homework is hands-on with AI tools you can already use: for example, planning an agent's steps and tools for a real errand (Day 15), comparing a fast answer with a reasoning mode (Day 16), checking what an assistant remembers about you (Day 17), and taking apart a real AI product into its model, the apps it touches and where its knowledge comes from (Day 18).",
    ],
    sections: [
      { heading: "Agents, reasoning, memory and connections (Days 15 to 18)", blocks: [{ kind: "days", from: 15, to: 18, detail: true }] },
      { heading: "AI at work and your next step (Days 19 and 20)", blocks: [{ kind: "days", from: 19, to: 20, detail: true }] },
      {
        heading: "The capstone project and the certificate",
        blocks: [
          { kind: "p", text: CERT },
          { kind: "p", text: "You submit the capstone after completing all 20 days. A trainer reviews it and either approves it or asks you to revise and resubmit." },
        ],
      },
    ],
    faqs: [
      { q: "What is the difference between an AI agent and a chatbot?", a: "A chatbot answers; an agent takes action. Day 15 explains how giving a model tools changes what it can do, how an agent decides its next step one move at a time, and why guardrails and a human in the loop keep agents safe." },
      { q: "Does the course cover MCP?", a: "Yes. Day 18 explains APIs as plugs between systems, RAG over your own documents, and connectors and MCP (Model Context Protocol) as a universal adapter that lets any MCP-aware AI use a tool." },
      { q: "Do I need to know how to code?", a: "No. There is no coding requirement; the lessons explain agents in plain language and the homework uses AI tools you can already access." },
      { q: "What do I need to know before the agents lessons?", a: "The course gets you there: Days 1 to 14 cover attention, the Transformer, foundation models, prompting and multimodal AI before agents begin on Day 15." },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
