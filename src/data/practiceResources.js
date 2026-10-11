const link = (title, type, url, blurb) => ({ title, type, url, blurb });

const APTITUDE = [
  link(
    "IndiaBix aptitude",
    "PRACTICE",
    "https://www.indiabix.com/aptitude/questions-and-answers/",
    "Quantitative and logical sets used in campus aptitude rounds."
  ),
  link(
    "GeeksforGeeks aptitude",
    "PRACTICE",
    "https://www.geeksforgeeks.org/aptitude/aptitude-questions-and-answers/",
    "Topic-wise aptitude with explanations."
  ),
  link(
    "Placement reasoning",
    "PRACTICE",
    "https://www.indiabix.com/logical-reasoning/questions-and-answers/",
    "Puzzles and logical reasoning for the first screen."
  ),
];

const DSA = [
  link(
    "LeetCode top interview",
    "CODING",
    "https://leetcode.com/explore/interview/card/top-interview-questions-easy/",
    "Arrays, hashing, and easy-medium coding patterns."
  ),
  link(
    "GeeksforGeeks DSA",
    "NOTES",
    "https://www.geeksforgeeks.org/data-structures/",
    "Structures, complexity, and worked examples."
  ),
  link(
    "HackerRank algorithms",
    "CODING",
    "https://www.hackerrank.com/domains/algorithms",
    "Timed practice that matches many company coding rounds."
  ),
];

const HR = [
  link(
    "GeeksforGeeks HR set",
    "HR",
    "https://www.geeksforgeeks.org/hr-interview-questions/",
    "Standard HR questions with structured answer patterns."
  ),
  link(
    "STAR method",
    "GUIDE",
    "https://www.themuse.com/advice/star-interview-method",
    "Situation, Task, Action, Result — what behavioural rounds score."
  ),
  link(
    "Leadership principles (Amazon-style)",
    "GUIDE",
    "https://www.amazon.jobs/content/en/our-workplace/leadership-principles",
    "Ownership stories with a metric and a customer."
  ),
];

