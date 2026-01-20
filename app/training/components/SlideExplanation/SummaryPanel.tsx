import React from "react";
import { Zap, Cog, Rocket, Lightbulb } from "lucide-react";

interface SummaryProps {
  data: {
    panels: {
      panel1: { trigger: string; function: string };
      panel2: { mechanism1: string; mechanism2: string };
      panel3: { goal1: string; goal2: string; conclusion: string };
    };
    analogy: string;
    takeaways: string[];
  } | null;
}

export const SummaryPanel: React.FC<SummaryProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="h-full flex items-center justify-center text-gray-700 text-center p-4">
        Summary not available. Click "Generate Summary" to create one.
      </div>
    );
  }

  const { panels, analogy, takeaways } = data; 
  const Section = ({
    icon,
    title,
    children,
  }: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="flex gap-3 items-start p-2">
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div className="flex-1 text-sm leading-snug">
        <p className="font-semibold text-gray-800 mb-1">{title}</p>
        {children}
      </div>
    </div>
  );

  return (
    <div className="h-full w-full flex flex-col p-6 overflow-y-auto space-y-4">
      {/* Panels */}
      <Section icon={""} title="Trigger & Function">
        <p><b>Trigger:</b> {panels.panel1.trigger}</p>
        <p><b>Function:</b> {panels.panel1.function}</p>
      </Section>

      <Section icon={""} title="Mechanisms">
        <p>{panels.panel2.mechanism1}</p>
        <p>{panels.panel2.mechanism2}</p>
      </Section>

      <Section icon={""} title="Application">
        <p>Goal 1: {panels.panel3.goal1}</p>
        <p>Goal 2: {panels.panel3.goal2}</p>
        <p>Conclusion: {panels.panel3.conclusion}</p>
      </Section>

      {/* Analogy */}
      <Section icon={""} title="Analogy">
        <p className="whitespace-pre-line">{analogy}</p>
      </Section>

      {/* Takeaways */}
      <div className="flex flex-col gap-2">
        <p className="font-semibold text-gray-800">✨ Key Takeaways</p>
        <div className="flex flex-wrap gap-2">
          {takeaways.map((t, i) => (
            <span
              key={i}
              className="text-sm px-2 py-1 rounded-full border border-gray-300 cursor-default hover:bg-gray-100 transition"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
