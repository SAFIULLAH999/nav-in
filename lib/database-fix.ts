// Temporary script to fix database schema issues
import { prisma } from './prisma'

async function fixDatabaseIssues() {
  try {
    console.log('🔧 Checking and fixing database schema...')

    // List of columns that need to exist in the Job table
    const requiredJobColumns = [
      'companyName', 'skills', 'benefits', 'experience',
      'isRemote', 'applicationDeadline', 'views', 'applicationsCount'
    ]

    // Check each required column
    for (const column of requiredJobColumns) {
      try {
        await prisma.$queryRaw`SELECT ${column} FROM Job LIMIT 1`
        console.log(`✅ ${column} field exists`)
      } catch (error) {
        console.log(`❌ ${column} field missing, attempting to add...`)

        // Determine the appropriate default value based on column type
        let defaultValue = "'default_value'"
        let columnType = 'TEXT'

        switch (column) {
          case 'isRemote':
          case 'isActive':
            defaultValue = '0'
            columnType = 'INTEGER'
            break
          case 'views':
          case 'applicationsCount':
          case 'salaryMin':
          case 'salaryMax':
            defaultValue = '0'
            columnType = 'INTEGER'
            break
          case 'applicationDeadline':
            defaultValue = 'NULL'
            columnType = 'DATETIME'
            break
          default:
            defaultValue = "''"
            columnType = 'TEXT'
        }

        try {
          // Add the missing column
          await prisma.$queryRaw`ALTER TABLE Job ADD COLUMN ${column} ${columnType} DEFAULT ${defaultValue}`
          console.log(`✅ Added ${column} field successfully`)
        } catch (addError) {
          console.log(`❌ Failed to add ${column} field:`, addError instanceof Error ? addError.message : String(addError))
          // Try alternative syntax for SQLite
          try {
            await prisma.$queryRaw`ALTER TABLE Job ADD ${column} ${columnType} DEFAULT ${defaultValue}`
            console.log(`✅ Added ${column} field with alternative syntax`)
          } catch (altError) {
            console.log(`❌ Alternative syntax also failed for ${column}:`, altError instanceof Error ? altError.message : String(altError))
          }
        }
      }
    }

    // Check if we need to rename 'company' to 'companyName'
    try {
      await prisma.$queryRaw`SELECT company FROM Job LIMIT 1`
      console.log('✅ company field exists')

      // Check if companyName already exists
      try {
        await prisma.$queryRaw`SELECT companyName FROM Job LIMIT 1`
        console.log('✅ companyName field also exists')
      } catch {
        console.log('🔄 Renaming company field to companyName...')
        await prisma.$queryRaw`ALTER TABLE Job RENAME COLUMN company TO companyName`
        console.log('✅ Field renamed successfully')
      }
    } catch (companyError) {
      console.log('ℹ️ company field does not exist, will use companyName')
    }

    console.log('🎉 Database schema fix completed!')

  } catch (error) {
    console.error('❌ Error fixing database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixDatabaseIssues()