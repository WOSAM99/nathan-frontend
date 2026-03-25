import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  IconButton,
  Skeleton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useLocation } from "wouter";
import { api } from "@/lib/api";
import AppNavbar from "@/components/AppNavBar";
import { useAuth } from "@/contexts/AuthContext";
import { Project } from "@/types";
import { DeleteOutline } from "@mui/icons-material";
import ConfirmModal from "@/components/ConfirmModal";
import { useAppSnackbar } from "@/hooks/useAppSnackbar";

export default function DashboardPage() {
  const [, setLocation] = useLocation();
  const { userId } = useAuth();
  const { showSnackbar } = useAppSnackbar();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const handleCancelDelete = useCallback(() => {
    if (deleteLoading) return;
    setConfirmOpen(false);
    setSelectedProjectId(null);
  }, [deleteLoading]);

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

  const handleConfirmDelete = useCallback(async () => {
    if (!selectedProjectId || !userId) return;

    try {
      setDeleteLoading(true);

      const res = await api.deleteProperty(selectedProjectId, userId);

      if (res?.property_data_deleted) {
        showSnackbar("Workspace deleted successfully", "success");
        await loadProjects();
      }

      setConfirmOpen(false);
      setSelectedProjectId(null);
    } catch (e) {
      console.error("Delete failed", e);
    } finally {
      setDeleteLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, userId, loadProjects]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects, userId]);

  return (
    <Box>
      <AppNavbar showNewProject={true} />

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
      </Box>

      {/* ===== LOADING STATE ===== */}
      {loading && (
        <Grid
          container
          spacing={4}
          sx={{
            mx: "auto",
            px: { xs: 2, sm: 4 },
          }}
        >
          {[...Array(4)].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Skeleton
                variant="rectangular"
                height={340}
                sx={{ borderRadius: 3 }}
              />
            </Grid>
          ))}
        </Grid>
      )}

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
                <IconButton
                  sx={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    width: 28,
                    height: 28,
                    bgcolor: "#fff",
                    border: `1px solid #E5E7EB`,
                    boxShadow: "0px 2px 6px rgba(0,0,0,0.15)",
                    "&:hover": {
                      bgcolor: "#fff",
                    },
                    "&:hover .MuiSvgIcon-root": {
                      color: "#000",
                    },
                  }}
                  onClick={(e) => {
                    setSelectedProjectId(project.property_id);
                    setConfirmOpen(true);
                  }}
                >
                  <DeleteOutline sx={{ color: "#000", fontSize: 18 }} />
                </IconButton>

                {/* IMAGE */}
                <CardMedia
                  component="img"
                  src={
                    Object.values(
                      project?.files?.mls?.categories || {},
                    ).flatMap((cat: any) => cat?.images || [])?.[0]?.url
                  }
                  sx={{
                    width: "100%",
                    aspectRatio: "4 / 3",
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
                      {project?.files?.mls?.address || project?.property_id}
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
      <ConfirmModal
        open={confirmOpen}
        title="Delete Workspace"
        description="Are you sure you want to delete this workspace? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleteLoading}
      />
    </Box>
  );
}
