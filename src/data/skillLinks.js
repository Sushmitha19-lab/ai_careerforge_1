const L = (title, url) => ({ title, url });

export const SKILL_LINKS = {
  software: {
    python: [
      L("Python tutorial", "https://docs.python.org/3/tutorial/"),
      L("GeeksforGeeks Python", "https://www.geeksforgeeks.org/python-programming-language/"),
    ],
    dsa: [
      L("GeeksforGeeks DSA", "https://www.geeksforgeeks.org/data-structures/"),
      L("LeetCode interview card", "https://leetcode.com/explore/interview/card/top-interview-questions-easy/"),
    ],
    core: [
      L("Operating systems", "https://www.geeksforgeeks.org/operating-systems/"),
      L("DBMS notes", "https://www.geeksforgeeks.org/dbms/"),
    ],
    design: [
      L("System design primer", "https://github.com/donnemartin/system-design-primer"),
      L("AWS architecture center", "https://aws.amazon.com/architecture/"),
    ],
    ownership: [
      L("STAR interview method", "https://www.themuse.com/advice/star-interview-method"),
      L("Amazon leadership principles", "https://www.amazon.jobs/content/en/our-workplace/leadership-principles"),
    ],
  },
  ai: {
    python: [
      L("Python tutorial", "https://docs.python.org/3/tutorial/"),
      L("Kaggle Python", "https://www.kaggle.com/learn/python"),
    ],
    numpy: [
      L("NumPy for beginners", "https://numpy.org/doc/stable/user/absolute_beginners.html"),
      L("Kaggle Pandas", "https://www.kaggle.com/learn/pandas"),
    ],
    stats: [
      L("Khan Academy statistics", "https://www.khanacademy.org/math/statistics-probability"),
      L("Seeing Theory", "https://seeing-theory.brown.edu/"),
    ],
    ml: [
      L("Google ML crash course", "https://developers.google.com/machine-learning/crash-course"),
      L("sklearn user guide", "https://scikit-learn.org/stable/user_guide.html"),
    ],
    dl: [
      L("fast.ai practical DL", "https://course.fast.ai/"),
      L("Made With ML", "https://madewithml.com/"),
    ],
  },
  cloud: {
    linux: [
      L("OverTheWire Bandit", "https://overthewire.org/wargames/bandit/"),
      L("Linux command handbook", "https://www.freecodecamp.org/news/the-linux-commands-handbook/"),
    ],
    net: [
      L("MDN HTTP overview", "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview"),
      L("AWS VPC basics", "https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html"),
    ],
    cloud: [
      L("AWS Skill Builder", "https://skillbuilder.aws/"),
      L("Azure fundamentals", "https://learn.microsoft.com/training/paths/azure-fundamentals/"),
    ],
    cicd: [
      L("GitHub Actions quickstart", "https://docs.github.com/en/actions/get-started/quickstart"),
      L("Docker getting started", "https://docs.docker.com/get-started/"),
    ],
    sre: [
      L("Google SRE book", "https://sre.google/sre-book/table-of-contents/"),
      L("Incident response guide", "https://sre.google/sre-book/managing-incidents/"),
    ],
  },
  security: {
    cia: [
      L("NIST Cybersecurity Framework", "https://www.nist.gov/cyberframework"),
      L("CIA triad explainer", "https://www.cloudflare.com/learning/privacy/what-is-the-cia-triad/"),
    ],
    appsec: [
      L("OWASP Top 10", "https://owasp.org/www-project-top-ten/"),
      L("PortSwigger Web Security Academy", "https://portswigger.net/web-security"),
    ],
    iam: [
      L("Google Cloud IAM", "https://cloud.google.com/iam/docs/overview"),
      L("AWS IAM user guide", "https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html"),
    ],
    incident: [
      L("NIST incident handling", "https://csrc.nist.gov/pubs/sp/800/61/r3/final"),
      L("SANS incident handbook", "https://www.sans.org/white-papers/33901/"),
    ],
    zero: [
      L("NIST zero trust", "https://www.nist.gov/publications/zero-trust-architecture"),
      L("CISA zero trust", "https://www.cisa.gov/zero-trust-maturity-model"),
    ],
  },
  fullstack: {
    js: [
      L("MDN JavaScript", "https://developer.mozilla.org/en-US/docs/Web/JavaScript"),
      L("javascript.info", "https://javascript.info/"),
    ],
    ui: [
      L("React learn", "https://react.dev/learn"),
      L("MDN accessibility", "https://developer.mozilla.org/en-US/docs/Web/Accessibility"),
    ],
    api: [
      L("MDN HTTP", "https://developer.mozilla.org/en-US/docs/Web/HTTP"),
      L("REST API tutorial", "https://restfulapi.net/"),
    ],
    data: [
      L("SQLBolt", "https://sqlbolt.com/"),
      L("Postgres tutorial", "https://www.postgresqltutorial.com/"),
    ],
    ship: [
      L("Web Vitals", "https://web.dev/articles/vitals"),
      L("12-factor app", "https://12factor.net/"),
    ],
  },
  mobile: {
    lang: [
      L("Kotlin Koans", "https://play.kotlinlang.org/koans"),
      L("Swift language guide", "https://docs.swift.org/swift-book/documentation/the-swift-programming-language/"),
    ],
    life: [
      L("Android activity lifecycle", "https://developer.android.com/guide/components/activities/activity-lifecycle"),
      L("Apple Human Interface", "https://developer.apple.com/design/human-interface-guidelines/"),
    ],
    list: [
      L("Android RecyclerView", "https://developer.android.com/develop/ui/views/layout/recyclerview"),
      L("Flutter lists", "https://docs.flutter.dev/cookbook/lists/basic-list"),
    ],
    off: [
      L("Android data storage", "https://developer.android.com/training/data-storage"),
      L("WorkManager", "https://developer.android.com/topic/libraries/architecture/workmanager"),
    ],
    store: [
      L("Play Console quality", "https://developer.android.com/distribute/best-practices/launch/pre-launch-report"),
      L("App Store review", "https://developer.apple.com/app-store/review/guidelines/"),
    ],
  },
  analytics: {
    sql: [
      L("Mode SQL tutorial", "https://mode.com/sql-tutorial/"),
      L("LeetCode database", "https://leetcode.com/problemset/database/"),
    ],
    stats: [
      L("Khan Academy statistics", "https://www.khanacademy.org/math/statistics-probability"),
      L("Seeing Theory", "https://seeing-theory.brown.edu/"),
    ],
    kpi: [
      L("Google Analytics academy", "https://skillshop.exceedlms.com/student/catalog/list?category_ids=53-google-analytics-4"),
      L("Storytelling with data", "https://www.storytellingwithdata.com/"),
    ],
    story: [
      L("Storytelling with data", "https://www.storytellingwithdata.com/"),
      L("NN/g dashboard design", "https://www.nngroup.com/articles/dashboard-design/"),
    ],
    exp: [
      L("Designing studies", "https://www.khanacademy.org/math/statistics-probability/designing-studies"),
      L("Trustworthy A/B tests", "https://exp-platform.com/"),
    ],
  },
  ux: {
    research: [
      L("IDEO design kit", "https://www.designkit.org/methods"),
      L("NN/g usability testing", "https://www.nngroup.com/articles/usability-testing-101/"),
    ],
    flow: [
      L("Laws of UX", "https://lawsofux.com/"),
      L("NN/g user flows", "https://www.nngroup.com/articles/user-flow-mapping/"),
    ],
    wire: [
      L("Figma learn", "https://help.figma.com/hc/en-us/articles/14563969806359-Learn-how-to-use-Figma"),
      L("NN/g wireframing", "https://www.nngroup.com/articles/wireframing-101/"),
    ],
    visual: [
      L("Material Design 3", "https://m3.material.io/"),
      L("Inclusive Microsoft Design", "https://inclusive.microsoft.design/"),
    ],
    crit: [
      L("NN/g 10 heuristics", "https://www.nngroup.com/articles/ten-usability-heuristics/"),
      L("Laws of UX", "https://lawsofux.com/"),
    ],
  },
  qa: {
    design: [
      L("ISTQB", "https://www.istqb.org/"),
      L("Test pyramid", "https://martinfowler.com/bliki/TestPyramid.html"),
    ],
    cases: [
      L("OWASP testing guide", "https://owasp.org/www-project-web-security-testing-guide/"),
      L("Postman learning", "https://learning.postman.com/docs/introduction/overview/"),
    ],
    auto: [
      L("Cypress first test", "https://docs.cypress.io/guides/end-to-end-testing/writing-your-first-end-to-end-test"),
      L("Playwright intro", "https://playwright.dev/docs/intro"),
    ],
    ci: [
      L("GitHub Actions", "https://docs.github.com/en/actions/get-started/quickstart"),
      L("Google testing blog", "https://testing.googleblog.com/"),
    ],
    voice: [
      L("Google testing blog", "https://testing.googleblog.com/"),
      L("Test pyramid", "https://martinfowler.com/bliki/TestPyramid.html"),
    ],
  },
  database: {
    sql: [
      L("SQLBolt", "https://sqlbolt.com/"),
      L("LeetCode database", "https://leetcode.com/problemset/database/"),
    ],
    model: [
      L("Postgres tutorial", "https://www.postgresqltutorial.com/"),
      L("Database normalization", "https://www.geeksforgeeks.org/normal-forms-in-dbms/"),
    ],
    idx: [
      L("Use The Index, Luke", "https://use-the-index-luke.com/"),
      L("Postgres EXPLAIN", "https://www.postgresql.org/docs/current/using-explain.html"),
    ],
    tx: [
      L("Postgres transactions", "https://www.postgresql.org/docs/current/tutorial-transactions.html"),
      L("Designing Data-Intensive Apps", "https://dataintensive.net/"),
    ],
    ha: [
      L("Postgres high availability", "https://www.postgresql.org/docs/current/high-availability.html"),
      L("AWS RDS failover", "https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html"),
    ],
  },
};

