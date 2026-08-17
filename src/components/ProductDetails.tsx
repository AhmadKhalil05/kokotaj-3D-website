export interface DetailSection {
  id: string;
  title: string;
  description: string;
  align?: 'left' | 'right' | 'center';
}

interface ProductDetailsProps {
  sections?: DetailSection[];
}

export function ProductDetails({
  sections = [
    {
      id: 'design',
      title: 'Crafted from Nature',
      description: 'Our shell utilizes bio-composite fibers extracted from organic coconut waste. Durable, lightweight, and acoustic-optimized.',
      align: 'left',
    },
    {
      id: 'acoustics',
      title: 'Resonant Acoustic Chambers',
      description: 'The natural inner curvature of the coconut shell provides zero standing-wave interference, giving you crisp highs and deeply warm lows.',
      align: 'right',
    },
    {
      id: 'sustainability',
      title: '100% Carbon Neutral',
      description: 'For every pair made, we plant a coconut palm tree. Circular economy meets state-of-the-art audiophile engineering.',
      align: 'left',
    },
    {
      id: 'battery',
      title: '40 Hours of Pure Joy',
      description: 'Designed for endless listening. Charge for 10 minutes via USB-C to enjoy 5 hours of continuous premium sound.',
      align: 'center',
    },
  ],
}: ProductDetailsProps) {
  return (
    <div className="product-details-container">
      {sections.map((section, index) => {
        const alignmentClass = `align-${section.align || 'left'}`;
        return (
          <section
            key={section.id}
            id={section.id}
            className={`detail-section ${alignmentClass}`}
          >
            <div className="detail-card">
              <span className="detail-index">0{index + 1}</span>
              <h2 className="detail-title">{section.title}</h2>
              <p className="detail-description">{section.description}</p>
            </div>
          </section>
        );
      })}
    </div>
  );
}
