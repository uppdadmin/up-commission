// import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';

import { Route, Routes } from "react-router"
import ProtectedRoute from "./lib/components/ProtectedRoute"
import RootLayout from "./_root/RootLayout"
import AuthLayout from "./_auth/AuthLayout"
import { Dashboard } from "./_root/pages"
import Login from "./_auth/forms/Login"
import Dashboards from "./_root/pages/Dashboards"

const App = () => {
  return (
    <Routes>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
        </Route>
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
            <Route element={<RootLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboards />} />
            </Route>
        </Route>
    </Routes>
  )
}

export default App

// export default function App() {
//   return (
//     <header>
//       <SignedOut>
//         <SignInButton />
//       </SignedOut>
//       <SignedIn>
//         <UserButton />
//       </SignedIn>
//     </header>
//   );
// }
