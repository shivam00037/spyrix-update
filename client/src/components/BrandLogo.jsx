import React from 'react';

/** One transparent, full-width SPYRIX master lockup used throughout the app. */
export default function BrandLogo({ className = '', alt = 'SPYRIX', symbolOnly = false }) {
  return (
    <span className={`spyrix-brand-lockup${symbolOnly ? ' is-symbol-only' : ''}${className ? ` ${className}` : ''}`} role="img" aria-label={alt}>
      <img
        className={`spyrix-brand-logo${symbolOnly ? ' is-symbol' : ''}`}
        src={symbolOnly ? '/assets/branding/spyrix-sx-emblem-source.png' : '/assets/branding/spyrix-master-lockup.png'}
        alt=""
        decoding="async"
        loading="eager"
        draggable="false"
      />
    </span>
  );
}
