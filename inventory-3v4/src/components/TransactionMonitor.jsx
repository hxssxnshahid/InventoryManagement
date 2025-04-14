import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Typography,
  Box,
  IconButton,
  Tooltip,
  TextField
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import RetryIcon from '@mui/icons-material/Replay'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import { transactionManager } from '../lib/transactionManager'

const TransactionMonitor = ({ open, onClose }) => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [resolution, setResolution] = useState('')
  const [isResolving, setIsResolving] = useState(false)

  const fetchTransactions = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await transactionManager.getUnresolvedTransactions()
      setTransactions(data)
    } catch (err) {
      setError('Failed to fetch transactions: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchTransactions()
    }
  }, [open])

  const handleRetry = async (transaction) => {
    try {
      setLoading(true)
      await transactionManager.executeWithRetry(
        () => Promise.resolve(), // Placeholder for actual retry logic
        transaction.operation_type,
        transaction.operation_data
      )
      await fetchTransactions()
    } catch (err) {
      setError('Failed to retry transaction: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async () => {
    if (!selectedTransaction || !resolution) return

    setIsResolving(true)
    try {
      await transactionManager.resolveTransaction(selectedTransaction.transaction_id, resolution)
      setSelectedTransaction(null)
      setResolution('')
      await fetchTransactions()
    } catch (err) {
      setError('Failed to resolve transaction: ' + err.message)
    } finally {
      setIsResolving(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success.main'
      case 'failed':
        return 'error.main'
      case 'unresolved':
        return 'warning.main'
      default:
        return 'text.primary'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '12px' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Transaction Monitor</Typography>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchTransactions} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : transactions.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No Unresolved Transactions
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: '8px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Transaction ID</TableCell>
                  <TableCell>Operation Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Attempts</TableCell>
                  <TableCell>Last Attempt</TableCell>
                  <TableCell>Error Message</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{transaction.transaction_id}</TableCell>
                    <TableCell>{transaction.operation_type}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {transaction.status === 'completed' ? (
                          <CheckCircleIcon color="success" />
                        ) : transaction.status === 'failed' ? (
                          <ErrorIcon color="error" />
                        ) : (
                          <ErrorIcon color="warning" />
                        )}
                        <Typography color={getStatusColor(transaction.status)}>
                          {transaction.status}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{transaction.attempt_count}</TableCell>
                    <TableCell>{formatDate(transaction.last_attempt)}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {transaction.error_message || 'No error message'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Retry">
                          <IconButton
                            size="small"
                            onClick={() => handleRetry(transaction)}
                            disabled={loading}
                          >
                            <RetryIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Resolve">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedTransaction(transaction)}
                            disabled={loading}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Resolution Dialog */}
      <Dialog
        open={!!selectedTransaction}
        onClose={() => {
          setSelectedTransaction(null)
          setResolution('')
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <DialogTitle>Resolve Transaction</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Transaction ID: {selectedTransaction?.transaction_id}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Operation Type: {selectedTransaction?.operation_type}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Error Message: {selectedTransaction?.error_message}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Resolution Details"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              multiline
              rows={4}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSelectedTransaction(null)
              setResolution('')
            }}
            disabled={isResolving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResolve}
            variant="contained"
            color="primary"
            disabled={isResolving || !resolution}
            startIcon={isResolving ? <CircularProgress size={20} /> : null}
          >
            {isResolving ? 'Resolving...' : 'Resolve'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  )
}

export default TransactionMonitor 