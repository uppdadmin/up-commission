import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Outlet } from 'react-router';
import SignInForm from '../_auth/forms/SignInForm';


const RootLayout = () => {
  return (
    <>
      <SignedIn>
        <Outlet /> {/* Renders the child route if signed in */}
      </SignedIn>
      <SignedOut>
        <SignInForm />
      </SignedOut>
    </>
  )
}

export default RootLayout