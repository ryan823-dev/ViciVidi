/**
 * Product Hunt 新产品发现服务
 * 
 * 获取每日/每周新产品
 * 找到创始人和联系方式
 */

const PRODUCT_HUNT_API = 'https://api.producthunt.com/v2/api/graphql'

export interface ProductHuntProduct {
  id: string
  name: string
  tagline: string
  url: string
  website?: string
  createdAt: string
  votesCount: number
  commentsCount: number
  makers?: Maker[]
  topics?: Topic[]
  thumbnail?: string
}

export interface Maker {
  id: string
  name: string
  username: string
  headline?: string
  profileUrl: string
  twitterUsername?: string
  websiteUrl?: string
}

export interface Topic {
  id: string
  name: string
  slug: string
}

/**
 * 获取今日产品
 */
export async function getTodaysProducts(): Promise<ProductHuntProduct[]> {
  const query = `
    query {
      posts(order: RANKING, topic: "all") {
        edges {
          node {
            id
            name
            tagline
            url
            website
            createdAt
            votesCount
            commentsCount
            thumbnail {
              url
            }
            topics {
              edges {
                node {
                  id
                  name
                  slug
                }
              }
            }
            user {
              id
              name
              username
              headline
              profileUrl
              twitterUsername
              websiteUrl
            }
            makers {
              edges {
                node {
                  id
                  name
                  username
                  headline
                  profileUrl
                  twitterUsername
                  websiteUrl
                }
              }
            }
          }
        }
      }
    }
  `
  
  try {
    const response = await fetch(PRODUCT_HUNT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
    
    if (!response.ok) {
      console.error('Product Hunt API error:', response.status)
      return []
    }
    
    const data = await response.json()
    
    if (data.errors) {
      console.error('Product Hunt GraphQL errors:', data.errors)
      return []
    }
    
    return data.data.posts.edges.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name,
      tagline: edge.node.tagline,
      url: edge.node.url,
      website: edge.node.website,
      createdAt: edge.node.createdAt,
      votesCount: edge.node.votesCount,
      commentsCount: edge.node.commentsCount,
      thumbnail: edge.node.thumbnail?.url,
      topics: edge.node.topics.edges.map((e: any) => e.node),
      makers: edge.node.makers?.edges.map((e: any) => ({
        id: e.node.id,
        name: e.node.name,
        username: e.node.username,
        headline: e.node.headline,
        profileUrl: e.node.profileUrl,
        twitterUsername: e.node.twitterUsername,
        websiteUrl: e.node.websiteUrl,
      })),
    }))
  } catch (error) {
    console.error('Product Hunt fetch error:', error)
    return []
  }
}

/**
 * 获取指定主题的产品
 */
export async function getProductsByTopic(
  topic: string,
  limit: number = 20
): Promise<ProductHuntProduct[]> {
  const query = `
    query {
      posts(order: RANKING, topic: "${topic}") {
        edges {
          node {
            id
            name
            tagline
            url
            website
            createdAt
            votesCount
            user {
              id
              name
              username
              headline
              profileUrl
              twitterUsername
              websiteUrl
            }
            makers {
              edges {
                node {
                  id
                  name
                  username
                  headline
                  profileUrl
                  twitterUsername
                  websiteUrl
                }
              }
            }
          }
        }
      }
    }
  `
  
  try {
    const response = await fetch(PRODUCT_HUNT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    
    if (data.errors) {
      return []
    }
    
    return data.data.posts.edges
      .slice(0, limit)
      .map((edge: any) => ({
        id: edge.node.id,
        name: edge.node.name,
        tagline: edge.node.tagline,
        url: edge.node.url,
        website: edge.node.website,
        createdAt: edge.node.createdAt,
        votesCount: edge.node.votesCount,
        topics: [],
        makers: edge.node.makers?.edges.map((e: any) => ({
          id: e.node.id,
          name: e.node.name,
          username: e.node.username,
          headline: e.node.headline,
          profileUrl: e.node.profileUrl,
          twitterUsername: e.node.twitterUsername,
          websiteUrl: e.node.websiteUrl,
        })),
      }))
  } catch (error) {
    console.error('Product Hunt topic fetch error:', error)
    return []
  }
}

/**
 * 搜索产品
 */
export async function searchProducts(
  keywords: string
): Promise<ProductHuntProduct[]> {
  const query = `
    query {
      searchPosts(query: "${keywords}") {
        edges {
          node {
            id
            name
            tagline
            url
            website
            createdAt
            votesCount
            user {
              id
              name
              username
              headline
              profileUrl
              twitterUsername
              websiteUrl
            }
          }
        }
      }
    }
  `
  
  try {
    const response = await fetch(PRODUCT_HUNT_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    })
    
    if (!response.ok) {
      return []
    }
    
    const data = await response.json()
    
    if (data.errors) {
      return []
    }
    
    return data.data.searchPosts.edges.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name,
      tagline: edge.node.tagline,
      url: edge.node.url,
      website: edge.node.website,
      createdAt: edge.node.createdAt,
      votesCount: edge.node.votesCount,
      makers: [{
        id: edge.node.user.id,
        name: edge.node.user.name,
        username: edge.node.user.username,
        headline: edge.node.user.headline,
        profileUrl: edge.node.user.profileUrl,
        twitterUsername: edge.node.user.twitterUsername,
        websiteUrl: edge.node.user.websiteUrl,
      }],
    }))
  } catch (error) {
    console.error('Product Hunt search error:', error)
    return []
  }
}

/**
 * 生成 Product Hunt 链接
 */
export function generateProductHuntUrl(
  topic?: string
): string {
  if (topic) {
    return `https://www.producthunt.com/topics/${topic}`
  }
  return 'https://www.producthunt.com/'
}
