import { SignedIn, UserButton, useUser } from '@clerk/clerk-react'

const Header = () => {
  const { user, isLoaded } = useUser();
  return (
    <header className="shadow-lg border-b border-slate-200">
        <SignedIn>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-10 h-10 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">UP</span>
                </div>
                <div>
                  <h1 className="font-bold">Comissão</h1>
                  <p className="text-sm">Dashboard</p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <div className="text-right">
                  <h2 className="text-lg font-semibold">
                    Olá,{" "}
                    {isLoaded ? user?.fullName || user?.username || "User" : "Loading..."}
                  </h2>
                  <p className="text-sm">Bem-vindo de volta!</p>
                </div>
                <div className="transform hover:scale-105 transition-transform duration-200">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10 ring-2 ring-blue-100 hover:ring-blue-200 transition-all"
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </SignedIn>
      </header>
  )
}

export default Header