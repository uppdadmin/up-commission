import { SignedIn, UserButton, useUser } from "@clerk/clerk-react";
import Logo from "/public/logo.png";

const Header = () => {
  const { user, isLoaded } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  return (
    <header className="shadow-lg border-b border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <SignedIn>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo Section */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm sm:text-lg">UP</span>
              </div> */}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-md">
                <img
                  src={Logo}
                  alt="Logo"
                  className="w-6 h-6 sm:w-16 sm:h-16 object-contain"
                />
              </div>
              <div>
                <h1 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                  Comissão
                </h1>
                {isAdmin && (
                  <span className="text-xs text-blue-600 dark:text-[#55a6e0] font-medium">
                    Admin
                  </span>
                )}
              </div>
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-3 sm:space-x-6">
              {/* User Info - Hidden on very small screens */}
              <div className="hidden sm:block text-right">
                <h2 className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Olá,{" "}
                  {isLoaded
                    ? user?.firstName ||
                      user?.fullName ||
                      user?.username ||
                      "User"
                    : "Loading..."}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Bem-vindo de volta!
                </p>
              </div>

              {/* Mobile User Info - Shown only on very small screens */}
              <div className="block sm:hidden text-right">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {isLoaded
                    ? user?.firstName || user?.username || "User"
                    : "..."}
                </h2>
                {isAdmin && (
                  <span className="text-xs text-blue-600 dark:text-[#55a6e0] font-medium">
                    Admin
                  </span>
                )}
              </div>

              {/* User Avatar Button */}
              <div className="transform hover:scale-105 transition-transform duration-200">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox:
                        "w-8 h-8 sm:w-10 sm:h-10 ring-2 ring-blue-100 hover:ring-blue-200 dark:ring-blue-800 dark:hover:ring-blue-700 transition-all shadow-md",
                      userButtonPopoverCard:
                        "bg-gray-800 dark:bg-gray-800 dark:border-gray-700",
                      userButtonPopoverMain: "dark:bg-gray-800",
                      userButtonPopoverFooter:
                        "dark:bg-gray-800 dark:border-gray-700",
                      userPreviewMainIdentifier: "dark:text-white",
                      userPreviewSecondaryIdentifier: "dark:text-gray-400",
                      menuItem: "dark:text-gray-300 dark:hover:bg-gray-700",
                      menuItemButton:
                        "dark:text-gray-300 dark:hover:bg-gray-700",
                      userButtonPopoverActionButton:
                        "dark:text-gray-300 dark:hover:bg-gray-700",
                      userButtonPopoverActionButtonText: "dark:text-gray-300",
                      userButtonPopoverActionButtonIcon: "dark:text-gray-400",
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </SignedIn>
    </header>
  );
};

export default Header;
