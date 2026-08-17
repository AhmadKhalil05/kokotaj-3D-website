import { useState } from 'preact/hooks';
import { useSmoothScroll } from './hooks/useSmoothScroll';
import { Header } from './components/Header';
import { ScrollCanvas } from './components/ScrollCanvas';
import { ScrollyStory } from './components/ScrollyStory';
import { ContactModal } from './components/ContactModal';

export function App() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  // Initialize ultra-smooth luxury momentum scrolling
  useSmoothScroll(true);

  return (
    <div className="site-wrapper">
      {/* 1. Static Fixed Header (Transparent background, pure white text) */}
      <Header onOpenContact={() => setIsContactOpen(true)} />

      {/* 2. Full-Screen Hardware-Accelerated 3D Background Canvas */}
      <ScrollCanvas
        totalFrames={241}
        baseUrl="/assets/desktop/"
        fileNamePrefix="frame_"
        fileNameDigits={3}
        fileExtension="webp"
        useEasing={true}
        lerpFactor={0.08}
      />

      {/* 3. Alternating Corner Animated Typography Scrollytelling Story */}
      <ScrollyStory onOpenContact={() => setIsContactOpen(true)} />

      {/* 4. Wholesale Inquiry Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />
    </div>
  );
}

export default App;
