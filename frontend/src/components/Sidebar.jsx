import { useState } from 'react';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { PieChart, Home, NotebookPen, LogOut, BadgeIndianRupee, Settings, UserPlus, List } from "lucide-react";

export default function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "Admin";
  const isUser = user.role === "User";

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      {!isOpen && (
        <button onClick={toggleSidebar} className="fixed rounded-full top-2 left-2 z-50 bg-blue-800 px-2 py-2 text-white">
          <FiChevronRight />
        </button>
      )}

      <div
        className={`bg-[#011638] fixed top-0 left-0 z-40 min-h-screen transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-0 -translate-x-full md:translate-x-0'
        }`}
      >
        <div className={`flex h-16 ${isOpen ? 'border-b border-gray-700' : ''} justify-between items-center px-4 py-4`}>
          {isOpen ? (
            <h2 className="text-xl text-white font-bold flex items-center gap-2">
              <Home className="h-5 w-5" />
              ROF
            </h2>
          ) : (
            <button onClick={toggleSidebar} className="text-2xl text-white w-10">
              <FiChevronRight />
            </button>
          )}
          {isOpen && (
            <button onClick={toggleSidebar} className="text-2xl text-white w-10">
              <FiChevronLeft />
            </button>
          )}
        </div>

        {isOpen && (
          <ul className="mt-4 px-4 space-y-2">
            {/* Admin-only routes */}
            {isAdmin && (
              <>
                <li>
                  <Link to="/">
                    <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-100 hover:text-gray-900 hover:bg-gray-100">
                      <PieChart className="mr-2 h-4 w-4" />
                      Dashboard
                    </button>
                  </Link>
                </li>
                <li>
                  <Link to="/getentry">
                    <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-100 hover:text-gray-900 hover:bg-gray-100">
                      <List className="mr-2 h-4 w-4" />
                      Entries
                    </button>
                  </Link>
                </li>
                <li>
                  <Link to="/records">
                    <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-100 hover:text-gray-900 hover:bg-gray-100">
                      <NotebookPen className="mr-2 h-4 w-4" />
                      Records
                    </button>
                  </Link>
                </li>
                <li>
                  <Link to="/payments">
                    <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-100 hover:text-gray-900 hover:bg-gray-100">
                      <BadgeIndianRupee className="mr-2 h-4 w-4" />
                      Payments
                    </button>
                  </Link>
                </li>
                
                <li>
                  <Link to="/settings">
                    <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-100 hover:text-gray-900 hover:bg-gray-100">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </button>
                  </Link>
                </li>
                
              </>
            )}
            {isUser && (
              <>
              <li>
                  <Link to="/addentry">
                    <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-100 hover:text-gray-900 hover:bg-gray-100">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add Entry
                    </button>
                  </Link>
                </li>
            <li>
                  <Link to="/settings">
                    <button className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-100 hover:text-gray-900 hover:bg-gray-100">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </button>
                  </Link>
                </li>
            </>
            )}    

            {/* Logout is visible to everyone */}
            <li>
              <button onClick={handleLogout} className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-100 hover:text-gray-900 hover:bg-gray-100">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </li>
          </ul>
        )}
      </div>
    </>
  );
}
