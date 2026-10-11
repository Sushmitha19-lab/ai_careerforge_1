function keyOf(company) {
  return String(company?.name || company || "")
    .toLowerCase()
    .trim();
}

function directionFromDelta(delta) {
  if (delta >= 8) {
    return "up";
  }
  if (delta <= -8) {
    return "down";
  }
  return "steady";
}

function weightsFromSkills(skills) {
  const entries = Object.entries(skills || {});
  const total = entries.reduce((sum, [, value]) => sum + Number(value || 0), 0);
  const mapped = {
    python: 0.2,
    dsa: 0.2,
    aptitude: 0.2,
    communication: 0.2,
    ml: 0,
    cloud: 0,
  };

  entries.forEach(([skill, value]) => {
    const share = total ? Number(value) / total : 0;
    const name = skill.toLowerCase();
    if (name.includes("dsa") || name.includes("coding") || name.includes("algorithm")) {
      mapped.dsa += share;
    } else if (name.includes("ml") || name.includes("ai")) {
      mapped.ml += share;
    } else if (name.includes("cloud") || name.includes("sre") || name.includes("linux")) {
      mapped.cloud += share;
    } else if (name.includes("comm") || name.includes("owner") || name.includes("hr") || name.includes("behav")) {
      mapped.communication += share;
    } else if (name.includes("aptitude") || name.includes("puzzle") || name.includes("quant")) {
      mapped.aptitude += share;
    } else if (name.includes("python") || name.includes("sql") || name.includes("lang")) {
      mapped.python += share;
    } else {
      mapped.dsa += share * 0.5;
      mapped.python += share * 0.5;
    }
  });

  const sum = Object.values(mapped).reduce((a, b) => a + b, 0) || 1;
  Object.keys(mapped).forEach((id) => {
    mapped[id] = Math.round((mapped[id] / sum) * 100) / 100;
  });
  return mapped;
}

export const REQUIREMENT_CYCLES = {
  google: {
    name: "Google",
    prior: {
      cycle: "2024 H2",
      summary: "Screens were mostly DSA, puzzles, and core CS.",
      skills: { DSA: 88, "System design": 55, "AI / ML": 42, "Puzzle rounds": 50, Communication: 60 },
    },
    current: {
      cycle: "2026 H1",
      summary: "DSA stays, but ML literacy and system design rose for product roles.",
      skills: { DSA: 85, "System design": 78, "AI / ML": 70, "Puzzle rounds": 18, Communication: 68 },
    },
  },
  microsoft: {
    name: "Microsoft",
    prior: {
      cycle: "2024 H2",
      summary: "OOP, coding, and CS fundamentals were the main filter.",
      skills: { Coding: 80, "CS fundamentals": 75, Cloud: 40, Communication: 55, "Language trivia": 50 },
    },
    current: {
      cycle: "2026 H1",
      summary: "Cloud, identity, and applied ML show up more often on the same roles.",
      skills: { Coding: 78, "CS fundamentals": 70, Cloud: 68, Communication: 72, "Language trivia": 22 },
    },
  },
  amazon: {
    name: "Amazon",
    prior: {
      cycle: "2024 H2",
      summary: "Leadership principles plus a hard DSA bar.",
      skills: { DSA: 90, "Ownership stories": 70, "Cloud / SRE": 35, Communication: 65 },
    },
    current: {
      cycle: "2026 H1",
      summary: "Same bar, plus cloud operations and incident ownership.",
      skills: { DSA: 88, "Ownership stories": 82, "Cloud / SRE": 62, Communication: 70 },
    },
  },
  adobe: {
    name: "Adobe",
    prior: {
      cycle: "2024 H2",
      summary: "Programming, databases, and product thinking.",
      skills: { DSA: 70, "Machine learning": 35, Product: 60, Communication: 55 },
    },
    current: {
      cycle: "2026 H1",
      summary: "More applied ML and data pipelines on the same product teams.",
      skills: { DSA: 72, "Machine learning": 64, Product: 62, Communication: 58 },
    },
  },
  nvidia: {
    name: "NVIDIA",
    prior: {
      cycle: "2024 H2",
      summary: "CUDA-adjacent coding and algorithms.",
      skills: { "Systems / DSA": 80, "AI / ML": 55, Python: 40, Communication: 45 },
    },
    current: {
      cycle: "2026 H1",
      summary: "Production ML, evaluation metrics, and Python depth rose beside C++.",
      skills: { "Systems / DSA": 78, "AI / ML": 82, Python: 68, Communication: 52 },
    },
  },
  ibm: {
    name: "IBM",
    prior: {
      cycle: "2024 H2",
      summary: "Enterprise Java/Python plus consulting communication.",
      skills: { Programming: 65, Cloud: 40, "AI / ML": 35, Communication: 70 },
    },
    current: {
      cycle: "2026 H1",
      summary: "Cloud architecture and responsible AI questions increased.",
      skills: { Programming: 62, Cloud: 66, "AI / ML": 58, Communication: 74 },
    },
  },
  accenture: {
    name: "Accenture",
    prior: {
      cycle: "2024 H2",
      summary: "Aptitude, communication, and light technical screening.",
      skills: { Aptitude: 80, Communication: 70, "Cloud / Security": 30, Coding: 45 },
    },
    current: {
      cycle: "2026 H1",
      summary: "Cloud, security, and client-ready explanations rose together.",
      skills: { Aptitude: 78, Communication: 82, "Cloud / Security": 58, Coding: 52 },
    },
  },
  meta: {
    name: "Meta",
    prior: {
      cycle: "2024 H2",
      summary: "Hard coding plus product sense.",
      skills: { DSA: 90, "Product sense": 60, "System design": 55, Communication: 50 },
    },
    current: {
      cycle: "2026 H1",
      summary: "Coding remains, with more ML-aware product questions.",
      skills: { DSA: 86, "Product sense": 72, "System design": 70, Communication: 58 },
    },
  },
  apple: {
    name: "Apple",
    prior: {
      cycle: "2024 H2",
      summary: "Craft, platforms, and careful coding.",
      skills: { Coding: 75, Quality: 70, "System design": 40, Communication: 50 },
    },
    current: {
      cycle: "2026 H1",
      summary: "On-device ML and privacy questions rose beside craft.",
      skills: { Coding: 76, Quality: 74, "System design": 58, Communication: 55 },
    },
  },
  oracle: {
    name: "Oracle",
    prior: {
      cycle: "2024 H2",
      summary: "Java, SQL, and enterprise apps.",
      skills: { SQL: 75, Java: 70, Cloud: 35, Communication: 50 },
    },
    current: {
      cycle: "2026 H1",
      summary: "OCI and data-platform questions increased.",
      skills: { SQL: 78, Java: 65, Cloud: 62, Communication: 54 },
    },
  },
  infosys: {
    name: "Infosys",
    prior: {
      cycle: "2024 H2",
      summary: "Aptitude first, then light coding.",
      skills: { Aptitude: 85, Coding: 50, Communication: 60, Cloud: 20 },
    },
    current: {
      cycle: "2026 H1",
      summary: "Still aptitude-gated, with more cloud vocabulary.",
      skills: { Aptitude: 84, Coding: 58, Communication: 66, Cloud: 42 },
    },
  },
  tcs: {
    name: "TCS",
    prior: {
      cycle: "2024 H2",
      summary: "NQT-style aptitude and verbal.",
      skills: { Aptitude: 88, Coding: 45, Communication: 62, Cloud: 18 },
    },
    current: {
      cycle: "2026 H1",
      summary: "Aptitude stays; coding and cloud basics rose a notch.",
      skills: { Aptitude: 86, Coding: 55, Communication: 65, Cloud: 36 },
    },
  },
  flipkart: {
    name: "Flipkart",
    prior: {
      cycle: "2024 H2",
      summary: "DSA plus e-commerce scale stories.",
      skills: { DSA: 82, "System design": 60, Product: 50, Communication: 48 },
    },
    current: {
      cycle: "2026 H1",
      summary: "Sale-event reliability and mobile quality rose.",
      skills: { DSA: 80, "System design": 72, Product: 58, Communication: 55 },
    },
  },
  deloitte: {
    name: "Deloitte",
    prior: {
      cycle: "2024 H2",
      summary: "Case interviews and Excel-heavy analytics.",
      skills: { Aptitude: 70, Communication: 80, Cloud: 30, Analytics: 55 },
    },
    current: {
      cycle: "2026 H1",
      summary: "Cloud architecture workshops and data storytelling rose.",
      skills: { Aptitude: 68, Communication: 84, Cloud: 58, Analytics: 66 },
    },
  },
};

