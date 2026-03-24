import { AnimatedText, FadeIn } from "@/components/ui/animations";
import Link from "next/link";
import { ArrowRight, Flower2, Cross, Flame, HandHeart, BookHeart } from "lucide-react";

const services = [
  {
    title: "Funeral Planning",
    description: "Comprehensive planning and coordination to celebrate your loved one's life with dignity.",
    icon: <Flower2 className="w-10 h-10 text-purple-primary" />,
    image: "https://images.unsplash.com/photo-1542154298-251f0c2a8b9f?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Burial Services",
    description: "Traditional and modern burial options, handled with the utmost respect and care.",
    icon: <Cross className="w-10 h-10 text-purple-primary" />,
    image: "https://images.unsplash.com/photo-1594902095368-80963fa1b585?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Cremation Services",
    description: "Simple, direct, and customized cremation services tailored to your family's beliefs.",
    icon: <Flame className="w-10 h-10 text-purple-primary" />,
    image: "https://images.unsplash.com/photo-1494587351196-bbf5f29cff42?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Pre-planning",
    description: "Relieve your family of future financial and emotional burdens by planning ahead.",
    icon: <BookHeart className="w-10 h-10 text-purple-primary" />,
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800",
  },
  {
    title: "Grief Support",
    description: "Ongoing compassionate support and resources to help you through the mourning process.",
    icon: <HandHeart className="w-10 h-10 text-purple-primary" />,
    image: "https://images.unsplash.com/photo-1518104593124-ac2e82b7b208?auto=format&fit=crop&q=80&w=800",
  },
];

export default function Services() {
  return (
    <div className="w-full pt-32 pb-24 bg-background">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <FadeIn>
            <h1 className="text-5xl md:text-6xl font-serif font-semibold text-foreground mb-6">
              Our <span className="text-purple-primary italic">Services</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We offer a range of dignified services tailored to honor your loved one's legacy and provide comfort during difficult times.
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, idx) => (
            <FadeIn key={idx} delay={idx * 0.1}>
              <div className="group h-full bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-purple-primary/5 transition-all duration-300">
                <div className="h-48 overflow-hidden relative">
                  <div className="absolute inset-0 bg-black/20 z-10 group-hover:bg-transparent transition-colors duration-500" />
                  <img src={service.image} alt={service.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="p-8">
                  <div className="mb-6 bg-purple-50 w-16 h-16 rounded-2xl flex items-center justify-center -mt-16 relative z-20 border-4 border-white">
                    {service.icon}
                  </div>
                  <h3 className="text-2xl font-serif font-medium mb-3 text-foreground">{service.title}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">{service.description}</p>
                  <Link href={`#contact`} className="inline-flex items-center text-purple-primary font-medium hover:text-purple-dark hover:gap-3 transition-all">
                    Inquire <ArrowRight size={16} className="ml-2" />
                  </Link>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </div>
  );
}
