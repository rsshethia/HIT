import { Card } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Link } from "wouter";
import {
  EXTERNAL_STANDARDS,
  NAV_GROUPS,
  SECTION_BY_HREF,
  SECTION_ORDER,
  type NavChild,
} from "@/data/navigation";

function ToolCard({ tool }: { tool: NavChild }) {
  return (
    <Card className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow">
      <h4 className="text-lg font-medium text-gray-900">{tool.label}</h4>
      <p className="mt-2 text-base text-gray-500">{tool.blurb}</p>
      <div className="mt-4">
        <Link
          href={tool.href}
          className="text-primary hover:text-primary-700 font-medium flex items-center"
        >
          Learn more
          <span className="material-icons ml-1 text-sm">arrow_forward</span>
        </Link>
      </div>
    </Card>
  );
}

// Same groups, same order, same titles as the nav menu — one catalogue,
// two surfaces. Long groups reuse the nav's Build / Assure / Apply /
// Explore sections so both places teach the same workflow.
export default function ResourcesPage() {
  usePageMeta("/resources");

  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Integration Resources</h2>
            <p className="mt-4 text-lg text-gray-500">
              Explore these resources to help improve your healthcare integration capabilities and maturity.
            </p>
          </div>
          <div className="mt-12 lg:mt-0 lg:col-span-2">
            {NAV_GROUPS.map((group) => (
              <div key={group.label} className="mb-12">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{group.label}</h3>
                {group.children.length > 4 ? (
                  <div className="space-y-8">
                    {SECTION_ORDER.map((section) => {
                      const kids = group.children.filter((c) => SECTION_BY_HREF[c.href] === section);
                      if (!kids.length) return null;
                      return (
                        <div key={section}>
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">
                            {section}
                          </h4>
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {kids.map((tool) => (
                              <ToolCard key={tool.href} tool={tool} />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {group.children.map((tool) => (
                      <ToolCard key={tool.href} tool={tool} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="mb-12">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Standards</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {EXTERNAL_STANDARDS.map((s) => (
                  <Card key={s.label} className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow">
                    <h4 className="text-lg font-medium text-gray-900">{s.label}</h4>
                    <p className="mt-2 text-base text-gray-500">{s.blurb}</p>
                    <div className="mt-4">
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary-700 font-medium flex items-center"
                      >
                        Learn more
                        <span className="material-icons ml-1 text-sm">arrow_forward</span>
                      </a>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
