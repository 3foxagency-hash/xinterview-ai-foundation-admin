export type WorkflowStage = {
  id: string;
  label: string;
  count: number;
  terminal?: boolean;
};

export type Candidate = {
  id: string;
  name: string;
  initials: string;
  title: string;
  email: string;
  phone: string;
  applied: string;
  source: string;
  score?: number;
  rating?: number;
  reviews: number;
  live?: boolean;
};

export type InterviewQuestion = {
  id: string;
  number: number;
  text: string;
  answer: string;
  duration: string;
  flagged?: boolean;
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
  { id: 'aarav', name: 'Aarav Malhotra', initials: 'AM', title: 'Sr. Product Designer', email: 'aarav.malhotra@example.com', phone: '+91 98765 43210', applied: 'Today, 10:24 AM', source: 'via direct link', score: 88, rating: 4.5, reviews: 3, live: true },
  { id: 'saanvi', name: 'Saanvi Iyer', initials: 'SI', title: 'Product Designer', email: 'saanvi.iyer@example.com', phone: '+91 98765 42110', applied: 'Today, 09:11 AM', source: 'via direct link', score: 76, rating: 4, reviews: 2 },
  { id: 'rohan', name: 'Rohan Mehta', initials: 'RM', title: 'UX Designer', email: 'rohan.mehta@example.com', phone: '+91 98765 41120', applied: 'Yesterday, 06:35 PM', source: 'via direct link', score: 62, rating: 3.5, reviews: 2, live: true },
  { id: 'diya', name: 'Diya Shah', initials: 'DS', title: 'Product Designer', email: 'diya.shah@example.com', phone: '+91 98765 40130', applied: 'Yesterday, 03:22 PM', source: 'via direct link', score: 58, reviews: 0 },
  { id: 'krishnapriya', name: 'Krishnapriya Venkataraman Subramanian', initials: 'KV', title: 'Senior Product Designer', email: 'krishnapriya@example.com', phone: '+91 98765 39140', applied: '14 Aug, 11:02 AM', source: 'via direct link', score: 45, rating: 2.5, reviews: 1 },
  { id: 'ishaan', name: 'Ishaan Verma', initials: 'IV', title: 'Product Designer', email: 'ishaan.verma@example.com', phone: '+91 98765 38150', applied: '13 Aug, 08:47 AM', source: 'via direct link', score: 34, reviews: 0 },
  { id: 'neha', name: 'Neha Kapoor', initials: 'NK', title: 'Product Designer', email: 'neha.kapoor@example.com', phone: '+91 98765 37160', applied: '13 Aug, 04:15 AM', source: 'via direct link', score: 71, rating: 4, reviews: 1 },
];

export const interviewQuestions: InterviewQuestion[] = [
  { id: 'q1', number: 1, text: 'Tell us about your background and what brings you here.', answer: 'I have spent the last six years designing products that help teams work more clearly and confidently.', duration: '01:12' },
  { id: 'q2', number: 2, text: 'Tell us about a challenging project you worked on.', answer: 'A challenging project I worked on was redesigning our onboarding experience for a B2B SaaS product. The existing flow had too many steps, which created friction for new users.', duration: '01:48', flagged: true },
  { id: 'q3', number: 3, text: 'Walk us through your design process.', answer: 'My design process starts with understanding the problem deeply. I begin with user research, competitor analysis, and gathering context from the team.', duration: '01:33', flagged: true },
  { id: 'q4', number: 4, text: 'How do you handle feedback or criticism?', answer: 'I view feedback as an opportunity to improve. I listen carefully, ask clarifying questions, and look for the strongest idea in the room.', duration: '01:05' },
  { id: 'q5', number: 5, text: 'What does great collaboration look like to you?', answer: 'Great collaboration is transparent, kind, and focused on the outcome rather than ownership of an idea.', duration: '01:22' },
  { id: 'q6', number: 6, text: 'What would you like to learn in your next role?', answer: 'I want to deepen my product strategy skills and work closer to the decisions that shape the customer experience.', duration: '00:58' },
];
