import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { articles, categoryLabels } from "@/data/articles";
import { Logo } from "@/components/ui/Logo";
import type { Article } from "@/data/articles";

const categories = Object.keys(categoryLabels) as Article['category'][];

const Articles = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") as Article['category'] | null;

  const filtered = activeCategory
    ? articles.filter(a => a.category === activeCategory)
    : articles;

  return (
    <>
      <SEOHead
        title="Concreting Articles & Guides | PourHub"
        description="Practical guides for Australian concreters. Quoting, pricing, Australian Standards, technical calculations, variations, and business tips."
        canonicalPath="/articles"
        keywords="concreting guides australia, concrete business tips, concreter quoting, concrete standards"
      />

      <div className="min-h-screen bg-charcoal-dark">
        {/* Header */}
        <header className="border-b border-border/30">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="sm" className="w-8 h-8 rounded-md" />
              <span className="text-xl font-bold text-primary-foreground">
                Pour<span className="text-primary">Hub</span>
              </span>
            </Link>
            <Link
              to="/"
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              ← Back to PourHub
            </Link>
          </div>
        </header>

        {/* Hero */}
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-3">
            Concreting Articles & Guides
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Practical, no-fluff guides written for Australian concreters. Quoting tips, standards explained, technical calculations, and business advice.
          </p>
        </div>

        {/* Category Filters */}
        <div className="max-w-6xl mx-auto px-4 pb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSearchParams({})}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !activeCategory
                  ? "bg-primary text-primary-foreground"
                  : "bg-charcoal text-muted-foreground hover:text-primary-foreground border border-border/30"
              }`}
            >
              All ({articles.length})
            </button>
            {categories.map(cat => {
              const count = articles.filter(a => a.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSearchParams({ category: cat })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-charcoal text-muted-foreground hover:text-primary-foreground border border-border/30"
                  }`}
                >
                  {categoryLabels[cat]} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Article Grid */}
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(article => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-charcoal-dark py-8 px-4 text-center border-t border-border/30">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} PourHub. Operations management for Australian concreting businesses.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4 text-sm mt-4">
            <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms & Conditions</Link>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Articles;
