import { supabase } from './supabaseClient'

class TransactionManager {
  constructor() {
    this.maxRetries = 3
    this.retryDelay = 2000 // 2 seconds
  }

  generateTransactionId() {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async logTransaction(transactionId, operationType, status, errorMessage = null, operationData = null) {
    try {
      const { error } = await supabase
        .from('transaction_logs')
        .insert([{
          transaction_id: transactionId,
          operation_type: operationType,
          status: status,
          error_message: errorMessage,
          operation_data: operationData
        }])

      if (error) throw error
    } catch (error) {
      console.error('Failed to log transaction:', error)
    }
  }

  async updateTransactionStatus(transactionId, status, errorMessage = null, attemptCount = 1) {
    try {
      const { error } = await supabase
        .from('transaction_logs')
        .update({
          status,
          error_message: errorMessage,
          attempt_count: attemptCount,
          last_attempt: new Date().toISOString()
        })
        .eq('transaction_id', transactionId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to update transaction status:', error)
    }
  }

  async executeWithRetry(operation, operationType, operationData = null) {
    const transactionId = this.generateTransactionId()
    let lastError = null

    // Log initial transaction attempt
    await this.logTransaction(transactionId, operationType, 'started', null, operationData)

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Execute the operation
        const result = await operation()

        // Log successful transaction
        await this.updateTransactionStatus(transactionId, 'completed', null, attempt)
        return result
      } catch (error) {
        lastError = error

        // Log failed attempt
        await this.updateTransactionStatus(
          transactionId,
          'failed',
          error.message,
          attempt
        )

        // If this is the last attempt, mark as unresolved
        if (attempt === this.maxRetries) {
          await this.updateTransactionStatus(
            transactionId,
            'unresolved',
            error.message,
            attempt
          )
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }

  async resolveTransaction(transactionId, resolution) {
    try {
      const { error } = await supabase
        .from('transaction_logs')
        .update({
          status: 'resolved',
          resolved: true,
          error_message: resolution
        })
        .eq('transaction_id', transactionId)

      if (error) throw error
    } catch (error) {
      console.error('Failed to resolve transaction:', error)
    }
  }

  async getUnresolvedTransactions() {
    try {
      const { data, error } = await supabase
        .from('transaction_logs')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to fetch unresolved transactions:', error)
      return []
    }
  }
}

export const transactionManager = new TransactionManager() 