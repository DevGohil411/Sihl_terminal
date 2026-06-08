import ApeHero from "@/components/ApeHero";
import Navbar from "@/components/Navbar";
import SmoothScroll from "@/components/SmoothScroll";
import ClickSpark from "@/components/ClickSpark";
import LetterGlitch from "@/components/LetterGlitch";
import ScrollStack from "@/components/ScrollStack";
import DecryptedText from "@/components/DecryptedText";

export default function Home() {
  return (
    <ClickSpark>
      <SmoothScroll>
        <LetterGlitch />
        <Navbar />
        <main className="relative w-full overflow-hidden">
          
          <ScrollStack index={0}>
            <ApeHero />
          </ScrollStack>
          
        </main>
      </SmoothScroll>
    </ClickSpark>
  );
}
