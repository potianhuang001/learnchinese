/**
 * Footer — simple site footer.
 */
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-ink/5 bg-white">
      <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-sm text-ink-lighter sm:flex-row">
        <p>© {new Date().getFullYear()} LearnChinese. Made for language learners.</p>
        <div className="flex gap-4">
          <Link to="/about" className="hover:text-ink">About</Link>
          <Link to="/lessons" className="hover:text-ink">Lessons</Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
