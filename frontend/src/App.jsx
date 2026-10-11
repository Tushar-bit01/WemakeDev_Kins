import React from 'react';
import {Route,Routes} from 'react-router-dom';
import Home from './pages/home/Home.jsx';
import Design from './pages/design/Design.jsx';
import SignUp from './pages/signup/SignUp.jsx';
import Pricing from './pages/Pricing/Pricing.jsx';
import CustomerProfile from './pages/design/CustomerProfile.jsx';
import VendorProfile from './pages/vendor/VendorProfile.jsx';
import VendorDashboard from './pages/vendor/VendorDashboard.jsx';
import SignUpVendor from './pages/signup/SignUpVendor.jsx';
import LoginVendor from './pages/signup/LoginVendor.jsx';
import LoginCustomer from './pages/signup/LoginCustomer.jsx';
import VendorCustomerView from './pages/vendor/VendorCustomerView.jsx';
import CustomerInviteLanding from './pages/design/CustomerInviteLanding.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

const App = () => {
  return (
    <div>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home/>} />
        <Route path="/signup" element={<SignUp/>}/>
        <Route path="/login" element={<LoginCustomer/>}/>
        <Route path="/vendor/signup" element={<SignUpVendor/>}/>
        <Route path="/vendor/login" element={<LoginVendor/>}/>
        <Route path='/pricing' element={<Pricing/>}/>
        <Route path="/invite/:token" element={<CustomerInviteLanding/>} />

        {/* Protected */}
        <Route path="/design" element={<ProtectedRoute><Design/></ProtectedRoute>}/>
        <Route path='/profile' element={<ProtectedRoute><CustomerProfile/></ProtectedRoute>}/>
        <Route path='/vendor/profile' element={<ProtectedRoute><VendorProfile/></ProtectedRoute>}/>
        <Route path='/vendor/dashboard' element={<ProtectedRoute><VendorDashboard/></ProtectedRoute>}/>
        <Route path="/vendor/customer/:customerId" element={<ProtectedRoute><VendorCustomerView/></ProtectedRoute>}/>
      </Routes>
    </div>
  );
};

export default App