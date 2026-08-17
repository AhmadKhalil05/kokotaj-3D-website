import { useEffect, useRef, useState } from 'preact/hooks';
import gsap from 'gsap';

interface ScrollyStoryProps {
  onOpenContact: () => void;
}

export function ScrollyStory({ onOpenContact }: ScrollyStoryProps) {
  const [currentPhase, setCurrentPhase] = useState<number>(0);
  const [scrollPercent, setScrollPercent] = useState<number>(0);

  const phase0Ref = useRef<HTMLDivElement | null>(null);
  const phase1Ref = useRef<HTMLDivElement | null>(null);
  const phase2Ref = useRef<HTMLDivElement | null>(null);
  const phase3Ref = useRef<HTMLDivElement | null>(null);
  const phase4Ref = useRef<HTMLDivElement | null>(null);

  const phaseRefs = [phase0Ref, phase1Ref, phase2Ref, phase3Ref, phase4Ref];
  const prevPhaseRef = useRef<number>(-1);

  // Helper to trigger horizontal entrance animation with GSAP
  const animatePhaseIn = (index: number) => {
    const el = phaseRefs[index]?.current;
    if (!el) return;

    const items = el.querySelectorAll('.gsap-item');
    if (!items.length) return;

    // Horizontal direction based on corner:
    // Left corners (0, 3) slide in horizontally from left (x: -90)
    // Right corners (1, 2) slide in horizontally from right (x: 90)
    // Center (4) expands horizontally with letter-spacing & scale
    let startX = 0;
    if (index === 0 || index === 3) {
      startX = -90;
    } else if (index === 1 || index === 2) {
      startX = 90;
    }

    gsap.killTweensOf(items);

    if (index === 4) {
      gsap.fromTo(
        items,
        {
          opacity: 0,
          scaleX: 0.9,
          x: 0,
          filter: 'blur(10px)',
        },
        {
          opacity: 1,
          scaleX: 1,
          x: 0,
          filter: 'blur(0px)',
          duration: 0.75,
          stagger: 0.08,
          ease: 'power3.out',
        }
      );
    } else {
      gsap.fromTo(
        items,
        {
          opacity: 0,
          x: startX,
          filter: 'blur(12px)',
        },
        {
          opacity: 1,
          x: 0,
          filter: 'blur(0px)',
          duration: 0.8,
          stagger: 0.09,
          ease: 'power3.out',
        }
      );
    }
  };

  // Helper to trigger horizontal exit animation with GSAP
  const animatePhaseOut = (index: number) => {
    const el = phaseRefs[index]?.current;
    if (!el) return;

    const items = el.querySelectorAll('.gsap-item');
    if (!items.length) return;

    let exitX = 0;
    if (index === 0 || index === 3) {
      exitX = -60;
    } else if (index === 1 || index === 2) {
      exitX = 60;
    }

    gsap.killTweensOf(items);
    gsap.to(items, {
      opacity: 0,
      x: exitX,
      filter: 'blur(8px)',
      duration: 0.35,
      stagger: 0.03,
      ease: 'power2.in',
    });
  };

  // 1. Initial Load Horizontal Entrance (Phase 0: Top-Left from -90px)
  useEffect(() => {
    const timer = setTimeout(() => {
      prevPhaseRef.current = 0;
      animatePhaseIn(0);
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  // 2. Real-time 60fps Scroll Progress & Horizontal Phase Switching
  useEffect(() => {
    let animId: number;

    const checkScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || window.pageYOffset || 0;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight <= 0 ? 0 : Math.min(1, Math.max(0, scrollTop / scrollHeight));
      
      setScrollPercent(Math.round(progress * 100));

      // 5 Discrete Phase Ranges:
      // Phase 0: 0% - 19% (Top-Left)
      // Phase 1: 19% - 39% (Bottom-Right)
      // Phase 2: 39% - 59% (Top-Right)
      // Phase 3: 59% - 79% (Bottom-Left)
      // Phase 4: 79% - 100% (Bottom-Center)
      let targetPhase = 0;
      if (progress < 0.19) {
        targetPhase = 0;
      } else if (progress >= 0.19 && progress < 0.39) {
        targetPhase = 1;
      } else if (progress >= 0.39 && progress < 0.59) {
        targetPhase = 2;
      } else if (progress >= 0.59 && progress < 0.79) {
        targetPhase = 3;
      } else {
        targetPhase = 4;
      }

      // When phase changes: Animate old out horizontally, animate new in horizontally!
      if (targetPhase !== prevPhaseRef.current && prevPhaseRef.current !== -1) {
        const oldIndex = prevPhaseRef.current;
        prevPhaseRef.current = targetPhase;
        setCurrentPhase(targetPhase);

        animatePhaseOut(oldIndex);
        animatePhaseIn(targetPhase);
      } else if (prevPhaseRef.current === -1) {
        prevPhaseRef.current = targetPhase;
        setCurrentPhase(targetPhase);
      }

      animId = requestAnimationFrame(checkScroll);
    };

    animId = requestAnimationFrame(checkScroll);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="scrolly-wrapper">
      {/* 500vh scroll track to allow scrolling down */}
      <div className="scrolly-scroll-track" />

      {/* Pinned Fixed Viewport - Always stays in screen */}
      <div className="scrolly-viewport">

        {/* =========================================================
            PHASE 0: THE RAW HARVEST (CORNER: TOP-LEFT)
            Horizontal GSAP Entrance from Left (x: -90 -> 0)
           ========================================================= */}
        <div 
          ref={phase0Ref} 
          className={`corner-section pos-top-left ${currentPhase === 0 ? 'is-active' : ''}`}
        >
          <div className="corner-card">
            <span className="editorial-number gsap-item">01</span>
            <div className="editorial-tag gsap-item">
              <span className="tag-dot" /> MEKONG DELTA • 10°14'N 106°22'E
            </div>
            <h1 className="editorial-title gsap-item">
              KOKOTAJ
            </h1>
            <h2 className="editorial-subtitle gsap-item">
              UNTOUCHED ORGANIC COCONUT
            </h2>
            <p className="editorial-desc gsap-item">
              Grown in the mineral-rich alluvium soils of Ben Tre, Vietnam. Hand-selected for supreme water volume and natural vital enzymes.
            </p>
            <div className="editorial-badges gsap-item">
              <span className="badge-white">100% ORGANIC</span>
              <span className="badge-white">RAW PURITY</span>
              <span className="badge-white">BEN TRE PROVINCE</span>
            </div>
            <div className="scroll-invite-text gsap-item">
              SCROLL TO UNPEEL 3D COCONUT ↓
            </div>
          </div>
        </div>

        {/* =========================================================
            PHASE 1: 8.0° BRIX SWEETNESS (CORNER: BOTTOM-RIGHT)
            Horizontal GSAP Entrance from Right (x: 90 -> 0)
           ========================================================= */}
        <div 
          ref={phase1Ref} 
          className={`corner-section pos-bottom-right ${currentPhase === 1 ? 'is-active' : ''}`}
        >
          <div className="corner-card align-right">
            <span className="editorial-number gsap-item">02</span>
            <div className="editorial-tag gsap-item">
              NATURAL BRIX INDEX • PEAK SWEETNESS
            </div>
            <div className="giant-metric-row gsap-item">
              <span className="giant-metric-val">8.0°</span>
              <span className="giant-metric-unit">BRIX</span>
            </div>
            <h2 className="editorial-subtitle gsap-item">
              THE SWEETNESS BENCHMARK
            </h2>
            <p className="editorial-desc gsap-item">
              Standard commercial coconuts measure 5.0–6.0° Brix. Kokotaj achieves an unprecedented 8.0° Brix naturally with 0% added sugars.
            </p>
            <div className="metrics-pill-grid gsap-item">
              <div className="mini-metric-pill">
                <strong>8.0° Bx</strong>
                <span>Peak Brix</span>
              </div>
              <div className="mini-metric-pill">
                <strong>0%</strong>
                <span>Added Sugar</span>
              </div>
              <div className="mini-metric-pill">
                <strong>5×</strong>
                <span>Electrolytes</span>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            PHASE 2: COLD-CHAIN & PURITY (CORNER: TOP-RIGHT)
            Horizontal GSAP Entrance from Right (x: 90 -> 0)
           ========================================================= */}
        <div 
          ref={phase2Ref} 
          className={`corner-section pos-top-right ${currentPhase === 2 ? 'is-active' : ''}`}
        >
          <div className="corner-card align-right">
            <span className="editorial-number gsap-item">03</span>
            <div className="editorial-tag gsap-item">
              SEALED AT SOURCE • ZERO ADDITIVES
            </div>
            <h2 className="editorial-title gsap-item">
              100% RAW
            </h2>
            <h3 className="editorial-subtitle gsap-item">
              DIRECT TREE-TO-CHILL PRESERVATION
            </h3>
            <p className="editorial-desc gsap-item">
              Harvested strictly at the 7-month maturity apex. Immediate flash refrigeration locks in delicate aroma, active electrolytes, and potassium.
            </p>
            <div className="editorial-badges justify-right gsap-item">
              <span className="badge-white">COLD-CHAIN SEALED</span>
              <span className="badge-white">ISO 22000 COMPLIANT</span>
              <span className="badge-white">HACCP CERTIFIED</span>
            </div>
          </div>
        </div>

        {/* =========================================================
            PHASE 3: ARTISANAL BIO-STAND (CORNER: BOTTOM-LEFT)
            Horizontal GSAP Entrance from Left (x: -90 -> 0)
           ========================================================= */}
        <div 
          ref={phase3Ref} 
          className={`corner-section pos-bottom-left ${currentPhase === 3 ? 'is-active' : ''}`}
        >
          <div className="corner-card">
            <span className="editorial-number gsap-item">04</span>
            <div className="editorial-tag gsap-item">
              CIRCULAR HARVEST • BIO-COMPOSITE
            </div>
            <h2 className="editorial-title gsap-item">
              ZERO WASTE
            </h2>
            <h3 className="editorial-subtitle gsap-item">
              HANDCRAFTED ARTISANAL HUSK STAND
            </h3>
            <p className="editorial-desc gsap-item">
              Every gram of the coconut is honored. The fibrous outer husk is hand-carved into a custom natural serving stand, eliminating single-use plastic holders.
            </p>
            <div className="editorial-badges gsap-item">
              <span className="badge-white">100% BIODEGRADABLE</span>
              <span className="badge-white">ZERO PLASTIC</span>
              <span className="badge-white">ECO-STAND INCLUDED</span>
            </div>
          </div>
        </div>

        {/* =========================================================
            PHASE 4: 360° LUXURY EXPORT & TRADE (CORNER: BOTTOM-CENTER)
            Horizontal Expansion GSAP Entrance (scaleX, letter-spacing)
           ========================================================= */}
        <div 
          ref={phase4Ref} 
          className={`corner-section pos-bottom-center ${currentPhase === 4 ? 'is-active' : ''}`}
        >
          <div className="corner-card align-center">
            <span className="editorial-number gsap-item">05</span>
            <div className="editorial-tag gsap-item">
              WORLDWIDE EXPORT LOGISTICS
            </div>
            <h2 className="editorial-title gsap-item">
              GLOBAL LUXURY
            </h2>
            <h3 className="editorial-subtitle gsap-item">
              GERMANY (HQ) • SAUDI ARABIA • VIETNAM
            </h3>
            <p className="editorial-desc gsap-item" style={{ maxWidth: '580px', margin: '0 auto 1.5rem auto' }}>
              Supplying premier Michelin restaurants, luxury hotels, gourmet organic supermarkets, and beverage distributors worldwide with refrigerated container shipments.
            </p>
            <div className="editorial-action-row gsap-item">
              <button 
                type="button" 
                className="btn-white-filled"
                onClick={onOpenContact}
              >
                REQUEST WHOLESALE CATALOG
              </button>
              <a 
                href="mailto:info@tajtrading.de" 
                className="btn-white-outline"
              >
                INFO@TAJTRADING.DE
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Floating Minimal Progress HUD */}
      <div className="minimal-hud-bottom">
        <div className="hud-phase-label">
          <span>PHASE 0{currentPhase + 1}</span> / 05
        </div>
        <div className="hud-progress-track">
          <div className="hud-progress-bar" style={{ width: `${scrollPercent}%` }} />
        </div>
        <div className="hud-percent-label">
          {scrollPercent}%
        </div>
      </div>
    </div>
  );
}
