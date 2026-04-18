"use client";

import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-foreground text-muted pt-20 pb-10 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="md:col-span-1">
          <Link href="/" className="font-serif text-2xl font-semibold text-white mb-6 block">
            Royalty <span className="text-purple-400 font-light">Funeral Services</span>
          </Link>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
            Providing compassionate, dignified, and elegant funeral services to support families during their time of need.
          </p>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">Quick Links</h4>
          <ul className="space-y-4 text-sm text-gray-400">
            <li><Link href="/about" className="hover:text-purple-400 transition-colors">About Us</Link></li>
            <li><Link href="/services" className="hover:text-purple-400 transition-colors">Our Services</Link></li>
            <li><Link href="/policies" className="hover:text-purple-400 transition-colors">Policy Options</Link></li>
            <li><Link href="/resources" className="hover:text-purple-400 transition-colors">Resources</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">Support</h4>
          <ul className="space-y-4 text-sm text-gray-400">
            <li><Link href="/contact" className="hover:text-purple-400 transition-colors">Contact Us</Link></li>
            <li><Link href="/faq" className="hover:text-purple-400 transition-colors">FAQs</Link></li>
            <li><Link href="/login" className="hover:text-purple-400 transition-colors">Client Portal</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-6">Contact</h4>
          <ul className="space-y-4 text-sm text-gray-400">
            <li className="flex flex-col gap-1">
              <span className="flex items-center gap-2"><MapPin size={16} /> Address:</span>
              <span className="pl-6">Stand 15383, Khami Road Kelvin North 11, Bulawayo</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone size={16} />
              <a href="tel:+2700000000" className="hover:text-purple-400 transition-colors">+27 (0) 00 000 0000</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail size={16} />
              <a href="mailto:sales@royaltyfuneral.com" className="hover:text-purple-400 transition-colors">sales@royaltyfuneral.com</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-16 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} Royalty Funeral Services. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
