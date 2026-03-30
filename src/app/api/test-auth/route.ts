import { NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    console.log('[test-auth] 收到登录请求:', { email, password: '***' });
    
    // 检查环境变量
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    const hasJwtSecret = !!process.env.JWT_SECRET;
    
    console.log('[test-auth] 环境变量:', {
      hasDatabaseUrl,
      hasJwtSecret,
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing',
    });
    
    if (!hasDatabaseUrl) {
      return NextResponse.json(
        { error: 'DATABASE_URL 未配置' },
        { status: 500 }
      );
    }
    
    // 连接数据库
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    
    const client = await pool.connect();
    try {
      // 查询用户
      const userResult = await client.query(
        'SELECT id, email, name, password, "tenantId", "roleId" FROM "User" WHERE email = $1',
        [email]
      );
      
      if (userResult.rows.length === 0) {
        console.log('[test-auth] 用户不存在:', email);
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 401 }
        );
      }
      
      const user = userResult.rows[0];
      console.log('[test-auth] 找到用户:', {
        id: user.id,
        email: user.email,
        hasPassword: !!user.password,
        passwordPrefix: user.password?.substring(0, 10),
      });
      
      // 验证密码
      const isValid = await bcrypt.compare(password, user.password);
      console.log('[test-auth] 密码验证:', isValid ? '成功' : '失败');
      
      if (!isValid) {
        return NextResponse.json(
          { error: '密码错误' },
          { status: 401 }
        );
      }
      
      // 查询租户和角色
      const [tenantResult, roleResult] = await Promise.all([
        client.query(
          'SELECT id, name, slug FROM "Tenant" WHERE id = $1',
          [user.tenantId]
        ),
        client.query(
          'SELECT id, name, "displayName", permissions FROM "Role" WHERE id = $1',
          [user.roleId]
        ),
      ]);
      
      const tenant = tenantResult.rows[0];
      const role = roleResult.rows[0];
      
      console.log('[test-auth] 登录成功');
      
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          tenantName: tenant?.name,
          tenantSlug: tenant?.slug,
          roleId: user.roleId,
          roleName: role?.name,
          permissions: role?.permissions,
        },
      });
      
    } finally {
      client.release();
      await pool.end();
    }
    
  } catch (error: any) {
    console.error('[test-auth] 错误:', error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
