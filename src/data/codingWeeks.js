const problem = (name, url) => ({ name, url });

const DSA_WEEKS = [
  {
    week: 1,
    title: "Arrays & hashing",
    focus: "Maps, frequency, and one-pass scans.",
    problems: [
      problem("Two Sum", "https://leetcode.com/problems/two-sum/"),
      problem("Contains Duplicate", "https://leetcode.com/problems/contains-duplicate/"),
      problem("Valid Anagram", "https://leetcode.com/problems/valid-anagram/"),
    ],
  },
  {
    week: 2,
    title: "Two pointers & sliding window",
    focus: "Windows on strings and arrays without extra nested loops.",
    problems: [
      problem("Best Time to Buy and Sell Stock", "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/"),
      problem("Longest Substring Without Repeating Characters", "https://leetcode.com/problems/longest-substring-without-repeating-characters/"),
      problem("Container With Most Water", "https://leetcode.com/problems/container-with-most-water/"),
    ],
  },
  {
    week: 3,
    title: "Stacks, queues, linked lists",
    focus: "Pointers and linear structures you must draw, not memorize.",
    problems: [
      problem("Valid Parentheses", "https://leetcode.com/problems/valid-parentheses/"),
      problem("Reverse Linked List", "https://leetcode.com/problems/reverse-linked-list/"),
      problem("Merge Two Sorted Lists", "https://leetcode.com/problems/merge-two-sorted-lists/"),
    ],
  },
  {
    week: 4,
    title: "Trees & recursion",
    focus: "DFS/BFS and explaining the call stack.",
    problems: [
      problem("Maximum Depth of Binary Tree", "https://leetcode.com/problems/maximum-depth-of-binary-tree/"),
      problem("Invert Binary Tree", "https://leetcode.com/problems/invert-binary-tree/"),
      problem("Binary Tree Level Order Traversal", "https://leetcode.com/problems/binary-tree-level-order-traversal/"),
    ],
  },
  {
    week: 5,
    title: "Graphs & heaps",
    focus: "Visited sets, shortest path language, and priority queues.",
    problems: [
      problem("Number of Islands", "https://leetcode.com/problems/number-of-islands/"),
      problem("Clone Graph", "https://leetcode.com/problems/clone-graph/"),
      problem("Kth Largest Element in an Array", "https://leetcode.com/problems/kth-largest-element-in-an-array/"),
    ],
  },
  {
    week: 6,
    title: "Dynamic programming",
    focus: "Subproblems you can name, then code.",
    problems: [
      problem("Climbing Stairs", "https://leetcode.com/problems/climbing-stairs/"),
      problem("House Robber", "https://leetcode.com/problems/house-robber/"),
      problem("Coin Change", "https://leetcode.com/problems/coin-change/"),
    ],
  },
  {
    week: 7,
    title: "Intervals & sorting patterns",
    focus: "Greedy choices you can prove in one sentence.",
    problems: [
      problem("Merge Intervals", "https://leetcode.com/problems/merge-intervals/"),
      problem("Meeting Rooms", "https://leetcode.com/problems/meeting-rooms/"),
      problem("Non-overlapping Intervals", "https://leetcode.com/problems/non-overlapping-intervals/"),
    ],
  },
  {
    week: 8,
    title: "Company mixed set",
    focus: "Timed easy-medium mix as if it is the coding round.",
    problems: [
      problem("LRU Cache", "https://leetcode.com/problems/lru-cache/"),
      problem("Course Schedule", "https://leetcode.com/problems/course-schedule/"),
      problem("Word Break", "https://leetcode.com/problems/word-break/"),
    ],
  },
];

