import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
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
  CardContent
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'

function BillsView() {
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBill, setSelectedBill] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)

  useEffect(() => {
    fetchBills()
  }, [])

  async function fetchBills() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('bill_id, customer_first_name, customer_last_name, customer_phone, order_date, comments')
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
        .select('bill_id, item_category, item_name, article_number, quantity_dozens')
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
          <TableContainer sx={{ borderRadius: '8px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {['Bill ID', 'First Name', 'Last Name', 'Phone', 'Order Date', 'Actions'].map((header, index, array) => (
                    <TableCell 
                      key={header}
                      sx={{ 
                        backgroundColor: '#f5f5f5',
                        fontWeight: 600,
                        color: '#1976d2',
                        ...(index === 0 && { borderTopLeftRadius: '8px' }),
                        ...(index === array.length - 1 && { borderTopRightRadius: '8px' })
                      }}
                    >
                      {header}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills.map((bill) => (
                    <TableRow key={bill.bill_id}>
                      <TableCell>{bill.bill_id}</TableCell>
                      <TableCell>{bill.customer_first_name}</TableCell>
                      <TableCell>{bill.customer_last_name}</TableCell>
                      <TableCell>{bill.customer_phone}</TableCell>
                      <TableCell>{new Date(bill.order_date).toLocaleDateString()}</TableCell>
                      <TableCell>
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
              <TableContainer component={Paper} sx={{ borderRadius: '8px' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      {['Category', 'Item Name', 'Article Number', 'Quantity (Dozens)'].map((header, index, array) => (
                        <TableCell 
                          key={header}
                          sx={{ 
                            backgroundColor: '#f5f5f5',
                            fontWeight: 600,
                            color: '#1976d2',
                            ...(index === 0 && { borderTopLeftRadius: '8px' }),
                            ...(index === array.length - 1 && { borderTopRightRadius: '8px' })
                          }}
                        >
                          {header}
                        </TableCell>
                      ))}
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
          <Button 
            onClick={() => setOpenDetailsDialog(false)}
            sx={{ 
              borderRadius: '8px',
              '&:hover': { 
                boxShadow: 2 
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default BillsView 