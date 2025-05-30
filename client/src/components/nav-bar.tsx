import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function NavBar() {
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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
            <div className="hidden md:ml-6 md:flex md:space-x-6">
              <Link 
                href="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive("/") 
                    ? "border-primary text-gray-900" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Home
              </Link>

              <Link 
                href="/resources"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive("/resources") 
                    ? "border-primary text-gray-900" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Resources
              </Link>
              <Link 
                href="/about"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive("/about") 
                    ? "border-primary text-gray-900" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                About
              </Link>
            </div>
          </div>
          
          <div className="hidden md:ml-6 md:flex md:items-center">
            <Button 
              variant="outline"
              onClick={() => setLocation("/resources")}
              size="sm"
              className="inline-flex items-center"
            >
              <span className="material-icons mr-1 text-sm">apps</span>
              Tools & Resources
            </Button>
          </div>
          
          <div className="-mr-2 flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
            >
              <span className="sr-only">Open main menu</span>
              <span className="material-icons">{isMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden absolute w-full bg-white shadow-lg z-50`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link 
            href="/"
            onClick={() => setIsMenuOpen(false)}
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive("/") 
                ? "border-primary text-primary bg-primary-50" 
                : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Home
          </Link>

          <Link 
            href="/resources"
            onClick={() => setIsMenuOpen(false)}
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive("/resources") 
                ? "border-primary text-primary bg-primary-50" 
                : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            Resources
          </Link>
          <Link 
            href="/about"
            onClick={() => setIsMenuOpen(false)}
            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
              isActive("/about") 
                ? "border-primary text-primary bg-primary-50" 
                : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
            }`}
          >
            About
          </Link>
          <div className="mt-4 px-4 pb-2">
            <Button 
              variant="outline"
              onClick={() => {
                setLocation("/resources");
                setIsMenuOpen(false);
              }}
              className="w-full justify-center"
            >
              <span className="material-icons mr-1 text-sm">apps</span>
              Explore Tools and Resources
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}