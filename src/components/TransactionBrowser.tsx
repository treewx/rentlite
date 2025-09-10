'use client'

import { useState, useEffect } from 'react'
import { Search, Calendar, DollarSign, Check, X } from 'lucide-react'

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  accountId: string
  accountName: string
  suggestedKeywords: string[]
}

interface Account {
  id: string
  name: string
  type: string
  accountNumber: string
}

interface TransactionBrowserProps {
  onSelectTransaction: (transaction: Transaction, keyword: string) => void
  onCancel: () => void
  prefilledAmount?: number
}

export default function TransactionBrowser({ 
  onSelectTransaction, 
  onCancel, 
  prefilledAmount 
}: TransactionBrowserProps) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [minAmount, setMinAmount] = useState(prefilledAmount || 100)
  const [days, setDays] = useState(90)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [selectedKeyword, setSelectedKeyword] = useState('')

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    if (selectedAccount) {
      loadTransactions()
    }
  }, [selectedAccount, searchTerm, minAmount, days])

  const loadAccounts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/transactions/browse')
      const data = await response.json()
      
      if (data.success) {
        setAccounts(data.accounts)
        if (data.accounts.length === 1) {
          setSelectedAccount(data.accounts[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading accounts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTransactions = async () => {
    if (!selectedAccount) return

    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        accountId: selectedAccount,
        days: days.toString(),
        minAmount: minAmount.toString(),
        search: searchTerm
      })

      const response = await fetch(`/api/transactions/browse?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setTransactions(data.transactions)
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setSelectedKeyword(transaction.suggestedKeywords[0] || '')
  }

  const handleConfirmSelection = () => {
    if (selectedTransaction && selectedKeyword) {
      onSelectTransaction(selectedTransaction, selectedKeyword)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Select Rent Payment Transaction
            </h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            Browse your recent transactions and select the rent payment to automatically set the keyword
          </p>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="input-field"
              >
                <option value="">Select account...</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.accountNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Amount</label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(Number(e.target.value))}
                className="input-field"
                placeholder="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Days</label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="input-field"
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
                <option value={180}>180 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
                placeholder="Search transactions..."
              />
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">
                {selectedAccount ? 'No transactions found matching your criteria' : 'Please select an account'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map(transaction => (
                <div
                  key={transaction.id}
                  onClick={() => handleSelectTransaction(transaction)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTransaction?.id === transaction.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm text-gray-500">{formatDate(transaction.date)}</span>
                        <span className="text-lg font-semibold text-green-600">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 mb-2">{transaction.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {transaction.suggestedKeywords.slice(0, 4).map((keyword, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                    {selectedTransaction?.id === transaction.id && (
                      <Check className="h-5 w-5 text-primary-600 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selection Confirmation */}
        {selectedTransaction && (
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Selection</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Selected transaction:</p>
              <p className="font-medium">{selectedTransaction.description}</p>
              <p className="text-sm text-gray-600">
                {formatDate(selectedTransaction.date)} - {formatCurrency(selectedTransaction.amount)}
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose keyword for matching future payments:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {selectedTransaction.suggestedKeywords.map((keyword, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedKeyword(keyword)}
                    className={`p-2 text-sm border rounded ${
                      selectedKeyword === keyword
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {keyword}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={selectedKeyword}
                onChange={(e) => setSelectedKeyword(e.target.value)}
                className="input-field mt-2"
                placeholder="Or enter custom keyword..."
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button onClick={onCancel} className="btn-secondary">
                Cancel
              </button>
              <button 
                onClick={handleConfirmSelection}
                disabled={!selectedKeyword}
                className="btn-primary disabled:opacity-50"
              >
                Use This Transaction
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}