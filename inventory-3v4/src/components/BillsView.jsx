import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { transactionManager } from '../lib/transactionManager'
import { 
  Container, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  TextField, 
  Box,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Card,
  CardContent,
  Chip,
  Alert
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import UndoIcon from '@mui/icons-material/Undo'

function BillsView({ isVisible }) {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBill, setSelectedBill] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)
  const [isReturning, setIsReturning] = useState(false)
  const [openReturnDialog, setOpenReturnDialog] = useState(false)
  const [returnReason, setReturnReason] = useState('')
  const [returnError, setReturnError] = useState('')

  useEffect(() => {
    if (isVisible) {
      fetchBills()
    }
  }, [isVisible])

  async function fetchBills() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('bill_id, customer_first_name, customer_last_name, customer_phone, order_date, comments, status, return_date, return_reason')
        .order('order_date', { ascending: false })
      
      if (error) throw error
      setBills(data)
    } catch (error) {
      console.error('Error fetching bills:', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchOrderItems(billId) {
    setLoadingItems(true)
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('bill_id', billId)
      
      if (error) throw error
      setOrderItems(data)
    } catch (error) {
      console.error('Error fetching order items:', error.message)
    } finally {
      setLoadingItems(false)
    }
  }

  const handleViewDetails = async (bill) => {
    setSelectedBill(bill)
    await fetchOrderItems(bill.bill_id)
    setOpenDetailsDialog(true)
  }

  const handleReturnItems = () => {
    setOpenReturnDialog(true)
  }

  const handleConfirmReturn = async () => {
    setIsReturning(true)
    setReturnError('')

    try {
      const result = await transactionManager.executeWithRetry(
        async () => {
          // Update order status
          const { error: updateOrderError } = await supabase
            .from('orders')
            .update({
              status: 'cancelled',
              return_date: new Date().toISOString()
            })
            .eq('bill_id', selectedBill.bill_id)

          if (updateOrderError) {
            console.error('Order update error:', updateOrderError)
            throw updateOrderError
          }

          // Return quantities to inventory
          for (const item of orderItems) {
            console.log('Processing item:', item)
            
            // Get current inventory item
            const { data: inventoryItem, error: fetchError } = await supabase
              .from(item.item_table)
              .select('quantity_remaining_dozens, amount_sold_dozens')
              .eq('id', item.item_id)
              .single()

            if (fetchError) {
              console.error('Inventory fetch error:', fetchError)
              throw fetchError
            }

            console.log('Current inventory state:', inventoryItem)

            // Update inventory quantities
            const { error: updateInventoryError } = await supabase
              .from(item.item_table)
              .update({
                quantity_remaining_dozens: inventoryItem.quantity_remaining_dozens + item.quantity_dozens,
                amount_sold_dozens: inventoryItem.amount_sold_dozens - item.quantity_dozens
              })
              .eq('id', item.item_id)

            if (updateInventoryError) {
              console.error('Inventory update error:', updateInventoryError)
              throw updateInventoryError
            }
          }

          return { success: true }
        },
        'return_items',
        {
          billId: selectedBill.bill_id,
          items: orderItems.map(item => ({
            id: item.item_id,
            table: item.item_table,
            quantity: item.quantity_dozens
          }))
        }
      )

      if (result.success) {
        // Only update UI after successful transaction
        await fetchBills()
        setSelectedBill(prev => ({
          ...prev,
          status: 'cancelled',
          return_date: new Date().toISOString()
        }))
        setOpenReturnDialog(false)
      }

    } catch (error) {
      console.error('Error processing return:', error)
      setReturnError(`Failed to process return: ${error.message}. Please try again.`)
      // Refresh bills to ensure UI is in sync with database
      await fetchBills()
    } finally {
      setIsReturning(false)
    }
  }

  const filteredBills = bills.filter(bill => 
    bill.bill_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.customer_first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.customer_last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.customer_phone.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Container maxWidth="lg">
      <Card sx={{ mb: 3, boxShadow: 2, borderRadius: '12px' }}>
        <CardContent>
          <Typography variant="h4" component="h1" gutterBottom>
            Orders
          </Typography>
          <TextField
            label="Search by Bill ID, Customer Name, or Phone"
            variant="outlined"
            size="small"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                backgroundColor: 'white',
                '&:hover fieldset': {
                  borderColor: '#1976d2',
                },
              }
            }}
          />
        </CardContent>
      </Card>

      <Card sx={{ boxShadow: 2, borderRadius: '12px' }}>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Bill ID</TableCell>
                  <TableCell>First Name</TableCell>
                  <TableCell>Last Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Order Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills.map((bill) => (
                    <TableRow 
                      key={bill.bill_id}
                      sx={{
                        backgroundColor: bill.status === 'cancelled' ? 'rgba(0, 0, 0, 0.04)' : 'inherit'
                      }}
                    >
                      <TableCell>{bill.bill_id}</TableCell>
                      <TableCell>{bill.customer_first_name}</TableCell>
                      <TableCell>{bill.customer_last_name}</TableCell>
                      <TableCell>{bill.customer_phone}</TableCell>
                      <TableCell>{new Date(bill.order_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={bill.status === 'cancelled' ? 'Cancelled' : 'Active'}
                          color={bill.status === 'cancelled' ? 'error' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<VisibilityIcon />}
                            onClick={() => handleViewDetails(bill)}
                            sx={{ 
                              borderRadius: '8px',
                              '&:hover': { 
                                boxShadow: 2 
                              }
                            }}
                          >
                            View Details
                          </Button>
                          {bill.status !== 'cancelled' && (
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              startIcon={<UndoIcon />}
                              onClick={() => {
                                setSelectedBill(bill)
                                setOpenReturnDialog(true)
                              }}
                              sx={{ 
                                borderRadius: '8px',
                                '&:hover': { 
                                  boxShadow: 2 
                                }
                              }}
                            >
                              Return Items
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <DialogTitle>
          Order Details - Bill ID: {selectedBill?.bill_id}
          {selectedBill?.status === 'cancelled' && (
            <Chip 
              label="Cancelled"
              color="error"
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          {loadingItems ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Customer Information
                </Typography>
                <Typography>
                  Name: {selectedBill?.customer_first_name} {selectedBill?.customer_last_name}
                </Typography>
                <Typography>
                  Phone: {selectedBill?.customer_phone}
                </Typography>
                <Typography>
                  Date: {new Date(selectedBill?.order_date).toLocaleDateString()}
                </Typography>
                {selectedBill?.status === 'cancelled' && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" color="error" gutterBottom>
                      Return Information
                    </Typography>
                    <Typography>
                      Return Date: {new Date(selectedBill?.return_date).toLocaleDateString()}
                    </Typography>
                  </>
                )}
                {selectedBill?.comments && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" gutterBottom>
                      Comments
                    </Typography>
                    <Typography>
                      {selectedBill.comments}
                    </Typography>
                  </>
                )}
              </Box>

              <Typography variant="subtitle1" gutterBottom>
                Order Items
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell>Item Name</TableCell>
                      <TableCell>Article Number</TableCell>
                      <TableCell>Quantity (Dozens)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.item_category}</TableCell>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell>{item.article_number}</TableCell>
                        <TableCell>{item.quantity_dozens}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Return Confirmation Dialog */}
      <Dialog
        open={openReturnDialog}
        onClose={() => {
          if (!isReturning) {
            setOpenReturnDialog(false)
            setReturnError('')
          }
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <DialogTitle>
          Confirm Return - Bill ID: {selectedBill?.bill_id}
        </DialogTitle>
        <DialogContent>
          {returnError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
              {returnError}
            </Alert>
          )}
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to return all items from this bill? This action will:
          </Typography>
          <Box component="ul" sx={{ mb: 2 }}>
            <Typography component="li">Return all quantities to inventory</Typography>
            <Typography component="li">Mark the bill as cancelled</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setOpenReturnDialog(false)
              setReturnError('')
            }}
            disabled={isReturning}
            sx={{ 
              borderRadius: '8px',
              '&:hover': { 
                boxShadow: 2 
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmReturn}
            variant="contained"
            color="warning"
            disabled={isReturning}
            startIcon={isReturning ? <CircularProgress size={20} /> : <UndoIcon />}
            sx={{ 
              borderRadius: '8px',
              '&:hover': { 
                boxShadow: 4 
              }
            }}
          >
            {isReturning ? 'Processing...' : 'Confirm Return'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default BillsView 