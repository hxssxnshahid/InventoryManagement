import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import { transactionManager } from './lib/transactionManager'
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
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Box, 
  TextField, 
  Button, 
  IconButton, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Checkbox, 
  Tooltip, 
  Alert, 
  Badge, 
  Divider, 
  CircularProgress, 
  Tabs, 
  Tab,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Snackbar
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import CloseIcon from '@mui/icons-material/Close'
import ReceiptIcon from '@mui/icons-material/Receipt'
import InventoryIcon from '@mui/icons-material/Inventory'
import BillsView from './components/BillsView'
import VisibilityIcon from '@mui/icons-material/Visibility'
import EditIcon from '@mui/icons-material/Edit'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import ErrorIcon from '@mui/icons-material/Error'
import RefreshIcon from '@mui/icons-material/Refresh'
import TransactionMonitor from './components/TransactionMonitor'
import SystemStatusIndicator from './components/SystemStatusIndicator'

function App() {
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState('short_and_trousers')
  const [searchTerm, setSearchTerm] = useState('')
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [selectedItems, setSelectedItems] = useState([])
  const [formError, setFormError] = useState('')
  const [formItems, setFormItems] = useState([{
    item_category: '',
    item_name: '',
    article_number: '',
    carton_number: '',
    quantity_remaining_dozens: '',
    supplier: 'Unknown Supplier'
  }])
  const [isOrderMode, setIsOrderMode] = useState(false)
  const [cart, setCart] = useState([])
  const [openCartDialog, setOpenCartDialog] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    billId: '',
    comments: ''
  })
  const [itemQuantities, setItemQuantities] = useState({})
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [openBillsDialog, setOpenBillsDialog] = useState(false)
  const [recentBills, setRecentBills] = useState([])
  const [billsLoading, setBillsLoading] = useState(false)
  const [isGeneratingBill, setIsGeneratingBill] = useState(false)
  const [successfulBillId, setSuccessfulBillId] = useState('')
  const [currentView, setCurrentView] = useState('inventory')
  const [selectedBill, setSelectedBill] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [editItems, setEditItems] = useState([])
  const [editError, setEditError] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [openErrorLogDialog, setOpenErrorLogDialog] = useState(false)
  const [manualError, setManualError] = useState({
    error_detail: '',
    source_table: '',
    record_id: ''
  })
  const [manualErrorError, setManualErrorError] = useState('')
  const [openCommentDialog, setOpenCommentDialog] = useState(false)
  const [selectedItemForComment, setSelectedItemForComment] = useState(null)
  const [itemComment, setItemComment] = useState('')
  const [isUpdatingComment, setIsUpdatingComment] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [transactionStatus, setTransactionStatus] = useState('')
  const [openTransactionMonitor, setOpenTransactionMonitor] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [sideNotification, setSideNotification] = useState({ open: false, message: '', billId: null })

  const tables = [
    { value: 'short_and_trousers', label: 'Shorts and Trousers' },
    { value: 'shirts', label: 'Shirts' },
    { value: 'jeans_and_joggers', label: 'Jeans and Joggers' }
  ]

  useEffect(() => {
    fetchItems()
  }, [selectedTable])

  useEffect(() => {
    filterItems()
  }, [searchTerm, items])

  async function fetchItems() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from(selectedTable)
        .select('*')
      
      if (error) throw error
      setItems(data)
      setFilteredItems(data)
    } catch (error) {
      console.error('Error fetching items:', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchShirts() {
    try {
      const { data, error } = await supabase
        .from('shirts')
        .select('*')
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching shirts:', error.message)
      return []
    }
  }

  async function fetchJeansAndJoggers() {
    try {
      const { data, error } = await supabase
        .from('jeans_and_joggers')
        .select('*')
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching jeans and joggers:', error.message)
      return []
    }
  }

  const handleTableChange = (event) => {
    setSelectedTable(event.target.value)
    setSearchTerm('')
  }

  const handleSearch = (event) => {
    setSearchTerm(event.target.value)
  }

  const filterItems = () => {
    if (!searchTerm) {
      setFilteredItems(items)
      return
    }

    const searchLower = searchTerm.toLowerCase()
    const filtered = items.filter(item => 
      item.item_name?.toLowerCase().includes(searchLower) ||
      item.article_number?.toLowerCase().includes(searchLower)
    )
    setFilteredItems(filtered)
  }

  const handleAddItem = () => {
    setFormItems([...formItems, {
      item_category: '',
      item_name: '',
      article_number: '',
      carton_number: '',
      quantity_remaining_dozens: '',
      supplier: 'Unknown Supplier'
    }])
  }

  const handleRemoveItem = (index) => {
    const newItems = formItems.filter((_, i) => i !== index)
    setFormItems(newItems)
  }

  const handleFormChange = (index, field, value) => {
    const newItems = [...formItems]
    newItems[index][field] = value
    setFormItems(newItems)
  }

  const validateForm = () => {
    for (const item of formItems) {
      if (!item.item_category || !item.item_name || !item.article_number || !item.quantity_remaining_dozens) {
        return 'Please fill in all required fields (Item Category, Item Name, Article Number, and Quantity)'
      }
      if (isNaN(item.quantity_remaining_dozens) || parseFloat(item.quantity_remaining_dozens) < 0) {
        return 'Quantity must be a valid number greater than or equal to 0'
      }
    }
    return ''
  }

  const handleSubmit = async () => {
    const error = validateForm()
    if (error) {
      setFormError(error)
      return
    }

    try {
      // Convert quantity to numeric
      const itemsToSubmit = formItems.map(item => ({
        ...item,
        quantity_remaining_dozens: parseFloat(item.quantity_remaining_dozens),
        supplier: item.supplier || 'Unknown Supplier'
      }))

      const { error } = await supabase
        .from(selectedTable)
        .insert(itemsToSubmit)
      
      if (error) throw error
      
      // Refresh the items list
      fetchItems()
      // Reset form
      setFormItems([{
        item_category: '',
        item_name: '',
        article_number: '',
        carton_number: '',
        quantity_remaining_dozens: '',
        supplier: 'Unknown Supplier'
      }])
      setOpenAddDialog(false)
      setFormError('')
      setSuccessMessage('Items added successfully!')
    } catch (error) {
      console.error('Error adding items:', error.message)
      setFormError(error.message)
      setErrorMessage('Error adding items. Please try again later.')
    }
  }

  const handleSelectItem = (itemId) => {
    if (!isOrderMode) {
      setSelectedItems(prev => {
        if (prev.includes(itemId)) {
          return prev.filter(id => id !== itemId)
        } else {
          return [...prev, itemId]
        }
      })
    } else {
      const item = items.find(i => i.id === itemId)
      if (item && item.quantity_remaining_dozens > 0) {
        setSelectedItems(prev => {
          if (prev.includes(itemId)) {
            return prev.filter(id => id !== itemId)
          } else {
            return [...prev, itemId]
          }
        })
      }
    }
  }

  const handleAddToCart = () => {
    const selectedItemsData = items.filter(item => selectedItems.includes(item.id))
    
    // Check for duplicates based on category, name, and article number
    const duplicates = selectedItemsData.filter(item => 
      cart.some(cartItem => 
        cartItem.item_category === item.item_category &&
        cartItem.item_name === item.item_name &&
        cartItem.article_number === item.article_number
      )
    )
    
    if (duplicates.length > 0) {
      setOrderError(`The following items are already in your cart: ${duplicates.map(item => `${item.item_name} (${item.article_number})`).join(', ')}`)
      return
    }
    
    // Add the current table information to each item
    const itemsWithTable = selectedItemsData.map(item => ({
      ...item,
      item_table: selectedTable
    }))
    
    setCart(prev => [...prev, ...itemsWithTable])
    setSelectedItems([])
    setOrderError('')
  }

  const handleRemoveFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  const handleStartOrder = () => {
    setIsOrderMode(true)
    setSelectedItems([])
  }

  const handleEndOrder = () => {
    setIsOrderMode(false)
    setSelectedItems([])
    setCart([])
  }

  const handleQuantityChange = (itemId, quantity) => {
    const item = cart.find(item => item.id === itemId)
    if (item && quantity > item.quantity_remaining_dozens) {
      setOrderError(`Quantity cannot exceed available stock (${item.quantity_remaining_dozens} dozens)`)
      return
    }
    setItemQuantities(prev => ({
      ...prev,
      [itemId]: quantity
    }))
    setOrderError('')
  }

  const handleCustomerInfoChange = (field, value) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const checkBillIdExists = async (billId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('bill_id')
        .eq('bill_id', billId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is the "not found" error
        throw error
      }
      return !!data
    } catch (error) {
      console.error('Error checking bill ID:', error.message)
      return false
    }
  }

  const validateOrder = async () => {
    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.phone || !customerInfo.billId) {
      return 'Please fill in all required customer information'
    }

    // Check if bill ID already exists
    const billIdExists = await checkBillIdExists(customerInfo.billId)
    if (billIdExists) {
      return `Bill ID ${customerInfo.billId} already exists. Please use a different Bill ID.`
    }
    
    for (const item of cart) {
      if (!itemQuantities[item.id] || itemQuantities[item.id] <= 0) {
        return `Please enter a valid quantity for ${item.item_name}`
      }
      if (itemQuantities[item.id] > item.quantity_remaining_dozens) {
        return `Quantity for ${item.item_name} exceeds available stock`
      }
    }
    
    return ''
  }

  // Add error logging system
  const errorLogger = {
    async logError(error, sourceTable = null, recordId = null) {
      try {
        const { error: logError } = await supabase
          .from('error_records')
          .insert([{
            error_detail: error.message || error.toString(),
            source_table: sourceTable,
            record_id: recordId
          }])

        if (logError) {
          console.error('Failed to log error:', logError)
        }
      } catch (e) {
        console.error('Error while logging error:', e)
      }
    }
  }

  const withTransaction = async (operations) => {
    try {
      // Use Supabase's built-in transaction support
      const { data, error } = await supabase.rpc('begin_transaction')
      if (error) {
        await errorLogger.logError(error, 'transaction', 'begin')
        throw new Error('Failed to start transaction: ' + error.message)
      }

      // Execute operations
      const result = await operations()

      // Commit transaction
      const { error: commitError } = await supabase.rpc('commit_transaction')
      if (commitError) {
        await errorLogger.logError(commitError, 'transaction', 'commit')
        throw new Error('Failed to commit transaction: ' + commitError.message)
      }

      return { data: result, error: null }
    } catch (error) {
      // Rollback on error
      await supabase.rpc('rollback_transaction')
      
      // Log the error
      await errorLogger.logError(error, 'transaction', 'rollback')

      // Log the error for monitoring
      await monitoring.logOperation({
        type: 'transaction_error',
        details: error.message,
        status: 'failed',
        duration: 0
      })

      // Add to error recovery queue
      await errorRecoveryQueue.addFailedOperation({
        type: 'transaction',
        data: operations,
        error: error.message
      })

      return { data: null, error: error.message }
    }
  }

  const createOrder = async () => {
    try {
      setTransactionStatus('Creating order...')
      const result = await transactionManager.executeWithRetry(
        async () => {
          // Verify current quantities before proceeding
          for (const item of cart) {
            const { data: currentItem, error: fetchError } = await supabase
              .from(item.item_table)
              .select('quantity_remaining_dozens, item_name')
              .eq('id', item.id)
              .single()

            if (fetchError) {
              await errorLogger.logError(fetchError, item.item_table, item.id)
              throw new Error(`Failed to fetch current quantity for ${item.item_name}: ${fetchError.message}`)
            }
            if (!currentItem) {
              await errorLogger.logError(new Error(`Item not found`), item.item_table, item.id)
              throw new Error(`Item ${item.item_name} not found in inventory`)
            }
            if (currentItem.quantity_remaining_dozens < itemQuantities[item.id]) {
              await errorLogger.logError(
                new Error(`Insufficient quantity`), 
                item.item_table, 
                item.id
              )
              throw new Error(`Insufficient quantity for ${item.item_name}. Available: ${currentItem.quantity_remaining_dozens}, Requested: ${itemQuantities[item.id]}`)
            }
          }

          // Create the order
          const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert([{
              bill_id: customerInfo.billId,
              customer_first_name: customerInfo.firstName,
              customer_last_name: customerInfo.lastName,
              customer_phone: customerInfo.phone,
              comments: customerInfo.comments,
              total_items: cart.length,
              total_quantity_dozens: cart.reduce((sum, item) => sum + (itemQuantities[item.id] || 0), 0)
            }])
            .select()
            .single()

          if (orderError) {
            await errorLogger.logError(orderError, 'orders', customerInfo.billId)
            throw new Error('Failed to create order: ' + orderError.message)
          }

          // Create order items
          const orderItems = cart.map(item => ({
            bill_id: customerInfo.billId,
            item_id: item.id,
            item_table: item.item_table,
            quantity_dozens: itemQuantities[item.id],
            item_name: item.item_name,
            article_number: item.article_number,
            item_category: item.item_category
          }))

          const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)

          if (itemsError) {
            await errorLogger.logError(itemsError, 'order_items', customerInfo.billId)
            throw new Error('Failed to create order items: ' + itemsError.message)
          }

          // Update inventory quantities and amount sold
          for (const item of cart) {
            const newQuantity = item.quantity_remaining_dozens - itemQuantities[item.id]
            const { data: currentItem, error: fetchError } = await supabase
              .from(item.item_table)
              .select('amount_sold_dozens, sold_in_bills')
              .eq('id', item.id)
              .single()

            if (fetchError) {
              await errorLogger.logError(fetchError, item.item_table, item.id)
              throw new Error(`Failed to fetch current amount sold for ${item.item_name}: ${fetchError.message}`)
            }

            const newAmountSold = (currentItem?.amount_sold_dozens || 0) + itemQuantities[item.id]
            const currentBills = currentItem?.sold_in_bills || ''
            const newBills = currentBills ? `${currentBills}-${customerInfo.billId}` : customerInfo.billId
            
            const { error: updateError } = await supabase
              .from(item.item_table)
              .update({ 
                quantity_remaining_dozens: newQuantity,
                amount_sold_dozens: newAmountSold,
                sold_in_bills: newBills
              })
              .eq('id', item.id)

            if (updateError) {
              await errorLogger.logError(updateError, item.item_table, item.id)
              throw new Error(`Failed to update quantity for ${item.item_name}: ${updateError.message}`)
            }
          }

          // Verify quantities after update
          for (const item of cart) {
            const { data: verifyItem, error: verifyError } = await supabase
              .from(item.item_table)
              .select('quantity_remaining_dozens, amount_sold_dozens, sold_in_bills, item_name')
              .eq('id', item.id)
              .single()

            if (verifyError) {
              await errorLogger.logError(verifyError, item.item_table, item.id)
              throw new Error(`Failed to verify quantity for ${item.item_name}: ${verifyError.message}`)
            }
            
            const expectedQuantity = item.quantity_remaining_dozens - itemQuantities[item.id]
            if (verifyItem.quantity_remaining_dozens !== expectedQuantity) {
              const error = new Error(`Quantity verification failed for ${item.item_name}. Expected: ${expectedQuantity}, Found: ${verifyItem.quantity_remaining_dozens}`)
              await errorLogger.logError(error, item.item_table, item.id)
              throw error
            }
          }

          return order
        },
        'order_creation',
        {
          billId: customerInfo.billId,
          items: cart.map(item => ({
            id: item.id,
            quantity: itemQuantities[item.id],
            name: item.item_name
          }))
        }
      )

      setTransactionStatus('Order created successfully!')
      setCart([])
      setItemQuantities({})
      setCustomerInfo({
        firstName: '',
        lastName: '',
        phone: '',
        billId: '',
        comments: ''
      })
      setOrderSuccess(true)
      setOpenCartDialog(false)
      setSuccessfulBillId(result.bill_id)
      
      // Show side notification
      setSideNotification({
        open: true,
        message: 'Order created successfully!',
        billId: result.bill_id
      })
      
      // Refresh data for all tables
      await Promise.all([
        fetchItems(),
        fetchShirts(),
        fetchJeansAndJoggers()
      ])
    } catch (error) {
      console.error('Error creating order:', error)
      setTransactionStatus(`Error: ${error.message}`)
      setOrderError(error.message)
      setErrorMessage('Error creating order. Please try again later.')
    }
  }

  const handleGenerateBill = async () => {
    const error = await validateOrder()
    if (error) {
      setOrderError(error)
      return
    }
    setIsGeneratingBill(true)
    try {
      await createOrder()
    } finally {
      setIsGeneratingBill(false)
    }
  }

  const fetchRecentBills = async () => {
    setBillsLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('bill_id, customer_first_name, customer_last_name, customer_phone, order_date, comments')
        .order('order_date', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentBills(data)
    } catch (error) {
      console.error('Error fetching recent bills:', error.message)
    } finally {
      setBillsLoading(false)
    }
  }

  const handleViewBills = () => {
    fetchRecentBills()
    setOpenBillsDialog(true)
  }

  const handleViewDetails = async (bill) => {
    setSelectedBill(bill)
    setLoadingItems(true)
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('bill_id, item_category, item_name, article_number, quantity_dozens')
        .eq('bill_id', bill.bill_id)
      
      if (error) throw error
      setOrderItems(data)
    } catch (error) {
      console.error('Error fetching order items:', error.message)
    } finally {
      setLoadingItems(false)
      setOpenDetailsDialog(true)
    }
  }

  const handleStartEdit = () => {
    if (selectedItems.length === 0) {
      setEditError('Please select at least one item to edit')
      return
    }
    const itemsToEdit = items.filter(item => selectedItems.includes(item.id))
    setEditItems(itemsToEdit)
    setOpenEditDialog(true)
  }

  const handleEditItemChange = (itemId, field, value) => {
    setEditItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ))
  }

  const handleUpdateItems = async () => {
    setIsUpdating(true)
    setEditError('')
    
    try {
      // Validate all items before updating
      for (const item of editItems) {
        if (!item.item_category || !item.item_name || !item.article_number) {
          throw new Error('Please fill in all required fields for all items')
        }
        if (isNaN(item.quantity_remaining_dozens) || parseFloat(item.quantity_remaining_dozens) < 0) {
          throw new Error('Quantity must be a valid number greater than or equal to 0')
        }
      }

      // Update each item
      for (const item of editItems) {
        const { error } = await supabase
          .from(selectedTable)
          .update({
            item_category: item.item_category,
            item_name: item.item_name,
            article_number: item.article_number,
            carton_number: item.carton_number,
            quantity_remaining_dozens: parseFloat(item.quantity_remaining_dozens),
            supplier: item.supplier || 'Unknown Supplier'
          })
          .eq('id', item.id)

        if (error) throw error
      }

      // Refresh items list
      await fetchItems()
      setSelectedItems([])
      setOpenEditDialog(false)
      setSuccessMessage('Items updated successfully!')
    } catch (error) {
      console.error('Error updating items:', error.message)
      setEditError(error.message)
      setErrorMessage('Error updating items. Please try again later.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleStartDelete = () => {
    if (selectedItems.length === 0) {
      setDeleteError('Please select at least one item to delete')
      return
    }
    setOpenDeleteDialog(true)
  }

  const handleDeleteItems = async () => {
    setIsDeleting(true)
    setDeleteError('')
    
    try {
      // Delete each selected item
      for (const itemId of selectedItems) {
        const { error } = await supabase
          .from(selectedTable)
          .delete()
          .eq('id', itemId)

        if (error) throw error
      }

      // Refresh items list
      await fetchItems()
      setSelectedItems([])
      setOpenDeleteDialog(false)
      setSuccessMessage('Items deleted successfully!')
    } catch (error) {
      console.error('Error deleting items:', error.message)
      setDeleteError(error.message)
      setErrorMessage('Error deleting items. Please try again later.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleUnselectAll = () => {
    setSelectedItems([])
  }

  const handleSelectAll = () => {
    if (selectedItems.length === filteredItems.length) {
      // If all items are selected, unselect all
      setSelectedItems([])
    } else {
      // Select all items in the filtered view
      setSelectedItems(filteredItems.map(item => item.id))
    }
  }

  // Add error recovery queue
  const errorRecoveryQueue = {
    async addFailedOperation(operation) {
      await supabase
        .from('failed_operations')
        .insert([{
          operation_type: operation.type,
          operation_data: operation.data,
          error_message: operation.error,
          retry_count: 0,
          status: 'pending'
        }])
    },

    async processFailedOperations() {
      const { data: failedOps } = await supabase
        .from('failed_operations')
        .select('*')
        .eq('status', 'pending')
        .lt('retry_count', 3)

      for (const op of failedOps || []) {
        try {
          switch (op.operation_type) {
            case 'inventory_update':
              await this.retryInventoryUpdate(op)
              break
            case 'order_creation':
              await this.retryOrderCreation(op)
              break
          }

          // Mark as completed if successful
          await supabase
            .from('failed_operations')
            .update({ status: 'completed' })
            .eq('id', op.id)

        } catch (error) {
          // Update retry count and status
          await supabase
            .from('failed_operations')
            .update({ 
              retry_count: op.retry_count + 1,
              status: op.retry_count >= 2 ? 'failed' : 'pending',
              last_error: error.message
            })
            .eq('id', op.id)
        }
      }
    }
  }

  // Add monitoring system
  const monitoring = {
    async logOperation(operation) {
      await supabase
        .from('system_logs')
        .insert([{
          operation_type: operation.type,
          details: operation.details,
          status: operation.status,
          duration_ms: operation.duration,
          timestamp: new Date()
        }])
    },

    async checkSystemHealth() {
      // Check database connectivity
      const dbStart = Date.now()
      const { error: dbError } = await supabase
        .from('inventory')
        .select('id')
        .limit(1)
      
      if (dbError) {
        this.triggerAlert('Database connectivity issues detected')
      }

      // Check for low stock items
      const { data: lowStock } = await supabase
        .from('inventory')
        .select('item_name, quantity_remaining_dozens')
        .lt('quantity_remaining_dozens', 5)

      if (lowStock?.length > 0) {
        this.triggerAlert('Low stock items detected', { items: lowStock })
      }

      // Check for failed operations
      const { data: failedOps } = await supabase
        .from('failed_operations')
        .select('*')
        .eq('status', 'failed')

      if (failedOps?.length > 0) {
        this.triggerAlert('Failed operations detected', { operations: failedOps })
      }
    }
  }

  // Add backup system
  const backupSystem = {
    async createBackup() {
      const tables = ['inventory', 'orders', 'order_items', 'inventory_audit']
      const backup = {}

      for (const table of tables) {
        const { data } = await supabase
          .from(table)
          .select('*')

        backup[table] = data
      }

      // Store backup in secure storage
      await supabase
        .storage
        .from('backups')
        .upload(`backup-${new Date().toISOString()}.json`, JSON.stringify(backup))
    },

    async scheduleBackups() {
      // Schedule daily backups
    }
  }

  const handleManualErrorSubmit = async () => {
    if (!manualError.error_detail) {
      setManualErrorError('Please enter error details')
      return
    }

    try {
      const { error } = await supabase
        .from('error_records')
        .insert([{
          error_detail: manualError.error_detail,
          source_table: manualError.source_table || null,
          record_id: manualError.record_id || null
        }])

      if (error) throw error

      // Reset form and close dialog
      setManualError({
        error_detail: '',
        source_table: '',
        record_id: ''
      })
      setManualErrorError('')
      setOpenErrorLogDialog(false)
      setSuccessMessage('Error logged successfully!')
    } catch (error) {
      console.error('Error logging manual error:', error.message)
      setManualErrorError(error.message)
      setErrorMessage('Error logging error. Please try again later.')
    }
  }

  const handleAddComment = (item) => {
    setSelectedItemForComment(item)
    setItemComment(item.item_comment || '')
    setOpenCommentDialog(true)
  }

  const handleUpdateComment = async () => {
    if (!selectedItemForComment) return
    
    setIsUpdatingComment(true)
    setCommentError('')
    
    try {
      const { error } = await supabase
        .from(selectedItemForComment.item_table)
        .update({ item_comment: itemComment })
        .eq('id', selectedItemForComment.id)

      if (error) throw error

      // Update local state
      setItems(prev => prev.map(item => 
        item.id === selectedItemForComment.id 
          ? { ...item, item_comment: itemComment }
          : item
      ))
      
      setOpenCommentDialog(false)
      setSelectedItemForComment(null)
      setItemComment('')
    } catch (error) {
      console.error('Error updating comment:', error.message)
      setCommentError(error.message)
    } finally {
      setIsUpdatingComment(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f7fa' }}>
      <SystemStatusIndicator />
      <AppBar position="static" sx={{ backgroundColor: '#1976d2', boxShadow: 3, borderRadius: '0 0 12px 12px' }}>
        <Toolbar>
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ 
              fontWeight: 600,
              color: 'white',
              flexGrow: 1
            }}
          >
            Inventory Management
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mr: 2 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<ErrorIcon />}
              onClick={() => setOpenErrorLogDialog(true)}
              sx={{ 
                boxShadow: 2,
                borderRadius: '8px',
                backgroundColor: 'black',
                color: '#ff1744',
                borderColor: 'black',
                '&:hover': { 
                  boxShadow: 4,
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  borderColor: 'black',
                  color: '#ff1744'
                }
              }}
            >
              Log Error
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={() => setOpenTransactionMonitor(true)}
              sx={{ 
                boxShadow: 2,
                borderRadius: '8px',
                backgroundColor: 'black',
                color: '#1976d2',
                borderColor: 'black',
                '&:hover': { 
                  boxShadow: 4,
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  borderColor: 'black',
                  color: '#1976d2'
                }
              }}
            >
              Transaction Monitor
            </Button>
          </Box>
          <Tabs 
            value={currentView} 
            onChange={(e, newValue) => setCurrentView(newValue)}
            sx={{ 
              '& .MuiTab-root': { 
                color: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '8px',
                '&.Mui-selected': { 
                  color: 'white',
                  fontWeight: 600
                },
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }
            }}
          >
            <Tab 
              value="inventory" 
              label="Inventory" 
              icon={<InventoryIcon />}
              iconPosition="start"
            />
            <Tab 
              value="bills" 
              label="Past Bills" 
              icon={<ReceiptIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {currentView === 'inventory' && (
          <>
            <Card sx={{ mb: 3, boxShadow: 2, borderRadius: '12px' }}>
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {!isOrderMode ? (
                      <>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<AddIcon />}
                          onClick={() => setOpenAddDialog(true)}
                          sx={{ 
                            boxShadow: 2,
                            borderRadius: '8px',
                            '&:hover': { boxShadow: 4 }
                          }}
                        >
                          Add Items
                        </Button>
                        <Button
                          variant="outlined"
                          color="primary"
                          startIcon={<CheckBoxIcon />}
                          onClick={handleSelectAll}
                          sx={{ 
                            boxShadow: 2,
                            borderRadius: '8px',
                            '&:hover': { 
                              boxShadow: 4,
                              backgroundColor: 'rgba(25, 118, 210, 0.04)'
                            }
                          }}
                        >
                          {selectedItems.length === filteredItems.length ? 'Unselect All' : 'Select All'} ({filteredItems.length})
                        </Button>
                        <Button
                          variant="contained"
                          color="info"
                          startIcon={<EditIcon />}
                          onClick={handleStartEdit}
                          disabled={selectedItems.length === 0}
                          sx={{ 
                            boxShadow: 2,
                            borderRadius: '8px',
                            '&:hover': { boxShadow: 4 }
                          }}
                        >
                          Edit Items ({selectedItems.length})
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<DeleteForeverIcon />}
                          onClick={handleStartDelete}
                          disabled={selectedItems.length === 0}
                          sx={{ 
                            boxShadow: 2,
                            borderRadius: '8px',
                            '&:hover': { boxShadow: 4 }
                          }}
                        >
                          Delete Items ({selectedItems.length})
                        </Button>
                        <Button
                          variant="outlined"
                          color="secondary"
                          startIcon={<CloseIcon />}
                          onClick={handleUnselectAll}
                          disabled={selectedItems.length === 0}
                          sx={{ 
                            boxShadow: 2,
                            borderRadius: '8px',
                            '&:hover': { 
                              boxShadow: 4,
                              backgroundColor: 'rgba(156, 39, 176, 0.04)'
                            }
                          }}
                        >
                          Unselect All ({selectedItems.length})
                        </Button>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<ShoppingCartIcon />}
                          onClick={handleStartOrder}
                          sx={{ 
                            boxShadow: 2,
                            borderRadius: '8px',
                            '&:hover': { boxShadow: 4 }
                          }}
                        >
                          New Order
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="contained"
                          color="error"
                          startIcon={<CloseIcon />}
                          onClick={handleEndOrder}
                          sx={{ 
                            boxShadow: 2,
                            borderRadius: '8px',
                            '&:hover': { boxShadow: 4 }
                          }}
                        >
                          End Order
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<ShoppingCartIcon />}
                          onClick={() => setOpenCartDialog(true)}
                          sx={{ 
                            boxShadow: 2,
                            borderRadius: '8px',
                            '&:hover': { boxShadow: 4 }
                          }}
                        >
                          Cart ({cart.length})
                        </Button>
                      </>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, justifyContent: 'flex-end' }}>
                    <TextField
                      label="Search Items"
                      variant="outlined"
                      size="small"
                      value={searchTerm}
                      onChange={handleSearch}
                      sx={{ 
                        minWidth: 300,
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          '&:hover fieldset': {
                            borderColor: '#1976d2',
                          },
                        },
                      }}
                      placeholder="Search by name or article number"
                    />
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel id="table-select-label">Category</InputLabel>
                      <Select
                        labelId="table-select-label"
                        value={selectedTable}
                        label="Category"
                        onChange={handleTableChange}
                        sx={{ 
                          backgroundColor: 'white',
                          borderRadius: '8px',
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                          }
                        }}
                      >
                        {tables.map((table) => (
                          <MenuItem key={table.value} value={table.value}>
                            {table.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {isOrderMode && selectedItems.length > 0 && (
              <Card sx={{ mb: 3, boxShadow: 2, borderRadius: '12px' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {orderError && (
                      <Alert severity="error" sx={{ flexGrow: 1, mr: 2, borderRadius: '8px' }}>
                        {orderError}
                      </Alert>
                    )}
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<ShoppingCartIcon />}
                      onClick={handleAddToCart}
                      sx={{ 
                        boxShadow: 2,
                        borderRadius: '8px',
                        '&:hover': { boxShadow: 4 }
                      }}
                    >
                      Add to Cart ({selectedItems.length})
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Card sx={{ boxShadow: 2, borderRadius: '12px' }}>
                <CardContent>
                  <TableContainer sx={{ borderRadius: '8px' }}>
                    {filteredItems.length === 0 ? (
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          py: 8,
                          backgroundColor: 'white',
                          borderRadius: '8px'
                        }}
                      >
                        <InventoryIcon sx={{ fontSize: 48, color: '#9e9e9e', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                          No Items Found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 400 }}>
                          {searchTerm 
                            ? `No items match your search for "${searchTerm}". Try adjusting your search terms.`
                            : 'There are no items in this category. Add some items to get started.'}
                        </Typography>
                      </Box>
                    ) : (
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell padding="checkbox">
                              <Checkbox
                                checked={selectedItems.length === filteredItems.length}
                                indeterminate={selectedItems.length > 0 && selectedItems.length < filteredItems.length}
                                onChange={handleSelectAll}
                                disabled={isOrderMode}
                              />
                            </TableCell>
                            {Object.keys(filteredItems[0] || {}).map((header) => (
                              <TableCell 
                                key={header}
                                sx={{ 
                                  backgroundColor: '#f5f5f5',
                                  fontWeight: 600,
                                  color: '#1976d2',
                                  ...(header === Object.keys(filteredItems[0] || {})[0] && { borderTopLeftRadius: '8px' }),
                                  ...(header === Object.keys(filteredItems[0] || {}).slice(-1)[0] && { borderTopRightRadius: '8px' })
                                }}
                              >
                                {header.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredItems.map((item) => (
                            <TableRow 
                              key={item.id}
                              hover
                              selected={selectedItems.includes(item.id)}
                              sx={{
                                opacity: isOrderMode && item.quantity_remaining_dozens <= 0 ? 0.5 : 1,
                                cursor: isOrderMode && item.quantity_remaining_dozens <= 0 ? 'not-allowed' : 'pointer',
                                '&:hover': {
                                  backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                },
                                '&.Mui-selected': {
                                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                  '&:hover': {
                                    backgroundColor: 'rgba(25, 118, 210, 0.12)',
                                  },
                                },
                              }}
                            >
                              <TableCell padding="checkbox">
                                <Checkbox
                                  checked={selectedItems.includes(item.id)}
                                  onChange={() => handleSelectItem(item.id)}
                                  disabled={isOrderMode && item.quantity_remaining_dozens <= 0}
                                />
                              </TableCell>
                              {Object.entries(item).map(([key, value], i) => (
                                <TableCell 
                                  key={i}
                                  sx={{
                                    backgroundColor: 'white',
                                    borderBottom: '1px solid rgba(224, 224, 224, 1)',
                                  }}
                                >
                                  {key === 'item_comment' ? (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" sx={{ flex: 1 }}>
                                        {value || 'No comment'}
                                      </Typography>
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleAddComment(item)
                                        }}
                                        sx={{ 
                                          color: 'primary.main',
                                          '&:hover': {
                                            backgroundColor: 'rgba(25, 118, 210, 0.04)',
                                          }
                                        }}
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  ) : (
                                    value?.toString() || ''
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TableContainer>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {currentView === 'bills' && <BillsView />}

        {/* Success Dialog */}
        <Dialog
          open={orderSuccess}
          onClose={() => {
            setOrderSuccess(false)
            setIsOrderMode(false)
            setSuccessfulBillId('')
          }}
          PaperProps={{
            sx: { borderRadius: '12px' }
          }}
        >
          <DialogTitle>Order Successful</DialogTitle>
          <DialogContent>
            <Typography>
              Order has been created successfully with Bill ID: {successfulBillId}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOrderSuccess(false)
              setIsOrderMode(false)
              setSuccessfulBillId('')
            }}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Cart Dialog */}
        <Dialog 
          open={openCartDialog} 
          onClose={() => {
            setOpenCartDialog(false)
            setOrderError('')
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: '12px' }
          }}
        >
          <DialogTitle>Order Cart</DialogTitle>
          <DialogContent>
            {orderError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {orderError}
              </Alert>
            )}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>Customer Information</Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label="First Name *"
                  value={customerInfo.firstName}
                  onChange={(e) => handleCustomerInfoChange('firstName', e.target.value)}
                  size="small"
                  sx={{ flex: 1, minWidth: 200 }}
                />
                <TextField
                  label="Last Name *"
                  value={customerInfo.lastName}
                  onChange={(e) => handleCustomerInfoChange('lastName', e.target.value)}
                  size="small"
                  sx={{ flex: 1, minWidth: 200 }}
                />
                <TextField
                  label="Phone Number *"
                  value={customerInfo.phone}
                  onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
                  size="small"
                  sx={{ flex: 1, minWidth: 200 }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <TextField
                  label="Bill ID *"
                  value={customerInfo.billId}
                  onChange={(e) => handleCustomerInfoChange('billId', e.target.value)}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="outlined"
                  onClick={handleViewBills}
                  sx={{ ml: 2 }}
                >
                  View Recent Bills
                </Button>
              </Box>
              <TextField
                label="Comments"
                value={customerInfo.comments}
                onChange={(e) => handleCustomerInfoChange('comments', e.target.value)}
                size="small"
                fullWidth
                multiline
                rows={2}
                sx={{ mt: 2 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Article Number</TableCell>
                    <TableCell>Available (Dozens)</TableCell>
                    <TableCell>Order Quantity (Dozens)</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.item_name}</TableCell>
                      <TableCell>{item.article_number}</TableCell>
                      <TableCell>{item.quantity_remaining_dozens}</TableCell>
                      <TableCell>
                        <TextField
                          label="Quantity (Dozens)"
                          type="number"
                          value={itemQuantities[item.id] || ''}
                          onChange={(e) => handleQuantityChange(item.id, parseFloat(e.target.value))}
                          onWheel={(e) => e.target.blur()}
                          size="small"
                          inputProps={{ 
                            min: 0,
                            step: 0.5,
                            max: item.quantity_remaining_dozens
                          }}
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          color="error" 
                          onClick={() => handleRemoveFromCart(cart.findIndex(i => i.id === item.id))}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setOpenCartDialog(false)
                setOrderError('')
              }}
              disabled={isGeneratingBill}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleGenerateBill}
              disabled={isGeneratingBill}
              startIcon={isGeneratingBill ? <CircularProgress size={20} /> : null}
            >
              {isGeneratingBill ? 'Generating Bill...' : 'Generate Bill'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Recent Bills Dialog */}
        <Dialog
          open={openBillsDialog}
          onClose={() => setOpenBillsDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: '12px' }
          }}
        >
          <DialogTitle>Recent Bills</DialogTitle>
          <DialogContent>
            {billsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Bill ID</TableCell>
                      <TableCell>First Name</TableCell>
                      <TableCell>Last Name</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Order Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentBills.map((bill) => (
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
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenBillsDialog(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Order Details Dialog */}
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

        {/* Add Items Dialog */}
        <Dialog 
          open={openAddDialog} 
          onClose={() => {
            setOpenAddDialog(false)
            setFormError('')
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: '12px' }
          }}
        >
          <DialogTitle>Add New Items</DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <Box sx={{ mt: 2 }}>
              {formItems.map((item, index) => (
                <Box key={index} sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  mb: 2,
                  alignItems: 'center'
                }}>
                  <TextField
                    label="Item Category *"
                    value={item.item_category}
                    onChange={(e) => handleFormChange(index, 'item_category', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    required
                  />
                  <TextField
                    label="Item Name *"
                    value={item.item_name}
                    onChange={(e) => handleFormChange(index, 'item_name', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    required
                  />
                  <TextField
                    label="Article Number *"
                    value={item.article_number}
                    onChange={(e) => handleFormChange(index, 'article_number', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    required
                  />
                  <TextField
                    label="Carton Number"
                    value={item.carton_number}
                    onChange={(e) => handleFormChange(index, 'carton_number', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Quantity (Dozens) *"
                    type="number"
                    value={item.quantity_remaining_dozens}
                    onChange={(e) => handleFormChange(index, 'quantity_remaining_dozens', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    required
                    inputProps={{ min: 0, step: 0.5 }}
                  />
                  <TextField
                    label="Supplier"
                    value={item.supplier}
                    onChange={(e) => handleFormChange(index, 'supplier', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    placeholder="Unknown Supplier"
                  />
                  {index > 0 && (
                    <IconButton 
                      color="error" 
                      onClick={() => handleRemoveItem(index)}
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                sx={{ mt: 2 }}
              >
                Add Another Item
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenAddDialog(false)
              setFormError('')
            }}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              Add Items
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Items Dialog */}
        <Dialog 
          open={openEditDialog} 
          onClose={() => {
            setOpenEditDialog(false)
            setEditError('')
          }}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: '12px' }
          }}
        >
          <DialogTitle>Edit Items</DialogTitle>
          <DialogContent>
            {editError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
                {editError}
              </Alert>
            )}
            <Box sx={{ mt: 2 }}>
              {editItems.map((item) => (
                <Box 
                  key={item.id} 
                  sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    mb: 2,
                    alignItems: 'center',
                    p: 2,
                    borderRadius: '8px',
                    backgroundColor: '#f5f7fa'
                  }}
                >
                  <TextField
                    label="Item Category *"
                    value={item.item_category}
                    onChange={(e) => handleEditItemChange(item.id, 'item_category', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    required
                  />
                  <TextField
                    label="Item Name *"
                    value={item.item_name}
                    onChange={(e) => handleEditItemChange(item.id, 'item_name', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    required
                  />
                  <TextField
                    label="Article Number *"
                    value={item.article_number}
                    onChange={(e) => handleEditItemChange(item.id, 'article_number', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    required
                  />
                  <TextField
                    label="Carton Number"
                    value={item.carton_number}
                    onChange={(e) => handleEditItemChange(item.id, 'carton_number', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label="Quantity (Dozens) *"
                    type="number"
                    value={item.quantity_remaining_dozens}
                    onChange={(e) => handleEditItemChange(item.id, 'quantity_remaining_dozens', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    required
                    inputProps={{ min: 0, step: 0.5 }}
                  />
                  <TextField
                    label="Supplier"
                    value={item.supplier}
                    onChange={(e) => handleEditItemChange(item.id, 'supplier', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    placeholder="Unknown Supplier"
                  />
                </Box>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setOpenEditDialog(false)
                setEditError('')
              }}
              disabled={isUpdating}
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
              onClick={handleUpdateItems} 
              variant="contained" 
              color="primary"
              disabled={isUpdating}
              startIcon={isUpdating ? <CircularProgress size={20} /> : null}
              sx={{ 
                borderRadius: '8px',
                '&:hover': { 
                  boxShadow: 4 
                }
              }}
            >
              {isUpdating ? 'Updating...' : 'Update Items'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={openDeleteDialog}
          onClose={() => {
            setOpenDeleteDialog(false)
            setDeleteError('')
          }}
          PaperProps={{
            sx: { borderRadius: '12px' }
          }}
        >
          <DialogTitle>Delete Items</DialogTitle>
          <DialogContent>
            {deleteError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
                {deleteError}
              </Alert>
            )}
            <Typography>
              Are you sure you want to delete {selectedItems.length} selected item{selectedItems.length > 1 ? 's' : ''}? This action cannot be undone.
            </Typography>
            <Box sx={{ mt: 2 }}>
              {items
                .filter(item => selectedItems.includes(item.id))
                .map(item => (
                  <Box 
                    key={item.id}
                    sx={{ 
                      p: 1.5,
                      mb: 1,
                      borderRadius: '8px',
                      backgroundColor: '#f5f7fa'
                    }}
                  >
                    <Typography variant="subtitle2">
                      {item.item_name} ({item.article_number})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Category: {item.item_category} | Quantity: {item.quantity_remaining_dozens} dozens
                    </Typography>
                  </Box>
                ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setOpenDeleteDialog(false)
                setDeleteError('')
              }}
              disabled={isDeleting}
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
              onClick={handleDeleteItems}
              variant="contained"
              color="error"
              disabled={isDeleting}
              startIcon={isDeleting ? <CircularProgress size={20} /> : null}
              sx={{ 
                borderRadius: '8px',
                '&:hover': { 
                  boxShadow: 4 
                }
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete Items'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Manual Error Log Dialog */}
        <Dialog
          open={openErrorLogDialog}
          onClose={() => {
            setOpenErrorLogDialog(false)
            setManualErrorError('')
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: '12px' }
          }}
        >
          <DialogTitle>Log Manual Error</DialogTitle>
          <DialogContent>
            {manualErrorError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
                {manualErrorError}
              </Alert>
            )}
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Error Details *"
                value={manualError.error_detail}
                onChange={(e) => setManualError(prev => ({ ...prev, error_detail: e.target.value }))}
                multiline
                rows={4}
                required
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  }
                }}
              />
              <TextField
                label="Source Table (Optional)"
                value={manualError.source_table}
                onChange={(e) => setManualError(prev => ({ ...prev, source_table: e.target.value }))}
                fullWidth
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  }
                }}
              />
              <TextField
                label="Record ID (Optional)"
                value={manualError.record_id}
                onChange={(e) => setManualError(prev => ({ ...prev, record_id: e.target.value }))}
                fullWidth
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
                setOpenErrorLogDialog(false)
                setManualErrorError('')
              }}
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
              onClick={handleManualErrorSubmit}
              variant="contained"
              color="error"
              sx={{ 
                borderRadius: '8px',
                '&:hover': { 
                  boxShadow: 4 
                }
              }}
            >
              Log Error
            </Button>
          </DialogActions>
        </Dialog>

        {/* Comment Dialog */}
        <Dialog
          open={openCommentDialog}
          onClose={() => {
            setOpenCommentDialog(false)
            setSelectedItemForComment(null)
            setItemComment('')
            setCommentError('')
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: '12px' }
          }}
        >
          <DialogTitle>
            Add Comment for {selectedItemForComment?.item_name}
          </DialogTitle>
          <DialogContent>
            {commentError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
                {commentError}
              </Alert>
            )}
            <TextField
              label="Comment"
              value={itemComment}
              onChange={(e) => setItemComment(e.target.value)}
              multiline
              rows={4}
              fullWidth
              sx={{ 
                mt: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                }
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setOpenCommentDialog(false)
                setSelectedItemForComment(null)
                setItemComment('')
                setCommentError('')
              }}
              disabled={isUpdatingComment}
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
              onClick={handleUpdateComment}
              variant="contained"
              color="primary"
              disabled={isUpdatingComment}
              startIcon={isUpdatingComment ? <CircularProgress size={20} /> : null}
              sx={{ 
                borderRadius: '8px',
                '&:hover': { 
                  boxShadow: 4 
                }
              }}
            >
              {isUpdatingComment ? 'Updating...' : 'Update Comment'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Transaction Status Alert */}
        {transactionStatus && (
          <Alert 
            severity={transactionStatus.includes('Error') ? 'error' : 'success'} 
            sx={{ 
              mb: 2,
              borderRadius: '8px',
              '& .MuiAlert-message': {
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }
            }}
          >
            <Typography>{transactionStatus}</Typography>
            {transactionStatus.includes('Error') && (
              <Button
                size="small"
                color="inherit"
                onClick={() => setTransactionStatus('')}
                sx={{ ml: 2 }}
              >
                Dismiss
              </Button>
            )}
          </Alert>
        )}

        {/* Transaction Monitor */}
        <TransactionMonitor 
          open={openTransactionMonitor} 
          onClose={() => setOpenTransactionMonitor(false)} 
        />

        {/* Side Notification */}
        <Snackbar
          open={sideNotification.open}
          autoHideDuration={6000}
          onClose={() => setSideNotification({ ...sideNotification, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSideNotification({ ...sideNotification, open: false })} 
            severity="success" 
            sx={{ width: '100%' }}
          >
            {sideNotification.message}
            {sideNotification.billId && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Bill ID: {sideNotification.billId}
              </Typography>
            )}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  )
}

export default App 