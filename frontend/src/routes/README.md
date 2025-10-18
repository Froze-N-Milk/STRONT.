**Here is the overall structure of the STRONT webapp, and each page's purpose**

> routes (currently routes2): 
index.tsx: contains the website homepage, with all the restaurants listed and a small section telling restaurant owners to log in.
__root.tsx: contains the navbar display logic & buttons

/$restaurantid/index.tsx: the restaurant homepage (currently /restaurants/$id.index.tsx)
/$restaurantid/make-booking/index.tsx: the make booking page (currently /restaurants/$restaurantid/make-booking/index.tsx)

/account/index.tsx: contains the landing page for the logged in account, displaying that account's restaurants, and letting them change their account settings.
/account/$restaurantid/index.tsx: the edit restaurant profile page (currently account/index.tsx)
/account/$restaurantid/booking-settings/index.tsx: the edit restaurant booking settings page (currently booking-setting)
/account/$restaurantid/FOHtracker/index.tsx: the FoH tracker page (we will probably rename this)
/account/$restaurantid/view-bookings/index.tsx: the booking listing page           

/booking/$bookingid/index.tsx: the page to view/edit a booking (currently booking/upcoming/$restaurantid/index.tsx)

