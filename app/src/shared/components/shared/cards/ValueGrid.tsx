'use client';
export default function ValueGrid(){
  const items = [
    { t:'Ride-hailing', d:'Fast ordering, accurate ETAs, trusted drivers.' },
    { t:'Hotels & weekends', d:'Instant reservations + smart weekend kits.' },
    { t:'Saved Places', d:'Collections that turn into repeat journeys.' },
    { t:'Wallet', d:'Card tokenization + local rails.' },
    { t:'Loyalty', d:'Tiers, bonuses, subscriptions.' },
    { t:'Clarity', d:'Transparent pricing & receipts.' }
  ];
  return (
    <div className="grid cols-3">
      {items.map(i=>(
        <div className="card" key={i.t}>
          <h4>{i.t}</h4>
          <p>{i.d}</p>
        </div>
      ))}
    </div>
  );
}
