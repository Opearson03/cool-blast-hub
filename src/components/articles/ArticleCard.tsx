import { Link } from "react-router-dom";
import { Clock, ArrowRight } from "lucide-react";
import type { Article } from "@/data/articles";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      to={`/articles/${article.slug}`}
      className="group block bg-charcoal border border-border/30 rounded-lg p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="flex items-center gap-2 text-xs text-primary font-medium mb-3">
        <span className="bg-primary/10 px-2 py-1 rounded">{article.categoryLabel}</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Clock className="w-3 h-3" />
          {article.readTimeMinutes} min read
        </span>
      </div>
      <h3 className="text-lg font-semibold text-primary-foreground mb-2 group-hover:text-primary transition-colors">
        {article.title}
      </h3>
      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
        {article.metaDescription}
      </p>
      <span className="inline-flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all">
        Read article <ArrowRight className="w-4 h-4" />
      </span>
    </Link>
  );
}
