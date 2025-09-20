import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './layouts/DashboardLayout';
import RecordManagement from './pages/Records';
import LoginPage from './pages/Login';
import PrivateRoute from './components/PrivateRoute';
import PaymentRecords from './pages/PaymentRecords';
import Settings from './pages/Settings';
import Entry from './pages/Entry';
import GetEntry from './pages/GetEntry';


function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage />
          }
        />
        {/* Protected Layout with Sidebar */}
        
        <Route path="/settings" element={<DashboardLayout>
            <Settings />
          </DashboardLayout>} />
        <Route element={<PrivateRoute allowedRoles={["User"]} />}>
          <Route path="/addentry" element={<DashboardLayout>
            <Entry />
          </DashboardLayout>} />
        </Route>
        <Route element={<PrivateRoute allowedRoles={["Admin"]} />}>
          <Route path="/" element={<DashboardLayout>
            <Dashboard />
          </DashboardLayout>} />
          <Route path="/getentry" element={<DashboardLayout>
            <GetEntry/>
          </DashboardLayout>} />
          <Route path="/records" element={<DashboardLayout>
            <RecordManagement />
          </DashboardLayout>} />
          <Route path="/payments" element={<DashboardLayout>
            <PaymentRecords />
          </DashboardLayout>} />
          
        </Route>


      </Routes>
    </Router>
  );
}

export default App;

