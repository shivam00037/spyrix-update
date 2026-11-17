import React from 'react';
import './SpyrixLoader.css';

/** Shared responsive SPYRIX MacBook loader used by the intro, auth and workspace. */
export default function SpyrixLoader({ className = '' }) {
  const keys = Array.from({ length: 52 }, (_, index) => index);

  return (
    <div className={`spyrix-loader-screen ${className}`.trim()} role="status" aria-live="polite" aria-label="SPYRIX is loading">
      <div className="spyrix-loader-stage">
        <div className="spyrix-macbook">
          <div className="spyrix-macbook-inner">
            <div className="spyrix-macbook-screen">
              <div className="spyrix-macbook-screen-face">
                <span className="spyrix-macbook-camera" />
                <div className="spyrix-macbook-display">
                  <span className="spyrix-macbook-brand">SPYRIX</span>
                  <span className="spyrix-macbook-shade" />
                </div>
              </div>
              <span className="spyrix-macbook-lid-logo">SX</span>
            </div>
            <div className="spyrix-macbook-body">
              <div className="spyrix-macbook-body-face">
                <div className="spyrix-macbook-touchpad" />
                <div className="spyrix-macbook-keyboard">
                  {keys.map(index => (
                    <span
                      key={index}
                      className={`spyrix-macbook-key${index === 25 ? ' space' : ''}${index > 39 ? ' function' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <span className="spyrix-macbook-pad one" />
              <span className="spyrix-macbook-pad two" />
              <span className="spyrix-macbook-pad three" />
              <span className="spyrix-macbook-pad four" />
            </div>
          </div>
          <span className="spyrix-macbook-shadow" />
        </div>
      </div>
    </div>
  );
}
