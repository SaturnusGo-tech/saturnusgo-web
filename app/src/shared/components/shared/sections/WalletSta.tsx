export default function WaitlistCTA(){
    const WAITLIST_URL = 'https://forms.gle/your-google-form'; // <-- замени на свою форму (Google/Tally/Typeform)
    return (
      <div className="cta-row">
        <a className="btn btn-primary" href={WAITLIST_URL} target="_blank" rel="noreferrer">Join the waitlist</a>
        <a className="btn" href="https://twitter.com/your_handle" target="_blank" rel="noreferrer">Follow on X</a>
      </div>
    );
  }
  