import katex from 'katex';
import { Fragment, ReactNode, useMemo } from 'react';
import { PlanetProfile } from '../data/planets';

interface ScientificDossierProps {
  planet: PlanetProfile;
  isTransitPending: boolean;
  transitTargetName: string | null;
  remainingSeconds: number;
}

function renderInlineRichText(text: string, keyPrefix: string): ReactNode[] {
  // Split on inline LaTeX ($...$), bold (**...**), and HTTPS URLs
  const nodes: ReactNode[] = [];
  const tokenRegex = /(\$[^$]+\$|\*\*[^*]+\*\*|https:\/\/[^\s]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let tokenIdx = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Fragment key={`${keyPrefix}-txt-${tokenIdx++}`}>
          {text.slice(lastIndex, match.index)}
        </Fragment>
      );
    }

    const token = match[0];
    if (token.startsWith('$') && token.endsWith('$')) {
      const latex = token.slice(1, -1);
      const html = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: false,
        output: 'html',
      });
      nodes.push(
        <span
          key={`${keyPrefix}-math-${tokenIdx++}`}
          className="inline-block align-baseline"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      const inner = token.slice(2, -2);
      // Recursively allow math inside bold spans
      nodes.push(
        <strong
          key={`${keyPrefix}-bold-${tokenIdx++}`}
          className="font-semibold text-white"
        >
          {renderInlineRichText(inner, `${keyPrefix}-b-${tokenIdx}`)}
        </strong>
      );
    } else if (token.startsWith('https://')) {
      nodes.push(
        <a
          key={`${keyPrefix}-url-${tokenIdx++}`}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sky-300 underline decoration-sky-300/40 underline-offset-4 break-all transition-colors hover:text-white hover:decoration-white/80"
        >
          {token}
        </a>
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <Fragment key={`${keyPrefix}-tail-${tokenIdx++}`}>
        {text.slice(lastIndex)}
      </Fragment>
    );
  }

  return nodes;
}

interface ParsedSection {
  heading: string;
  blocks: Array<
    | { type: 'subheading'; text: string }
    | { type: 'paragraph'; text: string }
    | { type: 'list'; items: string[] }
    | { type: 'table'; headers: [string, string]; rows: Array<[string, string]> }
  >;
}

function parseDossierMarkdown(markdown: string): ParsedSection[] {
  const lines = markdown.split('\n');
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;
  let currentList: string[] | null = null;

  const flushList = () => {
    if (currentList && currentSection) {
      currentSection.blocks.push({ type: 'list', items: currentList });
      currentList = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }

    if (line.startsWith('### ')) {
      flushList();
      currentSection = {
        heading: line.slice(4).trim(),
        blocks: [],
      };
      sections.push(currentSection);
    } else if (line.startsWith('* ')) {
      if (!currentList) {
        currentList = [];
      }
      currentList.push(line.slice(2).trim());
    } else {
      flushList();
      if (currentSection) {
        currentSection.blocks.push({ type: 'paragraph', text: line });
      }
    }
  }

  flushList();
  return sections;
}

const INTRODUCTION_SECTION: ParsedSection = {
  heading: '1. INTRODUCTION',
  blocks: [
    {
      type: 'paragraph',
      text: 'The Solar System consists of the Sun and the celestial objects gravitationally associated with it. It contains eight major planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.',
    },
    {
      type: 'paragraph',
      text: 'Understanding the movement and relative positions of these planets can be challenging through traditional diagrams and static images because planetary motion occurs continuously in three-dimensional space.',
    },
    {
      type: 'paragraph',
      text: 'Modern astronomical technologies make it possible to calculate planetary positions and visualize their movements using scientific datasets and computer simulations.',
    },
    {
      type: 'paragraph',
      text: "NASA's Eyes on the Solar System is an interactive visualization platform that allows users to explore the Solar System using real NASA mission data. It provides three-dimensional space exploration and enables users to control the visualization of space and time.",
    },
    {
      type: 'paragraph',
      text: 'Inspired by this platform, our project aims to recreate its core functionality through a web-based three-dimensional simulation.',
    },
    {
      type: 'paragraph',
      text: 'The proposed application focuses on accurate planetary positioning, orbital visualization, interactive exploration, and simulation-time control.',
    },
  ],
};

