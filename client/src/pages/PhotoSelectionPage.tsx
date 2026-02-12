import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardMedia,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Backdrop,
  CircularProgress,
} from "@mui/material";

import {
  MoreHoriz,
  ArrowForward,
  EditOutlined,
  DeleteOutline,
} from "@mui/icons-material";
import { useLocation, useParams } from "wouter";
import { api } from "@/lib/api";
import { useAppSnackbar } from "@/hooks/useAppSnackbar";
import AppNavbar from "@/components/AppNavBar";
import { useAuth } from "@/contexts/AuthContext";
import ConfirmDialog from "@/components/ConfirmDialog";

/* ===== DESIGN TOKENS ===== */
const ui = {
  bg: "#F8F9FA",
  white: "#FFFFFF",
  border: "#E5E7EB",
  muted: "#6B7280",
  text: "#111827",
  primary: "#0F172A",
  blue: "#2563EB",
  sidebarBg: "#FFFFFF",
  cardRadius: 4,
};

interface Photo {
  id: string;
  src: string;
  rawCategory: string;
  roomCategory: string;
  selected: boolean;
  filename: string;
}

export default function PhotoSelectionPage() {
  const { showSnackbar } = useAppSnackbar();
  const params = useParams();
  const propertyId = params.id || "";
  const { userId } = useAuth();
  const [, setLocation] = useLocation();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [deletePhoto, setDeletePhoto] = useState<Photo | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  const isSingleImageCategory = useMemo(
    () => deletePhoto && getCategoryImageCount(deletePhoto?.roomCategory) === 1,
    [],
  );

  const deleteDescription = useMemo(
    () =>
      isSingleImageCategory
        ? "Deleting this image will also delete the category. Are you sure you want to delete both? This action cannot be reversed."
        : "Are you sure you want to delete this image? This action cannot be reversed.",
    [],
  );

  const categoryData = useMemo(
    () =>
      Array.from(
        new Map(
          photos.map((p) => [
            (p.roomCategory || "Unknown").toLowerCase(),
            p.roomCategory || "Unknown",
          ]),
        ).values(),
      ),
    [],
  );

  const getCategoryImageCount = useCallback((category: string) => {
    return photos.filter((p) => p.roomCategory === category).length;
  }, []);

  const dynamicCategories = useMemo(
    () =>
      categoryData
        .map((cat) => ({
          id: cat.toLowerCase().replace(/\s+/g, "_"),
          label: cat,
          count: photos.filter((p) => p.roomCategory === cat).length,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );

  const filteredPhotos = useMemo(
    () => photos?.filter((p) => p.roomCategory === selectedCategory),
    [],
  );

  const loadPropertyImages = useCallback(async () => {
    if (!propertyId || !userId) return;
    try {
      if (userId && propertyId) {
        const details = await api.getPropertyDetails(propertyId, userId);
        const mlsImages = details?.files?.mls_images?.images || [];
        const loadedPhotos = mlsImages?.map((file: any) => {
          let roomCategory =
            file.category && file.category.includes("-")
              ? file.category.split("-").slice(1).join("-").trim()
              : file.category || "Unknown";

          roomCategory =
            roomCategory.charAt(0).toUpperCase() +
            roomCategory.slice(1).toLowerCase();

          return {
            id: file?.id,
            src: file?.url,
            rawCategory: file?.category || "Unknown",
            roomCategory,
            selected: false,
            filename: file?.filename,
          };
        });

        setPhotos(loadedPhotos);

        // Set first category as default selection
        const firstCategory = loadedPhotos?.find(
          (p: any) => p.roomCategory.toLowerCase() !== "unknown",
        )?.roomCategory;

        if (firstCategory) setSelectedCategory(firstCategory);
      }
    } catch (error) {
      showSnackbar("Failed to load images", "error");
    } finally {
      setLoading(false);
    }
  }, [propertyId, userId, showSnackbar]);

  const toggleSelection = useCallback((id: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p)),
    );
  }, []);

  const moveSinglePhoto = useCallback(async (id: string, newRoom: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, roomCategory: newRoom } : p)),
    );

    try {
      await api.updateImageCategory(propertyId, id, newRoom, String(userId));
      showSnackbar("Image moved", "success");
    } catch {
      showSnackbar("Failed to move image", "error");
      loadPropertyImages();
    }
  }, []);

  const handleContinue = useCallback(() => {
    setLocation(`/studio/${propertyId}`);
  }, []);

  const deletePhotoFn = useCallback(async () => {
    if (!deletePhoto) return;

    const deletedCategory = deletePhoto?.roomCategory;

    try {
      setDeleteLoading(true);

      const updatedPhotos = photos.filter((p) => p.id !== deletePhoto.id);
      setPhotos(updatedPhotos);

      await api.deleteImage(propertyId, deletePhoto.id, String(userId));

      showSnackbar("Image deleted successfully", "success");

      const remainingInCategory = updatedPhotos.filter(
        (p) => p.roomCategory === deletedCategory,
      );

      if (remainingInCategory.length === 0) {
        const unknownCategory = updatedPhotos?.find(
          (p) => p.roomCategory.toLowerCase() === "unknown",
        )?.roomCategory;

        if (unknownCategory) {
          setSelectedCategory(unknownCategory);
        } else if (updatedPhotos?.length > 0) {
          setSelectedCategory(updatedPhotos[0]?.roomCategory);
        } else {
          setSelectedCategory("");
        }
      }
    } catch (err) {
      showSnackbar("Failed to delete image", "error");
      loadPropertyImages();
    } finally {
      setDeleteLoading(false);
      setDeletePhoto(null);
    }
  }, []);

  useEffect(() => {
    if (!propertyId || !userId) {
      setLoading(false);
      return;
    }
    loadPropertyImages();
  }, [propertyId, userId]);

  if (loading) {
    return (
      <Backdrop open>
        <CircularProgress />
      </Backdrop>
    );
  }

  return (
    <>
      <AppNavbar propertyId={propertyId} showBack={true} bgcolor={ui.bg} />

      <Box
        sx={{
          position: "fixed",
          top: 64,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          bgcolor: ui.bg,
          overflow: "hidden",
        }}
      >
        {/* ========== LEFT SIDEBAR ========== */}
        <Paper
          elevation={0}
          sx={{
            width: 300,
            py: 3,
            pl: 3,
            backgroundColor: ui.bg,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Typography
            sx={{
              fontSize: 14,
              letterSpacing: 1,
              color: "#000",
              mb: 0.5,
              pl: 1.5,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            ROOM BUCKETS
          </Typography>

          <Box
            display="flex"
            flexDirection="column"
            gap={1}
            mt={2}
            sx={{
              flex: 1,
              overflowY: "auto",
              "&::-webkit-scrollbar": { width: 6 },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: ui.border,
                borderRadius: 10,
              },
            }}
          >
            {dynamicCategories?.map((cat) => {
              return (
                <Box
                  key={cat?.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 1.5,
                    py: 1.2,
                    borderRadius: 1,
                    cursor: "pointer",
                    bgcolor:
                      selectedCategory === cat?.label
                        ? "#0B1320"
                        : "transparent",
                    color: selectedCategory === cat?.label ? "white" : ui.text,

                    "&:hover": {
                      bgcolor:
                        selectedCategory === cat?.label ? "#0B1320" : "#f3f3f3",
                    },

                    "&:hover .action-icons": {
                      opacity: 1,
                      pointerEvents: "auto",
                    },
                  }}
                >
                  {/* LEFT: Category name + count */}
                  <Box
                    onClick={() => setSelectedCategory(cat?.label)}
                    sx={{ flex: 1 }}
                  >
                    <Typography
                      sx={{
                        fontSize: 14,
                        letterSpacing: 1,
                        lineHeight: 1.3,
                        whiteSpace: "normal",
                        wordBreak: "break-word",
                      }}
                    >
                      {cat?.label}{" "}
                      <Typography
                        component="span"
                        sx={{
                          fontSize: 14,
                          color:
                            selectedCategory === cat?.label ? "#fff" : ui.muted,
                          whiteSpace: "nowrap",
                          display: "inline",
                        }}
                      >
                        ({cat?.count})
                      </Typography>
                    </Typography>
                  </Box>
                  <Box
                    className="action-icons"
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                    sx={{
                      opacity: 0,
                      pointerEvents: "none",
                      transition: "opacity 0.2s ease",
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newName = prompt("Rename category:", cat?.label);
                        // if (newName) renameCategory(cat.label, newName);
                      }}
                      sx={{
                        color:
                          selectedCategory === cat?.label ? "white" : ui.muted,
                      }}
                    >
                      <EditOutlined fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        // deleteCategory(cat.label);
                      }}
                      sx={{
                        color:
                          selectedCategory === cat?.label ? "white" : ui.muted,
                      }}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Paper>

        {/* ========== RIGHT PANEL ========== */}
        <Box sx={{ flex: 1, p: 3, overflowY: "auto" }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: `1px solid ${ui.border}`,
              backgroundColor: ui.white,
              minHeight: "100%",
            }}
          >
            <Box display="flex" alignItems="flex-end" gap={1} mb={3}>
              <Typography
                sx={{ fontSize: 20, fontWeight: 500, letterSpacing: 1 }}
              >
                Subject Property Library
              </Typography>

              <Typography
                sx={{ fontSize: 13, color: ui.muted, letterSpacing: 1 }}
              >
                {photos?.length} items total •{" "}
                {
                  photos?.filter(
                    (p) => p.roomCategory.toLowerCase() !== "unknown",
                  ).length
                }{" "}
                categorized
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {filteredPhotos?.map((photo) => (
                <Grid key={photo?.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <Card
                    onClick={() => toggleSelection(photo?.id)}
                    sx={{
                      position: "relative",
                      cursor: "pointer",
                      borderRadius: ui.cardRadius,
                      boxShadow: "0px 2px 6px rgba(0,0,0,0.06)",
                      border: `1px solid ${ui.border}`,
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={photo?.src}
                      sx={{
                        width: "100%",
                        height: 180,
                        objectFit: "cover",
                        aspectRatio: "4 / 3",
                      }}
                    />

                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        display: "flex",
                        gap: 0.8,
                      }}
                    >
                      {/* DELETE BUTTON (DUSTBIN) */}
                      <IconButton
                        sx={{
                          width: 28,
                          height: 28,
                          minWidth: 28,
                          minHeight: 28,
                          p: 0.5,
                          bgcolor: "white",
                          border: `1px solid ${ui.border}`,
                          boxShadow: "0px 2px 6px rgba(0,0,0,0.15)",
                          "&:hover": {
                            bgcolor: "#fff",
                          },
                          "&:hover .MuiSvgIcon-root": {
                            color: "#000",
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletePhoto(photo);
                        }}
                      >
                        <DeleteOutline sx={{ color: ui.text, fontSize: 18 }} />
                      </IconButton>

                      {/* EXISTING 3 DOT MENU */}
                      <IconButton
                        sx={{
                          width: 28,
                          height: 28,
                          minWidth: 28,
                          minHeight: 28,
                          p: 0.5,
                          bgcolor: "white",
                          border: `1px solid ${ui.border}`,
                          boxShadow: "0px 2px 6px rgba(0,0,0,0.15)",
                          "&:hover": {
                            bgcolor: "#fff",
                          },
                          "&:hover .MuiSvgIcon-root": {
                            color: "#000",
                          },
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhoto(photo?.id);
                          setMenuAnchor(e.currentTarget);
                        }}
                      >
                        <MoreHoriz sx={{ color: ui.text }} />
                      </IconButton>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Box>

        {/* MOVE MENU (DYNAMIC) */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          {dynamicCategories
            ?.filter((c) => c.label !== selectedCategory)
            ?.map((cat) => (
              <MenuItem
                key={cat?.id}
                onClick={() => {
                  if (activePhoto) {
                    moveSinglePhoto(activePhoto, cat?.label);
                  }
                  setMenuAnchor(null);
                }}
              >
                {cat?.label}
              </MenuItem>
            ))}
        </Menu>

        {/* FLOATING CONTINUE BUTTON */}
        <Box
          position="fixed"
          bottom={24}
          left={340}
          right={24}
          display="flex"
          alignItems="center"
          justifyContent="flex-end"
          px={2}
          py={4}
        >
          <Button
            onClick={handleContinue}
            endIcon={<ArrowForward />}
            sx={{
              bgcolor: "#000",
              color: "#fff",
              borderRadius: 999,
              textTransform: "uppercase",
              letterSpacing: 1,
              fontSize: 12,
              px: 3,
              py: 1.2,
              boxShadow: "0px 6px 16px rgba(0,0,0,0.15)",
            }}
          >
            LOOKS GOOD, CONTINUE
          </Button>
        </Box>
      </Box>

      <ConfirmDialog
        open={Boolean(deletePhoto)}
        title="Delete Image"
        description={deleteDescription}
        onConfirm={deletePhotoFn}
        onCancel={() => setDeletePhoto(null)}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        loading={deleteLoading}
      />
    </>
  );
}
