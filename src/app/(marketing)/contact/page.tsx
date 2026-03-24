import { AnimatedText, FadeIn } from "@/components/ui/animations";
import { Mail, MapPin, Phone } from "lucide-react";

export default function Contact() {
  return (
    <div className="w-full pt-32 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <FadeIn>
            <h1 className="text-5xl md:text-6xl font-serif font-semibold text-foreground mb-6">
              Get in <span className="text-purple-primary italic">Touch</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We are here to assist you 24/7. Reach out to us for immediate assistance, to request a quote, or to discuss pre-planning options.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Details */}
          <FadeIn delay={0.2} className="space-y-12">
            <div>
              <h3 className="text-2xl font-serif font-medium mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-primary shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Phone (24/7 Support)</h4>
                    <a href="tel:+2700000000" className="text-muted-foreground hover:text-purple-primary transition-colors">+27 (0) 00 000 0000</a>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-primary shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Email</h4>
                    <a href="mailto:info@royaltyfunerals.co.za" className="text-muted-foreground hover:text-purple-primary transition-colors">info@royaltyfunerals.co.za</a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-primary shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Head Office</h4>
                    <p className="text-muted-foreground">123 Royalty Avenue<br/>Johannesburg, 2000<br/>South Africa</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="w-full h-64 bg-gray-100 rounded-3xl overflow-hidden relative border border-gray-200">
               <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                  Interactive Map Integration
               </div>
            </div>
          </FadeIn>

          {/* Contact Form */}
          <FadeIn delay={0.4} className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-2xl font-serif font-medium mb-8">Send Us a Message</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-foreground">First Name</label>
                  <input type="text" id="firstName" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-primary/20 focus:border-purple-primary transition-colors" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-foreground">Last Name</label>
                  <input type="text" id="lastName" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-primary/20 focus:border-purple-primary transition-colors" placeholder="Doe" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</label>
                <input type="email" id="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-primary/20 focus:border-purple-primary transition-colors" placeholder="john@example.com" />
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium text-foreground">Subject</label>
                <select id="subject" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-primary/20 focus:border-purple-primary transition-colors bg-white">
                  <option value="general">General Inquiry</option>
                  <option value="quote">Request a Quote</option>
                  <option value="preplanning">Pre-planning Services</option>
                  <option value="immediate">Immediate Assistance</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-foreground">Message</label>
                <textarea id="message" rows={5} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-primary/20 focus:border-purple-primary transition-colors resize-none" placeholder="How can we help you?"></textarea>
              </div>

              <button type="submit" className="w-full py-4 bg-purple-primary text-white rounded-xl font-medium hover:bg-purple-dark transition-colors shadow-md">
                Send Message
              </button>
            </form>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}
