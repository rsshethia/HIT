import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  DIRECT_LINKS,
  NAV_GROUPS,
  SECTION_BY_HREF,
  type NavGroup,
} from "@/data/navigation";

export default function NavBar() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openMobileGroup, setOpenMobileGroup] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const isActive = (path: string) => location === path;
  const isGroupActive = (group: NavGroup) =>
    group.children.some((child) => location === child.href);

  // Close menus on navigation or Escape
  useEffect(() => {
    setOpenDropdown(null);
    setIsMenuOpen(false);
    setFilter("");
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

  const q = filter.trim().toLowerCase();
  const matches = (label: string, desc: string) =>
    !q || label.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
  const visibleChildren = (group: NavGroup) =>
    group.children.filter((c) => matches(c.label, c.desc));

  const desktopLinkClass = (active: boolean) =>
    `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm ${active
      ? "border-primary text-gray-900"
      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`;

  const mobileLinkClass = (active: boolean) =>
    `block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${active
      ? "border-primary text-primary bg-primary-50"
      : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
    }`;

  const renderDesktopDropdown = (group: NavGroup) => {
    let lastSection: string | null = null;
    return (
      <div
        role="menu"
        aria-label={group.label}
        className="absolute left-0 top-full w-72 rounded-md border border-gray-200 bg-white shadow-lg py-2 z-50"
      >
        {group.children.map((child) => {
          const section = SECTION_BY_HREF[child.href];
          const showHeading = section && section !== lastSection;
          lastSection = section ?? lastSection;
          return (
            <div key={child.href}>
              {showHeading && (
                <p className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  {section}
                </p>
              )}
              <Link
                href={child.href}
                role="menuitem"
                className={`block px-4 py-2.5 hover:bg-gray-50 focus-visible:outline-none focus-visible:bg-primary-50 ${isActive(child.href) ? "bg-primary-50" : ""
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
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <nav className="bg-white shadow-sm" aria-label="Primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm">
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

              {NAV_GROUPS.map((group) =>
                // Single-tool groups render as a direct link — a dropdown
                // with one item adds a click without adding information.
                group.children.length === 1 ? (
                  <Link
                    key={group.children[0].href}
                    href={group.children[0].href}
                    title={group.children[0].desc}
                    className={desktopLinkClass(isActive(group.children[0].href))}
                  >
                    {group.label}
                  </Link>
                ) : (
                  <div
                    key={group.label}
                    className="relative inline-flex"
                    onMouseEnter={() => setOpenDropdown(group.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                    onFocus={() => setOpenDropdown(group.label)}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                        setOpenDropdown(null);
                      }
                    }}
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
                      <span className="material-icons text-base" aria-hidden="true">
                        {openDropdown === group.label ? "expand_less" : "expand_more"}
                      </span>
                    </button>
                    {openDropdown === group.label && renderDesktopDropdown(group)}
                  </div>
                )
              )}

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
        <div className="px-3 pt-3">
          <label className="sr-only" htmlFor="nav-filter">Filter navigation</label>
          <input
            id="nav-filter"
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter tools…"
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="pt-2 pb-3 space-y-1">
          {DIRECT_LINKS.slice(0, 1).map((link) => (
            matches(link.label, "") && (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={mobileLinkClass(isActive(link.href))}
              >
                {link.label}
              </Link>
            )
          ))}

          {NAV_GROUPS.map((group) => {
            const kids = visibleChildren(group);
            if (!kids.length && !matches(group.label, "")) return null;
            // Single-tool groups render as a direct link on mobile too.
            if (group.children.length === 1 && kids.length === 1) {
              return (
                <Link
                  key={kids[0].href}
                  href={kids[0].href}
                  onClick={() => setIsMenuOpen(false)}
                  className={mobileLinkClass(isActive(kids[0].href))}
                >
                  {group.label}: {kids[0].label}
                </Link>
              );
            }
            return (
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
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      {kids.length} tool{kids.length === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span className="material-icons" aria-hidden="true">
                    {openMobileGroup === group.label ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {openMobileGroup === group.label && (
                  <div className="bg-gray-50 py-1">
                    {kids.map((child) => (
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
            );
          })}

          {DIRECT_LINKS.slice(1).map((link) => (
            matches(link.label, "") && (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={mobileLinkClass(isActive(link.href))}
              >
                {link.label}
              </Link>
            )
          ))}
        </div>
      </div>
    </nav>
  );
}