const BY_TRACK = {
  software: {
    aptitude: APTITUDE,
    coding: DSA,
    technical: [
      link("OS / DBMS / CN", "NOTES", "https://www.geeksforgeeks.org/operating-systems/", "Core CS screening after coding."),
      link("System design primer", "GUIDE", "https://github.com/donnemartin/system-design-primer", "APIs, scale, and failure modes."),
      link("InterviewBit CS", "PRACTICE", "https://www.interviewbit.com/technical-interview-questions/", "OOP, DBMS, and networks drills."),
    ],
    hr: HR,
  },
  ai: {
    aptitude: [
      ...APTITUDE.slice(0, 2),
      link("Khan Academy statistics", "COURSE", "https://www.khanacademy.org/math/statistics-probability", "Distributions, bias, and what a metric means."),
    ],
    coding: [
      link("Python on LeetCode", "CODING", "https://leetcode.com/problemset/", "Arrays and hashing in Python."),
      link("Pandas exercises", "PRACTICE", "https://github.com/guipsamora/pandas_exercises", "Tables, joins, and missing values."),
      link("NumPy fundamentals", "NOTES", "https://numpy.org/doc/stable/user/absolute_beginners.html", "Vectorized work before ML."),
    ],
    technical: [
      link("Google ML crash course", "COURSE", "https://developers.google.com/machine-learning/crash-course", "Supervised learning and evaluation."),
      link("sklearn user guide", "NOTES", "https://scikit-learn.org/stable/user_guide.html", "Models, pipelines, and metrics."),
      link("Made With ML", "GUIDE", "https://madewithml.com/", "Shipping ML, not only training it."),
    ],
    hr: HR,
  },
  cloud: {
    aptitude: APTITUDE,
    coding: [
      link("OverTheWire Bandit", "LAB", "https://overthewire.org/wargames/bandit/", "Linux files, permissions, and logs."),
      link("Bash guide", "NOTES", "https://mywiki.wooledge.org/BashGuide", "Scripting used in CI and on-call."),
      link("Python automation", "COURSE", "https://automatetheboringstuff.com/", "Small scripts that replace click-ops."),
    ],
    technical: [
      link("AWS skill builder", "COURSE", "https://skillbuilder.aws/", "IaaS vs PaaS and one real workload."),
      link("Azure fundamentals", "COURSE", "https://learn.microsoft.com/training/paths/azure-fundamentals/", "Identity, networking, and cost."),
      link("Google SRE book", "GUIDE", "https://sre.google/sre-book/table-of-contents/", "SLIs, toil, and incident habits."),
    ],
    hr: HR,
  },
  security: {
    aptitude: APTITUDE,
    coding: [
      link("PortSwigger Web Security Academy", "LAB", "https://portswigger.net/web-security", "Injection, access control, and proofs."),
      link("OWASP Top 10", "NOTES", "https://owasp.org/www-project-top-ten/", "What AppSec rounds actually ask."),
      link("TryHackMe pre-sec", "LAB", "https://tryhackme.com/path/outline/beginner", "Logs, Linux, and basic response."),
    ],
    technical: [
      link("NIST incident guide", "GUIDE", "https://www.nist.gov/cyberframework", "Contain, eradicate, recover."),
      link("Google identity docs", "NOTES", "https://cloud.google.com/iam/docs/overview", "Least privilege and joiners-movers-leavers."),
      link("Cloud security basics", "COURSE", "https://www.coursera.org/learn/google-cybersecurity", "CIA with a cloud example."),
    ],
    hr: HR,
  },
  fullstack: {
    aptitude: APTITUDE,
    coding: DSA,
    technical: [
      link("MDN JavaScript", "NOTES", "https://developer.mozilla.org/en-US/docs/Web/JavaScript", "Language before the framework."),
      link("React learn", "COURSE", "https://react.dev/learn", "UI state and composition."),
      link("HTTP and REST", "GUIDE", "https://developer.mozilla.org/en-US/docs/Web/HTTP", "APIs, status codes, and caching."),
    ],
    hr: HR,
  },
  mobile: {
    aptitude: APTITUDE,
    coding: [
      ...DSA.slice(0, 2),
      link("Kotlin Koans", "PRACTICE", "https://play.kotlinlang.org/koans", "Language fluency for Android screens."),
    ],
    technical: [
      link("Android training", "COURSE", "https://developer.android.com/courses", "Lifecycle, navigation, and Play quality."),
      link("Apple Human Interface", "GUIDE", "https://developer.apple.com/design/human-interface-guidelines/", "What iOS rounds call craft."),
      link("Flutter layout", "NOTES", "https://docs.flutter.dev/ui", "Constraints, lists, and offline-ish UX."),
    ],
    hr: HR,
  },
  analytics: {
    aptitude: [
      ...APTITUDE.slice(0, 2),
      link("Mode SQL tutorial", "COURSE", "https://mode.com/sql-tutorial/", "Joins and aggregations used in analyst screens."),
    ],
    coding: [
      link("SQLBolt", "PRACTICE", "https://sqlbolt.com/", "Select, join, group — timed mentally."),
      link("LeetCode database", "CODING", "https://leetcode.com/problemset/database/", "Window functions and messy tables."),
      link("Kaggle pandas", "PRACTICE", "https://www.kaggle.com/learn/pandas", "Cleaning before you chart."),
    ],
    technical: [
      link("Storytelling with data", "GUIDE", "https://www.storytellingwithdata.com/", "Charts that a business owner can act on."),
      link("Google Analytics academy", "COURSE", "https://analytics.google.com/analytics/academy/", "Measurement and funnel language."),
      link("Experiment design", "NOTES", "https://www.khanacademy.org/math/statistics-probability/designing-studies", "Bias, samples, and what you cannot claim."),
    ],
    hr: HR,
  },
  ux: {
    aptitude: APTITUDE,
    coding: [
      link("NN/g heuristic evaluation", "GUIDE", "https://www.nngroup.com/articles/ten-usability-heuristics/", "How to critique a flow in a design round."),
      link("Figma learn", "COURSE", "https://help.figma.com/hc/en-us/articles/14563969806359", "Wireframes fast enough for a challenge."),
      link("Laws of UX", "NOTES", "https://lawsofux.com/", "Named principles you can cite in a critique."),
    ],
    technical: [
      link("Inclusive design", "GUIDE", "https://inclusive.microsoft.design/", "Accessibility as a requirement, not polish."),
      link("Material Design", "NOTES", "https://m3.material.io/", "Systems, not one-off screens."),
      link("IDEO design kit", "COURSE", "https://www.designkit.org/methods", "Research methods for the case round."),
    ],
    hr: HR,
  },
  qa: {
    aptitude: APTITUDE,
    coding: [
      link("ISTQB foundation syllabus", "NOTES", "https://www.istqb.org/", "Test design vocabulary used in QA screens."),
      link("Cypress docs", "PRACTICE", "https://docs.cypress.io/guides/overview/why-cypress", "UI automation patterns."),
      link("Postman learning", "COURSE", "https://learning.postman.com/docs/introduction/overview/", "API tests and collections."),
    ],
    technical: [
      link("Google testing blog", "GUIDE", "https://testing.googleblog.com/", "Risk, flakiness, and what to automate."),
      link("OWASP testing guide", "NOTES", "https://owasp.org/www-project-web-security-testing-guide/", "Security-minded QA cases."),
      link("xUnit patterns", "NOTES", "https://martinfowler.com/bliki/TestPyramid.html", "Unit vs service vs UI — where bugs hide."),
    ],
    hr: HR,
  },
  database: {
    aptitude: APTITUDE,
    coding: [
      link("SQLBolt", "PRACTICE", "https://sqlbolt.com/", "Core SQL used in every database round."),
      link("Use The Index, Luke", "NOTES", "https://use-the-index-luke.com/", "Why a query is slow."),
      link("LeetCode database", "CODING", "https://leetcode.com/problemset/database/", "Joins, windows, and edge cases."),
    ],
    technical: [
      link("Postgres tutorial", "COURSE", "https://www.postgresqltutorial.com/", "Modeling, constraints, and transactions."),
      link("Designing Data-Intensive Applications (companion)", "GUIDE", "https://dataintensive.net/", "Replication, partitioning, and failure."),
      link("MongoDB university", "COURSE", "https://learn.mongodb.com/", "Document models when SQL is not the fit."),
    ],
    hr: HR,
  },
};

export function resourcesForRound(track, roundId) {
  const pack = BY_TRACK[track] || BY_TRACK.software;
  return pack[roundId] || pack.technical;
}

export function allPracticeResources(track) {
  const pack = BY_TRACK[track] || BY_TRACK.software;
  return ["aptitude", "coding", "technical", "hr"].flatMap((roundId) =>
    (pack[roundId] || []).map((item) => ({ ...item, roundId }))
  );
}
