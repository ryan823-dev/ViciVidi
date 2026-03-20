import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Setting admin role for congrenmao799@gmail.com...')
  
  // Update or set admin role
  const adminUser = await prisma.user.updateMany({
    where: { email: 'congrenmao799@gmail.com' },
    data: { role: 'admin' },
  })
  
  console.log('Updated admin user:', adminUser.count, 'row(s)')
  
  // Verify the update
  const user = await prisma.user.findUnique({
    where: { email: 'congrenmao799@gmail.com' },
    select: { email: true, role: true, name: true },
  })
  
  if (user) {
    console.log('✓ Admin user verified:')
    console.log('  Email:', user.email)
    console.log('  Role:', user.role)
    console.log('  Name:', user.name)
  } else {
    console.log('⚠ User not found. The user needs to log in first to create the account.')
  }
  
  console.log('\n✓ Database migration completed!')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
