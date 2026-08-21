export type WorkflowStage = {
  id: string;
  label: string;
  count: number;
  terminal?: boolean;
};

/* A banded verdict, never a numeric score. Ranking people on a 0–100 scale
   invites false precision and unfair comparison, so the AI reports which band
   a candidate falls in and nothing finer. */
export type MatchLevel = 'perfect' | 'good' | 'average' | 'poor';

export const MATCH_LEVELS: MatchLevel[] = ['perfect', 'good', 'average', 'poor'];

export const MATCH_LABEL: Record<MatchLevel, string> = {
  perfect: 'Perfect match',
  good: 'Good match',
  average: 'Average match',
  poor: 'Poor match',
};

export type Candidate = {
  id: string;
  /** Opaque handle for share links — never derived from the name, so an
      anonymized link can't leak identity through the URL itself. */
  shareToken: string;
  name: string;
  initials: string;
  title: string;
  email: string;
  phone: string;
  applied: string;
  source: string;
  match?: MatchLevel;
  rating?: number;
  reviews: number;
  live?: boolean;
};

/* Comments and reviews are what the hiring team adds by hand from the
   header actions; a review additionally carries a star rating, and the
   candidate's headline rating is the average of those. */
export type TeamNote = {
  id: string;
  author: string;
  email: string;
  initials: string;
  at: string;
  body: string;
  /** Reviews only — 1..5 stars. */
  stars?: number;
};

/* Two severities, not one: the reference marks a hard flag (an integrity or
   quality concern) in red and a softer "worth a look" in amber. */
export type FlagSeverity = 'high' | 'medium';

export type InterviewQuestion = {
  id: string;
  number: number;
  text: string;
  answer: string;
  duration: string;
  /** The full spoken answer; `answer` is the rail's short preview of it. */
  transcript?: string;
  /** Seconds — drives the player scrubber and the elapsed/total readout. */
  seconds: number;
  allowed: string;
  flagged?: FlagSeverity;
};

export type AiOverview = {
  verdict: string;
  summary: string;
  strengths: string[];
  improvements: string[];
};

export const workflowStages: WorkflowStage[] = [
  { id: 'invited', label: 'Invited', count: 24 },
  { id: 'in-progress', label: 'In Progress', count: 18 },
  { id: 'review', label: 'Review', count: 22 },
  { id: 'shortlisted', label: 'Shortlisted', count: 8 },
  { id: 'live-interview', label: 'Live Interview', count: 5 },
  { id: 'hired', label: 'Hired', count: 2 },
  { id: 'rejected', label: 'Rejected', count: 11, terminal: true },
];

export const workflowCandidates: Candidate[] = [
  { id: 'aarav', shareToken: 'c-7f2k9m', name: 'Aarav Malhotra', initials: 'AM', title: 'Sr. Product Designer', email: 'aarav.malhotra@example.com', phone: '+91 98765 43210', applied: 'Today, 10:24 AM', source: 'via direct link', match: 'perfect', rating: 4.5, reviews: 3, live: true },
  { id: 'saanvi', shareToken: 'c-3q8x1p', name: 'Saanvi Iyer', initials: 'SI', title: 'Product Designer', email: 'saanvi.iyer@example.com', phone: '+91 98765 42110', applied: 'Today, 09:11 AM', source: 'via direct link', match: 'good', rating: 4, reviews: 2 },
  { id: 'rohan', shareToken: 'c-9d4w6t', name: 'Rohan Mehta', initials: 'RM', title: 'UX Designer', email: 'rohan.mehta@example.com', phone: '+91 98765 41120', applied: 'Yesterday, 06:35 PM', source: 'via direct link', match: 'average', rating: 3.5, reviews: 2, live: true },
  { id: 'diya', shareToken: 'c-2r5n8v', name: 'Diya Shah', initials: 'DS', title: 'Product Designer', email: 'diya.shah@example.com', phone: '+91 98765 40130', applied: 'Yesterday, 03:22 PM', source: 'via direct link', match: 'average', reviews: 0 },
  { id: 'krishnapriya', shareToken: 'c-6h1z4y', name: 'Krishnapriya Venkataraman Subramanian', initials: 'KV', title: 'Senior Product Designer', email: 'krishnapriya@example.com', phone: '+91 98765 39140', applied: '14 Aug, 11:02 AM', source: 'via direct link', match: 'poor', rating: 2.5, reviews: 1 },
  { id: 'ishaan', shareToken: 'c-5b3j7c', name: 'Ishaan Verma', initials: 'IV', title: 'Product Designer', email: 'ishaan.verma@example.com', phone: '+91 98765 38150', applied: '13 Aug, 08:47 AM', source: 'via direct link', match: 'poor', reviews: 0 },
  { id: 'neha', shareToken: 'c-8t2f5s', name: 'Neha Kapoor', initials: 'NK', title: 'Product Designer', email: 'neha.kapoor@example.com', phone: '+91 98765 37160', applied: '13 Aug, 04:15 AM', source: 'via direct link', match: 'good', rating: 4, reviews: 1 },
];

