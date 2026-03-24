import { AnimatedText, FadeIn } from "@/components/ui/animations";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-background">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 w-full h-full object-cover">
          <div className="absolute right-0 top-0 w-1/2 h-[80vh] bg-purple-50 rounded-bl-full opacity-50 blur-3xl" />
          <div className="absolute left-0 bottom-0 w-1/3 h-[50vh] bg-purple-100 rounded-tr-full opacity-60 blur-3xl pointer-events-none" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full text-center">
          <FadeIn delay={0.2} className="inline-block py-1 px-3 rounded-full bg-purple-50 text-purple-700 text-sm font-medium tracking-wide mb-6">
            Compassionate & Dignified Care
          </FadeIn>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-semibold text-foreground leading-[1.1] mb-8">
            <AnimatedText text="Honoring Lives" /> <br />
            <span className="text-purple-primary font-light"><AnimatedText text="With Elegance" /></span>
          </h1>
          
          <FadeIn delay={0.6} className="max-w-2xl mx-auto mb-10">
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              We provide exceptional service, profound respect, and the comfort your family deserves when it matters most.
            </p>
          </FadeIn>
          
          <FadeIn delay={0.8} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/services" className="px-8 py-4 bg-purple-primary text-white rounded-full font-medium hover:bg-purple-dark transition-all shadow-lg hover:shadow-purple-primary/30 flex items-center gap-2">
              Learn About Our Services
              <ArrowRight size={18} />
            </Link>
            <Link href="/contact" className="px-8 py-4 border border-foreground/10 hover:border-foreground/30 text-foreground bg-white/50 backdrop-blur-sm rounded-full font-medium transition-all">
              Get a Personalized Quote
            </Link>
          </FadeIn>
        </div>
      </section>
      
      {/* Services Overview Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <FadeIn>
              <h2 className="text-3xl md:text-5xl font-serif">
                Our Compassionate <span className="text-purple-primary italic">Services</span>
              </h2>
            </FadeIn>
            <FadeIn delay={0.2}>
              <Link href="/services" className="inline-flex items-center text-purple-primary font-medium hover:text-purple-dark hover:gap-3 transition-all">
                View All Services <ArrowRight size={16} className="ml-2" />
              </Link>
            </FadeIn>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Funeral Planning", desc: "Comprehensive planning and coordination to celebrate your loved one's life.", img: "https://images.unsplash.com/photo-1542154298-251f0c2a8b9f?auto=format&fit=crop&q=80&w=800" },
              { title: "Burial Options", desc: "Traditional and modern burial options, handled with the utmost respect.", img: "https://images.unsplash.com/photo-1594902095368-80963fa1b585?auto=format&fit=crop&q=80&w=800" },
              { title: "Pre-planning", desc: "Relieve your family of future emotional burdens by planning ahead.", img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800" }
            ].map((service, idx) => (
              <FadeIn key={idx} delay={0.2 + (idx * 0.1)} className="group h-[400px] rounded-3xl overflow-hidden relative shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer">
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
                <img src={service.img} alt={service.title} className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute inset-0 z-20 p-8 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                  <h3 className="text-2xl font-serif text-white mb-2">{service.title}</h3>
                  <p className="text-white/80 line-clamp-2">{service.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
