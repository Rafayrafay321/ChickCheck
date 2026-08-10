'use client'

import { Modal } from '@/components/ui/Modal'

interface InvoiceItem {
  id: string
  quantity: number
  unitPrice: number
  total: number
  product: {
    name: string
    unit: string
  }
}

interface InvoiceViewModalProps {
  isOpen: boolean
  onClose: () => void
  invoice: {
    id: string
    totalAmount: number
    paidAmount: number
    status: string
    createdAt: string
    customer: {
      name: string
      type: string
      phone: string | null
      address: string | null
    }
    order: {
      items: InvoiceItem[]
      note: string | null
    }
  } | null
}

export function InvoiceViewModal({ isOpen, onClose, invoice }: InvoiceViewModalProps) {
  if (!invoice) return null

  const remaining = Math.max(0, invoice.totalAmount - invoice.paidAmount)

  function handlePrint() {
    window.print()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🧾 Bill Preview & Print" width="540px">
      <div className="flex flex-col gap-5">
        {/* Printable Area */}
        <div id="printable-bill" className="p-6 bg-white border border-border rounded-xl text-black font-sans space-y-4">
          {/* Header */}
          <div className="text-center border-b border-gray-200 pb-3">
            <h2 className="text-xl font-extrabold m-0 tracking-tight text-gray-900">🐔 AL MAUSAF CHICKEN CENTRE</h2>
            <p className="text-xs text-gray-600 mt-1">Wholesale & Retail Chicken Specialists</p>
            <div className="text-[0.7rem] text-gray-500 mt-0.5">Bill / Cash Memo</div>
          </div>

          {/* Bill Meta */}
          <div className="flex justify-between text-xs text-gray-700 border-b border-gray-100 pb-3">
            <div>
              <div><strong>Grahak:</strong> {invoice.customer.name}</div>
              {invoice.customer.phone && <div><strong>Phone:</strong> {invoice.customer.phone}</div>}
              {invoice.customer.address && <div><strong>Address:</strong> {invoice.customer.address}</div>}
            </div>
            <div className="text-right">
              <div><strong>Invoice #:</strong> #{invoice.id.slice(-6).toUpperCase()}</div>
              <div><strong>Date:</strong> {new Date(invoice.createdAt).toLocaleDateString()}</div>
              <div><strong>Status:</strong> <span className="font-bold">{invoice.status}</span></div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-300 text-gray-600 text-left">
                <th className="py-2">Item</th>
                <th className="py-2 text-right">Qty</th>
                <th className="py-2 text-right">Rate</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.order.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2 font-medium text-gray-900">{item.product.name}</td>
                  <td className="py-2 text-right text-gray-700">{item.quantity} {item.product.unit}</td>
                  <td className="py-2 text-right text-gray-700">Rs {item.unitPrice}</td>
                  <td className="py-2 text-right font-semibold text-gray-900">Rs {item.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Totals */}
          <div className="border-t-2 border-gray-900 pt-3 flex flex-col gap-1 text-xs">
            <div className="flex justify-between font-bold text-sm text-gray-900">
              <span>Total Bill:</span>
              <span>Rs {invoice.totalAmount.toLocaleString('en-PK')}</span>
            </div>
            <div className="flex justify-between text-green-700 font-semibold">
              <span>Paid Amount:</span>
              <span>Rs {invoice.paidAmount.toLocaleString('en-PK')}</span>
            </div>
            <div className="flex justify-between text-red-600 font-bold">
              <span>Balance Due (Udhaar):</span>
              <span>Rs {remaining.toLocaleString('en-PK')}</span>
            </div>
          </div>

          {invoice.order.note && (
            <div className="text-[0.75rem] text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
              <strong>Note:</strong> {invoice.order.note}
            </div>
          )}

          <div className="text-center text-[0.7rem] text-gray-500 pt-2 border-t border-gray-100">
            Shukriya! Phir Tashreef Layien 🙏
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-lg border border-border bg-transparent text-text-secondary hover:bg-bg cursor-pointer transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="py-2.5 px-5 rounded-lg border-none bg-primary text-white font-semibold hover:bg-primary-hover cursor-pointer transition-colors min-h-11 flex items-center gap-2"
          >
            🖨️ Bill Print Karein
          </button>
        </div>
      </div>
    </Modal>
  )
}
