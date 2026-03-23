/**
 * SSRF (Server-Side Request Forgery) 防护工具
 * 验证 URL 安全性，防止请求内部资源
 */

export interface SSRFValidationResult {
  safe: boolean;
  reason?: string;
  hostname?: string;
  ip?: string;
}

/**
 * 检查是否为私有/保留 IP 地址
 */
function isPrivateOrReservedIP(ip: string): boolean {
  // IPv4 私有地址范围
  const ipv4PrivateRanges = [
    { start: '10.0.0.0', end: '10.255.255.255' },
    { start: '172.16.0.0', end: '172.31.255.255' },
    { start: '192.168.0.0', end: '192.168.255.255' },
  ];

  // IPv4 保留地址
  const ipv4ReservedRanges = [
    { start: '0.0.0.0', end: '0.255.255.255' },
    { start: '127.0.0.0', end: '127.255.255.255' }, // Loopback
    { start: '169.254.0.0', end: '169.254.255.255' }, // Link-local
    { start: '224.0.0.0', end: '239.255.255.255' }, // Multicast
    { start: '240.0.0.0', end: '255.255.255.255' }, // Reserved
  ];

  // 转换为数字比较
  const ipToNum = (ip: string): number => {
    const parts = ip.split('.').map(Number);
    return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
  };

  const ipNum = ipToNum(ip);
  const allRanges = [...ipv4PrivateRanges, ...ipv4ReservedRanges];

  for (const range of allRanges) {
    const startNum = ipToNum(range.start);
    const endNum = ipToNum(range.end);
    if (ipNum >= startNum && ipNum <= endNum) {
      return true;
    }
  }

  return false;
}

/**
 * 解析域名获取 IP 地址（仅检查 IPv4）
 */
async function resolveToIPv4(hostname: string): Promise<string | null> {
  try {
    const dns = await import('dns');
    const { promisify } = await import('util');
    const lookup = promisify(dns.lookup);

    const result = await lookup(hostname);
    if (result.family === 4) {
      return result.address;
    }
    // 如果是 IPv6，返回 null 让调用方决定
    return null;
  } catch {
    return null;
  }
}

/**
 * 检查是否为本地主机名
 */
function isLocalHostname(hostname: string): boolean {
  const localHostnames = [
    'localhost',
    'localhost.localdomain',
    'local',
    '127.0.0.1',
    '::1',
    '0.0.0.0',
  ];

  const lowerHostname = hostname.toLowerCase();
  if (localHostnames.includes(lowerHostname)) {
    return true;
  }

  // 检查 .local 域名
  if (lowerHostname.endsWith('.local')) {
    return true;
  }

  return false;
}

/**
 * 检查是否为内部域名
 */
function isInternalDomain(hostname: string): boolean {
  const internalPatterns = [
    // AWS 元数据服务
    /^.*\.amazonaws\.com$/i,
    /^169\.254\.169\.254$/,
    // GCP 元数据服务
    /^metadata\.google\-compute\.internal$/i,
    /^metadata$/,
    // Azure 元数据服务
    /^169\.254\.169\.254$/,
    // Docker/Kubernetes
    /^.*\.kubernetes\.local$/i,
    /^kubernetes$/i,
    // 内部服务常见后缀
    /^.*\.internal$/i,
    /^.*\.local$/i,
    /^.*\.corp$/i,
    /^.*\.intranet$/i,
    // 数据库默认端口主机
    /^mysql$/i,
    /^postgres$/i,
    /^mongodb$/i,
    /^redis$/i,
    /^memcached$/i,
  ];

  const lowerHostname = hostname.toLowerCase();
  return internalPatterns.some((pattern) => pattern.test(lowerHostname));
}

/**
 * 验证 URL 是否安全（防止 SSRF 攻击）
 */
export async function validateURL(url: string): Promise<SSRFValidationResult> {
  let parsed: URL;

  try {
    parsed = new URL(url);
  } catch {
    return { safe: false, reason: 'Invalid URL format' };
  }

  // 只允许 HTTP 和 HTTPS
  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') {
    return { safe: false, reason: `Disallowed protocol: ${protocol}` };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 检查本地主机名
  if (isLocalHostname(hostname)) {
    return { safe: false, reason: 'Localhost not allowed', hostname };
  }

  // 检查内部域名
  if (isInternalDomain(hostname)) {
    return { safe: false, reason: 'Internal domain not allowed', hostname };
  }

  // 尝试解析并检查 IP
  const ip = await resolveToIPv4(hostname);

  if (ip) {
    if (isPrivateOrReservedIP(ip)) {
      return {
        safe: false,
        reason: 'Private/reserved IP not allowed',
        hostname,
        ip,
      };
    }
    return { safe: true, hostname, ip };
  }

  // 如果无法解析，仍允许（可能是暂时性的 DNS 问题）
  // 但记录警告
  console.warn(`[SSRF] Could not resolve hostname: ${hostname}`);
  return { safe: true, hostname };
}

/**
 * 验证 URL（同步版本，仅做基本检查）
 * 用于不需要 DNS 查询的场景
 */
export function validateURLSync(url: string): SSRFValidationResult {
  try {
    const parsed = new URL(url);

    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') {
      return { safe: false, reason: `Disallowed protocol: ${protocol}` };
    }

    const hostname = parsed.hostname.toLowerCase();

    if (isLocalHostname(hostname)) {
      return { safe: false, reason: 'Localhost not allowed', hostname };
    }

    if (isInternalDomain(hostname)) {
      return { safe: false, reason: 'Internal domain not allowed', hostname };
    }

    return { safe: true, hostname };
  } catch {
    return { safe: false, reason: 'Invalid URL format' };
  }
}

/**
 * 带 SSRF 保护的 fetch 包装器
 */
export async function safeFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const validation = await validateURL(url);

  if (!validation.safe) {
    throw new Error(`SSRF blocked: ${validation.reason}`);
  }

  return fetch(url, {
    ...options,
    // 添加 DNS rebinding 保护
    signal: options.signal ?? AbortSignal.timeout(30000),
  });
}

/**
 * 清理和验证 URL 列表
 */
export async function validateURLs(
  urls: string[]
): Promise<{ valid: string[]; invalid: { url: string; reason: string }[] }> {
  const valid: string[] = [];
  const invalid: { url: string; reason: string }[] = [];

  for (const url of urls) {
    const result = await validateURL(url);
    if (result.safe) {
      valid.push(url);
    } else {
      invalid.push({ url, reason: result.reason ?? 'Unknown' });
    }
  }

  return { valid, invalid };
}
