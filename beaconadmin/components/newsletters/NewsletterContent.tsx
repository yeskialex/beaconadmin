'use client'

interface NewsletterContentProps {
  content: string
  className?: string
}

export default function NewsletterContent({ content, className = '' }: NewsletterContentProps) {
  // This component safely renders HTML content
  // Flutter apps can use flutter_html package to render the same HTML

  return (
    <div className={`newsletter-content ${className}`}>
      <div
        dangerouslySetInnerHTML={{ __html: content }}
        className="prose prose-lg max-w-none"
      />

      <style jsx global>{`
        .newsletter-content {
          color: #1a1a1a;
          line-height: 1.6;
        }

        .newsletter-content h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 1em 0 0.5em;
          color: #111;
        }

        .newsletter-content h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 1em 0 0.5em;
          color: #222;
        }

        .newsletter-content h3 {
          font-size: 1.2em;
          font-weight: bold;
          margin: 1em 0 0.5em;
          color: #333;
        }

        .newsletter-content p {
          margin: 1em 0;
        }

        .newsletter-content ul,
        .newsletter-content ol {
          margin: 1em 0;
          padding-left: 2em;
        }

        .newsletter-content li {
          margin: 0.5em 0;
        }

        .newsletter-content blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1.5em 0;
          font-style: italic;
          color: #666;
        }

        .newsletter-content img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 2em auto;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .newsletter-content strong {
          font-weight: 600;
        }

        .newsletter-content em {
          font-style: italic;
        }

        .newsletter-content u {
          text-decoration: underline;
        }

        .newsletter-content a {
          color: #2563eb;
          text-decoration: underline;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .newsletter-content a:hover {
          color: #1d4ed8;
        }

        .newsletter-content a:visited {
          color: #7c3aed;
        }

        /* Mobile responsive styles */
        @media (max-width: 640px) {
          .newsletter-content h1 {
            font-size: 1.5em;
          }

          .newsletter-content h2 {
            font-size: 1.3em;
          }

          .newsletter-content h3 {
            font-size: 1.1em;
          }

          .newsletter-content img {
            margin: 1.5em auto;
          }
        }
      `}</style>
    </div>
  )
}