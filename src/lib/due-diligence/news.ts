/**
 * NewsAPI 集成
 * 用于搜索公司相关新闻
 */

const NEWS_API_KEY = process.env.NEWS_API_KEY;

export interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
}

export interface NewsSearchResult {
  totalResults: number;
  articles: NewsArticle[];
  query: string;
}

/**
 * 搜索公司相关新闻
 */
export async function searchCompanyNews(
  companyName: string,
  options: {
    language?: string;
    pageSize?: number;
  } = {}
): Promise<NewsSearchResult> {
  const { language = 'en', pageSize = 10 } = options;

  if (!NEWS_API_KEY) {
    console.warn('[NewsAPI] NEWS_API_KEY not configured');
    return {
      totalResults: 0,
      articles: [],
      query: companyName,
    };
  }

  try {
    const query = encodeURIComponent(`${companyName} company`);
    const url = `https://newsapi.org/v2/everything?q=${query}&language=${language}&pageSize=${pageSize}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ViciVidi/1.0',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[NewsAPI] Error: ${response.status}`, errorText);
      return {
        totalResults: 0,
        articles: [],
        query: companyName,
      };
    }

    const data = await response.json();

    return {
      totalResults: data.totalResults || 0,
      articles: (data.articles || []).map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        source: {
          id: article.source?.id,
          name: article.source?.name || 'Unknown',
        },
        author: article.author,
      })),
      query: companyName,
    };
  } catch (error) {
    console.error('[NewsAPI] Fetch error:', error);
    return {
      totalResults: 0,
      articles: [],
      query: companyName,
    };
  }
}

/**
 * 搜索融资新闻
 */
export async function searchFundingNews(
  companyName: string,
  options: {
    language?: string;
    pageSize?: number;
  } = {}
): Promise<NewsSearchResult> {
  const { language = 'en', pageSize = 5 } = options;

  if (!NEWS_API_KEY) {
    console.warn('[NewsAPI] NEWS_API_KEY not configured');
    return {
      totalResults: 0,
      articles: [],
      query: companyName,
    };
  }

  try {
    const query = encodeURIComponent(`"${companyName}" funding OR raised OR investment OR Series`);
    const url = `https://newsapi.org/v2/everything?q=${query}&language=${language}&pageSize=${pageSize}&sortBy=relevancy&apiKey=${NEWS_API_KEY}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ViciVidi/1.0',
      },
    });

    if (!response.ok) {
      console.error(`[NewsAPI] Funding search error: ${response.status}`);
      return {
        totalResults: 0,
        articles: [],
        query: companyName,
      };
    }

    const data = await response.json();

    return {
      totalResults: data.totalResults || 0,
      articles: (data.articles || []).map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        source: {
          id: article.source?.id,
          name: article.source?.name || 'Unknown',
        },
        author: article.author,
      })),
      query: companyName,
    };
  } catch (error) {
    console.error('[NewsAPI] Funding search error:', error);
    return {
      totalResults: 0,
      articles: [],
      query: companyName,
    };
  }
}
