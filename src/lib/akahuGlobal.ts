import axios from 'axios'
import https from 'https'

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

export class AkahuGlobalService {
  private appToken: string
  private userToken: string
  private baseUrl = 'https://api.akahu.io/v1'

  constructor() {
    this.appToken = (process.env.AKAHU_APP_TOKEN || '').trim().replace(/[\r\n\t]/g, '')
    this.userToken = (process.env.AKAHU_USER_TOKEN || '').trim().replace(/[\r\n\t]/g, '')
    
    // Add Railway environment variable for debugging
    console.log('Railway Environment Info:', {
      nodeEnv: process.env.NODE_ENV,
      railwayEnv: process.env.RAILWAY_ENVIRONMENT,
      railwayRegion: process.env.RAILWAY_REGION,
      hasTokens: !!(this.appToken && this.userToken),
      appTokenLength: this.appToken.length,
      userTokenLength: this.userToken.length,
      appTokenValid: this.appToken.length > 10,
      userTokenValid: this.userToken.length > 20,
    })
    
    // Additional token validation
    if (this.appToken && this.userToken) {
      console.log('Token format validation:', {
        appTokenStartsWithExpected: this.appToken.startsWith('app_'),
        userTokenStartsWithExpected: this.userToken.startsWith('user_'),
        appTokenHasValidChars: /^[a-zA-Z0-9_-]+$/.test(this.appToken),
        userTokenHasValidChars: /^[a-zA-Z0-9_-]+$/.test(this.userToken),
      })
    }
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

  isConfigured(): boolean {
    return !!(this.appToken && this.userToken)
  }

  async getAccounts(): Promise<AkahuAccount[]> {
    try {
      // Create HTTPS agent for Railway SSL issues
      const httpsAgent = process.env.NODE_ENV === 'production' && process.env.RAILWAY_ENVIRONMENT 
        ? new https.Agent({ rejectUnauthorized: false }) 
        : undefined

      const headers = this.getHeaders()
      console.log('Making Akahu API request with headers:', {
        url: `${this.baseUrl}/accounts`,
        hasAuth: !!headers['Authorization'],
        hasAkahuId: !!headers['X-Akahu-ID'],
        authLength: headers['Authorization']?.length || 0,
        akahuIdLength: headers['X-Akahu-ID']?.length || 0,
        authPrefix: headers['Authorization']?.substring(0, 20) + '...',
        akahuIdPrefix: headers['X-Akahu-ID']?.substring(0, 10) + '...',
      })

      const response = await axios.get(`${this.baseUrl}/accounts`, {
        headers,
        timeout: 10000,
        httpsAgent,
      })
      return response.data.items || []
    } catch (error) {
      console.error('Error fetching Akahu accounts:', error)
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
        })
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          throw new Error('Cannot connect to Akahu API. This may be due to network restrictions on the hosting platform.')
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid Akahu tokens in environment variables.')
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

      // Create HTTPS agent for Railway SSL issues
      const httpsAgent = process.env.NODE_ENV === 'production' && process.env.RAILWAY_ENVIRONMENT 
        ? new https.Agent({ rejectUnauthorized: false }) 
        : undefined

      const response = await axios.get(
        `${this.baseUrl}/accounts/${accountId}/transactions?${params}`,
        {
          headers: this.getHeaders(),
          timeout: 15000,
          httpsAgent,
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
          throw new Error('Invalid Akahu tokens in environment variables.')
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
          transaction.amount > 0
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

export const akahuGlobal = new AkahuGlobalService()