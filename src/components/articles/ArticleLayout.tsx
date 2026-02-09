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

      <div className="min-h-screen bg-charcoal-dark">
        {/* Header */}
        <header className="border-b border-border/30 bg-charcoal-dark/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="sm" className="w-8 h-8 rounded-md" />
              <span className="text-xl font-bold text-primary-foreground">
                Pour<span className="text-primary">Hub</span>
              </span>
            </Link>
            <Link
              to="/articles"
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              All Articles
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
            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
              <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                {article.categoryLabel}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {article.readTimeMinutes} min read
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Updated {article.lastUpdated}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary-foreground leading-tight">
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
                prose-headings:text-primary-foreground prose-headings:font-bold
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

        {/* Subtle CTA */}
        <div className="border-t border-border/30 bg-charcoal py-12 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-muted-foreground mb-3">
              PourHub helps Australian concreters manage jobs, quotes, and schedules — all in one place.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Learn more about PourHub →
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-charcoal-dark py-8 px-4 text-center border-t border-border/30">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} PourHub. Operations management for Australian concreting businesses.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm mt-4">
            <Link to="/articles" className="text-muted-foreground hover:text-primary transition-colors">Articles</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms & Conditions</Link>
          </div>
        </footer>
      </div>
    </>
  );
}
