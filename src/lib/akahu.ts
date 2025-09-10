import axios from 'axios'

interface AkahuTransaction {
  _id: string
  _account: string
  created_at: string
  date: string
  description: string
  amount: number
  balance: number
  type: string
}

interface AkahuAccount {
  _id: string
  name: string
  type: string
  attributes: {
    account_number?: string
    account_name?: string
  }
}

export class AkahuService {
  private appToken: string
  private userToken: string
  private baseUrl = 'https://api.akahu.io/v1'

  constructor(appToken: string, userToken: string) {
    this.appToken = appToken.trim().replace(/[\r\n\t]/g, '')
    this.userToken = userToken.trim().replace(/[\r\n\t]/g, '')
  }

  private getHeaders() {
    // Clean tokens to ensure they're safe for HTTP headers
    const cleanUserToken = this.userToken.trim().replace(/[\r\n\t]/g, '')
    const cleanAppToken = this.appToken.trim().replace(/[\r\n\t]/g, '')
    
    return {
      'Authorization': `Bearer ${cleanUserToken}`,
      'X-Akahu-ID': cleanAppToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'RentLite/1.0'
    }
  }

  async getAccounts(): Promise<AkahuAccount[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/accounts`, {
        headers: this.getHeaders(),
        timeout: 10000, // 10 second timeout
      })
      return response.data.items || []
    } catch (error) {
      console.error('Error fetching Akahu accounts:', error)
      if (axios.isAxiosError(error)) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          throw new Error('Cannot connect to Akahu API. This may be due to network restrictions on the hosting platform.')
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid Akahu tokens. Please check your App Token and User Token.')
        }
        if (error.response?.status === 403) {
          throw new Error('Access forbidden. Please check your Akahu token permissions.')
        }
      }
      throw new Error('Failed to fetch accounts from Akahu')
    }
  }

  async getTransactions(
    accountId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AkahuTransaction[]> {
    try {
      const params = new URLSearchParams({
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      })

      const response = await axios.get(
        `${this.baseUrl}/accounts/${accountId}/transactions?${params}`,
        {
          headers: this.getHeaders(),
          timeout: 15000, // 15 second timeout for transactions
        }
      )
      return response.data.items || []
    } catch (error) {
      console.error('Error fetching Akahu transactions:', error)
      if (axios.isAxiosError(error)) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          throw new Error('Cannot connect to Akahu API. This may be due to network restrictions on the hosting platform.')
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid Akahu tokens. Please check your App Token and User Token.')
        }
        if (error.response?.status === 403) {
          throw new Error('Access forbidden. Please check your Akahu token permissions.')
        }
      }
      throw new Error('Failed to fetch transactions from Akahu')
    }
  }

  async checkRentPayment(
    keyword: string,
    expectedDate: Date,
    searchWindowDays = 7
  ): Promise<{ found: boolean; transaction?: AkahuTransaction; amount?: number }> {
    try {
      const accounts = await this.getAccounts()
      
      const startDate = new Date(expectedDate)
      startDate.setDate(startDate.getDate() - searchWindowDays)
      
      const endDate = new Date(expectedDate)
      endDate.setDate(endDate.getDate() + searchWindowDays)

      for (const account of accounts) {
        const transactions = await this.getTransactions(account._id, startDate, endDate)
        
        const matchingTransaction = transactions.find(transaction => 
          transaction.description.toLowerCase().includes(keyword.toLowerCase()) &&
          transaction.amount > 0 // Only incoming payments
        )

        if (matchingTransaction) {
          return {
            found: true,
            transaction: matchingTransaction,
            amount: matchingTransaction.amount
          }
        }
      }

      return { found: false }
    } catch (error) {
      console.error('Error checking rent payment:', error)
      throw error
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getAccounts()
      return true
    } catch {
      return false
    }
  }
}

import { prisma } from './prisma'

export async function createAkahuService(userId: string): Promise<AkahuService | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        akahuAppToken: true,
        akahuUserToken: true,
      }
    })

    if (!user?.akahuAppToken || !user?.akahuUserToken) {
      return null
    }

    return new AkahuService(user.akahuAppToken, user.akahuUserToken)
  } catch (error) {
    console.error('Error creating Akahu service:', error)
    return null
  }
}