export const interviewQuestions: InterviewQuestion[] = [
  { id: 'q1', number: 1, text: 'Tell us about your background and what brings you here.', answer: 'I have spent the last six years designing products that help teams work more clearly and confidently.', duration: '01:12', transcript: `I have spent the last six years designing products that help teams work more clearly and confidently.

I started out in agency work, which taught me to get to the heart of a problem quickly, and then moved in-house so I could stay with a product long enough to see whether the decisions actually held up.

Most recently I have been leading design on a B2B platform used by operations teams. What draws me to this role is that it sits at the same intersection: complex workflows, real constraints, and users who notice immediately when something is off.`, seconds: 72, allowed: '2 min' },
  { id: 'q2', number: 2, text: 'Tell us about a challenging project you worked on.', answer: 'A challenging project I worked on was redesigning our onboarding experience for a B2B SaaS product. The existing flow had too many steps, which created friction for new users.', duration: '01:48', transcript: `A challenging project I worked on was redesigning our onboarding experience for a B2B SaaS product. The existing flow had too many steps, which created friction for new users.

We were seeing about forty percent of accounts stall before they ever reached the first useful action. I started by watching session recordings and sitting in on support calls, and it became clear the problem was not the number of steps so much as the fact that we asked for information before we had shown any value.

We restructured it so the product did something useful within the first minute, then collected the rest progressively. Rebuilding the flow meant coordinating with backend and billing, which was the harder part, because the sequencing had real technical constraints.

Completion improved substantially, and support tickets about setup dropped noticeably in the following quarter.`, seconds: 108, allowed: '2 min', flagged: 'high' },
  { id: 'q3', number: 3, text: 'Walk us through your design process.', answer: 'My design process starts with understanding the problem deeply. I begin with user research, competitor analysis, and gathering context from the team.', duration: '01:33', transcript: `My design process starts with understanding the problem deeply. I begin with user research, competitor analysis, and gathering context from the team.

I try to write down what I think is true before I start designing, because it makes it obvious later which assumptions were wrong. From there I work in low fidelity for as long as I can, usually flows and rough structure rather than anything visual.

Once the shape is right I move into higher fidelity and start testing with real users, ideally five or six. Then I stay close to engineering through build, because the details decided during implementation are usually the ones users actually feel.`, seconds: 93, allowed: '2 min', flagged: 'high' },
  { id: 'q4', number: 4, text: 'How do you handle feedback or criticism?', answer: 'I view feedback as an opportunity to improve. I listen carefully, ask clarifying questions, and look for the strongest idea in the room.', duration: '01:05', transcript: `I view feedback as an opportunity to improve. I listen carefully, ask clarifying questions, and look for the strongest idea in the room.

Early in my career I would defend work reflexively. What changed my mind was a project where a colleague kept pushing on a flow I was sure about, and they turned out to be right: I had solved for the wrong user.

Now I try to separate the critique of the work from the work itself, and ask what the person is seeing that I am not. If I disagree after that, I will say so and explain my reasoning, but I want to have genuinely understood the objection first.`, seconds: 65, allowed: '2 min', flagged: 'medium' },
  { id: 'q5', number: 5, text: 'What does great collaboration look like to you?', answer: 'Great collaboration is transparent, kind, and focused on the outcome rather than ownership of an idea.', duration: '01:22', transcript: `Great collaboration is transparent, kind, and focused on the outcome rather than ownership of an idea.

In practice that means sharing work before it is polished, being explicit about what is decided and what is still open, and making it easy for engineering and product to push back early rather than late.

The teams I have enjoyed most had a habit of thinking out loud together. Nobody was precious about who came up with what, and the work was noticeably better for it.`, seconds: 82, allowed: '2 min' },
  { id: 'q6', number: 6, text: 'What would you like to learn in your next role?', answer: 'I want to deepen my product strategy skills and work closer to the decisions that shape the customer experience.', duration: '00:58', transcript: `I want to deepen my product strategy skills and work closer to the decisions that shape the customer experience.

I have grown a lot on the craft side, and I am confident taking an ambiguous problem through to a shipped solution. What I want next is more responsibility for which problems we take on in the first place.

I would also like to mentor more. I have done it informally and found it genuinely rewarding, and it tends to sharpen my own thinking too.`, seconds: 58, allowed: '90 sec' },
  { id: 'q7', number: 7, text: 'Tell us about a time you disagreed with a product decision.', answer: 'I pushed back on shipping a feature that solved a stakeholder request rather than a user problem.', duration: '01:41', transcript: `I pushed back on shipping a feature that solved a stakeholder request rather than a user problem.

The ask was for a bulk-export tool, and the reasoning was that one large customer had asked for it twice. When I looked at the support history, what they actually wanted was to get a weekly summary into a spreadsheet, which is a much smaller problem.

I put together a short doc with the two options and what each would cost to build. We shipped the scheduled summary in about a week instead of a month, and the customer was happy. The lesson I took was that pushing back works far better with an alternative attached.`, seconds: 101, allowed: '2 min' },
  { id: 'q8', number: 8, text: 'How do you approach designing for accessibility?', answer: 'I treat it as a constraint from the start rather than an audit at the end.', duration: '01:28', transcript: `I treat it as a constraint from the start rather than an audit at the end, because retrofitting is usually where the cost comes from.

Practically that means checking contrast while I am choosing colours, designing focus states at the same time as hover states, and writing the heading structure into the wireframe rather than leaving it to implementation.

I also keep a keyboard-only pass in my review checklist. It catches a surprising amount — skipped focus traps, modals that do not return focus, custom controls that are not reachable at all.`, seconds: 88, allowed: '2 min', flagged: 'medium' },
  { id: 'q9', number: 9, text: 'Describe how you work with engineers during implementation.', answer: 'I stay close through build rather than handing off a file and moving on.', duration: '01:52', transcript: `I stay close through build rather than handing off a file and moving on.

Before work starts I walk through the flow with whoever is picking it up, focusing on the states that are easy to miss — empty, loading, error, and what happens at the edges of the data.

During the build I try to review in the actual environment rather than screenshots, because spacing and motion never feel the same in a static image. If something needs to change for a technical reason, I would rather know early and adjust than protect a design that costs a week.`, seconds: 112, allowed: '2 min' },
  { id: 'q10', number: 10, text: 'What metrics do you use to judge whether a design succeeded?', answer: 'It depends on the problem, but I try to agree the measure before the work starts.', duration: '01:36', transcript: `It depends on the problem, but I try to agree the measure before the work starts, otherwise you end up choosing the number that flatters the result.

For the onboarding work it was completion rate and time to first useful action. For a settings redesign it was support tickets in that area. For a dashboard it was whether people returned to it weekly.

I also watch for the counter-metric. A flow can complete more often because it got easier or because it got pushier, and those look identical if you only track completion.`, seconds: 96, allowed: '2 min' },
  { id: 'q11', number: 11, text: 'Tell us about a project that did not go well.', answer: 'A redesign I led got most of the way to launch and then was shelved.', duration: '01:47', transcript: `A redesign I led got most of the way to launch and then was shelved, and it was largely my fault.

I had designed for what I thought the product should become rather than what the team could realistically ship that quarter. It tested well, but the build estimate came back at roughly three times what we had.

What I would do differently is bring engineering in during exploration rather than at review. I now try to get a rough feasibility read while the ideas are still cheap to change.`, seconds: 107, allowed: '2 min', flagged: 'high' },
  { id: 'q12', number: 12, text: 'How do you prioritise when everything is urgent?', answer: 'I try to separate what is urgent from what is consequential, because they are rarely the same list.', duration: '01:19', transcript: `I try to separate what is urgent from what is consequential, because they are rarely the same list.

My first move is to write everything down and mark what is genuinely blocked on me versus what is simply waiting. A surprising amount turns out to be the latter.

After that I look for the item that unblocks the most other people, and do that first even if it is not the most interesting. If I still cannot choose, I would rather ask my manager to break the tie than quietly pick and hope.`, seconds: 79, allowed: '90 sec' },
  { id: 'q13', number: 13, text: 'What does a good design critique look like to you?', answer: 'One where the person presenting says what they want feedback on before anyone starts talking.', duration: '01:24', transcript: `One where the person presenting says what they want feedback on before anyone starts talking.

Without that you get comments about button colour on work that is still exploring structure, which wastes everyone's time and makes the presenter defensive.

I also think critique works better when people describe what they are seeing rather than prescribing a fix. "I could not tell what to do next on this screen" is more useful than "make the button bigger", because it leaves the solution open.`, seconds: 84, allowed: '90 sec' },
  { id: 'q14', number: 14, text: 'How do you keep your skills current?', answer: 'Mostly by building things and by paying attention to products that solve problems close to mine.', duration: '01:15', transcript: `Mostly by building things. I find I do not really understand a pattern until I have had to implement it and watch someone struggle with it.

Beyond that I pay attention to products solving problems close to mine, and I try to work out why they made a particular choice rather than just noting that it looks good.

I also read outside design — a fair amount of what has changed how I work came from writing about systems and decision-making rather than from design blogs.`, seconds: 75, allowed: '90 sec' },
  { id: 'q15', number: 15, text: 'Why are you interested in this role specifically?', answer: 'The problem space is one I have spent years in, and the stage of the team is where I do my best work.', duration: '01:33', transcript: `The problem space is one I have spent years in. Hiring tools sit right where I like to work: dense workflows, real consequences for the people on both sides, and a lot of room for the interface to either help or get in the way.

The stage also matters to me. A team that is past the earliest scramble but still deciding what the product becomes is where I have been most useful, because there is enough signal to design against and enough openness to change direction.

And honestly, the interview experience itself is something I have opinions about as a candidate. It is unusual to get to work on something you have been on the receiving end of.`, seconds: 93, allowed: '2 min' },
];

