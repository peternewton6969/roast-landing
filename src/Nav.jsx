import { useState } from 'react';
import { Link } from 'react-router-dom';

// Hamburger menu in the site header, present on every page.
export default function Nav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <button
        type="button"
        className="nav-toggle"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? '✕' : '☰'}
      </button>
      {open && (
        <>
          <div className="nav-backdrop" onClick={close} aria-hidden="true" />
          <nav className="nav-menu" aria-label="Main">
            <Link to="/" className="nav-link" onClick={close}>
              Home
            </Link>
            <Link to="/mission" className="nav-link" onClick={close}>
              Our Mission
            </Link>
            <Link to="/features" className="nav-link" onClick={close}>
              Features
            </Link>
            <Link to="/captains-log" className="nav-link" onClick={close}>
              Captain&rsquo;s Log
            </Link>
          </nav>
        </>
      )}
    </>
  );
}
