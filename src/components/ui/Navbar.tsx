"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll(); // initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About Us", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Policies", href: "/policies" },
    { name: "Resources", href: "/resources" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-serif text-2xl font-semibold text-purple-primary flex items-center gap-2">
          <span>Royalty <span className="font-light text-foreground">Funeral Services</span></span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 font-sans">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm tracking-wide transition-colors ${
                pathname === link.href ? "text-purple-primary font-medium" : "text-foreground hover:text-purple-primary"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="/login"
            className="ml-4 px-5 py-2.5 rounded-full bg-purple-primary text-white text-sm font-medium hover:bg-purple-dark transition-colors shadow-md"
          >
            Client Portal
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Content */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-100 p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block text-lg py-2 ${
                pathname === link.href ? "text-purple-primary font-medium" : "text-foreground"
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-4 border-t border-gray-100">
            <Link
              href="/login"
              className="block w-full text-center px-6 py-3 rounded-full bg-purple-primary text-white font-medium hover:bg-purple-dark transition-colors"
            >
              Client Portal
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
