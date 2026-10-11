export const P = {
  definition: {
    id: "definition",
    label: "Gives a definition",
    regex: /\b(is|are|means|defined as|refers to|used to)\b/i,
  },
  comparison: {
    id: "comparison",
    label: "Makes a comparison",
    regex: /\b(whereas|while|unlike|difference|versus|vs|but|however|trade-?off)\b/i,
  },
  example: {
    id: "example",
    label: "Includes an example",
    regex: /\b(for example|e\.g\.?|such as|like when)\b/i,
  },
  tradeoff: {
    id: "tradeoff",
    label: "Discusses trade-offs",
    regex: /\b(trade-?off|pros|cons|cost|latency|scale|vs|versus|however)\b/i,
  },
  business: {
    id: "business",
    label: "Ties to users or business",
    regex: /\b(user|customer|business|stakeholder|sla|revenue|impact|priority)\b/i,
  },
  metric: {
    id: "metric",
    label: "Uses a metric",
    regex: /\b(metric|kpi|latency|throughput|accuracy|precision|recall|error rate|nines|slo)\b/i,
  },
  steps: {
    id: "steps",
    label: "Describes a process",
    regex: /\b(first|then|next|finally|step|process|pipeline|playbook)\b/i,
  },
  ownership: {
    id: "ownership",
    label: "Shows ownership or result",
    regex: /\b(i owned|we shipped|result|impact|i led|stakeholder|deadline|incident)\b/i,
  },
};

export function k(label, terms) {
  return { label, terms };
}
