'use client';

import { useState } from 'react';

interface NewsArticle {
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

interface CrunchbaseOrg {
  identifier: {
    uuid: string;
    name: string;
    permalink: string;
  };
  properties?: {
    name?: string;
    legal_name?: string;
    domain?: string;
    homepage_url?: string;
    linkedin_url?: string;
    twitter_url?: string;
    facebook_url?: string;
    short_description?: string;
    description?: string;
    founded_on?: string;
    num_employees_min?: number;
    num_employees_max?: number;
    total_funding_usd?: number;
    last_funding_at?: string;
    last_funding_type?: string;
    ipo_date?: string;
    stock_symbol?: string;
    revenue_range?: string;
  };
}

interface LinkedInCompany {
  name: string;
  domain: string;
  description?: string;
  industries?: string[];
  headquarters?: {
    city?: string;
    country?: string;
  };
  foundedOn?: string;
  employeeCountRange?: string;
  specialities?: string[];
}

interface DueDiligenceReportProps {
  leadId: string;
  report: {
    id: string;
    status: string;
    summary?: string;
    confidence?: number;
    sources?: string[];
    crunchbaseData?: CrunchbaseOrg | null;
    linkedinData?: LinkedInCompany | null;
    newsArticles?: NewsArticle[] | null;
    errorMessage?: string;
    creditCost?: number;
    triggeredBy?: string;
    createdAt?: string;
    completedAt?: string;
  };
}

function formatDate(dateString?: string): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount?: number): string {
  if (!amount) return '-';
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

function ConfidenceBadge({ score }: { score?: number }) {
  if (!score) return null;

  let color = 'gray';
  let label = '低置信度';

  if (score >= 70) {
    color = 'green';
    label = '高置信度';
  } else if (score >= 50) {
    color = 'amber';
    label = '中置信度';
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${color}-100 text-${color}-800`}>
      {label} ({score}%)
    </span>
  );
}

export default function DueDiligenceReport({ report }: DueDiligenceReportProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  if (report.status === 'processing') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center gap-3">
          <svg className="animate-spin h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-gray-600">正在聚合背调数据，请稍候...</span>
        </div>
      </div>
    );
  }

  if (report.status === 'failed') {
    return (
      <div className="bg-white border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-red-900">背调失败</h4>
            <p className="text-sm text-red-600">{report.errorMessage || '未知错误'}</p>
          </div>
        </div>
      </div>
    );
  }

  const cb = report.crunchbaseData?.properties;
  const li = report.linkedinData;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium text-gray-900">背调报告</span>
          </div>
          <div className="flex items-center gap-3">
            <ConfidenceBadge score={report.confidence} />
            {report.creditCost && (
              <span className="text-xs text-gray-500">消耗 {report.creditCost} credits</span>
            )}
          </div>
        </div>
      </div>

      {/* Summary */}
      {report.summary && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
          <p className="text-sm text-amber-900">{report.summary}</p>
        </div>
      )}

      {/* Content */}
      <div className="divide-y divide-gray-100">
        {/* Crunchbase Section */}
        {cb && (
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === 'crunchbase' ? null : 'crunchbase')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">Crunchbase 数据</span>
                <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">企业信息</span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'crunchbase' ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSection === 'crunchbase' && (
              <div className="px-4 pb-4 space-y-3">
                <InfoRow label="公司名称" value={cb.name || report.crunchbaseData?.identifier?.name} />
                <InfoRow label="官方网站" value={cb.homepage_url} isLink />
                <InfoRow label="LinkedIn" value={cb.linkedin_url} isLink />
                <InfoRow label="Twitter" value={cb.twitter_url} isLink />
                <InfoRow label="Founded" value={cb.founded_on ? formatDate(cb.founded_on) : undefined} />
                <InfoRow label="员工规模" value={cb.num_employees_min && cb.num_employees_max ? `${cb.num_employees_min}-${cb.num_employees_max}` : undefined} />
                <InfoRow label="融资总额" value={formatCurrency(cb.total_funding_usd)} />
                <InfoRow label="最近融资" value={cb.last_funding_type ? `${cb.last_funding_type} (${cb.last_funding_at ? formatDate(cb.last_funding_at) : ''})` : undefined} />
                <InfoRow label="IPO 日期" value={cb.ipo_date ? formatDate(cb.ipo_date) : undefined} />
                <InfoRow label="股票代码" value={cb.stock_symbol} />
                <InfoRow label="营收规模" value={cb.revenue_range} />
                {cb.short_description && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">公司简介</p>
                    <p className="text-sm text-gray-700">{cb.short_description}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* LinkedIn Section */}
        {li && (
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === 'linkedin' ? null : 'linkedin')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">LinkedIn 数据</span>
                <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">社交信息</span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'linkedin' ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSection === 'linkedin' && (
              <div className="px-4 pb-4 space-y-3">
                <InfoRow label="公司名称" value={li.name} />
                <InfoRow label="行业" value={li.industries?.join(', ')} />
                <InfoRow label="总部" value={li.headquarters ? `${li.headquarters.city}, ${li.headquarters.country}` : undefined} />
                <InfoRow label="成立时间" value={li.foundedOn} />
                <InfoRow label="员工规模" value={li.employeeCountRange} />
                {li.description && (
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">公司简介</p>
                    <p className="text-sm text-gray-700">{li.description}</p>
                  </div>
                )}
                {li.specialities && li.specialities.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">专业领域</p>
                    <div className="flex flex-wrap gap-1">
                      {li.specialities.map((spec, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* News Section */}
        {report.newsArticles && report.newsArticles.length > 0 && (
          <div>
            <button
              onClick={() => setExpandedSection(expandedSection === 'news' ? null : 'news')}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">新闻报道</span>
                <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                  {report.newsArticles.length} 篇
                </span>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === 'news' ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedSection === 'news' && (
              <div className="px-4 pb-4 space-y-3">
                {report.newsArticles.slice(0, 5).map((article, index) => (
                  <a
                    key={index}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex gap-3">
                      {article.urlToImage && (
                        <img
                          src={article.urlToImage}
                          alt=""
                          className="w-16 h-16 object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">{article.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {article.source.name} · {formatDate(article.publishedAt)}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          数据来源: {report.sources?.join(', ') || '聚合数据'} · 生成时间: {report.completedAt ? formatDate(report.completedAt) : formatDate(report.createdAt)}
        </p>
      </div>
    </div>
  );
}

function InfoRow({ label, value, isLink }: { label: string; value?: string | null; isLink?: boolean }) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
      {isLink ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate"
        >
          {value}
        </a>
      ) : (
        <span className="text-xs text-gray-900">{value}</span>
      )}
    </div>
  );
}
