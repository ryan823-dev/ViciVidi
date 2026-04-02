'use client';

import { useState } from 'react';

interface DueDiligenceButtonProps {
  leadId: string;
  companyName: string;
  hasExistingReport?: boolean;
  onComplete?: (data: any) => void;
}

const CREDIT_COST = 40;

export default function DueDiligenceButton({
  leadId,
  companyName,
  hasExistingReport = false,
  onComplete,
}: DueDiligenceButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleStartDueDiligence = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}/due-diligence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          setError(`Credits 不足，需要 ${CREDIT_COST} credits`);
        } else if (response.status === 409) {
          setError('背调正在进行中，请稍后查看');
        } else {
          setError(result.message || '启动背调失败');
        }
        return;
      }

      if (onComplete && result.dueDiligence?.data) {
        onComplete(result.dueDiligence.data);
      }

      // 刷新页面以显示新结果
      window.location.reload();

    } catch (err) {
      setError('网络错误，请重试');
      console.error('Due diligence error:', err);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900">确认启动背调</h4>
            <p className="mt-1 text-sm text-gray-500">
              将为 <strong>{companyName}</strong> 进行企业背调，将消耗 <strong>{CREDIT_COST} credits</strong>。
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleStartDueDiligence}
                disabled={loading}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    执行中...
                  </>
                ) : (
                  '确认背调'
                )}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={loading}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                取消
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      disabled={loading}
      className={`
        inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md
        transition-colors duration-200
        ${hasExistingReport
          ? 'text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100'
          : 'text-white bg-amber-600 hover:bg-amber-700'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>背调中...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {hasExistingReport ? '重新背调' : '企业背调'}
          <span className="text-xs opacity-75">({CREDIT_COST} credits)</span>
        </>
      )}
    </button>
  );
}
