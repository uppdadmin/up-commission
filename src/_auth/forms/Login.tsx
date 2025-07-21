import { SignedIn, SignedOut, SignInButton } from "@clerk/clerk-react";
import { Navigate } from "react-router";

const Login = () => {
  return (
    <div className="flex flex-col w-screen h-screen items-center justify-center  text-white">
      <div className="max-w-md w-full rounded-xl shadow-2xl p-8 space-y-8 flex flex-col items-center justify-center text-center">
        <div>
          <h2 className="mt-2 text-sm">
            Faça login para acessar seu painel
          </h2>
        </div>
        <SignedIn>
          {/* If the user is signed in, navigate to the home page */}
          <Navigate to="/" />
        </SignedIn>
        <SignedOut>
          <div className="space-y-6 flex flex-col items-center w-full">
            <div className="login-button flex justify-center w-full">
              <SignInButton mode="modal">
                <button className="group relative w-full flex justify-center py-4 px-6 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 ease-in-out shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0">
                  <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                    <svg
                      className="h-5 w-5 group-hover:text-indigo-200 transition-colors duration-200"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  Entrar
                </button>
              </SignInButton>
            </div>

            <div>
              <p className="clerk-auth">
                Secure authentication powered by Clerk
              </p>
            </div>
          </div>
        </SignedOut>
      </div>
    </div>
  );
};

export default Login;
