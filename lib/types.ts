export interface Slide {
  id: string;
  title: string;
  type: "intro" | "concept" | "story" | "diagram" | "code" | "market" | "recap" | "quiz" | string;
  body: string;
  speakerNotes?: string;
  marketConnection?: string;
}

export interface Day {
  day: number;
  title: string;
  subtitle: string;
  theme: string;
  duration: string;
  learningObjectives: string[];
  storyHook: string;
  slides: Slide[];
  keyTakeaways: string[];
  marketSnapshot2026: string;
  homework: string;
  nextDayTeaser: string;
}

export interface DayMeta {
  day: number;
  title: string;
  subtitle: string;
  theme: string;
  duration: string;
  slideCount: number;
}

export interface Trainee {
  id: string;
  name: string;
  email: string;
  addedAt: string;
}

export interface Session {
  id: string;
  day: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM (24h)
  title: string;
  status: "scheduled" | "live" | "completed";
  invitesSent: boolean;
  createdAt: string;
}

export interface Progress {
  currentDay: number; // 1-based day the class is on / next to teach
  currentSlide: number; // 0-based index within the day
  completedDays: number[];
  lastTaughtAt: string | null;
}

export interface Trainer {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export interface OutboxMail {
  id: string;
  to: string[];
  subject: string;
  body: string;
  sentAt: string;
  delivered: boolean; // true if a real transport (Resend/SMTP) accepted it
  via: "resend" | "smtp" | "outbox";
  kind: "invite" | "announcement" | "test" | "welcome" | "payment" | "help" | "lead" | "enroll";
}

// ---------------------------------------------------------------------------
// Agentic learning platform
// ---------------------------------------------------------------------------

export interface JourneyEvent {
  id: string;
  type: "signup" | "goal_set" | "day_completed" | "coach_session" | "asked" | "recommendation" | "payment" | "help_request";
  day?: number;
  summary: string;
  detail?: string;
  at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  at: string;
}

export interface CoachSession {
  id: string;
  learnerId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface Learner {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  // profile used as RAG context for the coach
  background: string; // their experience / where they're coming from
  goals: string; // what they want to achieve
  level: "beginner" | "intermediate" | "advanced" | "";
  // gating
  handholdingCount: number; // number of coach sessions started
  approved: boolean; // unlocked (auto-true after payment)
  paid: boolean;
  plan: "free" | "pro";
  completedDays: number[]; // this learner's own self-paced completion
  journey: JourneyEvent[];
  createdAt: string;
  // per-learner vector embedding of their profile + journey (Voyage); used for RAG retrieval
  profileEmbedding?: number[];
  profileEmbeddingText?: string; // the text the embedding was built from (to detect staleness)
}

export interface HelpTicket {
  id: string;
  learnerId: string;
  learnerName: string;
  learnerEmail: string;
  coachSessionId?: string;
  question: string;
  context: string; // what the coach was discussing
  status: "open" | "resolved";
  response?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Payment {
  id: string;
  learnerId: string;
  orderId: string;
  paymentId?: string;
  amount: number; // in paise (INR smallest unit)
  currency: string; // "INR"
  status: "created" | "paid" | "failed";
  method?: string; // "upi" | "card" | ...
  provider: "razorpay" | "mock";
  createdAt: string;
  paidAt?: string;
}

export interface DB {
  trainer: Trainer;
  cohortName: string;
  startDate: string | null;
  trainees: Trainee[];
  sessions: Session[];
  progress: Progress;
  outbox: OutboxMail[];
  // agentic platform
  learners: Learner[];
  coachSessions: CoachSession[];
  tickets: HelpTicket[];
  payments: Payment[];
}

export interface Certificate {
  id: string;
  credentialId: string;
  learnerId: string;
  learnerName: string;
  learnerEmail: string;
  cohort: string;
  daysCompleted: number;
  capstoneTitle: string;
  capstoneSummary: string;
  capstoneRaw: string;
  status: "valid" | "revoked";
  issuedAt: string;
  revokedAt?: string;
}

// ---------------------------------------------------------------------------
// Module A — Lead capture & Surge cross-sell bridge
// ---------------------------------------------------------------------------
export type LeadStatus = "new" | "contacted" | "enrolled" | "dropped";

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  background: string; // student | working_professional | surge_track | other
  interest: string;
  heardFrom: string;
  source: string; // surge_crosssell | organic | ...
  status: LeadStatus;
  consent: boolean;
  notes?: string;
  learnerId?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Module E — Careers / Placement hub
// ---------------------------------------------------------------------------
export interface JobRole {
  id: string;
  slug: string;
  title: string;
  description: string;
  skills: string[];
  curriculumDays: number[];
  level: string; // entry | mid | senior
  salaryBand: string;
  demandNotes: string;
  capstoneFit: string;
  sortOrder: number;
  createdAt: string;
}

export interface Opening {
  id: string;
  roleId?: string;
  title: string;
  company: string;
  location: string;
  mode: string; // onsite | remote | hybrid
  packageBand: string;
  applyUrl?: string;
  status: string; // open | closed
  postedAt: string;
}

export type PlacementStatus = "ready" | "in_process" | "placed";

export interface PlacementProfile {
  learnerId: string;
  shareableSlug: string;
  status: PlacementStatus;
  headline?: string;
  updatedAt: string;
}

export interface Placement {
  id: string;
  learnerId: string;
  learnerName: string;
  role: string;
  company: string;
  packageBand: string;
  date: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Module F — Media library (interview prep + orientation)
// ---------------------------------------------------------------------------
export interface MediaItem {
  id: string;
  type: "interview" | "orientation";
  title: string;
  description: string;
  roleId?: string;
  url: string;
  gatedLevel: "public" | "enrolled" | "certified";
  tags: string[];
  sortOrder: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Module G — Cohorts & attendance
// ---------------------------------------------------------------------------
export interface Cohort {
  id: string;
  name: string;
  startDate?: string;
  sessionDates: string[];
  trainerId?: string;
  createdAt: string;
}

export interface AttendanceMark {
  cohortId: string;
  learnerId: string;
  sessionDate: string;
  present: boolean;
}

// ---------------------------------------------------------------------------
// Module C — Capstone submission & review
// ---------------------------------------------------------------------------
export type CapstoneStatus = "submitted" | "under_review" | "approved" | "revisions";

export interface Capstone {
  id: string;
  learnerId: string;
  learnerName: string;
  title: string;
  description: string;
  links: string[];
  fileUrl?: string;
  status: CapstoneStatus;
  scoreUnderstanding?: number;
  scoreImplementation?: number;
  scoreCompleteness?: number;
  scorePresentation?: number;
  comments?: string;
  reviewerId?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export const FREE_HANDHOLDING_LIMIT = 3;
