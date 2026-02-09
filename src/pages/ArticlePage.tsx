import { useParams, Navigate } from "react-router-dom";
import { Suspense, lazy, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { getArticleBySlug } from "@/data/articles";
import { ArticleLayout } from "@/components/articles/ArticleLayout";

const ArticlePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticleBySlug(slug) : undefined;

  const ContentComponent = useMemo(() => {
    if (!article) return null;
    return lazy(article.content);
  }, [article]);

  if (!article || !ContentComponent) {
    return <Navigate to="/articles" replace />;
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-charcoal-dark flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ArticleLayout article={article}>
        <ContentComponent />
      </ArticleLayout>
    </Suspense>
  );
};

export default ArticlePage;
