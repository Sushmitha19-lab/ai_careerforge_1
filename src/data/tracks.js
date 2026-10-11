export const COURSE_ICONS = ["✦", "◈", "⌘", "◇", "△", "○", "▣", "◐", "▽", "⬡"];

export const TRACK_ROUNDS = {
  software: [
    { id: "aptitude", name: "Aptitude", blurb: "Logical and quantitative ability" },
    { id: "coding", name: "Coding", blurb: "Programming and problem solving" },
    { id: "technical", name: "Technical", blurb: "DSA, core CS, and system thinking" },
    { id: "hr", name: "HR", blurb: "Communication and behavioural" },
  ],
  ai: [
    { id: "aptitude", name: "Quant aptitude", blurb: "Probability, stats, and reasoning" },
    { id: "coding", name: "Python coding", blurb: "Python, pandas, and algorithms" },
    { id: "technical", name: "ML technical", blurb: "Models, metrics, and ML systems" },
    { id: "hr", name: "HR", blurb: "Communication and stakeholder stories" },
  ],
  cloud: [
    { id: "aptitude", name: "Aptitude", blurb: "Reasoning for operations problems" },
    { id: "coding", name: "Linux / scripting", blurb: "Shell, Python, and automation" },
    { id: "technical", name: "Cloud technical", blurb: "AWS/Azure, networking, reliability" },
    { id: "hr", name: "HR", blurb: "Ownership and incident communication" },
  ],
  security: [
    { id: "aptitude", name: "Aptitude", blurb: "Logic used in risk and triage" },
    { id: "coding", name: "Practical labs", blurb: "Scripts, logs, and exploit-aware coding" },
    { id: "technical", name: "Security technical", blurb: "CIA, IAM, and incident response" },
    { id: "hr", name: "HR", blurb: "Saying no to risk and influencing leaders" },
  ],
  fullstack: [
    { id: "aptitude", name: "Aptitude", blurb: "Logic before you open the editor" },
    { id: "coding", name: "Coding", blurb: "JavaScript, APIs, and data structures" },
    { id: "technical", name: "Full-stack technical", blurb: "Frontend, backend, and shipping" },
    { id: "hr", name: "HR", blurb: "Working with product and users" },
  ],
  mobile: [
    { id: "aptitude", name: "Aptitude", blurb: "Reasoning under device constraints" },
    { id: "coding", name: "Coding", blurb: "Kotlin / Swift / Flutter problem solving" },
    { id: "technical", name: "Mobile technical", blurb: "Lifecycle, offline, and store quality" },
    { id: "hr", name: "HR", blurb: "Shipping with design and QA" },
  ],
  analytics: [
    { id: "aptitude", name: "Quant aptitude", blurb: "Percentages, distributions, and logic" },
    { id: "coding", name: "SQL coding", blurb: "Joins, windows, and messy data" },
    { id: "technical", name: "Analytics technical", blurb: "Metrics, bias, and storytelling" },
    { id: "hr", name: "HR", blurb: "Explaining numbers to a business owner" },
  ],
  ux: [
    { id: "aptitude", name: "Aptitude", blurb: "Structured thinking about users" },
    { id: "coding", name: "Design challenge", blurb: "Flows, wireframes, and critique" },
    { id: "technical", name: "UX technical", blurb: "Research, accessibility, and systems" },
    { id: "hr", name: "HR", blurb: "Defending a design with evidence" },
  ],
  qa: [
    { id: "aptitude", name: "Aptitude", blurb: "Boundary cases and careful logic" },
    { id: "coding", name: "Test coding", blurb: "Cases, automation, and APIs" },
    { id: "technical", name: "QA technical", blurb: "Coverage, risk, and quality gates" },
    { id: "hr", name: "HR", blurb: "Raising defects without blocking the team" },
  ],
  database: [
    { id: "aptitude", name: "Aptitude", blurb: "Set thinking and careful counting" },
    { id: "coding", name: "SQL coding", blurb: "Queries, indexes, and plans" },
    { id: "technical", name: "Database technical", blurb: "Modeling, transactions, and scale" },
    { id: "hr", name: "HR", blurb: "Explaining downtime and data risk" },
  ],
};

const NAME_TO_TRACK = [
  ["data science", "ai"],
  ["artificial", "ai"],
  ["machine learning", "ai"],
  ["analytics", "analytics"],
  ["cloud", "cloud"],
  ["devops", "cloud"],
  ["cyber", "security"],
  ["security", "security"],
  ["full stack", "fullstack"],
  ["fullstack", "fullstack"],
  ["mobile", "mobile"],
  ["android", "mobile"],
  ["ios", "mobile"],
  ["ui/ux", "ux"],
  ["ux", "ux"],
  ["design", "ux"],
  ["quality", "qa"],
  ["qa", "qa"],
  ["test", "qa"],
  ["database", "database"],
  ["sql", "database"],
  ["data", "ai"],
];

export function trackFromCourse(course) {
  if (course?.track && TRACK_ROUNDS[course.track]) {
    return course.track;
  }
  const name = `${course?.name || ""}`.toLowerCase();
  const hit = NAME_TO_TRACK.find(([needle]) => name.includes(needle));
  return hit ? hit[1] : "software";
}

export function roundsForCourse(course) {
  return TRACK_ROUNDS[trackFromCourse(course)] || TRACK_ROUNDS.software;
}

export function roundLabel(course, roundId) {
  const round = roundsForCourse(course).find((item) => item.id === roundId);
  return round?.name || roundId;
}
