// Define types for questions, options, and sections
export interface Option {
  label: string;
  value: number;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
}

export interface Section {
  id: string;
  title: string;
  icon: string;
  questions: Question[];
}

// Define the assessment sections and questions
export const sections: Section[] = [
  {
    id: "system-coverage",
    title: "System Coverage",
    icon: "devices",
    questions: [
      {
        id: "q1",
        text: "How many of your systems are integrated?",
        options: [
          { label: "All core systems", value: 5 },
          { label: "Most core systems", value: 4 },
          { label: "Some systems", value: 3 },
          { label: "Very few systems", value: 2 },
          { label: "None", value: 1 }
        ]
      },
      {
        id: "q2",
        text: "We use widely accepted integration standards.",
        options: [
          { label: "Strongly Agree", value: 5 },
          { label: "Agree", value: 4 },
          { label: "Neutral", value: 3 },
          { label: "Disagree", value: 2 },
          { label: "Strongly Disagree", value: 1 }
        ]
      },
      {
        id: "q3",
        text: "Our systems can exchange data bi-directionally.",
        options: [
          { label: "Yes", value: 5 },
          { label: "No", value: 1 }
        ]
      }
    ]
  },
  {
    id: "timeliness",
    title: "Timeliness",
    icon: "schedule",
    questions: [
      {
        id: "q4",
        text: "Integrated systems update in near real-time.",
        options: [
          { label: "Strongly Agree", value: 5 },
          { label: "Agree", value: 4 },
          { label: "Neutral", value: 3 },
          { label: "Disagree", value: 2 },
          { label: "Strongly Disagree", value: 1 }
        ]
      },
      {
        id: "q5",
        text: "We have automated alerting and retry mechanisms for failures.",
        options: [
          { label: "Yes", value: 5 },
          { label: "No", value: 1 }
        ]
      },
      {
        id: "q6",
        text: "Message delivery failures are tracked and resolved proactively.",
        options: [
          { label: "Always", value: 5 },
          { label: "Sometimes", value: 4 },
          { label: "Rarely", value: 2 },
          { label: "Never", value: 1 }
        ]
      }
    ]
  },
  {
    id: "data-quality",
    title: "Data Quality",
    icon: "data_object",
    questions: [
      {
        id: "q7",
        text: "Data is consistent across systems.",
        options: [
          { label: "Always", value: 5 },
          { label: "Often", value: 4 },
          { label: "Sometimes", value: 3 },
          { label: "Rarely", value: 2 }
        ]
      },
      {
        id: "q8",
        text: "We use a Master Patient Index (EMPI).",
        options: [
          { label: "Yes", value: 5 },
          { label: "In Progress", value: 3 },
          { label: "No", value: 1 }
        ]
      },
      {
        id: "q9",
        text: "We experience duplicate or mismatched records due to integration issues.",
        options: [
          { label: "Frequently", value: 1 },
          { label: "Occasionally", value: 2 },
          { label: "Rarely", value: 4 },
          { label: "Never", value: 5 }
        ]
      }
    ]
  },
  {
    id: "monitoring",
    title: "Monitoring",
    icon: "monitoring",
    questions: [
      {
        id: "q10",
        text: "We have a centralized dashboard for monitoring.",
        options: [
          { label: "Yes", value: 5 },
          { label: "Partially", value: 3 },
          { label: "No", value: 1 }
        ]
      },
      {
        id: "q11",
        text: "Integration teams are notified of issues quickly.",
        options: [
          { label: "Always", value: 5 },
          { label: "Often", value: 4 },
          { label: "Sometimes", value: 3 },
          { label: "Rarely", value: 2 }
        ]
      }
    ]
  },
  {
    id: "scalability",
    title: "Scalability",
    icon: "open_in_full",
    questions: [
      {
        id: "q12",
        text: "Onboarding new systems is repeatable and predictable.",
        options: [
          { label: "Strongly Agree", value: 5 },
          { label: "Agree", value: 4 },
          { label: "Neutral", value: 3 },
          { label: "Disagree", value: 2 },
          { label: "Strongly Disagree", value: 1 }
        ]
      },
      {
        id: "q13",
        text: "We use reusable components or APIs for integration.",
        options: [
          { label: "Yes", value: 5 },
          { label: "In Development", value: 3 },
          { label: "No", value: 1 }
        ]
      }
    ]
  },
  {
    id: "governance",
    title: "Governance",
    icon: "policy",
    questions: [
      {
        id: "q14",
        text: "We maintain an up-to-date inventory of integrations.",
        options: [
          { label: "Yes", value: 5 },
          { label: "Partial", value: 3 },
          { label: "No", value: 1 }
        ]
      },
      {
        id: "q15",
        text: "There is a governance process before interfaces go live.",
        options: [
          { label: "Always", value: 5 },
          { label: "Sometimes", value: 4 },
          { label: "Rarely", value: 2 },
          { label: "Never", value: 1 }
        ]
      },
      {
        id: "q16",
        text: "Integration documentation is current and accessible.",
        options: [
          { label: "Strongly Agree", value: 5 },
          { label: "Agree", value: 4 },
          { label: "Neutral", value: 3 },
          { label: "Disagree", value: 2 },
          { label: "Strongly Disagree", value: 1 }
        ]
      }
    ]
  },
  {
    id: "security",
    title: "Security",
    icon: "security",
    questions: [
      {
        id: "q17",
        text: "All integration traffic is encrypted.",
        options: [
          { label: "Yes", value: 5 },
          { label: "Partially", value: 3 },
          { label: "No", value: 1 }
        ]
      },
      {
        id: "q18",
        text: "We regularly audit integration logs.",
        options: [
          { label: "Yes", value: 5 },
          { label: "Planned", value: 3 },
          { label: "No", value: 1 }
        ]
      }
    ]
  }
];
