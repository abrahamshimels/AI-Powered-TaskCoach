// src/App.jsx
import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header/Header";
import AppRoutes from "./routes/Routes";
import { AuthContext } from "./context/AuthContext";


function App() {
  const { authMessage } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (authMessage) {
      navigate("/login", { replace: true });
    }
  }, [authMessage, navigate]);

  return (
    <div className="App">
      <Header />
      <AppRoutes />
    </div>
  );
}

export default App;
