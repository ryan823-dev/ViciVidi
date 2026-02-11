import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, email, password, companyName } = await req.json();

    if (!name || !email || !password || !companyName) {
      return NextResponse.json(
        { error: "所有字段都是必填的" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 400 }
      );
    }

    // Get COMPANY_ADMIN role
    const role = await db.role.findUnique({
      where: { name: "COMPANY_ADMIN" },
    });
    if (!role) {
      return NextResponse.json(
        { error: "系统错误：角色未找到" },
        { status: 500 }
      );
    }

    // Create slug from company name
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
      .replace(/^-|-$/g, "")
      || `company-${Date.now()}`;

    // Check if slug is taken
    const existingTenant = await db.tenant.findUnique({ where: { slug } });
    const finalSlug = existingTenant ? `${slug}-${Date.now()}` : slug;

    // Create tenant and user in a transaction
    const hashedPassword = await hash(password, 10);

    const tenant = await db.tenant.create({
      data: {
        name: companyName,
        slug: finalSlug,
        plan: "free",
        status: "active",
      },
    });

    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        tenantId: tenant.id,
        roleId: role.id,
      },
    });

    // Create default content categories
    const defaultCategories = [
      { name: "Blog", slug: "blog", description: "博客文章", order: 0 },
      { name: "Buy Guide", slug: "buy-guide", description: "采购指南", order: 1 },
      { name: "Whitepaper", slug: "whitepaper", description: "白皮书", order: 2 },
    ];

    for (const cat of defaultCategories) {
      await db.contentCategory.create({
        data: { tenantId: tenant.id, ...cat },
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "注册失败，请重试" },
      { status: 500 }
    );
  }
}
