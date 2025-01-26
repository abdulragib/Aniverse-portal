
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home/Home"; // Your Home component

function App() {
  return (
    <Router>
      <div className="App">
        {/* Main Content */}
        <Routes>
          <Route path="/" element={<Home />} />
          {/* <Route path="/create-series" element={<CreateSeries />} />
          <Route path="/add-episodes" element={<AddEpisodes />} /> */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