/* Three strengths, matching the reference — the previous two-item list left
   the Strengths column visibly shorter than Areas to improve. */
export const aiOverview: AiOverview = {
  verdict: 'Good Fit',
  summary: 'Strong product thinking and communication.',
  strengths: ['Clear problem understanding', 'Good ownership and initiative', 'Structured explanation'],
  improvements: ['Could add more metrics', 'Impact could be more specific'],
};

export const candidateComments: TeamNote[] = [
  { id: 'c1', author: 'Sarah Chen', email: 'sarah.chen@xinterview.ai', initials: 'SC', at: 'Today, 11:02 AM', body: 'Really clear communicator. Walked through the onboarding redesign end to end without losing the thread.' },
  { id: 'c2', author: 'Michael Wong', email: 'michael.wong@xinterview.ai', initials: 'MW', at: 'Today, 09:47 AM', body: 'Agreed on the craft. I would like to hear more about how they measured the impact of that work.' },
  { id: 'c3', author: 'Priya Nair', email: 'priya.nair@xinterview.ai', initials: 'PN', at: 'Yesterday, 04:15 PM', body: 'Good ownership signals throughout. Worth putting in front of the product team.' },
];

export const candidateReviews: TeamNote[] = [
  { id: 'r1', author: 'Sarah Chen', email: 'sarah.chen@xinterview.ai', initials: 'SC', at: 'Today, 11:10 AM', stars: 5, body: 'Strongest portfolio in this batch. Systems thinking came through in every answer.' },
  { id: 'r2', author: 'Michael Wong', email: 'michael.wong@xinterview.ai', initials: 'MW', at: 'Today, 10:05 AM', stars: 4, body: 'Solid across the board. Would benefit from sharper metrics when describing outcomes.' },
  { id: 'r3', author: 'Priya Nair', email: 'priya.nair@xinterview.ai', initials: 'PN', at: 'Yesterday, 05:30 PM', stars: 4.5, body: 'Collaborative and thoughtful. Handled the feedback question with real self-awareness.' },
];