const PROBLEM_STATEMENT_SECTION: ParsedSection = {
  heading: '2. PROBLEM STATEMENT',
  blocks: [
    {
      type: 'paragraph',
      text: 'Traditional Solar System learning tools frequently use static illustrations or simplified animations to demonstrate planetary movements.',
    },
    {
      type: 'paragraph',
      text: 'Although these approaches help users understand the basic structure of the Solar System, they do not necessarily represent the actual astronomical positions of planets at a selected date and time.',
    },
    {
      type: 'paragraph',
      text: 'Some existing educational simulations use fixed orbital paths and arbitrary animation speeds without integrating scientific ephemeris data.',
    },
    {
      type: 'paragraph',
      text: 'This creates a difference between visual representation and actual astronomical conditions.',
    },
    {
      type: 'paragraph',
      text: 'Therefore, there is a need for an interactive three-dimensional system that:',
    },
    {
      type: 'list',
      items: [
        'Represents all eight planets in a unified environment.',
        'Uses scientifically sourced planetary position data.',
        'Visualizes planetary movement over simulation time.',
        'Provides interactive exploration of celestial objects.',
        'Presents astronomical information in an understandable format.',
      ],
    },
    {
      type: 'paragraph',
      text: 'Our project addresses these requirements through a real-time 3D Solar System visualization system.',
    },
  ],
};

const EXISTING_SYSTEM_SECTION: ParsedSection = {
  heading: '3. EXISTING SYSTEM',
  blocks: [
    {
      type: 'paragraph',
      text: 'Existing Solar System visualization applications provide different levels of astronomical exploration.',
    },
    {
      type: 'paragraph',
      text: 'NASA Eyes on the Solar System is an important reference because it combines three-dimensional visualization with real NASA mission information.',
    },
    {
      type: 'paragraph',
      text: 'The official NASA/JPL platform supports:',
    },
    {
      type: 'list',
      items: [
        'Three-dimensional Solar System exploration.',
        'Real NASA mission data.',
        'Planetary and spacecraft visualization.',
        'Interactive navigation.',
        'Time-based exploration.',
      ],
    },
    {
      type: 'paragraph',
      text: 'However, many basic educational Solar System applications offer only simplified planetary animations and limited scientific interaction.',
    },
    {
      type: 'paragraph',
      text: 'Our project aims to reproduce the essential interactive experience while implementing a scientific data integration workflow.',
    },
  ],
};

const REFERENCES_SECTION: ParsedSection = {
  heading: 'REFERENCES',
  blocks: [
    {
      type: 'paragraph',
      text: 'NASA Jet Propulsion Laboratory, Eyes on the Solar System. https://eyes.nasa.gov/apps/solar-system/',
    },
    {
      type: 'paragraph',
      text: 'NASA Jet Propulsion Laboratory, JPL Horizons System. https://ssd.jpl.nasa.gov/horizons/',
    },
    {
      type: 'paragraph',
      text: 'NASA/JPL, Horizons API Documentation. https://ssd-api.jpl.nasa.gov/doc/horizons.html',
    },
    {
      type: 'paragraph',
      text: 'NASA, Solar System Exploration. https://science.nasa.gov/solar-system/',
    },
    {
      type: 'paragraph',
      text: 'NASA, NASA 3D Resources. https://science.nasa.gov/3d-resources/',
    },
    {
      type: 'paragraph',
      text: 'Three.js Documentation. https://threejs.org/docs/',
    },
    {
      type: 'paragraph',
      text: 'React Three Fiber Documentation. https://r3f.docs.pmnd.rs/',
    },
  ],
};

