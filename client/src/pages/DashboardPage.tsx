import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  TextField,
  IconButton,
  Tabs,
  Tab,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import AddIcon from "@mui/icons-material/Add";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import AppNavbar from "@/components/AppNavBar";
import ClearIcon from "@mui/icons-material/Clear";
import { useAuth } from "@/contexts/AuthContext";
import { Project } from "@/types";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { userId } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState<number>(0);

  const loadProjects = useCallback(async () => {
    try {
      if (userId) {
        const data = await api.getProjects(userId);
        setProjects(data);
      }
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects, userId]);
    
  return (
    <Box>
      <AppNavbar
        showNewProject={true}
        centerContent={
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              "& .MuiTab-root": {
                textTransform: "uppercase",
                letterSpacing: 1,
                fontSize: 12,
              },
            }}
          >
            <Tab label="MY PROJECTS" />
            <Tab label="ASSETS" />
            <Tab label="TEMPLATES" />
          </Tabs>
        }
      />

      {/* ===== TITLE + SEARCH ===== */}
      <Box
        sx={{
          px: { xs: 2, sm: 4 },
          my: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        {/* TITLE */}
        <Box>
          <Typography
            sx={{
              fontSize: { xs: 20, sm: 28 },
              fontWeight: 400,
              letterSpacing: 1,
            }}
          >
            Project Portfolio
          </Typography>
          <Typography sx={{ color: "#888", fontSize: 14, letterSpacing: 1 }}>
            Manage and monitor your active renovation investments.
          </Typography>
        </Box>

        {/* SEARCH + FILTER */}
        <Box display="flex" alignItems="center" gap={1.5}>
          <TextField
            placeholder="Search addresses..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              width: 320,
              "& .MuiOutlinedInput-root": {
                borderRadius: "999px",
                backgroundColor: "#F3F5F7",
                height: 40,
              },
              "& fieldset": {
                border: "none",
              },
            }}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: "#888", fontSize: 18 }} />
              ),

              endAdornment: searchQuery ? (
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery("")}
                  sx={{ mr: 0.5 }}
                >
                  <ClearIcon sx={{ fontSize: 18, color: "#888" }} />
                </IconButton>
              ) : null,
            }}
          />

          <IconButton
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: "#F3F5F7",
              "&:hover": { bgcolor: "#eaeef2" },
            }}
          >
            <FilterListIcon sx={{ color: "#555", fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>

      {/* ===== PROJECT GRID ===== */}
      {!loading && (
        <Grid
          container
          spacing={4}
          sx={{
            mx: "auto",
            px: { xs: 2, sm: 4 },
            justifyContent: "flex-start",
            alignItems: "stretch",
          }}
        >
          {projects?.map((project) => (
            <Grid key={project?.property_id} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0px 6px 20px rgba(0,0,0,0.06)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                  position: "relative",
                }}
              >
                {/* IMAGE */}
                <CardMedia
                  component="img"
                  image={project.thumbnail_url}
                  sx={{
                    objectFit: "cover",
                  }}
                />

                {/* CARD CONTENT */}
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Typography sx={{ fontSize: 14, letterSpacing: 1 }}>
                      {project?.property_id}
                    </Typography>
                  </Box>

                  {/* ===== BUTTON  ===== */}
                  <Button
                    fullWidth
                    sx={{
                      mt: 1.5,
                      bgcolor: "#F3F5F7",
                      color: "#0b1320",
                      textTransform: "none",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                    onClick={() =>
                      setLocation(`/organize/${project?.property_id}`)
                    }
                  >
                    OPEN WORKSPACE
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* INITIATE NEW PROJECT CARD */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box
              onClick={() => setLocation("/new-project")}
              sx={{
                border: "2px dashed #ccc",
                borderRadius: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                bgcolor: "#F9FAFB",
                height: 340,
                minHeight: "100%",
                boxSizing: "border-box",
              }}
            >
              <Box
                sx={{
                  width: 45,
                  height: 45,
                  borderRadius: "50%",
                  bgcolor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1,
                  boxShadow: "0px 4px 12px rgba(0,0,0,0.06)",
                }}
              >
                <AddIcon sx={{ fontSize: 32, color: "#888" }} />
              </Box>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: 16,
                  letterSpacing: 1,
                }}
              >
                Initiate New Project
              </Typography>
              <Typography
                sx={{ fontSize: 12, color: "#888", letterSpacing: 1 }}
              >
                Setup takes less than 2 minutes
              </Typography>
            </Box>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
