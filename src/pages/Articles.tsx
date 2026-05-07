import { useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { LandingShell } from "@/components/landing/LandingShell";
import { articles, categoryLabels } from "@/data/articles";
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

      <LandingShell ctaHref="/signup" ctaLabel="Try PourHub free">
        {/* Hero */}
        <section className="bg-charcoal-dark border-b border-border/30">
          <div className="max-w-6xl mx-auto px-4 pt-16 pb-12">
            <span className="eyebrow text-primary inline-block mb-4">Knowledge base</span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground mb-4 leading-tight">
              Concreting articles & guides
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Practical, no-fluff guides written for Australian concreters. Quoting tips, standards explained, technical calculations, and business advice.
            </p>
          </div>
        </section>

        {/* Category Filters */}
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSearchParams({})}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                !activeCategory
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground hover:text-primary-foreground hover:border-primary/50 border-border/40"
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
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    activeCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground hover:text-primary-foreground hover:border-primary/50 border-border/40"
                  }`}
                >
                  {categoryLabels[cat]} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Article Grid */}
        <div className="max-w-6xl mx-auto px-4 pb-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(article => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </div>
      </LandingShell>
    </>
  );
};

export default Articles;