const PROPOSED_SYSTEM_SECTION: ParsedSection = {
  heading: '5. PROPOSED SYSTEM',
  blocks: [
    {
      type: 'paragraph',
      text: 'The proposed system is a browser-based three-dimensional Solar System simulator.',
    },
    {
      type: 'paragraph',
      text: 'It uses astronomical data to determine the positions of celestial objects and renders them using a 3D graphics engine.',
    },
    {
      type: 'paragraph',
      text: 'The system contains the following major components:',
    },
    {
      type: 'subheading',
      text: '5.1 Solar System Visualization',
    },
    {
      type: 'paragraph',
      text: 'The central visualization displays:',
    },
    {
      type: 'list',
      items: [
        'Sun.',
        'Mercury.',
        'Venus.',
        'Earth.',
        'Mars.',
        'Jupiter.',
        'Saturn.',
        'Uranus.',
        'Neptune.',
        'Available natural satellites.',
        'Asteroid belt.',
      ],
    },
    {
      type: 'paragraph',
      text: 'Each planet is represented as a three-dimensional spherical object with appropriate surface textures and lighting.',
    },
    {
      type: 'subheading',
      text: '5.2 Astronomical Data Integration',
    },
    {
      type: 'paragraph',
      text: 'The application integrates NASA/JPL Horizons data to obtain astronomical information.',
    },
    {
      type: 'paragraph',
      text: 'The data includes:',
    },
    {
      type: 'list',
      items: [
        'Cartesian position coordinates.',
        'Velocity components.',
        'Selected simulation timestamps.',
        'Planetary positions relative to a reference body.',
      ],
    },
    {
      type: 'paragraph',
      text: 'This information is used to calculate and update the positions of planets in the 3D environment.',
    },
    {
      type: 'subheading',
      text: '5.3 Planetary Movement',
    },
    {
      type: 'paragraph',
      text: 'Planetary movement is represented using scientific position data rather than arbitrary circular animations.',
    },
    {
      type: 'paragraph',
      text: 'The application updates planetary positions according to the selected simulation time.',
    },
    {
      type: 'paragraph',
      text: 'Each planet follows its own orbital characteristics and speed.',
    },
    {
      type: 'subheading',
      text: '5.4 Interactive Planet Exploration',
    },
    {
      type: 'paragraph',
      text: 'Users can select individual planets to explore them.',
    },
    {
      type: 'paragraph',
      text: 'The system provides relevant information such as:',
    },
    {
      type: 'list',
      items: [
        'Planet name.',
        'Diameter.',
        'Distance from the Sun.',
        'Orbital period.',
        'Rotation period.',
        'Known moons.',
        'Scientific description.',
      ],
    },
    {
      type: 'subheading',
      text: '5.5 Time Simulation',
    },
    {
      type: 'paragraph',
      text: 'The time-control system allows users to:',
    },
    {
      type: 'list',
      items: [
        'Start and pause simulation.',
        'Adjust simulation speed.',
        'Move forward in time.',
        'Move backward in time.',
        'Select a simulation date.',
        'Observe changes in planetary positions.',
      ],
    },
    {
      type: 'paragraph',
      text: 'All planetary positions must correspond to a consistent simulation timestamp',
    },
  ],
};

const TECHNOLOGIES_USED_SECTION: ParsedSection = {
  heading: '6. TECHNOLOGIES USED',
  blocks: [
    {
      type: 'table',
      headers: ['Technology', 'Purpose'],
      rows: [
        ['React', 'User interface development'],
        ['TypeScript', 'Structured application development'],
        ['Three.js', '3D graphics rendering'],
        ['React Three Fiber', 'React-based 3D scene management'],
        ['Drei', '3D rendering utilities'],
        ['Tailwind CSS', 'Interface styling'],
        ['NASA/JPL Horizons API', 'Astronomical ephemeris data'],
        ['GitHub', 'Version control and collaboration'],
        ['Google Antigravity', 'AI-assisted development environment'],
      ],
    },
  ],
};

