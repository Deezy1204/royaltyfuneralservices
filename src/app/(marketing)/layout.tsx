import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import SmoothScrolling from "@/components/ui/SmoothScrolling";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SmoothScrolling>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </div>
    </SmoothScrolling>
  );
}
