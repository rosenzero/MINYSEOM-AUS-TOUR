import { ImageResponse } from 'next/og';

export const alt = 'Australia Tour Schedule';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#4f46e5',
          color: 'white',
          padding: '80px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 28,
              letterSpacing: '0.4em',
              opacity: 0.92,
              fontWeight: 600,
            }}
          >
            OUR TRIP
          </div>
          <div
            style={{
              fontSize: 120,
              fontWeight: 800,
              marginTop: 28,
              lineHeight: 1,
              letterSpacing: '-0.03em',
            }}
          >
            AUSTRALIA
          </div>
          <div
            style={{
              fontSize: 48,
              fontWeight: 600,
              marginTop: 20,
              opacity: 0.95,
            }}
          >
            Brisbane × Cairns
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ fontSize: 40, fontWeight: 700 }}>
            2026.05.01 – 05.07
          </div>
          <div
            style={{
              fontSize: 24,
              opacity: 0.85,
              letterSpacing: '0.25em',
              fontWeight: 600,
            }}
          >
            SCHEDULE BOARD
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