/* Placeholder resume served from /public until real uploads are wired up. */
export const RESUME_URL = '/CVArchanaGaitonde.pdf';
export const RESUME_META = { fileName: 'CVArchanaGaitonde.pdf', pages: 4, sizeLabel: '100 KB' };

/* ── Shareable link ──
   A share link exposes a read-only view of the candidate's interview. Each
   toggle controls what the recipient can see or do on that page, so the
   options travel with the link rather than being a property of the candidate. */
export type ShareOption = {
  id: 'name' | 'cv' | 'review' | 'comments' | 'aiReport';
  label: string;
  hint: string;
};

export const SHARE_OPTIONS: ShareOption[] = [
  { id: 'name', label: 'Show candidate name', hint: 'Reveal the name. Turn off to share the interview anonymously.' },
  { id: 'cv', label: 'Include resume', hint: "Attach the candidate's CV to the shared view." },
  { id: 'review', label: 'Allow reviews', hint: 'Let recipients rate the candidate with a star review.' },
  { id: 'comments', label: 'Allow comments', hint: 'Let recipients leave comments on the interview.' },
  { id: 'aiReport', label: 'Include AI report', hint: 'Show the AI assessment and per-question analysis.' },
];

export type ShareSettings = Record<ShareOption['id'], boolean>;

