interface FooterProps {
  onOpenContact?: () => void;
}

export function Footer({ onOpenContact }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top-grid">
          {/* Col 1: Brand & Bio */}
          <div className="footer-brand-col">
            <h3 className="footer-logo-text">
              KOKO<span className="accent">TAJ</span>
            </h3>
            <p className="footer-brand-desc">
              Pioneering direct-source organic coconut distribution with record 8.0° Brix natural sweetness. Harvested in Ben Tre, delivered globally with cold-chain freshness.
            </p>
            <div className="footer-cert-tags">
              <span className="cert-tag">ISO 22000</span>
              <span className="cert-tag">HACCP</span>
              <span className="cert-tag">ORGANIC VIETNAM</span>
              <span className="cert-tag">GLOBAL G.A.P.</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div className="footer-col">
            <h4 className="footer-col-title">Navigation</h4>
            <ul className="footer-links-list">
              <li className="footer-link-item">
                <a href="#" onClick={(e) => { e.preventDefault(); scrollToTop(); }}>
                  The 3D Experience
                </a>
              </li>
              <li className="footer-link-item">
                <a href="#taste" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: (document.documentElement.scrollHeight - window.innerHeight) * 0.25, behavior: 'smooth' }); }}>
                  8.0° Brix Sweetness
                </a>
              </li>
              <li className="footer-link-item">
                <a href="#purity" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: (document.documentElement.scrollHeight - window.innerHeight) * 0.5, behavior: 'smooth' }); }}>
                  Cold-Chain & Purity
                </a>
              </li>
              <li className="footer-link-item">
                <a href="#harvest" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: (document.documentElement.scrollHeight - window.innerHeight) * 0.72, behavior: 'smooth' }); }}>
                  Circular Harvest
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Global Offices */}
          <div className="footer-col">
            <h4 className="footer-col-title">Global Hubs</h4>
            <ul className="footer-links-list">
              <li className="footer-link-item">
                <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.85rem' }}>🇩🇪 Germany (HQ)</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Seebal Trading Company GmbH</span>
              </li>
              <li className="footer-link-item" style={{ marginTop: '0.5rem' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.85rem' }}>🇸🇦 Saudi Arabia</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Direct Gulf Distribution</span>
              </li>
              <li className="footer-link-item" style={{ marginTop: '0.5rem' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.85rem' }}>🇻🇳 Vietnam</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Ben Tre Organic Processing</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Inquiries */}
          <div className="footer-col">
            <h4 className="footer-col-title">Direct Inquiries</h4>
            <ul className="footer-links-list">
              <li className="footer-link-item">
                <a href="mailto:info@tajtrading.de">info@tajtrading.de</a>
              </li>
              <li className="footer-link-item">
                <a href="tel:+84934444560">+84 934 444 560</a>
              </li>
              <li className="footer-link-item" style={{ marginTop: '0.75rem' }}>
                <button 
                  type="button" 
                  className="btn-primary" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={onOpenContact}
                >
                  Wholesale Inquiries
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div>
            © {currentYear} KOKOTAJ • Seebal Trading Company GmbH. All rights reserved.
          </div>
          <div className="footer-legal-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Cold-Chain Specifications</a>
            <a href="#" onClick={(e) => { e.preventDefault(); scrollToTop(); }}>Back to Top ↑</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