const SQL_WEEKS = [
  {
    week: 1,
    title: "SELECT, WHERE, ORDER",
    focus: "Filters before joins. Know what a row is.",
    problems: [
      problem("SQLBolt lesson 1–4", "https://sqlbolt.com/lesson/select_queries_introduction"),
      problem("LeetCode Combine Two Tables", "https://leetcode.com/problems/combine-two-tables/"),
    ],
  },
  {
    week: 2,
    title: "JOINs",
    focus: "Inner vs left join with a business example.",
    problems: [
      problem("SQLBolt joins", "https://sqlbolt.com/lesson/select_queries_with_joins"),
      problem("Customers Who Never Order", "https://leetcode.com/problems/customers-who-never-order/"),
    ],
  },
  {
    week: 3,
    title: "GROUP BY & HAVING",
    focus: "Metrics, not row dumps.",
    problems: [
      problem("Duplicate Emails", "https://leetcode.com/problems/duplicate-emails/"),
      problem("Classes More Than 5 Students", "https://leetcode.com/problems/classes-more-than-5-students/"),
    ],
  },
  {
    week: 4,
    title: "Window functions",
    focus: "Ranks and running totals used in analyst screens.",
    problems: [
      problem("Department Highest Salary", "https://leetcode.com/problems/department-highest-salary/"),
      problem("Rank Scores", "https://leetcode.com/problems/rank-scores/"),
    ],
  },
  {
    week: 5,
    title: "Messy data",
    focus: "Nulls, duplicates, and type casts.",
    problems: [
      problem("Fix Names in a Table", "https://leetcode.com/problems/fix-names-in-a-table/"),
      problem("Delete Duplicate Emails", "https://leetcode.com/problems/delete-duplicate-emails/"),
    ],
  },
  {
    week: 6,
    title: "Plans and indexes",
    focus: "Why a query is slow — not only that it returns rows.",
    problems: [
      problem("Use The Index, Luke — first chapters", "https://use-the-index-luke.com/sql/preface"),
      problem("Second Highest Salary", "https://leetcode.com/problems/second-highest-salary/"),
    ],
  },
];