export const DEFAULT_SHARE_SETTINGS: ShareSettings = {
  name: true, cv: true, review: true, comments: true, aiReport: true,
};

/* ── Job links ──
   A job-level shareable link, distinct from the per-candidate ShareDialog
   above: it bundles a chosen set of candidates and questions behind one URL,
   optionally PIN-protected. Kept as an in-memory store keyed by jobId so the
   More menu can tell "no links yet" from "links exist" without a backend. */
export type JobLink = {
  id: string;
  jobId: string;
  name: string;
  candidateIds: string[];
  questionIds: string[];
  settings: ShareSettings;
  pin: string | null;
  url: string;
  createdAt: string;
};

const jobLinksStore = new Map<string, JobLink[]>();

export function getJobLinks(jobId: string): JobLink[] {
  return jobLinksStore.get(jobId) ?? [];
}

export type JobLinkInput = {
  name: string;
  candidateIds: string[];
  questionIds: string[];
  settings: ShareSettings;
  pin: string | null;
};

function buildLinkUrl(input: JobLinkInput): string {
  const enabled = (Object.keys(input.settings) as ShareOption['id'][]).filter((key) => input.settings[key]);
  const origin = typeof window === 'undefined' ? '' : window.location.origin;
  const tokens = input.candidateIds
    .map((id) => workflowCandidates.find((item) => item.id === id)?.shareToken)
    .filter((token): token is string => Boolean(token));
  const query = [tokens.length ? `c=${tokens.join(',')}` : '', enabled.length ? `opts=${enabled.join(',')}` : ''].filter(Boolean).join('&');
  return `${origin}/share${query ? `?${query}` : ''}`;
}

export function createJobLink(jobId: string, input: JobLinkInput): JobLink {
  const link: JobLink = {
    id: `link-${Date.now().toString(36)}`,
    jobId,
    name: input.name,
    candidateIds: input.candidateIds,
    questionIds: input.questionIds,
    settings: input.settings,
    pin: input.pin,
    url: buildLinkUrl(input),
    createdAt: new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' }),
  };

  jobLinksStore.set(jobId, [link, ...getJobLinks(jobId)]);
  return link;
}

/* Editing a link's candidates/questions/options changes what the URL's query
   string must encode, so the URL is regenerated on every update rather than
   left stale — the id and createdAt stay fixed, everything else can change. */
export function updateJobLink(jobId: string, linkId: string, input: JobLinkInput): JobLink | null {
  const current = getJobLinks(jobId);
  const existing = current.find((item) => item.id === linkId);
  if (!existing) return null;

  const updated: JobLink = {
    ...existing,
    name: input.name,
    candidateIds: input.candidateIds,
    questionIds: input.questionIds,
    settings: input.settings,
    pin: input.pin,
    url: buildLinkUrl(input),
  };

  jobLinksStore.set(jobId, current.map((item) => (item.id === linkId ? updated : item)));
  return updated;
}
