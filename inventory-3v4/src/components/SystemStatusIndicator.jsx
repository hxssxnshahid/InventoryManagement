import React, { useState, useEffect } from 'react'
import { 
  IconButton, 
  Tooltip, 
  Box, 
  Typography, 
  Paper,
  CircularProgress
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ErrorIcon from '@mui/icons-material/Error'
import { supabase } from '../lib/supabaseClient'

const SystemStatusIndicator = () => {
  const [status, setStatus] = useState({
    database: false,
    loading: true
  })

  const checkConnections = async () => {
    try {
      // Simple health check query
      const { data, error } = await supabase
        .from('orders')
        .select('count')
        .limit(1)
        .single()

      setStatus({
        database: !error,
        loading: false
      })
    } catch (error) {
      console.error('Error checking system status:', error)
      setStatus({
        database: false,
        loading: false
      })
    }
  }

  useEffect(() => {
    checkConnections()
    // Set up periodic checks every 30 seconds
    const interval = setInterval(checkConnections, 30000)
    return () => clearInterval(interval)
  }, [])

  const StatusTooltip = (
    <Paper sx={{ p: 2, maxWidth: 300 }}>
      <Typography variant="subtitle2" gutterBottom>
        System Status
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon 
            color={status.database ? 'success' : 'error'} 
            fontSize="small"
          />
          <Typography variant="body2">
            Database: {status.database ? 'Connected' : 'Disconnected'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  )

  return (
    <Tooltip 
      title={StatusTooltip} 
      arrow 
      placement="bottom-start"
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'transparent',
            '& .MuiTooltip-arrow': {
              color: 'transparent'
            }
          }
        }
      }}
    >
      <IconButton 
        sx={{ 
          position: 'fixed', 
          top: 16, 
          left: 16, 
          zIndex: 1200,
          backgroundColor: 'white',
          boxShadow: 2,
          border: '1px solid black',
          '&:hover': {
            backgroundColor: 'white',
            boxShadow: 4
          }
        }}
      >
        {status.loading ? (
          <CircularProgress size={24} />
        ) : status.database ? (
          <CheckCircleIcon color="success" />
        ) : (
          <ErrorIcon color="error" />
        )}
      </IconButton>
    </Tooltip>
  )
}

export default SystemStatusIndicator 