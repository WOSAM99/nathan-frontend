import { Switch, Route } from "wouter";
import { CssBaseline } from "@mui/material";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFoundPage from "@/pages/NotFoundPage";
import { SnackbarProvider } from "notistack";

import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import ProjectSetupPage from "@/pages/ProjectSetupPage";
import PhotoSelectionPage from "@/pages/PhotoSelectionPage";
import DesignWorkspacePage from "@/pages/DesignWorkspacePage";
import { ThemeProvider } from "@mui/material";
import { theme } from "./theme";
import FinalPropertySelection from "./pages/FinalPropertySelectionPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/new-project" component={ProjectSetupPage} />
      <Route path="/organize/:id" component={PhotoSelectionPage} />
      <Route path="/studio/:id" component={DesignWorkspacePage} />
      <Route
        path="/property-selection/:id"
        component={FinalPropertySelection}
      />
      <Route component={NotFoundPage} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider
          maxSnack={3}
          autoHideDuration={3000}
          hideIconVariant
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <AuthProvider>
            <Router />
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
