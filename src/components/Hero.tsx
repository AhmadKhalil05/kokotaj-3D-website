export function Hero() {
  return (
    <div className="hero-section">
      {/* Top Right Stats Overlay */}
      <div className="stats-container">
        <div className="stat-box">
          <div className="stat-value">93<span className="stat-percent">%</span></div>
          <div className="stat-label">SATISFACTION</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">71<span className="stat-percent">%</span></div>
          <div className="stat-label">SALES</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">78<span className="stat-percent">%</span></div>
          <div className="stat-label">NEW CLIENTS</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">46<span className="stat-percent">%</span></div>
          <div className="stat-label">SUPPORT</div>
        </div>
      </div>

      {/* Main Title Overlay */}
      <div className="hero-main-content">
        <span className="hero-tagline">ENJOY THE LIFE WITH</span>
        <h1 className="hero-main-title">
          <span className="title-row">KOKOTAJ</span>
          <span className="title-row"><span className="text-green">COCONUT</span> FRESH</span>
          <span className="title-row">FROM <span className="text-green">VIET NAM</span></span>
        </h1>
        <p className="hero-description-text">
          KOKOTAJ 🌴🥥🥥 TOP 1 NATURAL SWEETNESS WITH UP TO 8.0 BRIX (°Bx)
        </p>
        <button className="hero-cta-btn">HOME PAGE</button>
      </div>

      {/* Right side green L-frame decoration */}
      <div className="right-frame-decorator">
        <div className="vertical-green-bar"></div>
      </div>

      {/* Bottom info overlays */}
      <div className="hero-bottom-info">
        <span className="bottom-contact-text">+ 8 4 9 3 4 4 4 4 5 6 0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; I N F O @ T A J T R A D I N G . D E</span>
      </div>

      {/* Start Explore Tab */}
      <div className="explore-tab">
        <span className="explore-text">START EXPLORE</span>
        <span className="explore-arrow">→</span>
      </div>
    </div>
  );
}
