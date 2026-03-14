import { prisma } from './db'

export async function getWorkspaceMember(userId: string, workspaceId: string) {
  try {
    const members: any[] = await prisma.$queryRaw`
      SELECT * FROM workspace_members
      WHERE user_id = ${userId} AND workspace_id = ${workspaceId}
      LIMIT 1
    `
    return members[0] || null
  } catch (error) {
    console.error('获取工作空间成员失败:', error)
    return null
  }
}
