export default function NotFound(){
    return (
      <main className="section">
        <div className="section__head">
          <h2>Not found</h2>
          <p className="sub">This page doesn’t exist. Try the Home or Investors page.</p>
        </div>
        <div className="section__body">
          <a className="btn btn-primary" href="/">Back to Home</a>
        </div>
      </main>
    );
  }
  