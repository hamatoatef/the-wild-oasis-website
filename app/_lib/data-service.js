import { eachDayOfInterval } from "date-fns";
import pool from "../_utils/db";
import { notFound } from "next/navigation";

/////////////
// GET

export async function getCabin(id) {
  const client = await pool.connect();
  try {
    const result = await client.query(`select * from cabins where id=${id}`);
    const cabin = result.rows[0];

    const imageURL = `/${cabin.image}`;
    const cabinWithImageURL = { ...cabin, image: imageURL };
    return cabinWithImageURL;
  } catch (error) {
    console.log("error" + error);
    notFound();
  } finally {
    client.release();
  }
}

export const getCabins = async function () {
  const client = await pool.connect();
  try {
    const result = await client.query("select * from cabins");
    const cabins = result.rows;

    const cabinsWithImageURL = cabins.map((cabin) => {
      // Create the URL for the image
      const imageURL = `/${cabin.image}`;
      // Return the cabin data with the image URL
      return {
        ...cabin,
        image: imageURL,
      };
    });
    return cabinsWithImageURL;
  } catch (error) {
    console.log("error" + error);
  } finally {
    client.release();
  }
};

export async function getCabinPrice(id) {
  const { data, error } = await supabase
    .from("cabins")
    .select("regularPrice, discount")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
  }

  return data;
}

// Guests are uniquely identified by their email address
export async function getGuest(email) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * from guests where email like '${email}'`
    );

    return result.rows[0];
  } catch (error) {
    throw new error();
  } finally {
    client.release();
  }
}

export async function getBooking(id) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      ` select * 
        from booking  
        where id=${id}
        `
    );

    const booking = result.rows[0];

    return booking;
  } catch (error) {
    throw new error();
  } finally {
    client.release();
  }
}

export async function getBookings(guestId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      ` select b.id, b.create_at, startdate, enddate, numnights, numguests, totalprice,
        guestid, cabinid , name , image 
        from booking b 
        join cabins c 
        on (b.cabinid = c.id)
        where guestid=${guestId}
        order by startdate`
    );

    const bookings = result.rows;

    const cabinsWithImageURL = bookings.map((booking) => {
      // Create the URL for the image
      const imageURL = `/${booking.image}`;
      // Return the cabin data with the image URL
      return {
        ...booking,
        image: imageURL,
      };
    });

    return cabinsWithImageURL;
  } catch (error) {
    throw new error();
  } finally {
    client.release();
  }
}

export async function getBookedDatesByCabinId(cabinId) {
  const client = await pool.connect();
  try {
    const result = await client.query(
      `SELECT * from booking where cabinid = ${cabinId} and (startdate > CURRENT_DATE or status = 'checked-in')`
    );
    const bookings = result.rows;

    // Converting to actual dates to be displayed in the date picker
    const bookedDates = bookings
      .map((booking) => {
        return eachDayOfInterval({
          start: new Date(booking.startdate),
          end: new Date(booking.enddate),
        });
      })
      .flat();

    return bookedDates;
  } catch (error) {
    console.log("error" + error);
    notFound();
  } finally {
    client.release();
  }
}

export async function getSettings() {
  const client = await pool.connect();
  try {
    const result = await client.query(`select * from settings`);

    return result.rows[0];
  } catch (error) {
    console.log("error" + error);
    notFound();
  } finally {
    client.release();
  }
}

export async function getCountries() {
  try {
    const res = await fetch(
      "https://restcountries.com/v2/all?fields=name,flag"
    );
    const countries = await res.json();
    return countries;
  } catch {
    throw new Error("Could not fetch countries");
  }
}

/////////////
// CREATE

export async function createGuest(newGuest) {
  const client = await pool.connect();
  try {
    const { email, fullname } = newGuest;
    const result = await client.query(
      `insert into guests (email , fullname) values ('${email}' , '${fullname}')`
    );

    return "success";
  } catch (error) {
    console.log("error" + error);
  } finally {
    client.release();
  }
}

export async function createBooking(newBooking) {
  const { data, error } = await supabase
    .from("bookings")
    .insert([newBooking])
    // So that the newly created object gets returned!
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Booking could not be created");
  }

  return data;
}

/////////////
// UPDATE

// The updatedFields is an object which should ONLY contain the updated data
export async function updateGuest(id, updatedFields) {
  const { data, error } = await supabase
    .from("guests")
    .update(updatedFields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Guest could not be updated");
  }
  return data;
}

export async function updateBookincreateGuestg(id, updatedFields) {
  const { data, error } = await supabase
    .from("bookings")
    .update(updatedFields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw new Error("Booking could not be updated");
  }
  return data;
}

/////////////
// DELETE

export async function deleteBooking(id) {
  const { data, error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) {
    console.error(error);
    throw new Error("Booking could not be deleted");
  }
  return data;
}
