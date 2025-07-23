import { Route, Routes } from "react-router";
import ProtectedRoute from "./lib/components/ProtectedRoute";
import RootLayout from "./_root/RootLayout";
import AuthLayout from "./_auth/AuthLayout";
import { Dashboard } from "./_root/pages";
import Login from "./_auth/forms/Login";

const App = () => {

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RootLayout />}>
            <Route path="/" element={<Dashboard />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
};

export default App;