function synthesizeCycle(company) {
  const name = company?.name || "This company";
  return {
    name,
    prior: {
      cycle: "2024 H2",
      summary: "Aptitude and core coding were the typical first filters.",
      skills: { Aptitude: 70, Coding: 60, Communication: 55, Cloud: 30, "AI / ML": 25 },
    },
    current: {
      cycle: "2026 H1",
      summary: "The same filters, with more cloud and applied-AI vocabulary on the role.",
      skills: { Aptitude: 68, Coding: 64, Communication: 62, Cloud: 48, "AI / ML": 44 },
    },
  };
}

export function detectRequirementChanges(company) {
  const key = keyOf(company);
  const cycle = REQUIREMENT_CYCLES[key] || synthesizeCycle(company);
  const priorSkills = cycle.prior.skills;
  const currentSkills = cycle.current.skills;
  const skillNames = [...new Set([...Object.keys(priorSkills), ...Object.keys(currentSkills)])];

  const changes = skillNames.map((skill) => {
    const before = Number(priorSkills[skill] || 0);
    const after = Number(currentSkills[skill] || 0);
    const delta = after - before;
    const direction = directionFromDelta(delta);
    const verb =
      direction === "up"
        ? "increased"
        : direction === "down"
          ? "decreased"
          : "held steady";
    return {
      skill,
      direction,
      delta,
      before,
      after,
      detail: `${skill} ${verb} versus the prior hiring cycle (${before} → ${after}).`,
    };
  });

  changes.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return {
    name: cycle.name,
    key: key || "generic",
    source: REQUIREMENT_CYCLES[key] ? "tracked-cycle" : "synthesized",
    detectedAt: new Date().toISOString(),
    priorCycle: `${cycle.prior.cycle}: ${cycle.prior.summary}`,
    currentCycle: `${cycle.current.cycle}: ${cycle.current.summary}`,
    prior: cycle.prior,
    current: cycle.current,
    changes,
    weights: weightsFromSkills(currentSkills),
  };
}

export const COMPANY_SIGNALS = Object.fromEntries(
  Object.entries(REQUIREMENT_CYCLES).map(([key, cycle]) => [
    key,
    detectRequirementChanges({ name: cycle.name }),
  ])
);

export function getCompanySignal(company) {
  if (!String(company?.name || "").trim()) {
    return null;
  }
  return detectRequirementChanges(company);
}
