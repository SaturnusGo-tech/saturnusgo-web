'use client';

export default function FeatureCards() {
  const items = [
    { t: 'Rides', d: 'Fast ordering, ETA, fair pricing, driver logic.' },
    { t: 'Bookings', d: 'Hotels & weekend kits with overlap protection.' },
    { t: 'Saved Places', d: 'Collections for repeat usage & monetization.' },
    { t: 'Financial Hub', d: 'Analytics, history, charts across periods.' }
  ];

  return (
    <div className="grid features">
      {items.map((i) => (
        <div className="card card--hover" key={i.t}>
          <h4>{i.t}</h4>
          <p>{i.d}</p>
        </div>
      ))}
    </div>
  );
}
