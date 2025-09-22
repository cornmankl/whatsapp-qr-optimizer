import { db } from '../src/lib/db'

async function createDefaultUser() {
  try {
    const user = await db.user.create({
      data: {
        email: 'default@example.com',
        name: 'Default User'
      }
    })
    console.log('Default user created:', user)
  } catch (error) {
    console.error('Error creating default user:', error)
  }
}

createDefaultUser()