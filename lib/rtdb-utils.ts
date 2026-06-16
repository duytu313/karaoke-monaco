import { equalTo, get, orderByChild, query as rtdbQuery, ref } from "firebase/database"
import { rtdb } from "./firebase"

export type BookingRecord = Record<string, any>

export async function fetchUserBookings(userId: string) {
  const bookingsRef = ref(rtdb, "bookings")
  const userQuery = rtdbQuery(bookingsRef, orderByChild("userId"), equalTo(userId))

  try {
    const snapshot = await get(userQuery)
    if (!snapshot.exists()) return null
    return snapshot.val() as BookingRecord
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn hàng:", error)
    return null
  }
}
