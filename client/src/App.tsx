import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import { SnackbarProvider } from "notistack";

import AuthPage from "@/pages/AuthPage";
import DashboardPage from "@/pages/DashboardPage";
import ProjectSetupPage from "@/pages/ProjectSetupPage";
import PhotoSelectionPage from "@/pages/PhotoSelectionPage";
import DesignWorkspacePage from "@/pages/DesignWorkspacePage";
import { ThemeProvider } from "@mui/material";
import { theme } from "./theme";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/new-project" component={ProjectSetupPage} />
      <Route path="/organize" component={PhotoSelectionPage} />
      <Route path="/organize/:id" component={PhotoSelectionPage} />
      <Route path="/studio/:id" component={DesignWorkspacePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <SnackbarProvider
          maxSnack={3}
          autoHideDuration={3000}
          hideIconVariant
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <AuthProvider>
            <TooltipProvider>
              <Router />
            </TooltipProvider>
          </AuthProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
