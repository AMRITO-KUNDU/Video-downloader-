import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <p className="footer-copy">
          © {new Date().getFullYear()} StreamFetch · Built for the web
        </p>

        <p className="footer-privacy">
          <span className="material-icons-round">lock</span>
          <span>Temporary processing</span> · nothing is stored
        </p>
      </div>
    </footer>
  )
}
