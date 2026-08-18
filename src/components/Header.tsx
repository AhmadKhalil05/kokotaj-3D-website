import { useEffect, useRef } from 'preact/hooks';
import gsap from 'gsap';

interface HeaderProps {
  onOpenContact?: () => void;
}

export function Header({ onOpenContact }: HeaderProps) {
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!headerRef.current) return;
    gsap.fromTo(
      headerRef.current.querySelectorAll('.header-anim-item'),
      {
        opacity: 0,
        y: -20,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.08,
        ease: 'power3.out',
        delay: 0.1,
      }
    );
  }, []);

  const scrollToSection = (percent: number) => {
    const scrollTarget = (document.documentElement.scrollHeight - window.innerHeight) * percent;
    window.scrollTo({
      top: scrollTarget,
      behavior: 'smooth',
    });
  };

  return (
    <header ref={headerRef} className="site-header-transparent">
      <div className="header-inner-transparent">
        {/* Brand */}
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); scrollToSection(0); }} 
          className="brand-link-white header-anim-item"
        >
          <span className="brand-logo-text">KOKOTAJ</span>
          <span className="brand-dot-white hide-on-mobile" />
          <span className="brand-sub-white hide-on-mobile">VIETNAM</span>
        </a>

        {/* Minimalist White Nav Links */}
        <nav className="header-nav-white header-anim-item">
          <a href="#harvest" onClick={(e) => { e.preventDefault(); scrollToSection(0.05); }} className="nav-item-white">
            01 / HARVEST
          </a>
          <a href="#brix" onClick={(e) => { e.preventDefault(); scrollToSection(0.28); }} className="nav-item-white">
            02 / 8.0° BRIX
          </a>
          <a href="#purity" onClick={(e) => { e.preventDefault(); scrollToSection(0.52); }} className="nav-item-white">
            03 / PURITY
          </a>
          <a href="#eco" onClick={(e) => { e.preventDefault(); scrollToSection(0.75); }} className="nav-item-white">
            04 / CIRCULAR
          </a>
          <a href="#export" onClick={(e) => { e.preventDefault(); scrollToSection(0.95); }} className="nav-item-white">
            05 / EXPORT
          </a>
        </nav>

        {/* Right White Action Button */}
        <div className="header-action-white header-anim-item">
          <button 
            type="button" 
            className="btn-white-outline header-btn-inquire"
            onClick={onOpenContact}
          >
            <span className="hide-on-mobile">INQUIRE EXPORT</span>
            <span className="show-on-mobile">INQUIRE</span>
          </button>
        </div>
      </div>
    </header>
  );
}