export const CAREER_PAGES = {
  google: "https://www.google.com/about/careers/",
  microsoft: "https://careers.microsoft.com/",
  amazon: "https://www.amazon.jobs/",
  adobe: "https://careers.adobe.com/",
  nvidia: "https://www.nvidia.com/en-us/about-nvidia/careers/",
  ibm: "https://www.ibm.com/careers",
  accenture: "https://www.accenture.com/careers",
  meta: "https://www.metacareers.com/",
  apple: "https://www.apple.com/careers/",
  oracle: "https://www.oracle.com/careers/",
  infosys: "https://www.infosys.com/careers/",
  tcs: "https://www.tcs.com/careers",
  flipkart: "https://www.flipkartcareers.com/",
  deloitte: "https://www.deloitte.com/careers",
  uber: "https://www.uber.com/careers/",
  salesforce: "https://careers.salesforce.com/",
  cisco: "https://www.cisco.com/c/en/us/about/careers.html",
  "palo alto networks": "https://jobs.paloaltonetworks.com/",
  crowdstrike: "https://www.crowdstrike.com/careers/",
  wipro: "https://careers.wipro.com/",
  swiggy: "https://careers.swiggy.com/",
  razorpay: "https://razorpay.com/jobs/",
  zoho: "https://www.zoho.com/careers/",
  cognizant: "https://careers.cognizant.com/",
  phonepe: "https://www.phonepe.com/careers/",
  paytm: "https://jobs.paytm.com/",
  jpmorgan: "https://careers.jpmorgan.com/",
  fractal: "https://fractal.ai/careers/",
  "mu sigma": "https://www.mu-sigma.com/careers/",
  capgemini: "https://www.capgemini.com/careers/",
  snowflake: "https://careers.snowflake.com/",
  mongodb: "https://www.mongodb.com/careers",
  teradata: "https://careers.teradata.com/",
  freshworks: "https://www.freshworks.com/company/careers/",
  "tiger analytics": "https://www.tigeranalytics.com/careers/",
};

export function linksForNode(track, nodeId) {
  return SKILL_LINKS[track]?.[nodeId] || [];
}

export function careersUrl(companyName) {
  const key = String(companyName || "")
    .toLowerCase()
    .trim();
  if (CAREER_PAGES[key]) {
    return CAREER_PAGES[key];
  }
  if (!key) {
    return "";
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`${companyName} careers`)}`;
}

export function jobsUrl(companyName, role) {
  const query = [companyName, role].filter(Boolean).join(" ");
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query)}`;
}
