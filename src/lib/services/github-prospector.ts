/**
 * GitHub 技术公司挖掘服务
 * 
 * 通过 GitHub API 发现技术公司/开源项目
 * 找到创始人/开发者的联系方式
 */

const GITHUB_API = 'https://api.github.com'

export interface GitHubCompany {
  name: string
  url: string
  description?: string
  website?: string
  email?: string
  location?: string
  followers: number
  publicRepos: number
  technologies?: string[]
  topRepos?: GitHubRepo[]
}

export interface GitHubRepo {
  name: string
  url: string
  description?: string
  language?: string
  stars: number
  forks: number
}

export interface GitHubUser {
  login: string
  name?: string
  email?: string
  blog?: string
  company?: string
  location?: string
  bio?: string
  followers: number
  publicRepos: number
}

/**
 * 搜索使用特定技术栈的组织
 */
export async function searchGitHubOrganizations(
  technologies: string[],
  minFollowers: number = 10
): Promise<GitHubCompany[]> {
  const query = technologies.join('+')
  const url = `${GITHUB_API}/search/users?q=${query}+type:org+followers:>${minFollowers}&per_page=20`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    })
    
    if (!response.ok) {
      console.error('GitHub API error:', response.status)
      return []
    }
    
    const data = await response.json()
    
    // 获取组织详情
    const companies = await Promise.all(
      data.items.map(async (org: any) => {
        return await getOrganizationDetails(org.login)
      })
    )
    
    return companies.filter(Boolean)
  } catch (error) {
    console.error('GitHub search error:', error)
    return []
  }
}

/**
 * 获取组织详情
 */
async function getOrganizationDetails(orgName: string): Promise<GitHubCompany | null> {
  try {
    const response = await fetch(`${GITHUB_API}/orgs/${orgName}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    })
    
    if (!response.ok) {
      return null
    }
    
    const org = await response.json()
    
    // 获取组织的热门仓库
    const reposResponse = await fetch(
      `${GITHUB_API}/orgs/${orgName}/repos?sort=stars&direction=desc&per_page=5`,
      {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    )
    
    const repos = await reposResponse.json()
    
    return {
      name: org.name || org.login,
      url: org.html_url,
      description: org.description,
      website: org.blog,
      email: org.email,
      location: org.location,
      followers: org.followers,
      publicRepos: org.public_repos,
      topRepos: repos.map((r: any) => ({
        name: r.name,
        url: r.html_url,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        forks: r.forks_count,
      })),
    }
  } catch (error) {
    console.error('GitHub org details error:', error)
    return null
  }
}

/**
 * 搜索特定技术的开发者
 */
export async function searchGitHubDevelopers(
  technologies: string[],
  location?: string,
  minFollowers: number = 50
): Promise<GitHubUser[]> {
  const query = [
    technologies.join('+'),
    location ? `location:${location}` : '',
    `followers:>${minFollowers}`,
  ].filter(Boolean).join('+')
  
  const url = `${GITHUB_API}/search/users?q=${query}&per_page=20`
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    })
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    
    // 获取用户详情
    const users = await Promise.all(
      data.items.map(async (user: any) => {
        return await getUserDetails(user.login)
      })
    )
    
    return users.filter(Boolean) as GitHubUser[]
  } catch (error) {
    console.error('GitHub developer search error:', error)
    return []
  }
}

/**
 * 获取用户详情
 */
async function getUserDetails(login: string): Promise<GitHubUser | null> {
  try {
    const response = await fetch(`${GITHUB_API}/users/${login}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    })
    
    if (!response.ok) {
      return null
    }
    
    const user = await response.json()
    
    return {
      login: user.login,
      name: user.name,
      email: user.email,
      blog: user.blog,
      company: user.company,
      location: user.location,
      bio: user.bio,
      followers: user.followers,
      publicRepos: user.public_repos,
    }
  } catch (error) {
    console.error('GitHub user details error:', error)
    return null
  }
}

/**
 * 通过仓库查找公司
 */
export async function findCompanyByRepo(
  repoUrl: string
): Promise<GitHubCompany | null> {
  try {
    // 解析 GitHub 仓库 URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!match) {
      return null
    }
    
    const [, owner, repo] = match
    
    // 检查是组织还是个人
    const response = await fetch(`${GITHUB_API}/orgs/${owner}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    })
    
    if (response.ok) {
      return await getOrganizationDetails(owner)
    }
    
    // 如果是个人，尝试找其公司
    const userResponse = await fetch(`${GITHUB_API}/users/${owner}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
      },
    })
    
    if (userResponse.ok) {
      const user = await userResponse.json()
      if (user.company) {
        // 尝试找到公司
        return await getOrganizationDetails(user.company.replace(/\s+/g, '-'))
      }
    }
    
    return null
  } catch (error) {
    console.error('Find company by repo error:', error)
    return null
  }
}

/**
 * 生成 GitHub 搜索链接（供用户手动访问）
 */
export function generateGitHubSearchUrl(
  technologies: string[],
  type: 'org' | 'user' = 'org'
): string {
  const query = technologies.join('+')
  return `https://github.com/search?q=${query}+type:${type}&type=users`
}
