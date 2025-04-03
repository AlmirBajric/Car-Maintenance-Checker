"use client";

import { useState, useEffect, JSX } from "react";
import { useRouter } from "next/navigation";


interface Car {
  make: string;
  model: string;
  year: string;
  vin: string;
}

interface MaintenanceRecord {
  vin: string;
  service: string;
  date: string;
  cost: string;
  notes?: string;
}

interface Notification {
  vin: string;
  notificationDate: string;
  message: string;
}

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [cars, setCars] = useState<Car[]>([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState<MaintenanceRecord[]>([]);
  const [newCar, setNewCar] = useState<Car>({ make: "", model: "", year: "", vin: "" });
  const [maintenanceData, setMaintenanceData] = useState<Partial<MaintenanceRecord>>({});
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [notificationData, setNotificationData] = useState<Partial<Notification>>({
    vin: "",
    notificationDate: "",
    message: "",
  });

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSetNotification = async () => {
    if (!notificationData.vin || !notificationData.notificationDate || !notificationData.message) {
      alert("All fields are required.");
      return;
    }

    const response = await fetch("http://localhost:5001/set-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...notificationData, username }),
    });

    if (response.ok) {
      alert("Notification set successfully!");
      setNotificationData({ vin: "", notificationDate: "", message: "" });
      closeModal();
    } else {
      alert("Failed to set notification.");
    }
  }

  // Handle login
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const response = await fetch("http://localhost:5001/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      localStorage.setItem("username", username);
      setIsLoggedIn(true);
      loadCars();
      loadMaintenanceRecords();
    } else {
      alert("Invalid credentials. Please try again.");
    }
  };

  // Handle register
  const handleRegister = async () => {
    const response = await fetch("http://localhost:5001/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername, password: newPassword }),
    });

    if (response.ok) {
      alert("Registration successful! You can now log in.");
      setIsRegister(false);
    } else {
      alert("Registration failed. Please try again.");
    }
  };

  // Load cars for the logged-in user
  const loadCars = async () => {
    const storedUsername = localStorage.getItem("username");
    const response = await fetch(`http://localhost:5001/get-cars?username=${storedUsername}`);
    if (response.ok) {
      const data = await response.json();
      setCars(data);
    }
  };

  // Load maintenance records
  const loadMaintenanceRecords = async () => {
    const storedUsername = localStorage.getItem("username");
    const response = await fetch(`http://localhost:5001/get-maintenance?username=${storedUsername}`);
    if (response.ok) {
      const data = await response.json();
      setMaintenanceRecords(data);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("username");
    setIsLoggedIn(false);
  };

  // Add a new car
  const handleAddCar = async () => {
    if (username) {
      const response = await fetch("http://localhost:5001/add-car", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newCar, username }),
      });

      if (response.ok) {
        alert("Car added successfully!");
        setNewCar({ make: "", model: "", year: "", vin: "" }); // Reset form
        loadCars();
      } else {
        alert("Failed to add car.");
      }
    }
  };

  // Remove a car
  const handleRemoveCar = async (vin: string) => {
    try {
      const response = await fetch("http://localhost:5001/remove-car", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin, username }),
      });
  
      if (response.ok) {
        alert("Car removed successfully!");
        loadCars();
      } else {
        const errorData = await response.json();
        alert(`Failed to remove car: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Failed to remove car: Network error");
    }
  };
  
  
  
  // Log maintenance task
  const handleLogMaintenance = async () => {
    const response = await fetch("http://localhost:5001/log-maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...maintenanceData, username }),
    });

    if (response.ok) {
      alert("Maintenance task logged successfully!");
      loadMaintenanceRecords();
    } else {
      alert("Failed to log maintenance task.");
    }
  };

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (storedUsername) {
      setIsLoggedIn(true);
      setUsername(storedUsername);
      loadCars();
      loadMaintenanceRecords();
    }
  }, []);

  if (!isLoggedIn) {
    // Login/Register page
    return (
      <div className="car-theme min-h-screen flex items-center justify-center bg-[url('/images/back.avif')] bg-cover">
        <div className="overlay w-full h-full fixed top-0 left-0 z-0 bg-black opacity-60"></div>
        <div className="max-w-md w-full space-y-8 fade-in relative z-10 bg-white p-8 rounded-lg shadow-2xl">
          {!isRegister ? (
            <>
              <div className="text-center">
                <h2 className="text-4xl font-extrabold text-gray-900">
                  Welcome Back to CarCare!
                </h2>
                <p className="mt-2 text-lg text-gray-600">
                  Or{" "}
                  <button
                    onClick={() => setIsRegister(true)}
                    className="font-medium text-yellow-600 hover:text-yellow-500"
                  >
                    register here
                  </button>
                </p>
              </div>
              <form onSubmit={handleLogin} className="mt-8 space-y-6">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-3 border rounded-lg"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-3 border rounded-lg"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-yellow-500 text-white px-4 py-3 rounded-lg hover:bg-yellow-600"
                >
                  Sign In
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center">
                <h2 className="text-4xl font-extrabold text-gray-900">
                  Register for CarCare
                </h2>
                <p className="mt-2 text-lg text-gray-600">
                  Already have an account?{" "}
                  <button
                    onClick={() => setIsRegister(false)}
                    className="font-medium text-yellow-600 hover:text-yellow-500"
                  >
                    Sign in
                  </button>
                </p>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="New Username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-3 border rounded-lg"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-3 border rounded-lg"
                />
                <button
                  onClick={handleRegister}
                  className="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600"
                >
                  Register
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
  

  // Main page after login
return (
  <div>
    <header className="bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white py-4 shadow-md">
  <div className="container mx-auto flex justify-between items-center">
    <h1 className="text-3xl font-bold">CarCare Tracker</h1>
    <div className="flex space-x-4">
      <button
        onClick={openModal}
        className="bg-yellow-500 px-4 py-2 rounded-lg text-white hover:bg-yellow-600 transition duration-300 ease-in-out transform hover:scale-105"
      >
        Set Notification
      </button>
      <button
        onClick={handleLogout}
        className="bg-red-500 px-4 py-2 rounded-lg text-white hover:bg-red-600 transition duration-300 ease-in-out transform hover:scale-105"
      >
        Logout
      </button>
    </div>
  </div>
</header>


    <main className="container mx-auto py-16">
      <h2 className="text-2xl font-bold mb-8">Your Car Profiles</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  {cars.map((car, index) => (
    <div
      key={index}
      className="bg-gradient-to-br from-gray-200 to-gray-400 shadow-lg rounded-lg p-6"
      
    >
      
      <h3 className="text-xl font-bold text-gray-800">{car.make} {car.model}</h3>
      <p className="text-gray-700">Year: {car.year}</p>
      <p className="text-gray-700">VIN: {car.vin}</p>
      <button
        onClick={() => handleRemoveCar(car.vin)}
        className="mt-4 bg-red-500 px-4 py-2 rounded-lg text-white hover:bg-red-600"
      >
        Remove Car
      </button>
    </div>
  ))}
</div>


      <h2 className="text-2xl font-bold mt-16 mb-8">Add New Car</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAddCar();
        }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white shadow-lg p-6 rounded-lg"
      >
        <input
          type="text"
          placeholder="Make"
          value={newCar.make}
          onChange={(e) => setNewCar({ ...newCar, make: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
        <input
          type="text"
          placeholder="Model"
          value={newCar.model}
          onChange={(e) => setNewCar({ ...newCar, model: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
        <input
          type="text"
          placeholder="Year"
          value={newCar.year}
          onChange={(e) => setNewCar({ ...newCar, year: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
        <input
          type="text"
          placeholder="VIN"
          value={newCar.vin}
          onChange={(e) => setNewCar({ ...newCar, vin: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          required
        />
        <button
          type="submit"
          className="col-span-full bg-green-500 px-4 py-2 rounded-lg text-white"
        >
          Add Car
        </button>
      </form>

      <h2 className="text-2xl font-bold mt-16 mb-8">Log Maintenance</h2>
<form
  onSubmit={(e) => {
    e.preventDefault();
    handleLogMaintenance();
  }}
  className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white shadow-lg p-6 rounded-lg"
>
  <select
    className="w-full px-3 py-2 border rounded-lg"
    onChange={(e) => setMaintenanceData({ ...maintenanceData, vin: e.target.value })}
  >
    <option value="">Select Car</option>
    {cars.map((car, index) => (
      <option key={index} value={car.vin}>
        {car.make} {car.model} ({car.year})
      </option>
    ))}
  </select>
  <select
    className="w-full px-3 py-2 border rounded-lg"
    onChange={(e) => {
      const selectedOption = e.target.options[e.target.selectedIndex];
      const serviceCost = selectedOption.getAttribute("data-cost");
      setMaintenanceData({
        ...maintenanceData,
        service: e.target.value,
        cost: serviceCost || "",
      });
    }}
  >
    <option value="">Select Service</option>
    <option value="oil_change" data-cost="50">Oil Change ($50)</option>
    <option value="tire_rotation" data-cost="30">Tire Rotation ($30)</option>
    <option value="brake_repair" data-cost="200">Brake Repair ($200)</option>
  </select>
  <input
    type="date"
    className="w-full px-3 py-2 border rounded-lg"
    onChange={(e) => setMaintenanceData({ ...maintenanceData, date: e.target.value })}
    required
  />
  <textarea
    className="w-full px-3 py-2 border rounded-lg"
    placeholder="Notes"
    onChange={(e) => setMaintenanceData({ ...maintenanceData, notes: e.target.value })}
  ></textarea>
  <div className="col-span-full flex justify-center">
    <button
      type="submit"
      className="bg-indigo-600 px-4 py-2 rounded-lg text-white hover:bg-indigo-700"
    >
      Log Maintenance
    </button>
  </div>
</form>


      <h2 className="text-2xl font-bold mt-16 mb-8">Maintenance History</h2>
      <table className="w-full border-collapse bg-white shadow-lg rounded-lg">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">Car</th>
            <th className="border px-4 py-2">VIN</th>
            <th className="border px-4 py-2">Service</th>
            <th className="border px-4 py-2">Date</th>
            <th className="border px-4 py-2">Cost</th>
            <th className="border px-4 py-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {maintenanceRecords.map((record, index) => (
            <tr key={index}>
              <td className="border px-4 py-2">
                {cars.find((car) => car.vin === record.vin)?.make || "Unknown Car"}
              </td>
              <td className="border px-4 py-2">{record.vin}</td>
              <td className="border px-4 py-2">{record.service}</td>
              <td className="border px-4 py-2">{record.date}</td>
              <td className="border px-4 py-2">${record.cost}</td>
              <td className="border px-4 py-2">{record.notes || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>

    {/* Modal for setting notifications */}
    {isModalOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <h2 className="text-2xl font-bold mb-4">Set Notification</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSetNotification();
        }}
        className="space-y-4"
      >
        <select
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          onChange={(e) => setNotificationData({ ...notificationData, vin: e.target.value })}
          value={notificationData.vin}
          required
        >
          <option value="">Select Car</option>
          {cars.map((car, index) => (
            <option key={index} value={car.vin}>
              {car.make} {car.model} ({car.year})
            </option>
          ))}
        </select>
        <input
          type="date"
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          onChange={(e) => setNotificationData({ ...notificationData, notificationDate: e.target.value })}
          value={notificationData.notificationDate}
          required
        />
        <textarea
          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          placeholder="Enter your notification message"
          onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
          value={notificationData.message}
          required
        ></textarea>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={closeModal}
            className="bg-gray-500 px-4 py-2 rounded-lg text-white hover:bg-gray-600 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-indigo-600 px-4 py-2 rounded-lg text-white hover:bg-indigo-700 transition"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
)}

  </div>
);
}

