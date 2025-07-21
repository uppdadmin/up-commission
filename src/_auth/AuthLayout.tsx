import { SignedIn, SignedOut } from "@clerk/clerk-react"; // Assuming you've installed @clerk/clerk-react
import { Navigate, Outlet } from "react-router";

const AuthLayout = () => {
  return (
    <>
      <div className="authLayout">
        <SignedIn>
          {/* If the user is signed in, navigate to the home page */}
          <Navigate to="/" />
        </SignedIn>
        <SignedOut>
          {/* If the user is signed out, show the authentication layout */}
          <section>
            <Outlet />
          </section>
        </SignedOut>
      </div>
    </>
  );
};

export default AuthLayout;
