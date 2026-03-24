"use client";

import { AnimatedText, FadeIn } from "@/components/ui/animations";
import { BookOpen, HelpCircle, FileText, ChevronDown } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

const faqs = [
  {
    question: "What steps should I take immediately after a death?",
    answer: "First, notify the relevant authorities (doctor, police if unexpected). Then, contact Royalty Funeral Services. We are available 24/7 to guide you through the next steps and arrange transportation for your loved one."
  },
  {
    question: "Do you offer repatriation services?",
    answer: "Yes, we specialize in both localized services and international repatriation, ensuring your loved one is transported safely and respectfully to their final resting place."
  },
  {
    question: "Can I customize the funeral service?",
    answer: "Absolutely. We encourage families to personalize the service to reflect the unique life and personality of their loved one, from music and readings to specialized catering and decor."
  },
  {
    question: "How do your funeral policies work?",
    answer: "Our policies require a monthly premium. Upon the passing of a covered individual, the policy pays out a lump sum or covers specific services as detailed in your chosen plan. You can manage your policy anytime via our Client Portal."
  }
];

export default function Resources() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="w-full pt-32 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <FadeIn>
            <h1 className="text-5xl md:text-6xl font-serif font-semibold text-foreground mb-6">
              Helpful <span className="text-purple-primary italic">Resources</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Find answers, read our guides, and access support materials to help you navigate through funeral planning and grief.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <FadeIn delay={0.1} className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <BookOpen className="w-10 h-10 text-purple-primary mb-6" />
            <h3 className="text-2xl font-serif font-medium mb-4">Planning Guides</h3>
            <p className="text-muted-foreground mb-6">Step-by-step guides to help you plan a funeral or memorial service.</p>
            <Link href="#" className="font-medium text-purple-primary hover:underline">Read Guides &rarr;</Link>
          </FadeIn>
          
          <FadeIn delay={0.2} className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <FileText className="w-10 h-10 text-purple-primary mb-6" />
            <h3 className="text-2xl font-serif font-medium mb-4">Grief Support</h3>
            <p className="text-muted-foreground mb-6">Articles and professional resources to assist you during the mourning process.</p>
            <Link href="#" className="font-medium text-purple-primary hover:underline">Find Support &rarr;</Link>
          </FadeIn>
          
          <FadeIn delay={0.3} className="p-8 bg-purple-primary text-white rounded-3xl shadow-sm hover:shadow-md transition-shadow">
            <HelpCircle className="w-10 h-10 text-white/80 mb-6" />
            <h3 className="text-2xl font-serif font-medium mb-4">Need Immediate Help?</h3>
            <p className="text-white/80 mb-6">Our directors are available 24/7. Please call us immediately if someone has passed.</p>
            <a href="tel:+2700000000" className="inline-block py-2 px-6 bg-white text-purple-900 rounded-full font-medium hover:bg-gray-100 transition-colors">Call Now</a>
          </FadeIn>
        </div>

        <FadeIn delay={0.4} className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-serif font-medium text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white border border-gray-100 rounded-2xl overflow-hidden transition-all duration-300">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full text-left p-6 flex items-center justify-between font-medium text-lg text-foreground bg-gray-50/50 hover:bg-gray-50 transition-colors"
                >
                  {faq.question}
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ${openFaq === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="p-6 pt-0 text-muted-foreground leading-relaxed border-t border-gray-100">
                    <div className="pt-4">{faq.answer}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
