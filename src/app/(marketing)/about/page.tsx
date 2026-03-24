import { AnimatedText, FadeIn } from "@/components/ui/animations";
import Link from "next/link";
import { ArrowRight, HeartPulse, ShieldCheck, Clock } from "lucide-react";

export default function About() {
  return (
    <div className="w-full pt-32 pb-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <FadeIn>
            <h1 className="text-5xl md:text-6xl font-serif font-semibold text-foreground mb-6">
              <span className="text-purple-primary italic">About</span> <AnimatedText text="Royalty Funeral Services" />
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We understand that saying goodbye is one of life&apos;s most difficult moments. For years, we have provided unwavering support, ensuring every farewell is as unique and beautiful as the life it celebrates.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
          <FadeIn delay={0.2} className="relative h-[500px] w-full bg-purple-50 rounded-3xl overflow-hidden group">
            <div className="absolute inset-0 bg-purple-100 flex items-center justify-center text-purple-300">
               {/* Unsplash placeholder */}
               <img src="https://images.unsplash.com/photo-1544367567-0f2fcb046eeb?auto=format&fit=crop&q=80&w=1000" alt="Compassionate Care" className="w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" />
            </div>
          </FadeIn>
          
          <FadeIn delay={0.4}>
            <h2 className="text-3xl md:text-4xl font-serif font-medium mb-6">Our Commitment to You</h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                At Royalty Funeral Services, we believe that every family deserves a service that reflects the dignity and legacy of their loved one. Our experienced team handles every detail with grace, precision, and heartfelt compassion.
              </p>
              <p>
                Whether you prefer a traditional service, a modern celebration of life, or a simple intimate gathering, we are here to honor your wishes and alleviate the burden during your time of grief.
              </p>
            </div>
            
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <HeartPulse className="text-purple-primary w-8 h-8 mb-2" />
                <h3 className="font-semibold text-foreground">Compassion</h3>
                <p className="text-sm text-muted-foreground">Empathy in every interaction</p>
              </div>
              <div className="flex flex-col gap-2">
                <ShieldCheck className="text-purple-primary w-8 h-8 mb-2" />
                <h3 className="font-semibold text-foreground">Dignity</h3>
                <p className="text-sm text-muted-foreground">Respecting every wish</p>
              </div>
              <div className="flex flex-col gap-2">
                <Clock className="text-purple-primary w-8 h-8 mb-2" />
                <h3 className="font-semibold text-foreground">24/7 Support</h3>
                <p className="text-sm text-muted-foreground">Always here when you need us</p>
              </div>
            </div>
          </FadeIn>
        </div>

        <FadeIn className="bg-purple-900 rounded-3xl p-12 md:p-20 text-center text-white relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-serif mb-6">Let us handle the details, so you can focus on healing.</h2>
            <Link href="/contact" className="inline-flex items-center gap-2 mt-8 px-8 py-4 bg-white text-purple-900 rounded-full font-medium hover:bg-purple-50 transition-colors">
              Speak with a Director
              <ArrowRight size={18} />
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-800 rounded-full blur-3xl opacity-50 translate-x-1/2 -translate-y-1/2" />
        </FadeIn>
      </div>
    </div>
  );
}