const TRACK_WEEKS = {
  software: DSA_WEEKS,
  fullstack: DSA_WEEKS,
  mobile: DSA_WEEKS,
  ai: [
    ...DSA_WEEKS.slice(0, 4),
    {
      week: 5,
      title: "Python data wrangling",
      focus: "Pandas joins and missing values before any model.",
      problems: [
        problem("Pandas exercises — grouping", "https://github.com/guipsamora/pandas_exercises"),
        problem("Kaggle pandas course", "https://www.kaggle.com/learn/pandas"),
      ],
    },
    {
      week: 6,
      title: "ML evaluation coding",
      focus: "Train/test split, metrics, and leakage language.",
      problems: [
        problem("sklearn model evaluation", "https://scikit-learn.org/stable/modules/model_evaluation.html"),
        problem("Kaggle intro to ML", "https://www.kaggle.com/learn/intro-to-machine-learning"),
      ],
    },
  ],
  analytics: SQL_WEEKS,
  database: SQL_WEEKS,
  cloud: [
    {
      week: 1,
      title: "Linux daily",
      focus: "Processes, files, and logs without a GUI.",
      problems: [
        problem("Bandit levels 0–8", "https://overthewire.org/wargames/bandit/"),
      ],
    },
    {
      week: 2,
      title: "Bash loops and pipes",
      focus: "Small scripts that replace click-ops.",
      problems: [
        problem("Bandit levels 9–16", "https://overthewire.org/wargames/bandit/"),
      ],
    },
    {
      week: 3,
      title: "HTTP and ports",
      focus: "Why a service cannot be reached.",
      problems: [
        problem("MDN HTTP overview", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview"),
      ],
    },
    {
      week: 4,
      title: "Containers locally",
      focus: "Build, run, logs, and a failed health check.",
      problems: [
        problem("Docker getting started", "https://docs.docker.com/get-started/"),
      ],
    },
    {
      week: 5,
      title: "CI pipeline",
      focus: "Test, build, and roll back a bad release.",
      problems: [
        problem("GitHub Actions quickstart", "https://docs.github.com/en/actions/get-started/quickstart"),
      ],
    },
    {
      week: 6,
      title: "One cloud workload",
      focus: "VM or function + identity + cost note.",
      problems: [
        problem("AWS free tier walkthrough", "https://aws.amazon.com/getting-started/"),
      ],
    },
  ],
  security: [
    {
      week: 1,
      title: "Linux + logs",
      focus: "You cannot triage what you cannot read.",
      problems: [
        problem("Bandit 0–8", "https://overthewire.org/wargames/bandit/"),
      ],
    },
    {
      week: 2,
      title: "OWASP Top 10 map",
      focus: "Name the bug class, then the fix.",
      problems: [
        problem("OWASP Top 10", "https://owasp.org/www-project-top-ten/"),
      ],
    },
    {
      week: 3,
      title: "PortSwigger apprentice",
      focus: "SQLi and XSS with a written proof.",
      problems: [
        problem("Web Security Academy", "https://portswigger.net/web-security"),
      ],
    },
    {
      week: 4,
      title: "Access control labs",
      focus: "IDOR and broken authorization.",
      problems: [
        problem("Access control labs", "https://portswigger.net/web-security/access-control"),
      ],
    },
    {
      week: 5,
      title: "Incident tabletop",
      focus: "Contain → eradicate → recover on paper.",
      problems: [
        problem("NIST Cybersecurity Framework", "https://www.nist.gov/cyberframework"),
      ],
    },
    {
      week: 6,
      title: "IAM least privilege",
      focus: "A joiners-movers-leavers story with roles.",
      problems: [
        problem("IAM overview", "https://cloud.google.com/iam/docs/overview"),
      ],
    },
  ],
  ux: [
    {
      week: 1,
      title: "Heuristics",
      focus: "Critique an app you use with 10 heuristics.",
      problems: [
        problem("NN/g 10 heuristics", "https://www.nngroup.com/articles/ten-usability-heuristics/"),
      ],
    },
    {
      week: 2,
      title: "User flow",
      focus: "Happy path plus one failure path on paper.",
      problems: [
        problem("Figma flowchart", "https://help.figma.com/hc/en-us/articles/360040328853"),
      ],
    },
    {
      week: 3,
      title: "Wireframe a checkout",
      focus: "Trust, errors, and empty states.",
      problems: [
        problem("Laws of UX", "https://lawsofux.com/"),
      ],
    },
    {
      week: 4,
      title: "Accessibility pass",
      focus: "Contrast, focus order, and alt text.",
      problems: [
        problem("Inclusive Design", "https://inclusive.microsoft.design/"),
      ],
    },
    {
      week: 5,
      title: "Design system tokens",
      focus: "Reuse, do not invent a new button.",
      problems: [
        problem("Material 3", "https://m3.material.io/"),
      ],
    },
    {
      week: 6,
      title: "Timed challenge",
      focus: "45-minute redesign with a spoken critique.",
      problems: [
        problem("Design kit methods", "https://www.designkit.org/methods"),
      ],
    },
  ],
  qa: [
    {
      week: 1,
      title: "Test design",
      focus: "Equivalence, boundaries, and decision tables.",
      problems: [
        problem("ISTQB", "https://www.istqb.org/"),
      ],
    },
    {
      week: 2,
      title: "Write 20 cases",
      focus: "A login form including lockout and SSO.",
      problems: [
        problem("Test pyramid", "https://martinfowler.com/bliki/TestPyramid.html"),
      ],
    },
    {
      week: 3,
      title: "API collection",
      focus: "Happy path, 401, 404, and contract mismatch.",
      problems: [
        problem("Postman learning", "https://learning.postman.com/docs/introduction/overview/"),
      ],
    },
    {
      week: 4,
      title: "UI automation one flow",
      focus: "Stable selectors, not a recorded click-fest.",
      problems: [
        problem("Cypress first test", "https://docs.cypress.io/guides/end-to-end-testing/writing-your-first-end-to-end-test"),
      ],
    },
    {
      week: 5,
      title: "Flaky test hunt",
      focus: "Timing, data, and environment — name the cause.",
      problems: [
        problem("Google testing blog", "https://testing.googleblog.com/"),
      ],
    },
    {
      week: 6,
      title: "Risk-based plan",
      focus: "What you will not test before a sale event.",
      problems: [
        problem("OWASP testing guide", "https://owasp.org/www-project-web-security-testing-guide/"),
      ],
    },
  ],
};

export function codingWeeksForTrack(track) {
  return TRACK_WEEKS[track] || DSA_WEEKS;
}
