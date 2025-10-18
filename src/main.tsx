import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { StoryConfigProvider } from "./contexts/StoryConfigContext.tsx";
import { AgeBandProvider } from "./contexts/AgeBandContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StoryConfigProvider>
    <AgeBandProvider>
      <App />
    </AgeBandProvider>
  </StoryConfigProvider>
);
