// app/mobile/MobileLottie.tsx
'use client';

import { Player } from '@lottiefiles/react-lottie-player';

export default function MobileLottie() {
  return (
    <div
      className="mbl-anim"
      aria-hidden
      style={{
        width: 'clamp(220px, 48vw, 340px)',
        height: 'clamp(220px, 48vw, 340px)',
        marginTop: 'clamp(8px, 3.5vh, 22px)',
        marginBottom: 10,
        filter: 'drop-shadow(0 22px 46px rgba(0,0,0,.35))',
        position: 'relative',
      }}
    >
      <Player
        src="/lottie/rocket.json"
        autoplay
        loop
        speed={1}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
