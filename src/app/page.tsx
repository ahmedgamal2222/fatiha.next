import { Hero } from "@/components/home/Hero";
import { Counter } from "@/components/home/Counter";
import { VerseBand } from "@/components/home/VerseBand";
import { About } from "@/components/home/About";
import { Journey } from "@/components/home/Journey";
import { LogoCarousel } from "@/components/home/LogoCarousel";
import { Faq } from "@/components/home/Faq";
import { CtaSection } from "@/components/home/CtaSection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Counter />
      <VerseBand />
      <About />
      <Journey />
      <LogoCarousel />
      <Faq />
      <CtaSection />
    </>
  );
}
