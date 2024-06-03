"use server";

import { revalidatePath } from "next/cache";
import pool from "../_utils/db";
import { auth, signIn, signOut } from "./auth";
import { getBookings } from "./data-service";
import { redirect } from "next/navigation";

function formatDate(inputDate) {
  const date = new Date(inputDate);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // getMonth() is zero-based
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function updateGuest(formData) {
  // console.log(formData);
  const session = await auth();
  if (!session) throw new Error("you must be logged in");

  const nationalid = formData.get("nationalid");
  const [nationality, countryflag] = formData.get("nationality").split("%");

  if (!/^[a-zA-Z0-9]{6,12}$/.test(nationalid))
    throw new Error("Please provide a valid national ID");

  const updateData = { nationality, countryflag, nationalid };

  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE guests 
      SET nationalid = '${nationalid}', 
          countryflag = '${countryflag}', 
          nationality = '${nationality}' 
      WHERE id = ${session.user.guestId}`
    );

    revalidatePath("/account/profile");
  } catch (error) {
    throw new Error("Guest could not be updated");
  } finally {
    client.release();
  }
}

export async function signInAction() {
  await signIn("google", { redirectTo: "/account" });
}

export async function deleteReservation(bookingId) {
  const session = await auth();
  if (!session) throw new Error("you must be logged in");

  const guestBooking = await getBookings(session.user.guestId);

  const guestBookingsId = guestBooking.map((booking) => booking.id);

  if (!guestBookingsId.includes(bookingId))
    throw new Error("you are not allowed to delete this booking");

  const client = await pool.connect();
  try {
    const result = await client.query(
      `delete from booking
      WHERE id = ${bookingId}`
    );
    revalidatePath("/account/reservations");
  } catch (error) {
    throw new Error("Booking could not be deleted");
  } finally {
    client.release();
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function updateBooking(formData) {
  const bookingid = Number(formData.get("bookingid"));

  const session = await auth();
  if (!session) throw new Error("you must be logged in");

  const guestBooking = await getBookings(session.user.guestId);

  const guestBookingsId = guestBooking.map((booking) => booking.id);

  if (!guestBookingsId.includes(bookingid))
    throw new Error("you are not allowed to delete this booking");

  const numguests = Number(formData.get("numguests"));
  const observations = formData.get("observations");

  const client = await pool.connect();
  try {
    const result = await client.query(
      `UPDATE booking
          SET numguests = ${numguests},
          observations = '${observations}'
      WHERE id = ${bookingid}`
    );

    revalidatePath(`/account/reservations/edit/${bookingid}`);
    revalidatePath("/account/reservations");
  } catch (error) {
    throw new Error("Booking could not be updated");
  } finally {
    client.release();
  }
  redirect("/account/reservations");
}

export async function createBooking(bookingData, formData) {
  console.log(formData);
  console.log(bookingData);

  const session = await auth();
  if (!session) throw new Error("you must be logged in");

  const guestid = session.user.guestId;

  const numguests = Number(formData.get("numguests"));
  const observations = formData.get("observations") || "";

  const { startdate, enddate, numnights, cabinprice, cabinid } = bookingData;

  const client = await pool.connect();
  try {
    const result = client.query(
      `INSERT INTO booking (startdate, enddate, numnights, numguests, cabinprice ,extrasprice, totalprice, status,hasbreakfast, ispaid,observations,cabinid,guestid) 
      VALUES ('${formatDate(startdate)}','${formatDate(
        enddate
      )}', ${numnights}, ${numguests}, ${cabinprice}, 0,${cabinprice},'unconfirmed' , false, false, '${observations}' , ${cabinid},${guestid})`
    );
  } catch (error) {
    throw new Error("Booking could not be updated");
  } finally {
    client.release();
  }
  revalidatePath(`/cabins/${cabinid}`);
  redirect("/cabins/thankyou");
}
