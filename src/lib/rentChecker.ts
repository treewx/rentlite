import { prisma } from './prisma'
import { createAkahuService } from './akahu'
import { sendRentNotification } from './email'

export interface RentCheckResult {
  propertyId: string
  address: string
  tenantName: string
  rentReceived: boolean
  amount?: number
  error?: string
}

export async function checkRentForProperty(propertyId: string): Promise<RentCheckResult> {
  try {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { user: true }
    })

    if (!property) {
      throw new Error('Property not found')
    }

    const akahuService = await createAkahuService(property.userId)
    if (!akahuService) {
      throw new Error('Akahu not configured for user')
    }

    const rentDueDate = calculateRentDueDate(property.rentDueDay, property.rentFrequency)
    
    const result = await akahuService.checkRentPayment(
      property.keywordMatch,
      rentDueDate
    )

    const rentCheck = await prisma.rentCheck.create({
      data: {
        propertyId: property.id,
        checkDate: new Date(),
        rentDueDate,
        rentReceived: result.found,
        amount: result.amount,
      }
    })

    await sendRentNotification(
      property.user.email!,
      property.notifyTenantOnMissed ? property.tenantEmail : null,
      property.address,
      property.tenantName,
      result.found,
      rentDueDate,
      property.notifyTenantOnMissed && !result.found
    )

    await prisma.rentCheck.update({
      where: { id: rentCheck.id },
      data: {
        landlordNotified: true,
        tenantNotified: property.notifyTenantOnMissed && !result.found,
      }
    })

    return {
      propertyId: property.id,
      address: property.address,
      tenantName: property.tenantName,
      rentReceived: result.found,
      amount: result.amount,
    }

  } catch (error) {
    console.error(`Error checking rent for property ${propertyId}:`, error)
    return {
      propertyId,
      address: 'Unknown',
      tenantName: 'Unknown',
      rentReceived: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function checkAllRentPayments(): Promise<RentCheckResult[]> {
  try {
    const properties = await prisma.property.findMany({
      include: { user: true }
    })

    const results: RentCheckResult[] = []

    for (const property of properties) {
      const rentDueDate = calculateRentDueDate(property.rentDueDay, property.rentFrequency)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      if (shouldCheckRent(rentDueDate, yesterday)) {
        const existingCheck = await prisma.rentCheck.findFirst({
          where: {
            propertyId: property.id,
            checkDate: {
              gte: yesterday,
            }
          }
        })

        if (!existingCheck) {
          const result = await checkRentForProperty(property.id)
          results.push(result)
        }
      }
    }

    return results

  } catch (error) {
    console.error('Error checking all rent payments:', error)
    return []
  }
}

function calculateRentDueDate(rentDueDay: number, frequency: string): Date {
  const today = new Date()
  let dueDate = new Date()

  switch (frequency) {
    case 'WEEKLY':
      const currentDayOfWeek = today.getDay() + 1 // Convert to 1-7 format
      const daysUntilDue = (rentDueDay - currentDayOfWeek + 7) % 7
      dueDate.setDate(today.getDate() + daysUntilDue)
      if (daysUntilDue === 0 && today.getHours() > 12) {
        dueDate.setDate(dueDate.getDate() + 7)
      }
      break

    case 'FORTNIGHTLY':
      const daysSinceLastSunday = today.getDay()
      const lastSunday = new Date(today)
      lastSunday.setDate(today.getDate() - daysSinceLastSunday)
      
      const weeksSinceEpoch = Math.floor((lastSunday.getTime() - new Date(1970, 0, 4).getTime()) / (7 * 24 * 60 * 60 * 1000))
      const isRentWeek = weeksSinceEpoch % 2 === 0
      
      const currentDayOfWeekFortnightly = today.getDay() + 1
      let daysUntilDueFortnightly = (rentDueDay - currentDayOfWeekFortnightly + 7) % 7
      
      if (!isRentWeek || (daysUntilDueFortnightly === 0 && today.getHours() > 12)) {
        daysUntilDueFortnightly += 7
      }
      
      dueDate.setDate(today.getDate() + daysUntilDueFortnightly)
      break

    case 'MONTHLY':
      dueDate.setDate(rentDueDay)
      if (dueDate <= today) {
        dueDate.setMonth(dueDate.getMonth() + 1)
      }
      break
  }

  dueDate.setHours(0, 0, 0, 0)
  return dueDate
}

function shouldCheckRent(rentDueDate: Date, checkDate: Date): boolean {
  const dayAfterDue = new Date(rentDueDate)
  dayAfterDue.setDate(dayAfterDue.getDate() + 1)
  
  return checkDate.toDateString() === dayAfterDue.toDateString()
}

export function getNextRentDueDate(rentDueDay: number, frequency: string): Date {
  return calculateRentDueDate(rentDueDay, frequency)
}