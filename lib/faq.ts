import { allDays, TOTAL_DAYS } from "@/lib/curriculum";

// The /faq page and its FAQPage JSON-LD. Every answer restates something the site already says (home page,
// /terms, /llms.txt, the curriculum files): no new prices, dates or promises.

const lessonLength = () => {
  const lengths = Array.from(new Set(allDays().map((d) => d.duration).filter(Boolean)));
  return lengths.length === 1 ? lengths[0] : "";
};

export function faqItems(): { q: string; a: string }[] {
  const len = lessonLength();
  return [
    {
      q: "How much does Tensorpath cost?",
      a: "Enrolling is free: you register at tensorpath.in/join at no cost. Our Terms say that if a paid offering is ever introduced, it will be shown clearly before any charge.",
    },
    {
      q: "How long is the course?",
      a: `${TOTAL_DAYS} days, one topic a day.${len ? ` Each day is a live lesson of about ${len}.` : ""} Every session is recorded, so you can revisit it any time.`,
    },
    {
      q: "Is it live or self-paced?",
      a: "Live and instructor-led. Classes are video sessions inside the Tensorpath portal: your trainer screen-shares and teaches live, with chat. Between classes, Genie, your personal AI learning companion, answers questions, gives practice and tells you what to learn next. After each class your dashboard shows what was covered and the recording.",
    },
    {
      q: "Do I get a certificate?",
      a: `Yes. When you finish the ${TOTAL_DAYS} days and a trainer approves your capstone project, you get a verifiable certificate. Anyone can check it at tensorpath.in/verify.`,
    },
    {
      q: "What does the course cover?",
      a: "It runs from the 2017 paper “Attention Is All You Need” to today's reasoning models and AI agents: attention and the Transformer, word embeddings, neural networks, foundation models, chat and prompting, image, video and multimodal AI, agents, reasoning models, memory and tool connections. The day-by-day list is at tensorpath.in/syllabus.",
    },
    {
      q: "Who is it for?",
      a: "Students and working professionals who want to understand and use modern AI without heavy math, and teams that want their staff trained on generative AI. You must be at least 16 years old to enrol.",
    },
    {
      q: "How do I join a batch?",
      a: "Register free at tensorpath.in/join and tell us your goal. We approve your account and email your batch dates; you confirm your seat in one click. For team training, use tensorpath.in/enquiry.",
    },
    {
      q: "Is there help finding a job afterwards?",
      a: "Yes. After you are certified, you can visit the Surge office in Bengaluru for one-on-one interview prep, résumé and personal marketing help, and placement support.",
    },
    {
      q: "Who runs Tensorpath?",
      a: "Tensorpath is run by Surge Software Solutions Pvt. Ltd. Questions: corp@surgesoftware.co.in.",
    },
  ];
}

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems().map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
