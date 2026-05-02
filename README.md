# 🗺️ Singapore Hawker Centre Explorer

**Live Demo:** [👉 Click here to view the live app!](https://sghawkerexplorer.netlify.app/)
*(Note: If the live link is temporarily down due to Netlify's free-tier build limits, please refer to the Local Setup Instructions below to run the app in under a minute!)*

An interactive, data-driven web application designed to visualize and explore Hawker Centres across Singapore. Built with React and Leaflet, this tool goes beyond basic pin-mapping by offering regional segmentation, density visualization, and live statistical tracking.

---

## ✨ Key Features & Walkthrough

### 1. Omni-Search Engine
The application features a powerful, real-time search bar that filters the dataset instantly. You are not limited to just names; the search parses multiple data points simultaneously.
* **How it works:** Type in a hawker centre's name (e.g., "Maxwell"), a postal code (e.g., "069184"), or a street address. The map and the underlying data layer update instantly to isolate matching locations.
* *<img width="1350" height="805" alt="Screenshot 2026-05-02 114105" src="https://github.com/user-attachments/assets/6a42e2f0-b4af-4e54-a45c-1b22966037d7" />*

### 2. Density Visualization & Status Tracking
Instead of static map markers, the application visualizes data density using proportional markers.
* **How it works:** By switching the view mode to "Density Map," the standard pins are replaced with dynamic bubbles. The size and central number of each bubble are directly proportional to the exact number of cooked food stalls at that specific centre. 
* **Status Color-Coding:** The map automatically reads the construction status of each location. Established centres are rendered in **Blue**, while **New or Under-Construction** centres are highlighted in **Amber/Yellow**, allowing users to instantly spot upcoming food hubs.
* *<img width="1096" height="610" alt="Screenshot 2026-05-02 114312" src="https://github.com/user-attachments/assets/558b371b-2434-4a93-b951-f2c48b3d3568" />*

### 3. Geographical Segmentation (Region Lines)
Singapore is divided into five main planning regions. This application visually maps these boundaries using custom, interlocking polygon coordinates to help users understand spatial distribution.
* **How it works:** Users can easily toggle the "Region Lines" checkbox in the control panel to draw precise geographical boundaries over the map (Central, East, West, North, North-East). The logic ensures exact longitudinal clipping (e.g., the West/Central divide at 103.75) to prevent visual overlap, while the data categorization correctly groups border-line centres into their proper jurisdictions.
* *<img width="1865" height="801" alt="Screenshot 2026-05-02 114445" src="https://github.com/user-attachments/assets/88a32431-cfe6-4faa-8b99-6771e8eeb54b" />

### 4. Multi-Selection & Filtering Tray
Users can curate their own list of hawker centres for comparison or trip planning.
* **How it works:** Clicking on any map marker selects that centre and pins it to a sticky "Selection Tray" at the bottom of the screen. Checking the "Only Selected" box immediately hides all other pins on the map without altering the user's current zoom level or viewport.
* *<img width="1908" height="424" alt="Screenshot 2026-05-02 115011" src="https://github.com/user-attachments/assets/9f62813c-99ce-40d8-94ed-8ba5eb9eacd4" />*

### 5. Live Statistics Dashboard
The header is not just a title; it is a live data dashboard that responds to user interaction.
* **How it works:** As you search, filter by region, or toggle the "Only Selected" view, the header dynamically recalculates the exact number of "Visible Centres" and the total aggregate "Food Stalls" currently rendered on the map.
* *<img width="1070" height="663" alt="Screenshot 2026-05-02 115051" src="https://github.com/user-attachments/assets/21f6e9b9-0d1d-4789-aa3d-41805312512c" />*

### 6. Bulk Layer Management
For users who want to see raw geographical data or isolate specific areas, the map includes bulk toggle controls.
* **How it works:** The "Hide All Markers" button instantly clears the map. Users can then use the Leaflet layer controls (top right) to selectively turn on specific regions (e.g., viewing only the "East Area" centres) to compare regional densities.
* *<img width="317" height="194" alt="Screenshot 2026-05-02 114718" src="https://github.com/user-attachments/assets/ef56e694-9946-446e-acd6-86b2b4ebfff1" />
*

---

## 🛠️ Technical Architecture

This project was built with a strong focus on **Code Readability**, **Maintainability**, and **Separation of Concerns**. The monolithic structure was refactored into modular components:

* `App.jsx`: The "Brain" handling state management, data fetching, and filtering logic.
* `HawkerMap.jsx`: Encapsulates all Leaflet logic, polygon rendering, and dynamic marker clustering. Includes custom zoom-prevention logic during filtering.
* `Header.jsx`: Manages the UI for user inputs, view toggles, and live statistics.
* `HawkerCard.jsx`: A reusable component for the interactive popups and tooltips, utilizing responsive UI design.
* `SelectionPanel.jsx`: Manages the state and user interface for the bottom selection tray.

### Tech Stack
* **Framework:** React 19 + Vite
* **Mapping:** React-Leaflet + Leaflet.js
* **Clustering:** React-Leaflet-Cluster
* **Styling:** Tailwind CSS + PostCSS
* **Deployment:** Netlify

---

## 🚀 Local Setup Instructions

To run this project locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/agukaGorilla/Singapore-Hawker-Centre-Map.git

2. **Navigate to the project directory:**
   ```bash
   cd Singapore-Hawker-Centre-Map/hawker-map

3. **Install dependencies:**
   ```bash
   npm install

4. **Start the development server:**
   ```bash
   npm run dev

5. **Navigate to the link**
   Open the application and navigate to the provided local link
   

## 📊 Data Source
Data is served locally via hawkers.json in the /public directory to ensure fast, reliable loading times during the assessment evaluation without relying on external API rate limits.
