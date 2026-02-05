import { Box, Typography, Button, IconButton } from "@mui/material";
import { useLocation } from "wouter";
import ProfileMenu from "@/components/ProfileMenu";
import ArrowBackIosNewOutlinedIcon from "@mui/icons-material/ArrowBackIosNewOutlined";

interface AppNavbarProps {
  centerContent?: React.ReactNode;
  showNewProject?: boolean;
  showBack?: boolean;
  onBack?: () => void;  
  isFromProjectSetupPage?: boolean;
}

export default function AppNavbar({
  centerContent,
  showNewProject = false,
  showBack = false,      
  onBack,
  isFromProjectSetupPage = false
}: AppNavbarProps) {
  const [, setLocation] = useLocation();


  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <Box
  sx={{
    width: "100%", 
    mx: "auto",
    px: { xs: 2, sm: 4 },
    py: 2,
    minHeight: 64,
    display: "grid",
    gridTemplateColumns: "auto 1fr auto",
    alignItems: "center",
    bgcolor: "#fff",
  }}
>
      {/* LEFT: Always same */}
      <Box display="flex" alignItems="center" gap={1.5}>

        {/* LEFT: LOGO + (OPTIONAL) BACK BUTTON + TITLE */}
    
        {showBack && (
          <IconButton size="small" onClick={handleBack}>
            <ArrowBackIosNewOutlinedIcon fontSize="small" />
          </IconButton>
        )}

        <Box
          sx={{
            width: 22,
            height: 22,
            bgcolor: "#0b1320",
            borderRadius: 1,
          }}
        />
        <Typography sx={{ fontSize: 14, letterSpacing: 1 }}>
          DESIGN AI WORKSPACE
        </Typography>
      </Box>

      {/* CENTER: DIFFERENT PER PAGE */}
      <Box display="flex" justifyContent="center">
        {centerContent}
      </Box>

      {/* RIGHT */}
      <Box display="flex" alignItems="center" gap={2} justifyContent="flex-end">
        {showNewProject && (
          <Button
            onClick={() => setLocation("/new-project")}
            sx={{
              bgcolor: "#0b1320",
              color: "#fff",
              borderRadius: 20,
              textTransform: "none",
              px: 3,
            }}
          >
            + NEW PROJECT
          </Button>
        )}{
            isFromProjectSetupPage && ( <Typography sx={{ fontSize: 12, letterSpacing: 1, color: "#888" }}>
            DRAFT PROJECT V1.0
          </Typography>)
        }

        <ProfileMenu />
      </Box>
    </Box>
  );
}