export function ScientificDossier({
  planet,
  isTransitPending,
  transitTargetName,
  remainingSeconds,
}: ScientificDossierProps) {
  const sections = useMemo(
    () => parseDossierMarkdown(planet.markdownDescription),
    [planet.markdownDescription]
  );

  return (
    <aside
      aria-label={`${planet.name} Scientific Dossier`}
      className="flex h-full w-full flex-col border-t border-white/10 bg-[#05070d]/35 lg:border-t-0 lg:border-l lg:border-white/10 [text-shadow:0_1px_12px_rgba(0,0,0,0.92)]"
    >
      {/* Fixed Project Submission Metadata Header */}
      <div className="shrink-0 border-b border-white/12 px-6 pt-5 pb-4">
        <p className="font-mono-tabular text-[11px] font-medium uppercase tracking-[0.2em] text-sky-300/90">
          A Research Paper for Hackathon Project Submission
        </p>

        <div className="mt-1.5 flex items-baseline justify-between gap-4">
          <h2 className="font-display bg-gradient-to-r from-white via-slate-100 to-sky-200 bg-clip-text text-[26px] font-bold tracking-tight text-transparent">
            Solaris
          </h2>

          {isTransitPending && transitTargetName && (
            <div className="font-mono-tabular text-right text-xs text-amber-300">
              <div>Transit to {transitTargetName}</div>
              <div>{remainingSeconds.toFixed(1)} s</div>
            </div>
          )}
        </div>

        {/* Unboxed Project Submission Metadata Grid */}
        <dl className="mt-3.5 grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-white/12 pt-3.5">
          <div className="col-span-2">
            <dt className="font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Project Category
            </dt>
            <dd className="mt-0.5 text-[13.5px] font-medium text-white">
              Space Technology | Astronomy | Scientific Visualization
            </dd>
          </div>
          <div>
            <dt className="font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Project Name
            </dt>
            <dd className="mt-0.5 text-[13.5px] font-medium text-white">
              Solaris
            </dd>
          </div>
          <div>
            <dt className="font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Team Size
            </dt>
            <dd className="font-mono-tabular mt-0.5 text-[13.5px] font-medium text-white">
              4 Members
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Development Environment
            </dt>
            <dd className="mt-0.5 text-[13.5px] font-medium text-white">
              Google Antigravity, GitHub
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-slate-400">
              Primary Reference
            </dt>
            <dd className="mt-0.5 text-[13.5px] font-medium text-white">
              NASA Eyes on the Solar System, Wikipedia
            </dd>
          </div>
        </dl>
      </div>

      {/* Scrollable Scientific Prose */}
      <div
        key={planet.id}
        className="dossier-scroll flex-1 overflow-y-auto px-6 py-5 space-y-6"
      >
        {sections.map((section, sIdx) => {
          const activeSection =
            sIdx === 0
              ? INTRODUCTION_SECTION
              : sIdx === 1
                ? PROBLEM_STATEMENT_SECTION
                : sIdx === 2
                  ? EXISTING_SYSTEM_SECTION
                  : sIdx === 3
                    ? REFERENCES_SECTION
                    : sIdx === 4
                      ? PROPOSED_SYSTEM_SECTION
                      : sIdx === 5
                        ? TECHNOLOGIES_USED_SECTION
                        : section;
          return (
            <section
              key={`${planet.id}-sec-${sIdx}`}
              className="border-b border-white/10 pb-5 last:border-b-0 last:pb-0"
            >
              <h3 className="font-display border-l-2 border-sky-400/70 pl-3 text-[15px] font-semibold tracking-[0.04em] leading-snug text-white">
                {activeSection.heading}
              </h3>
              <div className="mt-3 space-y-3 text-[14.5px] leading-[1.72] text-slate-200/95">
                {activeSection.blocks.map((block, bIdx) => {
                  if (block.type === 'subheading') {
                    return (
                      <h4
                        key={`${planet.id}-sub-${sIdx}-${bIdx}`}
                        className="font-display pt-1.5 text-[14px] font-semibold tracking-[0.02em] text-sky-200"
                      >
                        {block.text}
                      </h4>
                    );
                  }
                  if (block.type === 'paragraph') {
                    return (
                      <p key={`${planet.id}-p-${sIdx}-${bIdx}`}>
                        {renderInlineRichText(block.text, `${planet.id}-p-${sIdx}-${bIdx}`)}
                      </p>
                    );
                  }
                  if (block.type === 'table') {
                    return (
                      <div
                        key={`${planet.id}-tbl-${sIdx}-${bIdx}`}
                        className="overflow-x-auto border-t border-b border-white/12"
                      >
                        <table className="w-full border-collapse text-left text-[13.5px]">
                          <thead>
                            <tr className="border-b border-white/12 font-mono-tabular text-[10.5px] uppercase tracking-[0.14em] text-slate-300">
                              <th className="py-2.5 pr-4 font-semibold">
                                {block.headers[0]}
                              </th>
                              <th className="py-2.5 font-semibold">
                                {block.headers[1]}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {block.rows.map(([tech, purpose], rIdx) => (
                              <tr key={`${planet.id}-row-${sIdx}-${bIdx}-${rIdx}`}>
                                <td className="py-2.5 pr-4 font-medium text-white align-top whitespace-nowrap">
                                  {tech}
                                </td>
                                <td className="py-2.5 text-slate-200/95 align-top">
                                  {purpose}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  return (
                    <ul
                      key={`${planet.id}-ul-${sIdx}-${bIdx}`}
                      className="space-y-2 pl-4 list-disc marker:text-sky-400/75"
                    >
                      {block.items.map((item, iIdx) => (
                        <li key={`${planet.id}-li-${sIdx}-${bIdx}-${iIdx}`}>
                          {renderInlineRichText(item, `${planet.id}-li-${sIdx}-${bIdx}-${iIdx}`)}
                        </li>
                      ))}
                    </ul>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </aside>
  );
}
