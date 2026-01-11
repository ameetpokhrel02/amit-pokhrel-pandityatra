import { useEffect, useState } from "react"
import api from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("ALL")

  const loadBookings = async () => {
    setLoading(true)
    const res = await api.get("/bookings/")
    setBookings(res.data)
    setLoading(false)
  }

  useEffect(() => {
    loadBookings()
  }, [])

  const cancelBooking = async (id: number) => {
    if (!confirm("Cancel this booking?")) return
    await api.patch(`/bookings/${id}/cancel/`)
    loadBookings()
  }

  const filtered = bookings.filter(b => {
    if (status !== "ALL" && b.status !== status) return false
    if (search && !(`${b.user.full_name} ${b.pandit.full_name}`.toLowerCase().includes(search.toLowerCase())))
      return false
    return true
  })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Booking Management</h1>

      <div className="flex gap-4 mb-4">
        <Input placeholder="Search user / pandit" value={search} onChange={e => setSearch(e.target.value)} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">ID</th>
              <th>User</th>
              <th>Pandit</th>
              <th>Service</th>
              <th>Date</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(b => (
              <tr key={b.id} className="border-t">
                <td className="p-3">#{b.id}</td>
                <td>{b.user.full_name}</td>
                <td>{b.pandit.full_name}</td>
                <td>{b.service_name}</td>
                <td>{b.booking_date} {b.booking_time}</td>
                <td>
                  <span className={`px-2 py-1 rounded text-xs ${
                    b.status === "COMPLETED" ? "bg-green-100" :
                    b.status === "PENDING" ? "bg-yellow-100" :
                    b.status === "CANCELLED" ? "bg-red-100" : "bg-blue-100"
                  }`}>
                    {b.status}
                  </span>
                </td>
                <td>{b.payment_status ? "Paid" : "Unpaid"}</td>
                <td className="flex gap-2 p-2">
                  {b.video_room_url && (
                    <a href={b.video_room_url} target="_blank">
                      <Button size="sm" variant="outline">Join</Button>
                    </a>
                  )}

                  {b.status === "PENDING" && (
                    <Button size="sm" variant="destructive" onClick={() => cancelBooking(b.id)}>
                      Cancel
                    </Button>
                  )}

                  {b.payment_status && b.status === "CANCELLED" && (
                    <Button size="sm" className="bg-orange-500 text-white">
                      Refund
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && <p className="p-4 text-center">Loading…</p>}
      </div>
    </div>
  )
}
