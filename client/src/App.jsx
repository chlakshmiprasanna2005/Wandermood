import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Navbar, Footer, Protected } from "./components.jsx";
import Home from "./pages/Home.jsx";
import { Destinations, DestinationDetail } from "./pages/Destinations.jsx";
import PackageDetail from "./pages/PackageDetail.jsx";
import { Hotels, Flights } from "./pages/Booking.jsx";
import Checkout from "./pages/Checkout.jsx";
import Itinerary from "./pages/Itinerary.jsx";
import Gallery from "./pages/Gallery.jsx";
import { Login, Register, Profile } from "./pages/Account.jsx";
import Contact from "./pages/Contact.jsx";
import Admin from "./pages/Admin.jsx";

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/destinations" element={<Destinations />} />
          <Route path="/destinations/:id" element={<DestinationDetail />} />
          <Route path="/packages/:id" element={<PackageDetail />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/flights" element={<Flights />} />
          <Route path="/itinerary" element={<Itinerary />} />
          <Route path="/itinerary/:id" element={<Itinerary />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              <Protected>
                <Profile />
              </Protected>
            }
          />
          <Route path="/contact" element={<Contact />} />
          <Route
            path="/admin"
            element={
              <Protected admin>
                <Admin />
              </Protected>
            }
          />
          <Route
            path="*"
            element={
              <div className="wrap section center">
                <h1>Lost the trail</h1>
                <p className="muted">That page doesn't exist.</p>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
