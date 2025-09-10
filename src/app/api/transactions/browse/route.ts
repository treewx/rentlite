import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { akahuGlobal } from '@/lib/akahuGlobal'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!akahuGlobal.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Akahu not configured',
        message: 'Please configure Akahu tokens in environment variables'
      })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const days = parseInt(searchParams.get('days') || '90') // Default to 90 days
    const minAmount = parseFloat(searchParams.get('minAmount') || '0')
    const searchTerm = searchParams.get('search') || ''

    // Get accounts first
    const accounts = await akahuGlobal.getAccounts()
    
    if (accounts.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No accounts found',
        message: 'No bank accounts are accessible with current Akahu configuration'
      })
    }

    let transactionsData = []

    // If specific account requested, get transactions for that account
    if (accountId) {
      const account = accounts.find(acc => acc._id === accountId)
      if (!account) {
        return NextResponse.json({
          success: false,
          error: 'Account not found'
        })
      }

      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - days)

      const transactions = await akahuGlobal.getTransactions(accountId, startDate, endDate)
      
      // Filter transactions
      const filteredTransactions = transactions
        .filter(t => t.amount >= minAmount) // Only positive amounts (incoming)
        .filter(t => searchTerm === '' || t.description.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Most recent first
        .slice(0, 100) // Limit to 100 transactions

      transactionsData = filteredTransactions.map(t => ({
        id: t._id,
        date: t.date,
        description: t.description,
        amount: t.amount,
        accountId: t._account,
        accountName: account.name,
        suggestedKeywords: extractKeywords(t.description)
      }))
    }

    return NextResponse.json({
      success: true,
      accounts: accounts.map(acc => ({
        id: acc._id,
        name: acc.name,
        type: acc.type,
        accountNumber: acc.attributes?.account_number || 'N/A'
      })),
      transactions: transactionsData,
      searchParams: {
        accountId,
        days,
        minAmount,
        searchTerm
      }
    })

  } catch (error) {
    console.error('Error browsing transactions:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to suggest keywords from transaction description
function extractKeywords(description: string): string[] {
  const keywords = []
  const desc = description.toUpperCase()
  
  // Split by common separators and filter meaningful words
  const words = desc.split(/[\s\-_.,;:|\/\\]+/)
    .filter(word => word.length >= 3)
    .filter(word => !['THE', 'AND', 'FOR', 'FROM', 'WITH', 'THIS', 'THAT', 'ARE', 'WAS'].includes(word))

  // Add individual meaningful words
  keywords.push(...words.slice(0, 5))
  
  // Add combinations for better matching
  if (words.length >= 2) {
    keywords.push(words.slice(0, 2).join(' '))
  }
  if (words.length >= 3) {
    keywords.push(words.slice(0, 3).join(' '))
  }

  // Remove duplicates and return
  return [...new Set(keywords)].slice(0, 8)
}