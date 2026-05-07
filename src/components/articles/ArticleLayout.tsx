import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { ArticleSchema } from "./ArticleSchema";
import { TableOfContents } from "./TableOfContents";
import { RelatedArticles } from "./RelatedArticles";
import { Logo } from "@/components/ui/Logo";
import type { Article } from "@/data/articles";

interface ArticleLayoutProps {
  article: Article;
  children: React.ReactNode;
}

export function ArticleLayout({ article, children }: ArticleLayoutProps) {
  return (
    <>
      <SEOHead
        title={`${article.metaTitle} | PourHub`}
        description={article.metaDescription}
        canonicalPath={`/articles/${article.slug}`}
        type="article"
        keywords={article.keywords}
      />
      <ArticleSchema article={article} />

      <div className="min-h-screen bg-background flex flex-col">
        {/* Header — mirrors LandingShell chrome */}
        <header className="sticky top-0 z-50 bg-charcoal-dark/95 backdrop-blur-md border-b border-border/30">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="sm" className="w-8 h-8 rounded-lg" />
              <span className="text-lg font-display font-bold text-primary-foreground">
                Pour<span className="text-primary">Hub</span>
              </span>
            </Link>
            <Link
              to="/articles"
              className="text-sm text-muted-foreground hover:text-primary-foreground transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              All articles
            </Link>
          </div>
        </header>

        {/* Breadcrumbs */}
        <div className="max-w-6xl mx-auto px-4 pt-6">
          <nav className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <span>›</span>
            <Link to="/articles" className="hover:text-primary transition-colors">Articles</Link>
            <span>›</span>
            <Link
              to={`/articles?category=${article.category}`}
              className="hover:text-primary transition-colors"
            >
              {article.categoryLabel}
            </Link>
          </nav>
        </div>

        {/* Article Header */}
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-4">
              <span className="eyebrow text-primary">{article.categoryLabel}</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                {article.readTimeMinutes} min read
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                Updated {article.lastUpdated}
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground leading-tight">
              {article.title}
            </h1>
          </div>
        </div>

        {/* Content + TOC */}
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <div className="flex gap-12">
            {/* Article Body */}
            <article
              data-article-body
              className="flex-1 max-w-3xl prose prose-invert prose-orange
                prose-headings:text-primary-foreground prose-headings:font-display prose-headings:font-bold
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-primary-foreground/80 prose-p:leading-relaxed
                prose-li:text-primary-foreground/80
                prose-strong:text-primary-foreground
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-table:border-border/30
                prose-th:text-primary-foreground prose-th:bg-charcoal prose-th:px-4 prose-th:py-2
                prose-td:px-4 prose-td:py-2 prose-td:border-border/30
                prose-tr:border-border/30"
            >
              {children}
            </article>

            {/* Sidebar TOC */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <TableOfContents />
            </aside>
          </div>

          <RelatedArticles article={article} />
        </div>

        {/* CTA strip */}
        <div className="border-t border-border/30 bg-primary py-14 px-4 mt-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-display text-3xl font-bold text-primary-foreground mb-3">
              Run your concreting business on PourHub
            </h2>
            <p className="text-primary-foreground/90 mb-6">
              Quotes, jobs, schedules, and dockets — all in one place.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-charcoal-dark text-primary-foreground hover:bg-charcoal px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Try PourHub free <ArrowLeft className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </div>

        {/* Footer — matches LandingShell */}
        <footer className="bg-charcoal-dark border-t border-border/30 py-6">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-primary-foreground/70">
            <p>© {new Date().getFullYear()} PourHub</p>
            <div className="flex gap-4">
              <Link to="/articles" className="hover:text-primary-foreground transition-colors">Articles</Link>
              <Link to="/privacy" className="hover:text-primary-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-primary-foreground transition-colors">Terms</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
