export default function Changelog(){
  const items = [
    { d:'2025-08-16', t:'Landing compact pass: Apple/Airbnb layout, numeric charts' },
    { d:'2025-07-19', t:'Investor page split + projections' },
    { d:'2025-07-10', t:'Waitlist form + route progress' }
  ];
  return (
    <main className="section">
      <div className="section__head">
        <div className="kicker">Changelog</div>
        <h2>What’s new</h2>
      </div>
      <div className="section__body">
        <ul className="bullets">
          {items.map((i,idx)=>(<li key={idx}><strong>{i.d}</strong> — {i.t}</li>))}
        </ul>
      </div>
    </main>
  );
}
