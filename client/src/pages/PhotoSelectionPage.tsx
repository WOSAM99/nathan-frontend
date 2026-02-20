import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import { DeleteTarget, Photo } from "@/types";
import RenameCategoryDialog from "@/components/RenameCategoryDialog";

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

export default function PhotoSelectionPage() {
  const { showSnackbar } = useAppSnackbar();
  const params = useParams();
  const { userId } = useAuth();
  const [, setLocation] = useLocation();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameCategoryName, setRenameCategoryName] = useState<string>("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const propertyId = useMemo(() => params.id || "", [params.id]);

  const categoryData = useMemo(() => categories, [categories]);

  const dynamicCategories = useMemo(
    () =>
      categoryData
        .map((cat) => ({
          id: cat.toLowerCase().replace(/\s+/g, "_"),
          label: cat,
          count: photos.filter((p) => p.roomCategory === cat).length,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [categoryData, photos],
  );

  const filteredPhotos = useMemo(
    () => photos?.filter((p) => p.roomCategory === selectedCategory),
    [photos, selectedCategory],
  );

  const loadPropertyImages = useCallback(async () => {
    if (!propertyId || !userId) return;

    try {
      const details = await api.getPropertyDetails(propertyId, userId);

      const categoriesObj = details?.files?.mls_images?.categories || {};

      const formatCategory = (cat: string) =>
        cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();

      const allCategoryNames = Object.keys(categoriesObj)
        .map(formatCategory)
        .filter((value, index, self) => self.indexOf(value) === index);

      setCategories(allCategoryNames);

      // Flatten only images into photos
      const allImages = Object.entries(categoriesObj).flatMap(
        ([categoryName, categoryData]: any) => {
          const formattedCategory = formatCategory(categoryName);

          return (categoryData?.images || []).map((file: any) => ({
            id: file?.id,
            src: file?.url,
            rawCategory: categoryName,
            roomCategory: formattedCategory,
            selected: false,
            filename: file?.filename,
          }));
        },
      );

      setPhotos(allImages);

      // Default category selection
      const firstWithImage = allCategoryNames.find((cat) =>
        allImages.some((img) => img.roomCategory === cat),
      );

      if (firstWithImage) {
        setSelectedCategory(firstWithImage);
      } else if (allCategoryNames.length > 0) {
        setSelectedCategory(allCategoryNames[0]);
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

  const moveSinglePhoto = useCallback(
    async (id: string, newRoom: string) => {
      setPhotos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, roomCategory: newRoom } : p)),
      );

      try {
        await api.updateImageCategory(propertyId, id, newRoom, String(userId));
        showSnackbar("Image moved", "success");
        loadPropertyImages();
      } catch {
        showSnackbar("Failed to move image", "error");
        loadPropertyImages();
      }
    },
    [loadPropertyImages, propertyId, showSnackbar, userId],
  );

  const handleContinue = useCallback(() => {
    setLocation(`/studio/${propertyId}`);
  }, [propertyId, setLocation]);

  const deletePhotoFn = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      setDeleteLoading(true);

      if (deleteTarget.type === "image") {
        const photo = deleteTarget.photo;

        const updatedPhotos = photos.filter((p) => p.id !== photo.id);
        setPhotos(updatedPhotos);

        await api.deleteImage(propertyId, photo.id, String(userId));

        showSnackbar("Image deleted successfully", "success");
      }

      if (deleteTarget.type === "category") {
        await api.deleteCategory(
          propertyId,
          String(userId),
          deleteTarget.category,
          true,
        );

        showSnackbar("Category deleted", "success");
      }

      loadPropertyImages();
    } catch {
      showSnackbar("Delete failed", "error");
      loadPropertyImages();
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }, [
    deleteTarget,
    photos,
    propertyId,
    userId,
    showSnackbar,
    loadPropertyImages,
  ]);

  const renameCategory = useCallback(
    async (oldName: string, newName: string) => {
      if (!newName || oldName === newName) {
        setRenameDialogOpen(false);
        return;
      }

      try {
        setRenameLoading(true);

        setCategories((prev) =>
          prev.map((cat) => (cat === oldName ? newName : cat)),
        );

        setPhotos((prev) =>
          prev.map((p) =>
            p.roomCategory === oldName ? { ...p, roomCategory: newName } : p,
          ),
        );

        if (selectedCategory === oldName) {
          setSelectedCategory(newName);
        }

        await api.renameCategory(propertyId, oldName, newName, String(userId));

        showSnackbar("Category renamed", "success");
        loadPropertyImages();
      } catch {
        showSnackbar("Failed to rename category", "error");
        loadPropertyImages();
      } finally {
        setRenameLoading(false);
        setRenameDialogOpen(false);
      }
    },
    [propertyId, userId, selectedCategory, showSnackbar, loadPropertyImages],
  );

  useEffect(() => {
    if (!propertyId || !userId) {
      setLoading(false);
      return;
    }
    loadPropertyImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                        lineHeight: 1,
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
                        setRenameCategoryName(cat.label);
                        setRenameDialogOpen(true);
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
                        setDeleteTarget({
                          type: "category",
                          category: cat.label,
                        });
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

            {filteredPhotos.length === 0 && (
              <Typography sx={{ color: ui.muted, mt: 4 }}>
                No images in this category
              </Typography>
            )}
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
                          setDeleteTarget({ type: "image", photo });
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
              borderRadius: 20,
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
        open={Boolean(deleteTarget)}
        title={
          deleteTarget?.type === "category" ? "Delete Category" : "Delete Image"
        }
        description={
          deleteTarget?.type === "category"
            ? `Are you sure you want to delete ${deleteTarget.category} category? This action cannot be reversed.`
            : "Are you sure you want to delete this image? This action cannot be reversed."
        }
        onConfirm={deletePhotoFn}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        loading={deleteLoading}
      />

      <RenameCategoryDialog
        open={renameDialogOpen}
        initialValue={renameCategoryName}
        loading={renameLoading}
        onCancel={() => setRenameDialogOpen(false)}
        onConfirm={(newName) => renameCategory(renameCategoryName, newName)}
      />
    </>
  );
}
