import { ArticleCard } from "./ArticleCard";
import type { Article } from "@/data/articles";
import { getRelatedArticles } from "@/data/articles";

interface RelatedArticlesProps {
  article: Article;
}

export function RelatedArticles({ article }: RelatedArticlesProps) {
  const related = getRelatedArticles(article);
  if (related.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-border/30">
      <h2 className="text-2xl font-bold text-primary-foreground mb-6">Related Articles</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {related.slice(0, 3).map(a => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
    </section>
  );
}
