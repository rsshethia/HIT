import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";

interface NavChild {
  label: string;
  href: string;
  desc: string;
}

interface NavGroup {
  label: string;
  icon: string;
  children: NavChild[];
}

// Every internal tool, grouped by workflow. Single source of truth for nav.
const NAV_GROUPS: NavGroup[] = [
  {
    label: "Diagram",
    icon: "account_tree",
    children: [
      { label: "Integration Architect", href: "/integration-architect", desc: "PlantUML diagrams + save & export" },
      { label: "Diagram Whiteboard", href: "/integration-diagram", desc: "Freeform tldraw canvas" },
    ],
  },
  {
    label: "HL7",
    icon: "terminal",
    children: [
      { label: "SQL Builder", href: "/hl7-sql-builder", desc: "HL7 parse stored procedures" },
      { label: "Segment Mapper", href: "/hl7-segment-mapper", desc: "Segments ↔ message graph" },
      { label: "De-Identify", href: "/hl7-deidentify", desc: "Pseudonymize PHI, keep journeys" },
      { label: "MessageTrace", href: "/message-trace", desc: "PowerShell archive search" },
    ],
  },
];

const DIRECT_LINKS = [
  { label: "Home", href: "/" },
  { label: "Resources", href: "/resources" },
  { label: "About", href: "/about" },
];

export default function NavBar() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);

  const isActive = (path: string) => location === path;
  const isGroupActive = (group: NavGroup) =>
    group.children.some((child) => location === child.href);

  // Close menus on navigation or Escape
  useEffect(() => {
    setOpenDropdown(null);
    setIsMenuOpen(false);
  }, [location]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenDropdown(null);
        setOpenMobileGroup(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const desktopLinkClass = (active: boolean) =>
    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${active
      ? "border-primary text-gray-900"
      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`;

  const mobileLinkClass = (active: boolean) =>
    `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${active
      ? "border-primary text-primary bg-primary-50"
      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
    }`;

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center">
                <span className="material-icons text-primary text-3xl mr-2">device_hub</span>
                <span className="font-bold text-xl text-gray-800 hidden md:block">
                  <span className="text-primary">HIT</span> - Health Integration Tools
                </span>
              </Link>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-4 lg:space-x-6">
              {DIRECT_LINKS.slice(0, 1).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={desktopLinkClass(isActive(link.href))}
                >
                  {link.label}
                </Link>
              ))}

              {NAV_GROUPS.map((group) => (
                <div
                  key={group.label}
                  className="relative inline-flex"
                  onMouseEnter={() => setOpenDropdown(group.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    onClick={() =>
                      setOpenDropdown(openDropdown === group.label ? null : group.label)
                    }
                    aria-expanded={openDropdown === group.label}
                    aria-haspopup="true"
                    className={`${desktopLinkClass(isGroupActive(group))} gap-1`}
                  >
                    {group.label}
                    <span className="material-icons text-base">
                      {openDropdown === group.label ? "expand_less" : "expand_more"}
                    </span>
                  </button>
                  {openDropdown === group.label && (
                    <div className="absolute left-0 top-full w-72 rounded-md border border-gray-200 bg-white shadow-lg py-2 z-50">
                      {group.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block px-4 py-2.5 hover:bg-gray-50 ${isActive(child.href) ? "bg-primary-50" : ""
                            }`}
                        >
                          <span
                            className={`block text-sm font-medium ${isActive(child.href) ? "text-primary" : "text-gray-800"
                              }`}
                          >
                            {child.label}
                          </span>
                          <span className="block text-xs text-gray-500 mt-0.5">
                            {child.desc}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {DIRECT_LINKS.slice(1).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={desktopLinkClass(isActive(link.href))}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation menu"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">Open main menu</span>
              <span className="material-icons">{isMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden absolute w-full bg-white shadow-lg z-50 max-h-[calc(100vh-4rem)] overflow-y-auto`}>
        <div className="pt-2 pb-3 space-y-1">
          {DIRECT_LINKS.slice(0, 1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className={mobileLinkClass(isActive(link.href))}
            >
              {link.label}
            </Link>
          ))}

          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <button
                onClick={() =>
                  setOpenMobileGroup(openMobileGroup === group.label ? null : group.label)
                }
                aria-expanded={openMobileGroup === group.label}
                className={`w-full flex items-center justify-between pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isGroupActive(group)
                  ? "border-primary text-primary bg-primary-50"
                  : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                  }`}
              >
                <span className="flex items-center">
                  <span className="material-icons mr-2 text-lg">{group.icon}</span>
                  {group.label}
                </span>
                <span className="material-icons">
                  {openMobileGroup === group.label ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {openMobileGroup === group.label && (
                <div className="bg-gray-50 py-1">
                  {group.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block pl-11 pr-4 py-2 text-sm font-medium ${isActive(child.href)
                        ? "text-primary"
                        : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {DIRECT_LINKS.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className={mobileLinkClass(isActive(link.href))}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
