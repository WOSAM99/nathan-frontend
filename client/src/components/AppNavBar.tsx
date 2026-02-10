import { Box, Typography, Button, IconButton } from "@mui/material";
import { useLocation } from "wouter";
import ProfileMenu from "@/components/ProfileMenu";
import ArrowBackIosNewOutlinedIcon from "@mui/icons-material/ArrowBackIosNewOutlined";

interface AppNavbarProps {
  centerContent?: React.ReactNode;
  showNewProject?: boolean;
  showBack?: boolean;
  onBack?: () => void;  
  propertyId?: string; 
  bgcolor?:string
}

export default function AppNavbar({
  centerContent,
  showNewProject = false,
  showBack = false,      
  onBack,
  propertyId,    
  bgcolor        
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
        bgcolor: bgcolor || "#fff",
        borderBottom: "1px solid #E5E7EB",
      }}
    >
      {/* ================= LEFT SIDE ================= */}
      <Box display="flex" alignItems="center" gap={1.5}>

        {showBack && (
          <IconButton size="small" onClick={handleBack}>
            <ArrowBackIosNewOutlinedIcon fontSize="small" />
          </IconButton>
        )}

        {propertyId ? (
          <Box display="flex" gap={6}>
            {/* SUBJECT PROPERTY */}
            <Box>
              <Typography
                sx={{
                  fontSize: "12px",
                  letterSpacing: 1,
                  fontWeight: 600,
                  color: "#111827",
                  textTransform: "uppercase",
                }}
              >
                SUBJECT PROPERTY
              </Typography>
              <Typography sx={{ fontSize: "12px", color: "#6B7280",letterSpacing: 1, }}>
                Organization Utility
              </Typography>
            </Box>

            
          </Box>
        ) : (
          <>
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
          </>
        )}
      </Box>

      {/* ================= CENTER ================= */}
      <Box display="flex" justifyContent="center">
        {centerContent}
      </Box>

      {/* ================= RIGHT SIDE ================= */}
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
        )}
        <ProfileMenu />
      </Box>
    </Box>
  );
}
