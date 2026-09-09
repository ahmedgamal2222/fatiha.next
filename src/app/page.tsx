import { Hero } from "@/components/home/Hero";
import { Counter } from "@/components/home/Counter";
import { About } from "@/components/home/About";
import { Faq } from "@/components/home/Faq";
import { CtaSection } from "@/components/home/CtaSection";
import { LogoCarousel } from "@/components/home/LogoCarousel";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Counter />
      <About />
      <Faq />
      <CtaSection />
      <LogoCarousel />
    </>
  );
}
