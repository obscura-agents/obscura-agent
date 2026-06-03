const GH = "https://github.com/obscura-agents/obscura-agent";
const X = "https://x.com/obscuraagents";

export function Nav() {
  return (
    <nav className="nav">
      <a className="nav-brand" href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/obscura-logo.png" alt="" className="nav-logo" />
        <span>Obscura&nbsp;Agent</span>
      </a>

      <div className="nav-links">
        <a href="/docs">Docs</a>
        <a href="/#how">How it works</a>
        <a href="/#why">Why</a>
        <a href="/#try">Try it</a>
      </div>

      <div className="nav-actions">
        <a href={GH} target="_blank" rel="noreferrer" aria-label="GitHub" title="GitHub">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.94c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.41-1.27.74-1.56-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.42.36.8 1.08.8 2.18v3.23c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
          </svg>
        </a>
        <a href={X} target="_blank" rel="noreferrer" aria-label="X" title="X / Twitter">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
          </svg>
        </a>
      </div>
    </nav>
  );
}
